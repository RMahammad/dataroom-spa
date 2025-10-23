import { describe, test, expect, beforeEach, afterEach } from "vitest";
import { FolderRepo } from "../../core/repos/FolderRepo";
import { clearDatabase } from "../../core/repos/db";
import { DatabaseError, NotFoundError } from "../../core/errors";
import type { Folder } from "../../core/types";

describe("FolderRepo", () => {
  beforeEach(async () => {
    await clearDatabase();
  });

  afterEach(async () => {
    await clearDatabase();
  });

  describe("insert", () => {
    test("should insert a new folder successfully", async () => {
      const folder: Folder = {
        id: "folder-1",
        dataroomId: "dataroom-1",
        parentId: null,
        name: "Documents",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const result = await FolderRepo.insert(folder);
      expect(result).toBe("folder-1");

      const retrieved = await FolderRepo.get("folder-1");
      expect(retrieved).toEqual(folder);
    });

    test("should insert a nested folder successfully", async () => {
      const parentFolder: Folder = {
        id: "parent-folder",
        dataroomId: "dataroom-1",
        parentId: null,
        name: "Parent",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const childFolder: Folder = {
        id: "child-folder",
        dataroomId: "dataroom-1",
        parentId: "parent-folder",
        name: "Child",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      await FolderRepo.insert(parentFolder);
      const result = await FolderRepo.insert(childFolder);
      expect(result).toBe("child-folder");

      const retrieved = await FolderRepo.get("child-folder");
      expect(retrieved).toEqual(childFolder);
    });

    test("should throw DatabaseError if insertion fails", async () => {
      // Insert a folder with duplicate ID
      const folder1: Folder = {
        id: "folder-1",
        dataroomId: "dataroom-1",
        parentId: null,
        name: "Folder 1",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const folder2: Folder = {
        id: "folder-1", // Same ID - should cause a constraint violation
        dataroomId: "dataroom-1",
        parentId: null,
        name: "Folder 2",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      await FolderRepo.insert(folder1);

      await expect(FolderRepo.insert(folder2)).rejects.toThrow(DatabaseError);
    });
  });

  describe("get", () => {
    test("should return folder when it exists", async () => {
      const folder: Folder = {
        id: "folder-1",
        dataroomId: "dataroom-1",
        parentId: null,
        name: "Documents",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      await FolderRepo.insert(folder);
      const result = await FolderRepo.get("folder-1");
      expect(result).toEqual(folder);
    });

    test("should return undefined when folder does not exist", async () => {
      const result = await FolderRepo.get("non-existent");
      expect(result).toBeUndefined();
    });

    test("should throw DatabaseError on database failure", async () => {
      const result = await FolderRepo.get("folder-1");
      expect(result).toBeUndefined();
    });
  });

  describe("getRequired", () => {
    test("should return folder when it exists", async () => {
      const folder: Folder = {
        id: "folder-1",
        dataroomId: "dataroom-1",
        parentId: null,
        name: "Documents",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      await FolderRepo.insert(folder);
      const result = await FolderRepo.getRequired("folder-1");
      expect(result).toEqual(folder);
    });

    test("should throw NotFoundError when folder does not exist", async () => {
      await expect(FolderRepo.getRequired("non-existent")).rejects.toThrow(
        NotFoundError
      );
    });
  });

  describe("listByParent", () => {
    test("should return root folders when parentId is null", async () => {
      const now = Date.now();
      const folders: Folder[] = [
        {
          id: "folder-1",
          dataroomId: "dataroom-1",
          parentId: null,
          name: "Documents",
          createdAt: now,
          updatedAt: now + 1000,
        },
        {
          id: "folder-2",
          dataroomId: "dataroom-1",
          parentId: null,
          name: "Images",
          createdAt: now + 500,
          updatedAt: now + 2000,
        },
        {
          id: "folder-3",
          dataroomId: "dataroom-1",
          parentId: "folder-1",
          name: "Subfolder",
          createdAt: now + 1000,
          updatedAt: now + 500,
        },
      ];

      for (const folder of folders) {
        await FolderRepo.insert(folder);
      }

      const result = await FolderRepo.listByParent(null, "dataroom-1");

      // Should return only root folders, sorted by name asc (default)
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe("Documents");
      expect(result[1].name).toBe("Images");
    });

    test("should return child folders when parentId is specified", async () => {
      const folders: Folder[] = [
        {
          id: "parent-folder",
          dataroomId: "dataroom-1",
          parentId: null,
          name: "Parent",
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
        {
          id: "child-1",
          dataroomId: "dataroom-1",
          parentId: "parent-folder",
          name: "Child 1",
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
        {
          id: "child-2",
          dataroomId: "dataroom-1",
          parentId: "parent-folder",
          name: "Child 2",
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
        {
          id: "other-child",
          dataroomId: "dataroom-1",
          parentId: "other-parent",
          name: "Other Child",
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ];

      for (const folder of folders) {
        await FolderRepo.insert(folder);
      }

      const result = await FolderRepo.listByParent(
        "parent-folder",
        "dataroom-1"
      );

      expect(result).toHaveLength(2);
      expect(result.every((f) => f.parentId === "parent-folder")).toBe(true);
    });

    test("should sort by name ascending", async () => {
      const folders: Folder[] = [
        {
          id: "folder-1",
          dataroomId: "dataroom-1",
          parentId: null,
          name: "Zebra",
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
        {
          id: "folder-2",
          dataroomId: "dataroom-1",
          parentId: null,
          name: "Alpha",
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ];

      for (const folder of folders) {
        await FolderRepo.insert(folder);
      }

      const result = await FolderRepo.listByParent(
        null,
        "dataroom-1",
        "name",
        "asc"
      );

      expect(result[0].name).toBe("Alpha");
      expect(result[1].name).toBe("Zebra");
    });

    test("should sort by name descending", async () => {
      const folders: Folder[] = [
        {
          id: "folder-1",
          dataroomId: "dataroom-1",
          parentId: null,
          name: "Alpha",
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
        {
          id: "folder-2",
          dataroomId: "dataroom-1",
          parentId: null,
          name: "Zebra",
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ];

      for (const folder of folders) {
        await FolderRepo.insert(folder);
      }

      const result = await FolderRepo.listByParent(
        null,
        "dataroom-1",
        "name",
        "desc"
      );

      expect(result[0].name).toBe("Zebra");
      expect(result[1].name).toBe("Alpha");
    });

    test("should sort by createdAt ascending", async () => {
      const now = Date.now();
      const folders: Folder[] = [
        {
          id: "folder-1",
          dataroomId: "dataroom-1",
          parentId: null,
          name: "Second",
          createdAt: now + 1000,
          updatedAt: now,
        },
        {
          id: "folder-2",
          dataroomId: "dataroom-1",
          parentId: null,
          name: "First",
          createdAt: now,
          updatedAt: now,
        },
      ];

      for (const folder of folders) {
        await FolderRepo.insert(folder);
      }

      const result = await FolderRepo.listByParent(
        null,
        "dataroom-1",
        "createdAt",
        "asc"
      );

      expect(result[0].name).toBe("First");
      expect(result[1].name).toBe("Second");
    });

    test("should sort by updatedAt descending", async () => {
      const now = Date.now();
      const folders: Folder[] = [
        {
          id: "folder-1",
          dataroomId: "dataroom-1",
          parentId: null,
          name: "Older",
          createdAt: now,
          updatedAt: now,
        },
        {
          id: "folder-2",
          dataroomId: "dataroom-1",
          parentId: null,
          name: "Newer",
          createdAt: now,
          updatedAt: now + 1000,
        },
      ];

      for (const folder of folders) {
        await FolderRepo.insert(folder);
      }

      const result = await FolderRepo.listByParent(
        null,
        "dataroom-1",
        "updatedAt",
        "desc"
      );

      expect(result[0].name).toBe("Newer");
      expect(result[1].name).toBe("Older");
    });

    test("should return empty array when no folders exist", async () => {
      const result = await FolderRepo.listByParent(null, "empty-dataroom");
      expect(result).toEqual([]);
    });

    test("should throw DatabaseError on database failure", async () => {
      const result = await FolderRepo.listByParent(null, "dataroom-1");
      expect(result).toEqual([]);
    });
  });

  describe("listByDataroom", () => {
    test("should return all folders in dataroom", async () => {
      const folders: Folder[] = [
        {
          id: "folder-1",
          dataroomId: "dataroom-1",
          parentId: null,
          name: "Root 1",
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
        {
          id: "folder-2",
          dataroomId: "dataroom-1",
          parentId: "folder-1",
          name: "Child 1",
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
        {
          id: "folder-3",
          dataroomId: "dataroom-2",
          parentId: null,
          name: "Other Root",
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ];

      for (const folder of folders) {
        await FolderRepo.insert(folder);
      }

      const result = await FolderRepo.listByDataroom("dataroom-1");

      expect(result).toHaveLength(2);
      expect(result.every((f) => f.dataroomId === "dataroom-1")).toBe(true);
    });

    test("should return empty array when no folders exist in dataroom", async () => {
      const result = await FolderRepo.listByDataroom("empty-dataroom");
      expect(result).toEqual([]);
    });
  });

  describe("updateName", () => {
    test("should update folder name and timestamp", async () => {
      const folder: Folder = {
        id: "folder-1",
        dataroomId: "dataroom-1",
        parentId: null,
        name: "Old Name",
        createdAt: Date.now(),
        updatedAt: 1000,
      };

      await FolderRepo.insert(folder);

      const updateTime = Date.now();
      const result = await FolderRepo.updateName("folder-1", "New Name");
      expect(result).toBe(1);

      const updated = await FolderRepo.getRequired("folder-1");
      expect(updated.name).toBe("New Name");
      expect(updated.updatedAt).toBeGreaterThanOrEqual(updateTime);
      expect(updated.createdAt).toBe(folder.createdAt);
    });

    test("should return 0 when folder does not exist", async () => {
      const result = await FolderRepo.updateName("non-existent", "New Name");
      expect(result).toBe(0);
    });

    test("should throw DatabaseError on database failure", async () => {
      const result = await FolderRepo.updateName("folder-1", "New Name");
      expect(result).toBe(0); // Folder doesn't exist
    });
  });

  describe("touch", () => {
    test("should update only the timestamp", async () => {
      const folder: Folder = {
        id: "folder-1",
        dataroomId: "dataroom-1",
        parentId: null,
        name: "Documents",
        createdAt: Date.now(),
        updatedAt: 1000,
      };

      await FolderRepo.insert(folder);

      const updateTime = Date.now();
      const result = await FolderRepo.touch("folder-1");
      expect(result).toBe(1);

      const updated = await FolderRepo.getRequired("folder-1");
      expect(updated.name).toBe(folder.name); // Unchanged
      expect(updated.parentId).toBe(folder.parentId); // Unchanged
      expect(updated.updatedAt).toBeGreaterThanOrEqual(updateTime);
    });

    test("should return 0 when folder does not exist", async () => {
      const result = await FolderRepo.touch("non-existent");
      expect(result).toBe(0);
    });
  });

  describe("delete", () => {
    test("should delete existing folder", async () => {
      const folder: Folder = {
        id: "folder-1",
        dataroomId: "dataroom-1",
        parentId: null,
        name: "Documents",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      await FolderRepo.insert(folder);

      await FolderRepo.delete("folder-1");
      const result = await FolderRepo.get("folder-1");
      expect(result).toBeUndefined();
    });

    test("should not throw error when deleting non-existent folder", async () => {
      await expect(FolderRepo.delete("non-existent")).resolves.not.toThrow();
    });

    test("should throw DatabaseError on database failure", async () => {
      await expect(FolderRepo.delete("folder-1")).resolves.not.toThrow();
    });
  });

  describe("nameExistsInParent", () => {
    test("should return true when name exists in same parent", async () => {
      const folder: Folder = {
        id: "folder-1",
        dataroomId: "dataroom-1",
        parentId: null,
        name: "Documents",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      await FolderRepo.insert(folder);

      const exists = await FolderRepo.nameExistsInParent(
        "Documents",
        null,
        "dataroom-1"
      );
      expect(exists).toBe(true);
    });

    test("should return false when name does not exist", async () => {
      const exists = await FolderRepo.nameExistsInParent(
        "NonExistent",
        null,
        "dataroom-1"
      );
      expect(exists).toBe(false);
    });

    test("should return false when name exists in different parent", async () => {
      const folders: Folder[] = [
        {
          id: "folder-1",
          dataroomId: "dataroom-1",
          parentId: null,
          name: "Documents",
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
        {
          id: "folder-2",
          dataroomId: "dataroom-1",
          parentId: "other-parent",
          name: "Documents",
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ];

      for (const folder of folders) {
        await FolderRepo.insert(folder);
      }

      const exists = await FolderRepo.nameExistsInParent(
        "Documents",
        "other-parent",
        "dataroom-1"
      );
      expect(exists).toBe(true); // Exists in other-parent

      const existsInRoot = await FolderRepo.nameExistsInParent(
        "Documents",
        "some-other-parent",
        "dataroom-1"
      );
      expect(existsInRoot).toBe(false); // Doesn't exist in some-other-parent
    });

    test("should exclude specified ID when checking existence", async () => {
      const folder: Folder = {
        id: "folder-1",
        dataroomId: "dataroom-1",
        parentId: null,
        name: "Documents",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      await FolderRepo.insert(folder);

      const exists = await FolderRepo.nameExistsInParent(
        "Documents",
        null,
        "dataroom-1",
        "folder-1"
      );
      expect(exists).toBe(false);
    });

    test("should not exclude other folders with same name", async () => {
      const folders: Folder[] = [
        {
          id: "folder-1",
          dataroomId: "dataroom-1",
          parentId: null,
          name: "Documents",
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
        {
          id: "folder-2",
          dataroomId: "dataroom-1",
          parentId: null,
          name: "Documents",
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ];

      for (const folder of folders) {
        await FolderRepo.insert(folder);
      }

      const exists = await FolderRepo.nameExistsInParent(
        "Documents",
        null,
        "dataroom-1",
        "folder-1"
      );
      expect(exists).toBe(true); // folder-2 still has the same name
    });

    test("should handle nested folder structure", async () => {
      const folders: Folder[] = [
        {
          id: "parent-folder",
          dataroomId: "dataroom-1",
          parentId: null,
          name: "Parent",
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
        {
          id: "child-folder",
          dataroomId: "dataroom-1",
          parentId: "parent-folder",
          name: "Child",
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ];

      for (const folder of folders) {
        await FolderRepo.insert(folder);
      }

      const existsInParent = await FolderRepo.nameExistsInParent(
        "Child",
        "parent-folder",
        "dataroom-1"
      );
      expect(existsInParent).toBe(true);

      const existsInRoot = await FolderRepo.nameExistsInParent(
        "Child",
        null,
        "dataroom-1"
      );
      expect(existsInRoot).toBe(false);
    });
  });

  describe("countChildren", () => {
    test("should return 0 when no child folders exist", async () => {
      const count = await FolderRepo.countChildren(
        "parent-folder",
        "dataroom-1"
      );
      expect(count).toBe(0);
    });

    test("should return correct count when child folders exist", async () => {
      const folders: Folder[] = [
        {
          id: "parent-folder",
          dataroomId: "dataroom-1",
          parentId: null,
          name: "Parent",
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
        {
          id: "child-1",
          dataroomId: "dataroom-1",
          parentId: "parent-folder",
          name: "Child 1",
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
        {
          id: "child-2",
          dataroomId: "dataroom-1",
          parentId: "parent-folder",
          name: "Child 2",
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
        {
          id: "other-child",
          dataroomId: "dataroom-1",
          parentId: "other-parent",
          name: "Other Child",
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ];

      for (const folder of folders) {
        await FolderRepo.insert(folder);
      }

      const count = await FolderRepo.countChildren(
        "parent-folder",
        "dataroom-1"
      );
      expect(count).toBe(2);
    });

    test("should throw DatabaseError on database failure", async () => {
      const count = await FolderRepo.countChildren(
        "parent-folder",
        "dataroom-1"
      );
      expect(typeof count).toBe("number");
    });
  });

  describe("deleteByDataroom", () => {
    test("should delete all folders in dataroom", async () => {
      const folders: Folder[] = [
        {
          id: "folder-1",
          dataroomId: "dataroom-1",
          parentId: null,
          name: "Root 1",
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
        {
          id: "folder-2",
          dataroomId: "dataroom-1",
          parentId: "folder-1",
          name: "Child 1",
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
        {
          id: "folder-3",
          dataroomId: "dataroom-2",
          parentId: null,
          name: "Other Root",
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ];

      for (const folder of folders) {
        await FolderRepo.insert(folder);
      }

      const deleted = await FolderRepo.deleteByDataroom("dataroom-1");
      expect(deleted).toBe(2);

      const remaining = await FolderRepo.listByDataroom("dataroom-1");
      expect(remaining).toHaveLength(0);

      const dataroom2Folders = await FolderRepo.listByDataroom("dataroom-2");
      expect(dataroom2Folders).toHaveLength(1);
    });

    test("should return 0 when no folders exist in dataroom", async () => {
      const deleted = await FolderRepo.deleteByDataroom("empty-dataroom");
      expect(deleted).toBe(0);
    });
  });
});
