import { describe, it, expect, vi, beforeEach } from "vitest";
import { FolderService } from "../../core/services/FolderService";
import { FolderRepo } from "../../core/repos/FolderRepo";
import { FileRepo } from "../../core/repos/FileRepo";
import { DataroomRepo } from "../../core/repos/DataroomRepo";
import {
  validateName,
  normalizeName,
  generateUniqueName,
} from "../../core/utils/names";
import {
  getDescendantFolderIds,
  countDescendants,
} from "../../core/utils/tree";
import { FileService } from "../../core/services/FileService";
import type { Folder, FileObject, Dataroom } from "../../core/types";
import {
  AlreadyExistsError,
  InvalidOperationError,
  NameValidationError,
} from "../../core/errors";

// Mock all dependencies
vi.mock("../../core/repos/FolderRepo");
vi.mock("../../core/repos/FileRepo");
vi.mock("../../core/repos/DataroomRepo");
vi.mock("../../core/utils/names");
vi.mock("../../core/utils/tree");
vi.mock("../../core/services/FileService");
vi.mock("../../core/utils/ids", () => ({
  generateId: () => "generated-id",
}));

describe("FolderService", () => {
  const mockDataroom: Dataroom = {
    id: "dataroom-1",
    name: "Test Dataroom",
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

  const mockSubfolder: Folder = {
    id: "folder-2",
    dataroomId: "dataroom-1",
    parentId: "folder-1",
    name: "Subfolder",
    createdAt: 1000000,
    updatedAt: 1000000,
  };

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

  beforeEach(() => {
    vi.clearAllMocks();
    vi.setSystemTime(new Date(1000000));
  });

  describe("create", () => {
    it("should create a new folder successfully", async () => {
      vi.mocked(normalizeName).mockReturnValue("New Folder");
      vi.mocked(validateName).mockImplementation(() => {});
      vi.mocked(DataroomRepo.getRequired).mockResolvedValue(mockDataroom);
      vi.mocked(FolderRepo.getRequired).mockResolvedValue(mockFolder);
      vi.mocked(FolderRepo.nameExistsInParent).mockResolvedValue(false);
      vi.mocked(FolderRepo.insert).mockResolvedValue("folder-id");
      vi.mocked(DataroomRepo.touch).mockResolvedValue(1);

      const result = await FolderService.create(
        "New Folder",
        "dataroom-1",
        "folder-1"
      );

      expect(validateName).toHaveBeenCalledWith("New Folder", "folder");
      expect(DataroomRepo.getRequired).toHaveBeenCalledWith("dataroom-1");
      expect(FolderRepo.getRequired).toHaveBeenCalledWith("folder-1");
      expect(FolderRepo.nameExistsInParent).toHaveBeenCalledWith(
        "New Folder",
        "folder-1",
        "dataroom-1"
      );
      expect(FolderRepo.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "New Folder",
          dataroomId: "dataroom-1",
          parentId: "folder-1",
        })
      );
      expect(DataroomRepo.touch).toHaveBeenCalledWith("dataroom-1");
      expect(result).toEqual(
        expect.objectContaining({
          name: "New Folder",
          dataroomId: "dataroom-1",
          parentId: "folder-1",
        })
      );
    });

    it("should create folder in dataroom root when parentId is null", async () => {
      vi.mocked(normalizeName).mockReturnValue("Root Folder");
      vi.mocked(validateName).mockImplementation(() => {});
      vi.mocked(DataroomRepo.getRequired).mockResolvedValue(mockDataroom);
      vi.mocked(FolderRepo.nameExistsInParent).mockResolvedValue(false);
      vi.mocked(FolderRepo.insert).mockResolvedValue("folder-id");
      vi.mocked(DataroomRepo.touch).mockResolvedValue(1);

      const result = await FolderService.create("Root Folder", "dataroom-1");

      expect(DataroomRepo.getRequired).toHaveBeenCalledWith("dataroom-1");
      expect(FolderRepo.getRequired).not.toHaveBeenCalled();
      expect(result).toEqual(
        expect.objectContaining({
          name: "Root Folder",
          dataroomId: "dataroom-1",
          parentId: null,
        })
      );
    });

    it("should throw error for invalid name", async () => {
      vi.mocked(normalizeName).mockReturnValue("invalid//name");
      vi.mocked(validateName).mockImplementation(() => {
        throw new NameValidationError("Invalid name");
      });

      await expect(
        FolderService.create("invalid//name", "dataroom-1")
      ).rejects.toThrow(NameValidationError);
    });

    it("should handle name collision with cancel action", async () => {
      vi.mocked(normalizeName).mockReturnValue("Existing Folder");
      vi.mocked(validateName).mockImplementation(() => {});
      vi.mocked(DataroomRepo.getRequired).mockResolvedValue(mockDataroom);
      vi.mocked(FolderRepo.nameExistsInParent).mockResolvedValue(true);

      await expect(
        FolderService.create("Existing Folder", "dataroom-1", null, "cancel")
      ).rejects.toThrow(AlreadyExistsError);
    });

    it("should handle name collision with keep-both action", async () => {
      vi.mocked(normalizeName).mockReturnValue("Existing Folder");
      vi.mocked(validateName).mockImplementation(() => {});
      vi.mocked(DataroomRepo.getRequired).mockResolvedValue(mockDataroom);
      vi.mocked(FolderRepo.nameExistsInParent).mockResolvedValue(true);
      vi.mocked(FolderRepo.listByParent).mockResolvedValue([mockFolder]);
      vi.mocked(generateUniqueName).mockReturnValue("Existing Folder (1)");
      vi.mocked(FolderRepo.insert).mockResolvedValue("folder-id");
      vi.mocked(DataroomRepo.touch).mockResolvedValue(1);

      const result = await FolderService.create(
        "Existing Folder",
        "dataroom-1",
        null,
        "keep-both"
      );

      expect(generateUniqueName).toHaveBeenCalled();
      expect(result).toEqual(
        expect.objectContaining({
          name: "Existing Folder (1)",
        })
      );
    });

    it("should throw error for replace action", async () => {
      vi.mocked(normalizeName).mockReturnValue("Existing Folder");
      vi.mocked(validateName).mockImplementation(() => {});
      vi.mocked(DataroomRepo.getRequired).mockResolvedValue(mockDataroom);
      vi.mocked(FolderRepo.nameExistsInParent).mockResolvedValue(true);

      await expect(
        FolderService.create("Existing Folder", "dataroom-1", null, "replace")
      ).rejects.toThrow(InvalidOperationError);
    });
  });

  describe("get", () => {
    it("should return folder by id", async () => {
      vi.mocked(FolderRepo.getRequired).mockResolvedValue(mockFolder);

      const result = await FolderService.get("folder-1");

      expect(FolderRepo.getRequired).toHaveBeenCalledWith("folder-1");
      expect(result).toEqual(mockFolder);
    });

    it("should throw error if folder not found", async () => {
      vi.mocked(FolderRepo.getRequired).mockRejectedValue(
        new Error("Folder not found")
      );

      await expect(FolderService.get("nonexistent")).rejects.toThrow(
        "Folder not found"
      );
    });
  });

  describe("listChildren", () => {
    it("should return child folders with default sorting", async () => {
      const folders = [mockSubfolder];
      vi.mocked(FolderRepo.listByParent).mockResolvedValue(folders);

      const result = await FolderService.listChildren("folder-1", "dataroom-1");

      expect(FolderRepo.listByParent).toHaveBeenCalledWith(
        "folder-1",
        "dataroom-1",
        "name",
        "asc"
      );
      expect(result).toEqual(folders);
    });

    it("should return child folders with custom sorting", async () => {
      const folders = [mockSubfolder];
      vi.mocked(FolderRepo.listByParent).mockResolvedValue(folders);

      const result = await FolderService.listChildren(
        "folder-1",
        "dataroom-1",
        "createdAt",
        "desc"
      );

      expect(FolderRepo.listByParent).toHaveBeenCalledWith(
        "folder-1",
        "dataroom-1",
        "createdAt",
        "desc"
      );
      expect(result).toEqual(folders);
    });
  });

  describe("rename", () => {
    it("should rename folder successfully", async () => {
      const updatedFolder = { ...mockFolder, name: "Renamed Folder" };
      vi.mocked(normalizeName).mockReturnValue("Renamed Folder");
      vi.mocked(validateName).mockImplementation(() => {});
      vi.mocked(FolderRepo.getRequired)
        .mockResolvedValueOnce(mockFolder)
        .mockResolvedValueOnce(updatedFolder);
      vi.mocked(FolderRepo.nameExistsInParent).mockResolvedValue(false);
      vi.mocked(FolderRepo.updateName).mockResolvedValue(1);
      vi.mocked(DataroomRepo.touch).mockResolvedValue(1);

      const result = await FolderService.rename("folder-1", "Renamed Folder");

      expect(validateName).toHaveBeenCalledWith("Renamed Folder", "folder");
      expect(FolderRepo.nameExistsInParent).toHaveBeenCalledWith(
        "Renamed Folder",
        null,
        "dataroom-1",
        "folder-1"
      );
      expect(FolderRepo.updateName).toHaveBeenCalledWith(
        "folder-1",
        "Renamed Folder"
      );
      expect(DataroomRepo.touch).toHaveBeenCalledWith("dataroom-1");
      expect(result).toEqual(updatedFolder);
    });

    it("should throw error for invalid name", async () => {
      vi.mocked(normalizeName).mockReturnValue("invalid//name");
      vi.mocked(validateName).mockImplementation(() => {
        throw new NameValidationError("Invalid name");
      });

      await expect(
        FolderService.rename("folder-1", "invalid//name")
      ).rejects.toThrow(NameValidationError);
    });

    it("should handle name collision with cancel action", async () => {
      vi.mocked(normalizeName).mockReturnValue("Existing Name");
      vi.mocked(validateName).mockImplementation(() => {});
      vi.mocked(FolderRepo.getRequired).mockResolvedValue(mockFolder);
      vi.mocked(FolderRepo.nameExistsInParent).mockResolvedValue(true);

      await expect(
        FolderService.rename("folder-1", "Existing Name", "cancel")
      ).rejects.toThrow(AlreadyExistsError);
    });

    it("should throw error for replace action", async () => {
      vi.mocked(normalizeName).mockReturnValue("Existing Name");
      vi.mocked(validateName).mockImplementation(() => {});
      vi.mocked(FolderRepo.getRequired).mockResolvedValue(mockFolder);
      vi.mocked(FolderRepo.nameExistsInParent).mockResolvedValue(true);

      await expect(
        FolderService.rename("folder-1", "Existing Name", "replace")
      ).rejects.toThrow(InvalidOperationError);
    });
  });

  describe("delete", () => {
    it("should delete folder and its contents", async () => {
      vi.mocked(FolderRepo.getRequired).mockResolvedValue(mockFolder);
      vi.mocked(FolderRepo.listByDataroom).mockResolvedValue([
        mockFolder,
        mockSubfolder,
      ]);
      vi.mocked(FileRepo.listByDataroom).mockResolvedValue([mockFile]);
      vi.mocked(getDescendantFolderIds).mockReturnValue(["folder-2"]);
      vi.mocked(FileService.delete).mockResolvedValue(undefined);
      vi.mocked(FolderRepo.delete).mockResolvedValue(undefined);
      vi.mocked(DataroomRepo.touch).mockResolvedValue(1);

      const result = await FolderService.delete("folder-1");

      expect(FolderRepo.getRequired).toHaveBeenCalledWith("folder-1");
      expect(getDescendantFolderIds).toHaveBeenCalledWith("folder-1", [
        mockFolder,
        mockSubfolder,
      ]);
      expect(FileService.delete).toHaveBeenCalledWith("file-1");
      expect(FolderRepo.delete).toHaveBeenCalledWith("folder-2"); // subfolder first
      expect(FolderRepo.delete).toHaveBeenCalledWith("folder-1"); // then parent
      expect(DataroomRepo.touch).toHaveBeenCalledWith("dataroom-1");
      expect(result).toEqual({
        folders: 2, // folder-1 and folder-2
        files: 1, // file-1
      });
    });

    it("should delete empty folder", async () => {
      vi.mocked(FolderRepo.getRequired).mockResolvedValue(mockFolder);
      vi.mocked(FolderRepo.listByDataroom).mockResolvedValue([mockFolder]);
      vi.mocked(FileRepo.listByDataroom).mockResolvedValue([]);
      vi.mocked(getDescendantFolderIds).mockReturnValue([]);
      vi.mocked(FolderRepo.delete).mockResolvedValue(undefined);
      vi.mocked(DataroomRepo.touch).mockResolvedValue(1);

      const result = await FolderService.delete("folder-1");

      expect(result).toEqual({
        folders: 1,
        files: 0,
      });
    });
  });

  describe("getDeletionImpact", () => {
    it("should return deletion impact information", async () => {
      vi.mocked(FolderRepo.getRequired).mockResolvedValue(mockFolder);
      vi.mocked(FolderRepo.listByDataroom).mockResolvedValue([
        mockFolder,
        mockSubfolder,
      ]);
      vi.mocked(FileRepo.listByDataroom).mockResolvedValue([mockFile]);
      vi.mocked(countDescendants).mockReturnValue({ folders: 1, files: 1 });

      const result = await FolderService.getDeletionImpact("folder-1");

      expect(countDescendants).toHaveBeenCalledWith(
        "folder-1",
        [mockFolder, mockSubfolder],
        [mockFile]
      );
      expect(result).toEqual({
        folders: 2, // 1 descendant + 1 for the folder itself
        files: 1,
      });
    });
  });

  describe("move", () => {
    it("should move folder to new parent", async () => {
      const targetFolder = { ...mockSubfolder, parentId: "folder-2" };
      const newParent = { ...mockFolder, id: "folder-3" };
      vi.mocked(FolderRepo.getRequired)
        .mockResolvedValueOnce(mockSubfolder)
        .mockResolvedValueOnce(newParent)
        .mockResolvedValueOnce(targetFolder);
      vi.mocked(FolderRepo.listByDataroom).mockResolvedValue([
        mockFolder,
        mockSubfolder,
      ]);
      vi.mocked(getDescendantFolderIds).mockReturnValue([]);
      vi.mocked(FolderRepo.nameExistsInParent).mockResolvedValue(false);
      vi.mocked(FolderRepo.updateName).mockResolvedValue(1);
      vi.mocked(DataroomRepo.touch).mockResolvedValue(1);

      const result = await FolderService.move("folder-2", "folder-3");

      expect(FolderRepo.getRequired).toHaveBeenCalledWith("folder-3");
      expect(getDescendantFolderIds).toHaveBeenCalledWith("folder-2", [
        mockFolder,
        mockSubfolder,
      ]);
      expect(FolderRepo.nameExistsInParent).toHaveBeenCalledWith(
        "Subfolder",
        "folder-3",
        "dataroom-1",
        "folder-2"
      );
      expect(FolderRepo.updateName).toHaveBeenCalledWith(
        "folder-2",
        "Subfolder"
      );
      expect(DataroomRepo.touch).toHaveBeenCalledWith("dataroom-1");
      expect(result).toEqual(targetFolder);
    });

    it("should move folder to root level", async () => {
      const targetFolder = { ...mockSubfolder, parentId: null };
      vi.mocked(FolderRepo.getRequired)
        .mockResolvedValueOnce(mockSubfolder)
        .mockResolvedValueOnce(targetFolder);
      vi.mocked(FolderRepo.nameExistsInParent).mockResolvedValue(false);
      vi.mocked(FolderRepo.updateName).mockResolvedValue(1);
      vi.mocked(DataroomRepo.touch).mockResolvedValue(1);

      const result = await FolderService.move("folder-2", null);

      expect(FolderRepo.nameExistsInParent).toHaveBeenCalledWith(
        "Subfolder",
        null,
        "dataroom-1",
        "folder-2"
      );
      expect(result).toEqual(targetFolder);
    });

    it("should throw error for circular reference", async () => {
      vi.mocked(FolderRepo.getRequired)
        .mockResolvedValueOnce(mockFolder)
        .mockResolvedValueOnce(mockSubfolder);
      vi.mocked(FolderRepo.listByDataroom).mockResolvedValue([
        mockFolder,
        mockSubfolder,
      ]);
      vi.mocked(getDescendantFolderIds).mockReturnValue(["folder-2"]);

      await expect(FolderService.move("folder-1", "folder-2")).rejects.toThrow(
        InvalidOperationError
      );
    });

    it("should throw error if name exists in destination", async () => {
      vi.mocked(FolderRepo.getRequired)
        .mockResolvedValueOnce(mockSubfolder)
        .mockResolvedValueOnce(mockFolder);
      vi.mocked(FolderRepo.listByDataroom).mockResolvedValue([
        mockFolder,
        mockSubfolder,
      ]);
      vi.mocked(getDescendantFolderIds).mockReturnValue([]);
      vi.mocked(FolderRepo.nameExistsInParent).mockResolvedValue(true);

      await expect(FolderService.move("folder-2", "folder-1")).rejects.toThrow(
        AlreadyExistsError
      );
    });
  });

  describe("isNameAvailable", () => {
    it("should return true for available name", async () => {
      vi.mocked(normalizeName).mockReturnValue("Available Name");
      vi.mocked(validateName).mockImplementation(() => {});
      vi.mocked(FolderRepo.nameExistsInParent).mockResolvedValue(false);

      const result = await FolderService.isNameAvailable(
        "Available Name",
        "folder-1",
        "dataroom-1"
      );

      expect(validateName).toHaveBeenCalledWith("Available Name", "folder");
      expect(FolderRepo.nameExistsInParent).toHaveBeenCalledWith(
        "Available Name",
        "folder-1",
        "dataroom-1",
        undefined
      );
      expect(result).toBe(true);
    });

    it("should return false for invalid name", async () => {
      vi.mocked(normalizeName).mockReturnValue("invalid//name");
      vi.mocked(validateName).mockImplementation(() => {
        throw new NameValidationError("Invalid name");
      });

      const result = await FolderService.isNameAvailable(
        "invalid//name",
        "folder-1",
        "dataroom-1"
      );

      expect(result).toBe(false);
    });

    it("should return false for unavailable name", async () => {
      vi.mocked(normalizeName).mockReturnValue("Existing Name");
      vi.mocked(validateName).mockImplementation(() => {});
      vi.mocked(FolderRepo.nameExistsInParent).mockResolvedValue(true);

      const result = await FolderService.isNameAvailable(
        "Existing Name",
        "folder-1",
        "dataroom-1"
      );

      expect(result).toBe(false);
    });
  });

  describe("calculateTotalSize", () => {
    it("should calculate total size of folder and its contents", async () => {
      const fileInSubfolder: FileObject = {
        ...mockFile,
        id: "file-2",
        parentId: "folder-2",
        size: 2000,
      };

      vi.mocked(FolderRepo.getRequired).mockResolvedValue(mockFolder);
      vi.mocked(FolderRepo.listByDataroom).mockResolvedValue([
        mockFolder,
        mockSubfolder,
      ]);
      vi.mocked(FileRepo.listByDataroom).mockResolvedValue([
        mockFile,
        fileInSubfolder,
      ]);
      vi.mocked(getDescendantFolderIds).mockReturnValue(["folder-2"]);

      const result = await FolderService.calculateTotalSize("folder-1");

      expect(getDescendantFolderIds).toHaveBeenCalledWith("folder-1", [
        mockFolder,
        mockSubfolder,
      ]);
      expect(result).toBe(3000); // 1000 (file-1) + 2000 (file-2)
    });

    it("should return zero for empty folder", async () => {
      vi.mocked(FolderRepo.getRequired).mockResolvedValue(mockFolder);
      vi.mocked(FolderRepo.listByDataroom).mockResolvedValue([mockFolder]);
      vi.mocked(FileRepo.listByDataroom).mockResolvedValue([]);
      vi.mocked(getDescendantFolderIds).mockReturnValue([]);

      const result = await FolderService.calculateTotalSize("folder-1");

      expect(result).toBe(0);
    });
  });
});
