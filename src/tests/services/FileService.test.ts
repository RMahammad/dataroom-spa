import { describe, it, expect, vi, beforeEach } from "vitest";
import { FileService } from "../../core/services/FileService";
import { FileRepo } from "../../core/repos/FileRepo";
import { BlobRepo } from "../../core/repos/BlobRepo";
import { FolderRepo } from "../../core/repos/FolderRepo";
import { DataroomRepo } from "../../core/repos/DataroomRepo";
import {
  validateName,
  normalizeName,
  generateUniqueName,
} from "../../core/utils/names";
import type { FileObject, Folder } from "../../core/types";
import {
  AlreadyExistsError,
  FileValidationError,
  NameValidationError,
} from "../../core/errors";

// Mock all dependencies
vi.mock("../../core/repos/FileRepo");
vi.mock("../../core/repos/BlobRepo");
vi.mock("../../core/repos/FolderRepo");
vi.mock("../../core/repos/DataroomRepo");
vi.mock("../../core/utils/names");
vi.mock("../../core/utils/ids", () => ({
  generateId: () => "generated-id",
}));

describe("FileService", () => {
  const mockFile: FileObject = {
    id: "file-1",
    dataroomId: "dataroom-1",
    parentId: "folder-1",
    name: "test.pdf",
    mimeType: "application/pdf",
    size: 1000,
    blobKey: "blob-1",
    createdAt: 1000000,
    updatedAt: 1000000,
  };

  const mockFolder: Folder = {
    id: "folder-1",
    dataroomId: "dataroom-1",
    parentId: null,
    name: "Test Folder",
    createdAt: 1000000,
    updatedAt: 1000000,
  };

  const mockPdfFile = new File(["test content"], "test.pdf", {
    type: "application/pdf",
  });

  const mockInvalidFile = new File(["test content"], "test.txt", {
    type: "text/plain",
  });

  beforeEach(() => {
    vi.clearAllMocks();
    vi.setSystemTime(new Date(1000000));
  });

  describe("upload", () => {
    it("should upload a valid PDF file successfully", async () => {
      vi.mocked(normalizeName).mockReturnValue("test.pdf");
      vi.mocked(validateName).mockImplementation(() => {});
      vi.mocked(DataroomRepo.getRequired).mockResolvedValue({
        id: "dataroom-1",
        name: "Test",
        createdAt: 1000000,
        updatedAt: 1000000,
      });
      vi.mocked(FolderRepo.getRequired).mockResolvedValue(mockFolder);
      vi.mocked(FileRepo.nameExistsInParent).mockResolvedValue(false);
      vi.mocked(BlobRepo.put).mockResolvedValue("blob-key");
      vi.mocked(FileRepo.insert).mockResolvedValue("file-id");
      vi.mocked(DataroomRepo.touch).mockResolvedValue(1);

      const result = await FileService.upload(
        mockPdfFile,
        "dataroom-1",
        "folder-1"
      );

      expect(validateName).toHaveBeenCalledWith("test.pdf", "file");
      expect(DataroomRepo.getRequired).toHaveBeenCalledWith("dataroom-1");
      expect(FolderRepo.getRequired).toHaveBeenCalledWith("folder-1");
      expect(FileRepo.nameExistsInParent).toHaveBeenCalledWith(
        "test.pdf",
        "folder-1",
        "dataroom-1"
      );
      expect(BlobRepo.put).toHaveBeenCalledWith("generated-id", mockPdfFile);
      expect(FileRepo.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "test.pdf",
          dataroomId: "dataroom-1",
          parentId: "folder-1",
          mimeType: "application/pdf",
          blobKey: "generated-id",
        })
      );
      expect(DataroomRepo.touch).toHaveBeenCalledWith("dataroom-1");
      expect(result).toEqual(
        expect.objectContaining({
          name: "test.pdf",
          dataroomId: "dataroom-1",
          parentId: "folder-1",
        })
      );
    });

    it("should throw error for non-PDF file", async () => {
      await expect(
        FileService.upload(mockInvalidFile, "dataroom-1", "folder-1")
      ).rejects.toThrow(FileValidationError);
    });

    it("should throw error for oversized file", async () => {
      const largeFile = new File(["x".repeat(51 * 1024 * 1024)], "large.pdf", {
        type: "application/pdf",
      });

      await expect(
        FileService.upload(largeFile, "dataroom-1", "folder-1")
      ).rejects.toThrow(FileValidationError);
    });

    it("should handle name collision with cancel action", async () => {
      vi.mocked(normalizeName).mockReturnValue("test.pdf");
      vi.mocked(validateName).mockImplementation(() => {});
      vi.mocked(DataroomRepo.getRequired).mockResolvedValue({
        id: "dataroom-1",
        name: "Test",
        createdAt: 1000000,
        updatedAt: 1000000,
      });
      vi.mocked(FolderRepo.getRequired).mockResolvedValue(mockFolder);
      vi.mocked(FileRepo.nameExistsInParent).mockResolvedValue(true);

      await expect(
        FileService.upload(mockPdfFile, "dataroom-1", "folder-1", "cancel")
      ).rejects.toThrow(AlreadyExistsError);
    });

    it("should handle name collision with keep-both action", async () => {
      vi.mocked(normalizeName).mockReturnValue("test.pdf");
      vi.mocked(validateName).mockImplementation(() => {});
      vi.mocked(DataroomRepo.getRequired).mockResolvedValue({
        id: "dataroom-1",
        name: "Test",
        createdAt: 1000000,
        updatedAt: 1000000,
      });
      vi.mocked(FolderRepo.getRequired).mockResolvedValue(mockFolder);
      vi.mocked(FileRepo.nameExistsInParent).mockResolvedValue(true);
      vi.mocked(FileRepo.listByParent).mockResolvedValue([mockFile]);
      vi.mocked(generateUniqueName).mockReturnValue("test (1).pdf");
      vi.mocked(BlobRepo.put).mockResolvedValue("blob-key");
      vi.mocked(FileRepo.insert).mockResolvedValue("file-id");
      vi.mocked(DataroomRepo.touch).mockResolvedValue(1);

      const result = await FileService.upload(
        mockPdfFile,
        "dataroom-1",
        "folder-1",
        "keep-both"
      );

      expect(generateUniqueName).toHaveBeenCalled();
      expect(result).toEqual(
        expect.objectContaining({
          name: "test (1).pdf",
        })
      );
    });

    it("should handle name collision with replace action", async () => {
      vi.mocked(normalizeName).mockReturnValue("test.pdf");
      vi.mocked(validateName).mockImplementation(() => {});
      vi.mocked(DataroomRepo.getRequired).mockResolvedValue({
        id: "dataroom-1",
        name: "Test",
        createdAt: 1000000,
        updatedAt: 1000000,
      });
      vi.mocked(FolderRepo.getRequired).mockResolvedValue(mockFolder);
      vi.mocked(FileRepo.nameExistsInParent).mockResolvedValue(true);
      vi.mocked(FileRepo.listByParent).mockResolvedValue([mockFile]);
      vi.mocked(FileRepo.getRequired).mockResolvedValue(mockFile);
      vi.mocked(BlobRepo.delete).mockResolvedValue(undefined);
      vi.mocked(FileRepo.delete).mockResolvedValue(undefined);
      vi.mocked(BlobRepo.put).mockResolvedValue("blob-key");
      vi.mocked(FileRepo.insert).mockResolvedValue("file-id");
      vi.mocked(DataroomRepo.touch).mockResolvedValue(1);

      const result = await FileService.upload(
        mockPdfFile,
        "dataroom-1",
        "folder-1",
        "replace"
      );

      expect(FileService.delete).toBeDefined();
      expect(result).toEqual(
        expect.objectContaining({
          name: "test.pdf",
        })
      );
    });
  });

  describe("get", () => {
    it("should return file by id", async () => {
      vi.mocked(FileRepo.getRequired).mockResolvedValue(mockFile);

      const result = await FileService.get("file-1");

      expect(FileRepo.getRequired).toHaveBeenCalledWith("file-1");
      expect(result).toEqual(mockFile);
    });

    it("should throw error if file not found", async () => {
      vi.mocked(FileRepo.getRequired).mockRejectedValue(
        new Error("File not found")
      );

      await expect(FileService.get("nonexistent")).rejects.toThrow(
        "File not found"
      );
    });
  });

  describe("listInFolder", () => {
    it("should return files in folder with default sorting", async () => {
      const files = [mockFile];
      vi.mocked(FileRepo.listByParent).mockResolvedValue(files);

      const result = await FileService.listInFolder("folder-1", "dataroom-1");

      expect(FileRepo.listByParent).toHaveBeenCalledWith(
        "folder-1",
        "dataroom-1",
        "name",
        "asc"
      );
      expect(result).toEqual(files);
    });

    it("should return files with custom sorting", async () => {
      const files = [mockFile];
      vi.mocked(FileRepo.listByParent).mockResolvedValue(files);

      const result = await FileService.listInFolder(
        "folder-1",
        "dataroom-1",
        "size",
        "desc"
      );

      expect(FileRepo.listByParent).toHaveBeenCalledWith(
        "folder-1",
        "dataroom-1",
        "size",
        "desc"
      );
      expect(result).toEqual(files);
    });
  });

  describe("rename", () => {
    it("should rename file successfully", async () => {
      const updatedFile = { ...mockFile, name: "renamed.pdf" };
      vi.mocked(normalizeName).mockReturnValue("renamed.pdf");
      vi.mocked(validateName).mockImplementation(() => {});
      vi.mocked(FileRepo.getRequired)
        .mockResolvedValueOnce(mockFile)
        .mockResolvedValueOnce(updatedFile);
      vi.mocked(FileRepo.nameExistsInParent).mockResolvedValue(false);
      vi.mocked(FileRepo.updateName).mockResolvedValue(1);
      vi.mocked(DataroomRepo.touch).mockResolvedValue(1);

      const result = await FileService.rename("file-1", "renamed.pdf");

      expect(validateName).toHaveBeenCalledWith("renamed.pdf", "file");
      expect(FileRepo.nameExistsInParent).toHaveBeenCalledWith(
        "renamed.pdf",
        "folder-1",
        "dataroom-1",
        "file-1"
      );
      expect(FileRepo.updateName).toHaveBeenCalledWith("file-1", "renamed.pdf");
      expect(DataroomRepo.touch).toHaveBeenCalledWith("dataroom-1");
      expect(result).toEqual(updatedFile);
    });

    it("should throw error for invalid name", async () => {
      vi.mocked(normalizeName).mockReturnValue("invalid//name.pdf");
      vi.mocked(validateName).mockImplementation(() => {
        throw new NameValidationError("Invalid name");
      });

      await expect(
        FileService.rename("file-1", "invalid//name.pdf")
      ).rejects.toThrow(NameValidationError);
    });

    it("should handle name collision with cancel action", async () => {
      vi.mocked(normalizeName).mockReturnValue("existing.pdf");
      vi.mocked(validateName).mockImplementation(() => {});
      vi.mocked(FileRepo.getRequired).mockResolvedValue(mockFile);
      vi.mocked(FileRepo.nameExistsInParent).mockResolvedValue(true);

      await expect(
        FileService.rename("file-1", "existing.pdf", "cancel")
      ).rejects.toThrow(AlreadyExistsError);
    });
  });

  describe("delete", () => {
    it("should delete file and its blob", async () => {
      vi.mocked(FileRepo.getRequired).mockResolvedValue(mockFile);
      vi.mocked(BlobRepo.delete).mockResolvedValue(undefined);
      vi.mocked(FileRepo.delete).mockResolvedValue(undefined);
      vi.mocked(DataroomRepo.touch).mockResolvedValue(1);

      await FileService.delete("file-1");

      expect(FileRepo.getRequired).toHaveBeenCalledWith("file-1");
      expect(BlobRepo.delete).toHaveBeenCalledWith("blob-1");
      expect(FileRepo.delete).toHaveBeenCalledWith("file-1");
      expect(DataroomRepo.touch).toHaveBeenCalledWith("dataroom-1");
    });
  });

  describe("getBlobUrl", () => {
    it("should return blob URL for existing file", async () => {
      vi.mocked(FileRepo.get).mockResolvedValue(mockFile);
      vi.mocked(BlobRepo.createBlobUrl).mockResolvedValue("blob:url");

      const result = await FileService.getBlobUrl("file-1");

      expect(FileRepo.get).toHaveBeenCalledWith("file-1");
      expect(BlobRepo.createBlobUrl).toHaveBeenCalledWith("blob-1");
      expect(result).toBe("blob:url");
    });

    it("should return null for non-existent file", async () => {
      vi.mocked(FileRepo.get).mockResolvedValue(undefined);

      const result = await FileService.getBlobUrl("nonexistent");

      expect(result).toBeNull();
    });
  });

  describe("revokeBlobUrl", () => {
    it("should revoke blob URL", () => {
      vi.mocked(BlobRepo.revokeBlobUrl).mockImplementation(() => {});

      FileService.revokeBlobUrl("blob:url");

      expect(BlobRepo.revokeBlobUrl).toHaveBeenCalledWith("blob:url");
    });
  });

  describe("downloadBlob", () => {
    it("should return blob and filename for existing file", async () => {
      const mockBlob = new Blob(["content"], { type: "application/pdf" });
      vi.mocked(FileRepo.get).mockResolvedValue(mockFile);
      vi.mocked(BlobRepo.get).mockResolvedValue(mockBlob);

      const result = await FileService.downloadBlob("file-1");

      expect(FileRepo.get).toHaveBeenCalledWith("file-1");
      expect(BlobRepo.get).toHaveBeenCalledWith("blob-1");
      expect(result).toEqual({
        blob: mockBlob,
        filename: "test.pdf",
      });
    });

    it("should return null for non-existent file", async () => {
      vi.mocked(FileRepo.get).mockResolvedValue(undefined);

      const result = await FileService.downloadBlob("nonexistent");

      expect(result).toBeNull();
    });

    it("should return null if blob not found", async () => {
      vi.mocked(FileRepo.get).mockResolvedValue(mockFile);
      vi.mocked(BlobRepo.get).mockResolvedValue(undefined);

      const result = await FileService.downloadBlob("file-1");

      expect(result).toBeNull();
    });
  });

  describe("move", () => {
    it("should move file to new parent folder", async () => {
      const movedFile = { ...mockFile, parentId: "folder-2" };
      vi.mocked(FileRepo.getRequired)
        .mockResolvedValueOnce(mockFile)
        .mockResolvedValueOnce(movedFile);
      vi.mocked(FolderRepo.getRequired).mockResolvedValue({
        ...mockFolder,
        id: "folder-2",
      });
      vi.mocked(FileRepo.nameExistsInParent).mockResolvedValue(false);
      vi.mocked(FileRepo.updateName).mockResolvedValue(1);
      vi.mocked(DataroomRepo.touch).mockResolvedValue(1);

      const result = await FileService.move("file-1", "folder-2");

      expect(FolderRepo.getRequired).toHaveBeenCalledWith("folder-2");
      expect(FileRepo.nameExistsInParent).toHaveBeenCalledWith(
        "test.pdf",
        "folder-2",
        "dataroom-1",
        "file-1"
      );
      expect(FileRepo.updateName).toHaveBeenCalledWith("file-1", "test.pdf");
      expect(DataroomRepo.touch).toHaveBeenCalledWith("dataroom-1");
      expect(result).toEqual(movedFile);
    });

    it("should throw error if name exists in destination", async () => {
      vi.mocked(FileRepo.getRequired).mockResolvedValue(mockFile);
      vi.mocked(FolderRepo.getRequired).mockResolvedValue({
        ...mockFolder,
        id: "folder-2",
      });
      vi.mocked(FileRepo.nameExistsInParent).mockResolvedValue(true);

      await expect(FileService.move("file-1", "folder-2")).rejects.toThrow(
        AlreadyExistsError
      );
    });
  });

  describe("isNameAvailable", () => {
    it("should return true for available name", async () => {
      vi.mocked(normalizeName).mockReturnValue("available.pdf");
      vi.mocked(validateName).mockImplementation(() => {});
      vi.mocked(FileRepo.nameExistsInParent).mockResolvedValue(false);

      const result = await FileService.isNameAvailable(
        "available.pdf",
        "folder-1",
        "dataroom-1"
      );

      expect(validateName).toHaveBeenCalledWith("available.pdf", "file");
      expect(FileRepo.nameExistsInParent).toHaveBeenCalledWith(
        "available.pdf",
        "folder-1",
        "dataroom-1",
        undefined
      );
      expect(result).toBe(true);
    });

    it("should return false for invalid name", async () => {
      vi.mocked(normalizeName).mockReturnValue("invalid//name.pdf");
      vi.mocked(validateName).mockImplementation(() => {
        throw new NameValidationError("Invalid name");
      });

      const result = await FileService.isNameAvailable(
        "invalid//name.pdf",
        "folder-1",
        "dataroom-1"
      );

      expect(result).toBe(false);
    });

    it("should return false for unavailable name", async () => {
      vi.mocked(normalizeName).mockReturnValue("existing.pdf");
      vi.mocked(validateName).mockImplementation(() => {});
      vi.mocked(FileRepo.nameExistsInParent).mockResolvedValue(true);

      const result = await FileService.isNameAvailable(
        "existing.pdf",
        "folder-1",
        "dataroom-1"
      );

      expect(result).toBe(false);
    });
  });
});
