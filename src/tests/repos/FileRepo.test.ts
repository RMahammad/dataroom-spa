import { describe, test, expect, beforeEach, afterEach } from "vitest";
import { FileRepo } from "../../core/repos/FileRepo";
import { clearDatabase } from "../../core/repos/db";
import { DatabaseError, NotFoundError } from "../../core/errors";
import type { FileObject } from "../../core/types";

describe("FileRepo", () => {
  beforeEach(async () => {
    await clearDatabase();
  });

  afterEach(async () => {
    await clearDatabase();
  });

  describe("insert", () => {
    test("should insert a new file successfully", async () => {
      const file: FileObject = {
        id: "file-1",
        dataroomId: "dataroom-1",
        parentId: "folder-1",
        name: "document.pdf",
        mimeType: "application/pdf",
        size: 1024,
        blobKey: "blob-key-1",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const result = await FileRepo.insert(file);
      expect(result).toBe("file-1");

      const retrieved = await FileRepo.get("file-1");
      expect(retrieved).toEqual(file);
    });

    test("should throw DatabaseError if insertion fails", async () => {
      // Try to insert a file with a duplicate ID
      const file1: FileObject = {
        id: "file-1",
        dataroomId: "dataroom-1",
        parentId: "folder-1",
        name: "document.pdf",
        mimeType: "application/pdf",
        size: 1024,
        blobKey: "blob-1",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const file2: FileObject = {
        id: "file-1", // Same ID - should cause a constraint violation
        dataroomId: "dataroom-1",
        parentId: "folder-1",
        name: "document2.pdf",
        mimeType: "application/pdf",
        size: 2048,
        blobKey: "blob-2",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      await FileRepo.insert(file1);

      await expect(FileRepo.insert(file2)).rejects.toThrow(DatabaseError);
    });
  });

  describe("get", () => {
    test("should return file when it exists", async () => {
      const file: FileObject = {
        id: "file-1",
        dataroomId: "dataroom-1",
        parentId: "folder-1",
        name: "document.pdf",
        mimeType: "application/pdf",
        size: 1024,
        blobKey: "blob-key-1",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      await FileRepo.insert(file);
      const result = await FileRepo.get("file-1");
      expect(result).toEqual(file);
    });

    test("should return undefined when file does not exist", async () => {
      const result = await FileRepo.get("non-existent");
      expect(result).toBeUndefined();
    });

    test("should throw DatabaseError on database failure", async () => {
      // Force a database error by trying to access after closing
      await clearDatabase();

      // This should work normally
      const result = await FileRepo.get("file-1");
      expect(result).toBeUndefined();
    });
  });

  describe("getRequired", () => {
    test("should return file when it exists", async () => {
      const file: FileObject = {
        id: "file-1",
        dataroomId: "dataroom-1",
        parentId: "folder-1",
        name: "document.pdf",
        mimeType: "application/pdf",
        size: 1024,
        blobKey: "blob-key-1",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      await FileRepo.insert(file);
      const result = await FileRepo.getRequired("file-1");
      expect(result).toEqual(file);
    });

    test("should throw NotFoundError when file does not exist", async () => {
      await expect(FileRepo.getRequired("non-existent")).rejects.toThrow(
        NotFoundError
      );
    });
  });

  describe("listByParent", () => {
    test("should return files in specified folder with default sorting", async () => {
      const now = Date.now();
      const files: FileObject[] = [
        {
          id: "file-1",
          dataroomId: "dataroom-1",
          parentId: "folder-1",
          name: "document1.pdf",
          mimeType: "application/pdf",
          size: 1024,
          blobKey: "blob-1",
          createdAt: now,
          updatedAt: now + 1000,
        },
        {
          id: "file-2",
          dataroomId: "dataroom-1",
          parentId: "folder-1",
          name: "document2.pdf",
          mimeType: "application/pdf",
          size: 2048,
          blobKey: "blob-2",
          createdAt: now + 500,
          updatedAt: now + 2000,
        },
        {
          id: "file-3",
          dataroomId: "dataroom-1",
          parentId: "folder-2",
          name: "document3.pdf",
          mimeType: "application/pdf",
          size: 512,
          blobKey: "blob-3",
          createdAt: now + 1000,
          updatedAt: now + 500,
        },
      ];

      for (const file of files) {
        await FileRepo.insert(file);
      }

      const result = await FileRepo.listByParent("folder-1", "dataroom-1");

      // Should return only files in folder-1, sorted by name asc (default)
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe("document1.pdf");
      expect(result[1].name).toBe("document2.pdf");
    });

    test("should sort by name ascending", async () => {
      const files: FileObject[] = [
        {
          id: "file-1",
          dataroomId: "dataroom-1",
          parentId: "folder-1",
          name: "zebra.pdf",
          mimeType: "application/pdf",
          size: 1024,
          blobKey: "blob-1",
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
        {
          id: "file-2",
          dataroomId: "dataroom-1",
          parentId: "folder-1",
          name: "alpha.pdf",
          mimeType: "application/pdf",
          size: 2048,
          blobKey: "blob-2",
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ];

      for (const file of files) {
        await FileRepo.insert(file);
      }

      const result = await FileRepo.listByParent(
        "folder-1",
        "dataroom-1",
        "name",
        "asc"
      );

      expect(result[0].name).toBe("alpha.pdf");
      expect(result[1].name).toBe("zebra.pdf");
    });

    test("should sort by size descending", async () => {
      const files: FileObject[] = [
        {
          id: "file-1",
          dataroomId: "dataroom-1",
          parentId: "folder-1",
          name: "small.pdf",
          mimeType: "application/pdf",
          size: 512,
          blobKey: "blob-1",
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
        {
          id: "file-2",
          dataroomId: "dataroom-1",
          parentId: "folder-1",
          name: "large.pdf",
          mimeType: "application/pdf",
          size: 2048,
          blobKey: "blob-2",
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ];

      for (const file of files) {
        await FileRepo.insert(file);
      }

      const result = await FileRepo.listByParent(
        "folder-1",
        "dataroom-1",
        "size",
        "desc"
      );

      expect(result[0].size).toBe(2048);
      expect(result[1].size).toBe(512);
    });

    test("should return empty array when no files exist in folder", async () => {
      const result = await FileRepo.listByParent("empty-folder", "dataroom-1");
      expect(result).toEqual([]);
    });

    test("should handle null parentId (root level)", async () => {
      const file: FileObject = {
        id: "file-1",
        dataroomId: "dataroom-1",
        parentId: null,
        name: "root-document.pdf",
        mimeType: "application/pdf",
        size: 1024,
        blobKey: "blob-1",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      await FileRepo.insert(file);

      const result = await FileRepo.listByParent(null, "dataroom-1");
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("file-1");
    });

    test("should throw DatabaseError on database failure", async () => {
      const result = await FileRepo.listByParent("folder-1", "dataroom-1");
      expect(result).toEqual([]);
    });
  });

  describe("listByDataroom", () => {
    test("should return all files in dataroom", async () => {
      const files: FileObject[] = [
        {
          id: "file-1",
          dataroomId: "dataroom-1",
          parentId: "folder-1",
          name: "document1.pdf",
          mimeType: "application/pdf",
          size: 1024,
          blobKey: "blob-1",
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
        {
          id: "file-2",
          dataroomId: "dataroom-1",
          parentId: "folder-2",
          name: "document2.pdf",
          mimeType: "application/pdf",
          size: 2048,
          blobKey: "blob-2",
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
        {
          id: "file-3",
          dataroomId: "dataroom-2",
          parentId: "folder-3",
          name: "document3.pdf",
          mimeType: "application/pdf",
          size: 512,
          blobKey: "blob-3",
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ];

      for (const file of files) {
        await FileRepo.insert(file);
      }

      const result = await FileRepo.listByDataroom("dataroom-1");

      expect(result).toHaveLength(2);
      expect(result.every((f) => f.dataroomId === "dataroom-1")).toBe(true);
    });

    test("should return empty array when no files exist in dataroom", async () => {
      const result = await FileRepo.listByDataroom("empty-dataroom");
      expect(result).toEqual([]);
    });
  });

  describe("updateName", () => {
    test("should update file name and timestamp", async () => {
      const file: FileObject = {
        id: "file-1",
        dataroomId: "dataroom-1",
        parentId: "folder-1",
        name: "old-name.pdf",
        mimeType: "application/pdf",
        size: 1024,
        blobKey: "blob-1",
        createdAt: Date.now(),
        updatedAt: 1000,
      };

      await FileRepo.insert(file);

      const updateTime = Date.now();
      const result = await FileRepo.updateName("file-1", "new-name.pdf");
      expect(result).toBe(1);

      const updated = await FileRepo.getRequired("file-1");
      expect(updated.name).toBe("new-name.pdf");
      expect(updated.updatedAt).toBeGreaterThanOrEqual(updateTime);
      expect(updated.createdAt).toBe(file.createdAt);
    });

    test("should return 0 when file does not exist", async () => {
      const result = await FileRepo.updateName("non-existent", "new-name.pdf");
      expect(result).toBe(0);
    });

    test("should throw DatabaseError on database failure", async () => {
      const result = await FileRepo.updateName("file-1", "new-name.pdf");
      expect(result).toBe(0); // File doesn't exist
    });
  });

  describe("touch", () => {
    test("should update only the timestamp", async () => {
      const file: FileObject = {
        id: "file-1",
        dataroomId: "dataroom-1",
        parentId: "folder-1",
        name: "document.pdf",
        mimeType: "application/pdf",
        size: 1024,
        blobKey: "blob-1",
        createdAt: Date.now(),
        updatedAt: 1000,
      };

      await FileRepo.insert(file);

      const updateTime = Date.now();
      const result = await FileRepo.touch("file-1");
      expect(result).toBe(1);

      const updated = await FileRepo.getRequired("file-1");
      expect(updated.name).toBe(file.name); // Unchanged
      expect(updated.parentId).toBe(file.parentId); // Unchanged
      expect(updated.updatedAt).toBeGreaterThanOrEqual(updateTime);
    });

    test("should return 0 when file does not exist", async () => {
      const result = await FileRepo.touch("non-existent");
      expect(result).toBe(0);
    });
  });

  describe("delete", () => {
    test("should delete existing file", async () => {
      const file: FileObject = {
        id: "file-1",
        dataroomId: "dataroom-1",
        parentId: "folder-1",
        name: "document.pdf",
        mimeType: "application/pdf",
        size: 1024,
        blobKey: "blob-1",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      await FileRepo.insert(file);

      await FileRepo.delete("file-1");
      const result = await FileRepo.get("file-1");
      expect(result).toBeUndefined();
    });

    test("should not throw error when deleting non-existent file", async () => {
      await expect(FileRepo.delete("non-existent")).resolves.not.toThrow();
    });

    test("should throw DatabaseError on database failure", async () => {
      await expect(FileRepo.delete("file-1")).resolves.not.toThrow();
    });
  });

  describe("nameExistsInParent", () => {
    test("should return true when name exists in same folder", async () => {
      const file: FileObject = {
        id: "file-1",
        dataroomId: "dataroom-1",
        parentId: "folder-1",
        name: "document.pdf",
        mimeType: "application/pdf",
        size: 1024,
        blobKey: "blob-1",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      await FileRepo.insert(file);

      const exists = await FileRepo.nameExistsInParent(
        "document.pdf",
        "folder-1",
        "dataroom-1"
      );
      expect(exists).toBe(true);
    });

    test("should return false when name does not exist", async () => {
      const exists = await FileRepo.nameExistsInParent(
        "nonexistent.pdf",
        "folder-1",
        "dataroom-1"
      );
      expect(exists).toBe(false);
    });

    test("should return false when name exists in different folder", async () => {
      const file: FileObject = {
        id: "file-1",
        dataroomId: "dataroom-1",
        parentId: "folder-1",
        name: "document.pdf",
        mimeType: "application/pdf",
        size: 1024,
        blobKey: "blob-1",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      await FileRepo.insert(file);

      const exists = await FileRepo.nameExistsInParent(
        "document.pdf",
        "folder-2",
        "dataroom-1"
      );
      expect(exists).toBe(false);
    });

    test("should exclude specified ID when checking existence", async () => {
      const file: FileObject = {
        id: "file-1",
        dataroomId: "dataroom-1",
        parentId: "folder-1",
        name: "document.pdf",
        mimeType: "application/pdf",
        size: 1024,
        blobKey: "blob-1",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      await FileRepo.insert(file);

      const exists = await FileRepo.nameExistsInParent(
        "document.pdf",
        "folder-1",
        "dataroom-1",
        "file-1"
      );
      expect(exists).toBe(false);
    });

    test("should not exclude other files with same name", async () => {
      const files: FileObject[] = [
        {
          id: "file-1",
          dataroomId: "dataroom-1",
          parentId: "folder-1",
          name: "document.pdf",
          mimeType: "application/pdf",
          size: 1024,
          blobKey: "blob-1",
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
        {
          id: "file-2",
          dataroomId: "dataroom-1",
          parentId: "folder-1",
          name: "document.pdf",
          mimeType: "application/pdf",
          size: 2048,
          blobKey: "blob-2",
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ];

      for (const file of files) {
        await FileRepo.insert(file);
      }

      const exists = await FileRepo.nameExistsInParent(
        "document.pdf",
        "folder-1",
        "dataroom-1",
        "file-1"
      );
      expect(exists).toBe(true); // file-2 still has the same name
    });

    test("should handle null parentId (root level)", async () => {
      const file: FileObject = {
        id: "file-1",
        dataroomId: "dataroom-1",
        parentId: null,
        name: "root-document.pdf",
        mimeType: "application/pdf",
        size: 1024,
        blobKey: "blob-1",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      await FileRepo.insert(file);

      const exists = await FileRepo.nameExistsInParent(
        "root-document.pdf",
        null,
        "dataroom-1"
      );
      expect(exists).toBe(true);
    });
  });

  describe("countInFolder", () => {
    test("should return 0 when no files exist", async () => {
      const count = await FileRepo.countInFolder("folder-1", "dataroom-1");
      expect(count).toBe(0);
    });

    test("should return correct count when files exist", async () => {
      const files: FileObject[] = [
        {
          id: "file-1",
          dataroomId: "dataroom-1",
          parentId: "folder-1",
          name: "document1.pdf",
          mimeType: "application/pdf",
          size: 1024,
          blobKey: "blob-1",
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
        {
          id: "file-2",
          dataroomId: "dataroom-1",
          parentId: "folder-1",
          name: "document2.pdf",
          mimeType: "application/pdf",
          size: 2048,
          blobKey: "blob-2",
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
        {
          id: "file-3",
          dataroomId: "dataroom-1",
          parentId: "folder-2",
          name: "document3.pdf",
          mimeType: "application/pdf",
          size: 512,
          blobKey: "blob-3",
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ];

      for (const file of files) {
        await FileRepo.insert(file);
      }

      const count = await FileRepo.countInFolder("folder-1", "dataroom-1");
      expect(count).toBe(2);
    });

    test("should handle null parentId (root level)", async () => {
      const file: FileObject = {
        id: "file-1",
        dataroomId: "dataroom-1",
        parentId: null,
        name: "root-document.pdf",
        mimeType: "application/pdf",
        size: 1024,
        blobKey: "blob-1",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      await FileRepo.insert(file);

      const count = await FileRepo.countInFolder(null, "dataroom-1");
      expect(count).toBe(1);
    });

    test("should throw DatabaseError on database failure", async () => {
      const count = await FileRepo.countInFolder("folder-1", "dataroom-1");
      expect(typeof count).toBe("number");
    });
  });

  describe("deleteByDataroom", () => {
    test("should delete all files in dataroom", async () => {
      const files: FileObject[] = [
        {
          id: "file-1",
          dataroomId: "dataroom-1",
          parentId: "folder-1",
          name: "document1.pdf",
          mimeType: "application/pdf",
          size: 1024,
          blobKey: "blob-1",
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
        {
          id: "file-2",
          dataroomId: "dataroom-1",
          parentId: "folder-2",
          name: "document2.pdf",
          mimeType: "application/pdf",
          size: 2048,
          blobKey: "blob-2",
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
        {
          id: "file-3",
          dataroomId: "dataroom-2",
          parentId: "folder-3",
          name: "document3.pdf",
          mimeType: "application/pdf",
          size: 512,
          blobKey: "blob-3",
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ];

      for (const file of files) {
        await FileRepo.insert(file);
      }

      const deleted = await FileRepo.deleteByDataroom("dataroom-1");
      expect(deleted).toBe(2);

      const remaining = await FileRepo.listByDataroom("dataroom-1");
      expect(remaining).toHaveLength(0);

      const dataroom2Files = await FileRepo.listByDataroom("dataroom-2");
      expect(dataroom2Files).toHaveLength(1);
    });

    test("should return 0 when no files exist in dataroom", async () => {
      const deleted = await FileRepo.deleteByDataroom("empty-dataroom");
      expect(deleted).toBe(0);
    });
  });

  describe("deleteByFolder", () => {
    test("should delete all files in specified folder", async () => {
      const files: FileObject[] = [
        {
          id: "file-1",
          dataroomId: "dataroom-1",
          parentId: "folder-1",
          name: "document1.pdf",
          mimeType: "application/pdf",
          size: 1024,
          blobKey: "blob-1",
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
        {
          id: "file-2",
          dataroomId: "dataroom-1",
          parentId: "folder-1",
          name: "document2.pdf",
          mimeType: "application/pdf",
          size: 2048,
          blobKey: "blob-2",
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
        {
          id: "file-3",
          dataroomId: "dataroom-1",
          parentId: "folder-2",
          name: "document3.pdf",
          mimeType: "application/pdf",
          size: 512,
          blobKey: "blob-3",
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ];

      for (const file of files) {
        await FileRepo.insert(file);
      }

      const deleted = await FileRepo.deleteByFolder("folder-1", "dataroom-1");
      expect(deleted).toBe(2);

      const remaining = await FileRepo.listByDataroom("dataroom-1");
      expect(remaining).toHaveLength(1);
      expect(remaining[0].id).toBe("file-3");
    });

    test("should return 0 when no files exist in folder", async () => {
      const deleted = await FileRepo.deleteByFolder(
        "empty-folder",
        "dataroom-1"
      );
      expect(deleted).toBe(0);
    });

    test("should handle null parentId (root level)", async () => {
      const file: FileObject = {
        id: "file-1",
        dataroomId: "dataroom-1",
        parentId: null,
        name: "root-document.pdf",
        mimeType: "application/pdf",
        size: 1024,
        blobKey: "blob-1",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      await FileRepo.insert(file);

      const deleted = await FileRepo.deleteByFolder(null, "dataroom-1");
      expect(deleted).toBe(1);

      const remaining = await FileRepo.listByDataroom("dataroom-1");
      expect(remaining).toHaveLength(0);
    });
  });

  describe("getTotalSizeInFolder", () => {
    test("should return 0 when no files exist in folder", async () => {
      const totalSize = await FileRepo.getTotalSizeInFolder(
        "empty-folder",
        "dataroom-1"
      );
      expect(totalSize).toBe(0);
    });

    test("should return correct total size for folder", async () => {
      const files: FileObject[] = [
        {
          id: "file-1",
          dataroomId: "dataroom-1",
          parentId: "folder-1",
          name: "document1.pdf",
          mimeType: "application/pdf",
          size: 1024,
          blobKey: "blob-1",
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
        {
          id: "file-2",
          dataroomId: "dataroom-1",
          parentId: "folder-1",
          name: "document2.pdf",
          mimeType: "application/pdf",
          size: 2048,
          blobKey: "blob-2",
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
        {
          id: "file-3",
          dataroomId: "dataroom-1",
          parentId: "folder-2",
          name: "document3.pdf",
          mimeType: "application/pdf",
          size: 512,
          blobKey: "blob-3",
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ];

      for (const file of files) {
        await FileRepo.insert(file);
      }

      const totalSize = await FileRepo.getTotalSizeInFolder(
        "folder-1",
        "dataroom-1"
      );
      expect(totalSize).toBe(3072); // 1024 + 2048

      const totalSize2 = await FileRepo.getTotalSizeInFolder(
        "folder-2",
        "dataroom-1"
      );
      expect(totalSize2).toBe(512);
    });

    test("should handle null parentId (root level)", async () => {
      const file: FileObject = {
        id: "file-1",
        dataroomId: "dataroom-1",
        parentId: null,
        name: "root-document.pdf",
        mimeType: "application/pdf",
        size: 1024,
        blobKey: "blob-1",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      await FileRepo.insert(file);

      const totalSize = await FileRepo.getTotalSizeInFolder(null, "dataroom-1");
      expect(totalSize).toBe(1024);
    });
  });
});
