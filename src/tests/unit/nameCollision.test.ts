import { describe, it, expect } from "vitest";
import {
  resolveNameCollision,
  isNameAvailable,
  resolveFileNameCollision,
  resolveFolderNameCollision,
  resolveDataroomNameCollision,
} from "../../core/utils/nameCollision";
import { AlreadyExistsError, InvalidOperationError } from "../../core/errors";
import type { FileObject, Folder } from "../../core/types";

describe("nameCollision utility", () => {
  const mockFiles: FileObject[] = [
    {
      id: "1",
      dataroomId: "room1",
      parentId: "folder1",
      name: "document.pdf",
      mimeType: "application/pdf",
      size: 1000,
      blobKey: "blob1",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
    {
      id: "2",
      dataroomId: "room1",
      parentId: "folder1",
      name: "report.pdf",
      mimeType: "application/pdf",
      size: 2000,
      blobKey: "blob2",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
  ];

  const mockFolders: Folder[] = [
    {
      id: "folder1",
      dataroomId: "room1",
      parentId: null,
      name: "Documents",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
    {
      id: "folder2",
      dataroomId: "room1",
      parentId: null,
      name: "Reports",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
  ];

  const mockDatarooms: Array<{ id: string; name: string }> = [
    { id: "room1", name: "Project Alpha" },
    { id: "room2", name: "Project Beta" },
  ];

  describe("isNameAvailable", () => {
    it("should return true for available names", () => {
      expect(isNameAvailable("newfile.pdf", mockFiles)).toBe(true);
    });

    it("should return false for existing names", () => {
      expect(isNameAvailable("document.pdf", mockFiles)).toBe(false);
    });

    it("should return true when excluding the same item", () => {
      expect(isNameAvailable("document.pdf", mockFiles, "1")).toBe(true);
    });

    it("should handle case sensitivity correctly", () => {
      expect(isNameAvailable("Document.pdf", mockFiles)).toBe(true); // Case-sensitive: different from 'document.pdf'
      expect(isNameAvailable("document.pdf", mockFiles)).toBe(false); // Exact match
    });

    it("should handle empty arrays", () => {
      expect(isNameAvailable("anyname.pdf", [])).toBe(true);
    });
  });

  describe("resolveNameCollision", () => {
    it("should return original name when no collision exists", async () => {
      const result = await resolveNameCollision({
        entityType: "file",
        name: "newfile.pdf",
        action: "cancel",
        existingSiblings: mockFiles,
      });

      expect(result.finalName).toBe("newfile.pdf");
      expect(result.shouldReplace).toBe(false);
    });

    it("should throw AlreadyExistsError when action is cancel and collision exists", async () => {
      await expect(
        resolveNameCollision({
          entityType: "file",
          name: "document.pdf",
          action: "cancel",
          existingSiblings: mockFiles,
        })
      ).rejects.toThrow(AlreadyExistsError);
    });

    it("should generate unique name when action is keep-both", async () => {
      const result = await resolveNameCollision({
        entityType: "file",
        name: "document.pdf",
        action: "keep-both",
        existingSiblings: mockFiles,
      });

      expect(result.finalName).toBe("document (1).pdf");
      expect(result.shouldReplace).toBe(false);
    });

    it("should handle replace action for supported entities", async () => {
      const result = await resolveNameCollision({
        entityType: "file",
        name: "document.pdf",
        action: "replace",
        existingSiblings: mockFiles,
        supportsReplace: true,
      });

      expect(result.finalName).toBe("document.pdf");
      expect(result.shouldReplace).toBe(true);
      expect(result.existingItem).toEqual(mockFiles[0]);
    });

    it("should throw InvalidOperationError when replace is not supported", async () => {
      await expect(
        resolveNameCollision({
          entityType: "folder",
          name: "Documents",
          action: "replace",
          existingSiblings: mockFolders,
          supportsReplace: false,
        })
      ).rejects.toThrow(InvalidOperationError);
    });

    it("should exclude specified item from collision check", async () => {
      const result = await resolveNameCollision({
        entityType: "file",
        name: "document.pdf",
        action: "keep-both",
        existingSiblings: mockFiles,
        excludeId: "1",
      });

      expect(result.finalName).toBe("document.pdf");
      expect(result.shouldReplace).toBe(false);
    });

    it("should generate multiple unique names correctly", async () => {
      const filesWithDuplicates = [
        ...mockFiles,
        {
          ...mockFiles[0],
          id: "3",
          name: "document (1).pdf",
        },
      ];

      const result = await resolveNameCollision({
        entityType: "file",
        name: "document.pdf",
        action: "keep-both",
        existingSiblings: filesWithDuplicates,
      });

      expect(result.finalName).toBe("document (2).pdf");
    });
  });

  describe("resolveFileNameCollision", () => {
    it("should handle file-specific collision resolution", async () => {
      const result = await resolveFileNameCollision(
        "document.pdf",
        "keep-both",
        mockFiles
      );

      expect(result.finalName).toBe("document (1).pdf");
      expect(result.shouldReplace).toBe(false);
    });

    it("should support replace action for files", async () => {
      const result = await resolveFileNameCollision(
        "document.pdf",
        "replace",
        mockFiles
      );

      expect(result.finalName).toBe("document.pdf");
      expect(result.shouldReplace).toBe(true);
    });
  });

  describe("resolveFolderNameCollision", () => {
    it("should handle folder-specific collision resolution", async () => {
      const result = await resolveFolderNameCollision(
        "Documents",
        "keep-both",
        mockFolders
      );

      expect(result.finalName).toBe("Documents (1)");
      expect(result.shouldReplace).toBe(false);
    });

    it("should not support replace action for folders", async () => {
      await expect(
        resolveFolderNameCollision("Documents", "replace", mockFolders)
      ).rejects.toThrow(InvalidOperationError);
    });
  });

  describe("resolveDataroomNameCollision", () => {
    it("should handle dataroom-specific collision resolution", async () => {
      const result = await resolveDataroomNameCollision(
        "Project Alpha",
        "keep-both",
        mockDatarooms
      );

      expect(result.finalName).toBe("Project Alpha (1)");
      expect(result.shouldReplace).toBe(false);
    });

    it("should not support replace action for datarooms", async () => {
      await expect(
        resolveDataroomNameCollision("Project Alpha", "replace", mockDatarooms)
      ).rejects.toThrow(InvalidOperationError);
    });
  });

  describe("edge cases", () => {
    it("should handle names without extensions", async () => {
      const foldersWithoutExt = [{ ...mockFolders[0], name: "folder" }];

      const result = await resolveNameCollision({
        entityType: "folder",
        name: "folder",
        action: "keep-both",
        existingSiblings: foldersWithoutExt,
      });

      expect(result.finalName).toBe("folder (1)");
    });

    it("should handle empty names gracefully", async () => {
      await expect(
        resolveNameCollision({
          entityType: "file",
          name: "",
          action: "cancel",
          existingSiblings: [],
        })
      ).rejects.toThrow(); // Should throw validation error from normalizeName
    });

    it("should handle very long names", async () => {
      const longName = "a".repeat(200) + ".pdf";
      const result = await resolveNameCollision({
        entityType: "file",
        name: longName,
        action: "keep-both",
        existingSiblings: [],
      });

      expect(result.finalName).toBe(longName);
    });

    it("should handle special characters in names", async () => {
      const invalidName = "file@#$%^&*().pdf";

      await expect(
        resolveNameCollision({
          entityType: "file",
          name: invalidName,
          action: "keep-both",
          existingSiblings: [],
        })
      ).rejects.toThrow("Name contains invalid characters");

      const validName = "file-name_with.spaces (1).pdf";
      const result = await resolveNameCollision({
        entityType: "file",
        name: validName,
        action: "keep-both",
        existingSiblings: [],
      });

      expect(result.finalName).toBe("file-name_with.spaces (1).pdf");
    });
  });
});
