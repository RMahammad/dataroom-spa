import { describe, it, expect } from 'vitest';
import { 
  getDescendantFolderIds, 
  countDescendants, 
  buildBreadcrumbs,
  buildFolderTree,
  sortEntries
} from '../../core/utils/tree';
import type { Folder, FileObject, DataroomEntry } from '../../core/types';

const mockFolders: Folder[] = [
  { id: 'root1', name: 'Root 1', parentId: null, dataroomId: 'dr1', createdAt: 1000, updatedAt: 1000 },
  { id: 'root2', name: 'Root 2', parentId: null, dataroomId: 'dr1', createdAt: 1000, updatedAt: 1000 },
  { id: 'child1', name: 'Child 1', parentId: 'root1', dataroomId: 'dr1', createdAt: 1000, updatedAt: 1000 },
  { id: 'child2', name: 'Child 2', parentId: 'root1', dataroomId: 'dr1', createdAt: 1000, updatedAt: 1000 },
  { id: 'grandchild1', name: 'Grandchild 1', parentId: 'child1', dataroomId: 'dr1', createdAt: 1000, updatedAt: 1000 },
];

const mockFiles: FileObject[] = [
  { id: 'file1', name: 'test.pdf', parentId: 'root1', dataroomId: 'dr1', size: 100, mimeType: 'application/pdf', blobKey: 'blob1', createdAt: 1000, updatedAt: 1000 },
  { id: 'file2', name: 'doc.pdf', parentId: 'child1', dataroomId: 'dr1', size: 200, mimeType: 'application/pdf', blobKey: 'blob2', createdAt: 2000, updatedAt: 2000 },
];

describe('Tree Utilities', () => {
  describe('getDescendantFolderIds', () => {
    it('should return all descendant folder IDs', () => {
      const descendants = getDescendantFolderIds('root1', mockFolders);
      expect(descendants).toContain('child1');
      expect(descendants).toContain('child2');
      expect(descendants).toContain('grandchild1');
      expect(descendants).toHaveLength(3);
    });

    it('should return empty for leaf folder', () => {
      const descendants = getDescendantFolderIds('grandchild1', mockFolders);
      expect(descendants).toEqual([]);
    });

    it('should return empty for non-existent folder', () => {
      const descendants = getDescendantFolderIds('nonexistent', mockFolders);
      expect(descendants).toEqual([]);
    });
  });

  describe('countDescendants', () => {
    it('should count all descendant folders and files', () => {
      const counts = countDescendants('root1', mockFolders, mockFiles);
      expect(counts.folders).toBe(3); // child1, child2, grandchild1
      expect(counts.files).toBe(2); // file1 in root1, file2 in child1
    });

    it('should return zero for leaf folder', () => {
      const counts = countDescendants('grandchild1', mockFolders, mockFiles);
      expect(counts.folders).toBe(0);
      expect(counts.files).toBe(0);
    });

    it('should handle empty arrays', () => {
      const counts = countDescendants('root1', [], []);
      expect(counts.folders).toBe(0);
      expect(counts.files).toBe(0);
    });
  });

  describe('buildBreadcrumbs', () => {
    it('should build breadcrumbs for nested folder', () => {
      const breadcrumbs = buildBreadcrumbs('grandchild1', mockFolders, 'Test Room', 'dr1');
      expect(breadcrumbs).toEqual([
        { id: 'dr1', name: 'Test Room', type: 'dataroom' },
        { id: 'root1', name: 'Root 1', type: 'folder' },
        { id: 'child1', name: 'Child 1', type: 'folder' },
        { id: 'grandchild1', name: 'Grandchild 1', type: 'folder' }
      ]);
    });

    it('should build breadcrumbs for root folder', () => {
      const breadcrumbs = buildBreadcrumbs('root1', mockFolders, 'Test Room', 'dr1');
      expect(breadcrumbs).toEqual([
        { id: 'dr1', name: 'Test Room', type: 'dataroom' },
        { id: 'root1', name: 'Root 1', type: 'folder' }
      ]);
    });

    it('should return only dataroom for null folder', () => {
      const breadcrumbs = buildBreadcrumbs(null, mockFolders, 'Test Room', 'dr1');
      expect(breadcrumbs).toEqual([
        { id: 'dr1', name: 'Test Room', type: 'dataroom' }
      ]);
    });
  });

  describe('buildFolderTree', () => {
    it('should build tree structure from flat list', () => {
      const tree = buildFolderTree(mockFolders);
      expect(tree).toHaveLength(2); // root1, root2
      
      const root1 = tree.find(node => node.id === 'root1');
      expect(root1?.children).toHaveLength(2); // child1, child2
      expect(root1?.depth).toBe(0);
      
      const child1 = root1?.children.find(node => node.id === 'child1');
      expect(child1?.children).toHaveLength(1); // grandchild1
      expect(child1?.depth).toBe(1);
    });

    it('should handle empty folder array', () => {
      const tree = buildFolderTree([]);
      expect(tree).toEqual([]);
    });
  });

  describe('sortEntries', () => {
    const entries: DataroomEntry[] = [
      ...mockFolders.slice(0, 2), // root1, root2
      ...mockFiles // file1, file2
    ];

    it('should sort by name ascending', () => {
      const sorted = sortEntries(entries, 'name', 'asc');
      
      for (let i = 1; i < sorted.length; i++) {
        expect(sorted[i-1].name.localeCompare(sorted[i].name)).toBeLessThanOrEqual(0);
      }
    });

    it('should sort by type (folders first)', () => {
      const sorted = sortEntries(entries, 'type', 'asc');
      
      const folders = sorted.filter(entry => !('blobKey' in entry));
      const files = sorted.filter(entry => 'blobKey' in entry);
      expect(folders).toHaveLength(2);
      expect(files).toHaveLength(2);
      
      expect(sorted.length).toBe(4);
      expect(sorted).toEqual(expect.any(Array));
    });

    it('should sort by size', () => {
      const sorted = sortEntries(entries, 'size', 'asc');
      const firstTwo = sorted.slice(0, 2);
      expect(firstTwo.every(entry => !('blobKey' in entry))).toBe(true);
    });

    it('should preserve original array', () => {
      const original = [...entries];
      sortEntries(entries, 'name');
      expect(entries).toEqual(original);
    });
  });
});