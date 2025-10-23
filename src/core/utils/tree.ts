import type { Folder, FileObject, DataroomEntry, ID } from "../types";

export interface TreeNode {
  id: ID;
  name: string;
  type: "folder";
  children: TreeNode[];
  parent: TreeNode | null;
  depth: number;
  fileCount: number;
  folderCount: number;
}

export function buildFolderTree(
  folders: Folder[],
  parentId: ID | null = null
): TreeNode[] {
  const folderMap = new Map<ID, Folder>();
  folders.forEach((folder) => folderMap.set(folder.id, folder));

  const buildNode = (
    folder: Folder,
    parent: TreeNode | null,
    depth: number
  ): TreeNode => {
    const node: TreeNode = {
      id: folder.id,
      name: folder.name,
      type: "folder",
      children: [],
      parent,
      depth,
      fileCount: 0,
      folderCount: 0,
    };

    // Find direct children
    const children = folders.filter((f) => f.parentId === folder.id);
    node.children = children.map((child) => buildNode(child, node, depth + 1));
    node.folderCount = children.length;

    return node;
  };

  // Find root folders (those with the specified parentId)
  const rootFolders = folders.filter((folder) => folder.parentId === parentId);
  return rootFolders.map((folder) => buildNode(folder, null, 0));
}

export function countDescendants(
  folderId: ID,
  folders: Folder[],
  files: FileObject[]
): { folders: number; files: number } {
  let folderCount = 0;
  let fileCount = 0;

  // Get direct child folders
  const childFolders = folders.filter((f) => f.parentId === folderId);
  folderCount += childFolders.length;

  // Get direct child files
  fileCount += files.filter((f) => f.parentId === folderId).length;

  // Recursively count descendants of child folders
  for (const childFolder of childFolders) {
    const childCounts = countDescendants(childFolder.id, folders, files);
    folderCount += childCounts.folders;
    fileCount += childCounts.files;
  }

  return { folders: folderCount, files: fileCount };
}

export function getDescendantFolderIds(folderId: ID, folders: Folder[]): ID[] {
  const descendants: ID[] = [];

  const childFolders = folders.filter((f) => f.parentId === folderId);

  for (const childFolder of childFolders) {
    descendants.push(childFolder.id);
    descendants.push(...getDescendantFolderIds(childFolder.id, folders));
  }

  return descendants;
}

export function buildBreadcrumbs(
  folderId: ID | null,
  folders: Folder[],
  dataroomName: string,
  dataroomId: ID
): Array<{ id: ID; name: string; type: "dataroom" | "folder" }> {
  const breadcrumbs: Array<{
    id: ID;
    name: string;
    type: "dataroom" | "folder";
  }> = [{ id: dataroomId, name: dataroomName, type: "dataroom" }];

  if (!folderId) {
    return breadcrumbs;
  }

  const folderMap = new Map<ID, Folder>();
  folders.forEach((folder) => folderMap.set(folder.id, folder));

  const path: Folder[] = [];
  let currentFolder = folderMap.get(folderId);

  // Trace back to root
  while (currentFolder) {
    path.unshift(currentFolder);
    if (currentFolder.parentId) {
      currentFolder = folderMap.get(currentFolder.parentId);
    } else {
      break;
    }
  }

  // Convert to breadcrumb format
  path.forEach((folder) => {
    breadcrumbs.push({
      id: folder.id,
      name: folder.name,
      type: "folder",
    });
  });

  return breadcrumbs;
}

export function sortEntries(
  entries: DataroomEntry[],
  sortBy: "name" | "modified" | "size" | "type",
  order: "asc" | "desc" = "asc"
): DataroomEntry[] {
  const sorted = [...entries].sort((a, b) => {
    let comparison = 0;

    switch (sortBy) {
      case "name": {
        comparison = a.name.localeCompare(b.name, undefined, { numeric: true });
        break;
      }
      case "modified": {
        comparison = a.updatedAt - b.updatedAt;
        break;
      }
      case "size": {
        // Folders are treated as size 0 for sorting
        const aSize = "size" in a ? a.size : 0;
        const bSize = "size" in b ? b.size : 0;
        comparison = aSize - bSize;
        break;
      }
      case "type": {
        // Folders first, then files
        const aType = "blobKey" in a ? "file" : "folder";
        const bType = "blobKey" in b ? "file" : "folder";
        comparison = aType.localeCompare(bType);
        if (comparison === 0) {
          // Same type, sort by name
          comparison = a.name.localeCompare(b.name, undefined, {
            numeric: true,
          });
        }
        break;
      }
    }

    return order === "desc" ? -comparison : comparison;
  });

  return sorted;
}
