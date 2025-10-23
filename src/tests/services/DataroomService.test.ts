import { describe, it, expect, vi, beforeEach } from "vitest";
import { DataroomService } from "../../core/services/DataroomService";
import { DataroomRepo } from "../../core/repos/DataroomRepo";
import { FileRepo } from "../../core/repos/FileRepo";
import { FolderRepo } from "../../core/repos/FolderRepo";
import { BlobRepo } from "../../core/repos/BlobRepo";
import { validateName } from "../../core/utils/names";
import {
  resolveDataroomNameCollision,
  isNameAvailable,
} from "../../core/utils/nameCollision";
import type { Dataroom, FileObject, Folder } from "../../core/types";
import { AlreadyExistsError, NameValidationError } from "../../core/errors";

// Mock all dependencies
vi.mock("../../core/repos/DataroomRepo");
vi.mock("../../core/repos/FileRepo");
vi.mock("../../core/repos/FolderRepo");
vi.mock("../../core/repos/BlobRepo");
vi.mock("../../core/utils/names");
vi.mock("../../core/utils/nameCollision");
vi.mock("../../core/utils/ids", () => ({
  generateId: () => "generated-id",
}));

describe("DataroomService", () => {
  const mockDataroom: Dataroom = {
    id: "dataroom-1",
    name: "Test Dataroom",
    createdAt: 1000000,
    updatedAt: 1000000,
  };

  const mockFile: FileObject = {
    id: "file-1",
    dataroomId: "dataroom-1",
    parentId: null,
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

  beforeEach(() => {
    vi.clearAllMocks();
    vi.setSystemTime(new Date(1000000));
  });

  describe("create", () => {
    it("should create a new dataroom successfully", async () => {
      vi.mocked(validateName).mockImplementation(() => {});
      vi.mocked(DataroomRepo.list).mockResolvedValue([]);
      vi.mocked(resolveDataroomNameCollision).mockResolvedValue({
        finalName: "New Dataroom",
        shouldReplace: false,
      });
      vi.mocked(DataroomRepo.insert).mockResolvedValue("generated-id");

      const result = await DataroomService.create("New Dataroom");

      expect(validateName).toHaveBeenCalledWith("New Dataroom", "folder");
      expect(resolveDataroomNameCollision).toHaveBeenCalledWith(
        "New Dataroom",
        "cancel",
        []
      );
      expect(DataroomRepo.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "New Dataroom",
          createdAt: 1000000,
          updatedAt: 1000000,
        })
      );
      expect(result).toEqual(
        expect.objectContaining({
          id: "generated-id",
          name: "New Dataroom",
          createdAt: 1000000,
          updatedAt: 1000000,
        })
      );
    });

    it("should throw error for invalid name", async () => {
      vi.mocked(validateName).mockImplementation(() => {
        throw new NameValidationError("Invalid name");
      });

      await expect(DataroomService.create("invalid//name")).rejects.toThrow(
        NameValidationError
      );
      expect(validateName).toHaveBeenCalledWith("invalid//name", "folder");
    });

    it("should throw error for name collision", async () => {
      vi.mocked(validateName).mockImplementation(() => {});
      vi.mocked(DataroomRepo.list).mockResolvedValue([mockDataroom]);
      vi.mocked(resolveDataroomNameCollision).mockImplementation(() => {
        throw new AlreadyExistsError("Dataroom", "Test Dataroom");
      });

      await expect(DataroomService.create("Test Dataroom")).rejects.toThrow(
        AlreadyExistsError
      );
    });
  });

  describe("get", () => {
    it("should return dataroom by id", async () => {
      vi.mocked(DataroomRepo.getRequired).mockResolvedValue(mockDataroom);

      const result = await DataroomService.get("dataroom-1");

      expect(DataroomRepo.getRequired).toHaveBeenCalledWith("dataroom-1");
      expect(result).toEqual(mockDataroom);
    });

    it("should throw error if dataroom not found", async () => {
      vi.mocked(DataroomRepo.getRequired).mockRejectedValue(
        new Error("Dataroom not found")
      );

      await expect(DataroomService.get("nonexistent")).rejects.toThrow(
        "Dataroom not found"
      );
    });
  });

  describe("list", () => {
    it("should return list of datarooms with default sorting", async () => {
      const datarooms = [mockDataroom];
      vi.mocked(DataroomRepo.list).mockResolvedValue(datarooms);

      const result = await DataroomService.list();

      expect(DataroomRepo.list).toHaveBeenCalledWith("updatedAt", "desc");
      expect(result).toEqual(datarooms);
    });

    it("should return list with custom sorting", async () => {
      const datarooms = [mockDataroom];
      vi.mocked(DataroomRepo.list).mockResolvedValue(datarooms);

      const result = await DataroomService.list("name", "asc");

      expect(DataroomRepo.list).toHaveBeenCalledWith("name", "asc");
      expect(result).toEqual(datarooms);
    });
  });

  describe("rename", () => {
    it("should rename dataroom successfully", async () => {
      const updatedDataroom = { ...mockDataroom, name: "New Name" };
      vi.mocked(validateName).mockImplementation(() => {});
      vi.mocked(DataroomRepo.list).mockResolvedValue([mockDataroom]);
      vi.mocked(resolveDataroomNameCollision).mockResolvedValue({
        finalName: "New Name",
        shouldReplace: false,
      });
      vi.mocked(DataroomRepo.updateName).mockResolvedValue(1);
      vi.mocked(DataroomRepo.getRequired).mockResolvedValue(updatedDataroom);

      const result = await DataroomService.rename("dataroom-1", "New Name");

      expect(validateName).toHaveBeenCalledWith("New Name", "folder");
      expect(resolveDataroomNameCollision).toHaveBeenCalledWith(
        "New Name",
        "cancel",
        [mockDataroom],
        "dataroom-1"
      );
      expect(DataroomRepo.updateName).toHaveBeenCalledWith(
        "dataroom-1",
        "New Name"
      );
      expect(result).toEqual(updatedDataroom);
    });

    it("should throw error for invalid rename", async () => {
      vi.mocked(validateName).mockImplementation(() => {
        throw new NameValidationError("Invalid name");
      });

      await expect(
        DataroomService.rename("dataroom-1", "invalid//name")
      ).rejects.toThrow(NameValidationError);
    });
  });

  describe("delete", () => {
    it("should delete dataroom and return deletion stats", async () => {
      vi.mocked(FileRepo.listByDataroom).mockResolvedValue([mockFile]);
      vi.mocked(BlobRepo.deleteMany).mockResolvedValue(1);
      vi.mocked(FileRepo.deleteByDataroom).mockResolvedValue(1);
      vi.mocked(FolderRepo.deleteByDataroom).mockResolvedValue(1);
      vi.mocked(DataroomRepo.delete).mockResolvedValue(undefined);

      const result = await DataroomService.delete("dataroom-1");

      expect(FileRepo.listByDataroom).toHaveBeenCalledWith("dataroom-1");
      expect(BlobRepo.deleteMany).toHaveBeenCalledWith(["blob-1"]);
      expect(FileRepo.deleteByDataroom).toHaveBeenCalledWith("dataroom-1");
      expect(FolderRepo.deleteByDataroom).toHaveBeenCalledWith("dataroom-1");
      expect(DataroomRepo.delete).toHaveBeenCalledWith("dataroom-1");
      expect(result).toEqual({
        folders: 1,
        files: 1,
        blobs: 1,
      });
    });

    it("should delete dataroom with no files", async () => {
      vi.mocked(FileRepo.listByDataroom).mockResolvedValue([]);
      vi.mocked(FileRepo.deleteByDataroom).mockResolvedValue(0);
      vi.mocked(FolderRepo.deleteByDataroom).mockResolvedValue(0);
      vi.mocked(DataroomRepo.delete).mockResolvedValue(undefined);

      const result = await DataroomService.delete("dataroom-1");

      expect(result).toEqual({
        folders: 0,
        files: 0,
        blobs: 0,
      });
    });
  });

  describe("getStats", () => {
    it("should return dataroom statistics", async () => {
      vi.mocked(FolderRepo.listByDataroom).mockResolvedValue([mockFolder]);
      vi.mocked(FileRepo.listByDataroom).mockResolvedValue([mockFile]);

      const result = await DataroomService.getStats("dataroom-1");

      expect(FolderRepo.listByDataroom).toHaveBeenCalledWith("dataroom-1");
      expect(FileRepo.listByDataroom).toHaveBeenCalledWith("dataroom-1");
      expect(result).toEqual({
        folderCount: 1,
        fileCount: 1,
        totalSize: 1000,
      });
    });

    it("should return zero stats for empty dataroom", async () => {
      vi.mocked(FolderRepo.listByDataroom).mockResolvedValue([]);
      vi.mocked(FileRepo.listByDataroom).mockResolvedValue([]);

      const result = await DataroomService.getStats("dataroom-1");

      expect(result).toEqual({
        folderCount: 0,
        fileCount: 0,
        totalSize: 0,
      });
    });
  });

  describe("getDeletionImpact", () => {
    it("should return deletion impact information", async () => {
      vi.mocked(FolderRepo.listByDataroom).mockResolvedValue([mockFolder]);
      vi.mocked(FileRepo.listByDataroom).mockResolvedValue([mockFile]);

      const result = await DataroomService.getDeletionImpact("dataroom-1");

      expect(result).toEqual({
        folders: 1,
        files: 1,
      });
    });
  });

  describe("isNameAvailable", () => {
    it("should return true for available name", async () => {
      vi.mocked(validateName).mockImplementation(() => {});
      vi.mocked(DataroomRepo.list).mockResolvedValue([]);
      vi.mocked(isNameAvailable).mockReturnValue(true);

      const result = await DataroomService.isNameAvailable("Available Name");

      expect(validateName).toHaveBeenCalledWith("Available Name", "folder");
      expect(isNameAvailable).toHaveBeenCalledWith(
        "Available Name",
        [],
        undefined
      );
      expect(result).toBe(true);
    });

    it("should return false for invalid name", async () => {
      vi.mocked(validateName).mockImplementation(() => {
        throw new NameValidationError("Invalid name");
      });

      const result = await DataroomService.isNameAvailable("invalid//name");

      expect(result).toBe(false);
    });

    it("should return false for unavailable name", async () => {
      vi.mocked(validateName).mockImplementation(() => {});
      vi.mocked(DataroomRepo.list).mockResolvedValue([mockDataroom]);
      vi.mocked(isNameAvailable).mockReturnValue(false);

      const result = await DataroomService.isNameAvailable("Test Dataroom");

      expect(isNameAvailable).toHaveBeenCalledWith(
        "Test Dataroom",
        [mockDataroom],
        undefined
      );
      expect(result).toBe(false);
    });
  });

  describe("touch", () => {
    it("should touch dataroom successfully", async () => {
      vi.mocked(DataroomRepo.touch).mockResolvedValue(1);

      await DataroomService.touch("dataroom-1");

      expect(DataroomRepo.touch).toHaveBeenCalledWith("dataroom-1");
    });
  });
});
