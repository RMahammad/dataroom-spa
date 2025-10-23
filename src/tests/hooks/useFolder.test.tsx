import React from "react";
import { describe, test, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useFolder } from "../../hooks/useFolder";
import toast from "react-hot-toast";
import type { Folder } from "../../core/types";

// Test wrapper to provide React context
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <div>{children}</div>
);

// Mock FolderService
vi.mock("../../core/services/FolderService");

import { FolderService } from "../../core/services/FolderService";

const mockFolderService = vi.mocked(FolderService, true);

// Mock react-hot-toast
vi.mock("react-hot-toast");
const mockToast = vi.mocked(toast);

describe("useFolder Hook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Initial State", () => {
    test("should initialize with empty state", () => {
      const { result } = renderHook(() => useFolder(), {
        wrapper: TestWrapper,
      });

      expect(result.current.folders).toEqual([]);
      expect(result.current.isLoading).toBe(false);
    });

    test("should expose all expected methods", () => {
      const { result } = renderHook(() => useFolder(), {
        wrapper: TestWrapper,
      });

      expect(typeof result.current.loadFolders).toBe("function");
      expect(typeof result.current.createFolder).toBe("function");
      expect(typeof result.current.renameFolder).toBe("function");
      expect(typeof result.current.deleteFolder).toBe("function");
      expect(typeof result.current.getDeletionImpact).toBe("function");
      expect(typeof result.current.isNameAvailable).toBe("function");
      expect(typeof result.current.getFolder).toBe("function");
    });
  });

  describe("loadFolders", () => {
    test("should load folders successfully", async () => {
      const mockFolders: Folder[] = [
        {
          id: "folder-1",
          name: "Documents",
          parentId: null,
          dataroomId: "room-1",
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
        {
          id: "folder-2",
          name: "Images",
          parentId: null,
          dataroomId: "room-1",
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ];

      mockFolderService.listChildren.mockResolvedValue(mockFolders);

      const { result } = renderHook(() => useFolder(), {
        wrapper: TestWrapper,
      });

      await act(async () => {
        await result.current.loadFolders("room-1");
      });

      expect(result.current.folders).toEqual(mockFolders);
      expect(result.current.isLoading).toBe(false);
      expect(mockFolderService.listChildren).toHaveBeenCalledWith(
        null,
        "room-1"
      );
    });

    test("should handle loading state correctly", async () => {
      const mockFolders: Folder[] = [];
      mockFolderService.listChildren.mockResolvedValue(mockFolders);

      const { result } = renderHook(() => useFolder(), {
        wrapper: TestWrapper,
      });

      expect(result.current.isLoading).toBe(false);

      const loadPromise = act(async () => {
        await result.current.loadFolders("room-1");
      });

      await loadPromise;

      expect(result.current.isLoading).toBe(false);
    });

    test("should handle errors and show toast message", async () => {
      const error = new Error("Network error");
      mockFolderService.listChildren.mockRejectedValue(error);

      const { result } = renderHook(() => useFolder(), {
        wrapper: TestWrapper,
      });

      await act(async () => {
        await result.current.loadFolders("room-1");
      });

      expect(result.current.folders).toEqual([]);
      expect(result.current.isLoading).toBe(false);
      expect(mockToast.error).toHaveBeenCalledWith(
        "Failed to load folders: Network error"
      );
    });

    test("should load folders with parent folder", async () => {
      const mockFolders: Folder[] = [];
      mockFolderService.listChildren.mockResolvedValue(mockFolders);

      const { result } = renderHook(() => useFolder(), {
        wrapper: TestWrapper,
      });

      await act(async () => {
        await result.current.loadFolders("room-1", "parent-folder");
      });

      expect(mockFolderService.listChildren).toHaveBeenCalledWith(
        "parent-folder",
        "room-1"
      );
    });
  });

  describe("createFolder", () => {
    test("should create folder successfully", async () => {
      const mockFolder: Folder = {
        id: "folder-1",
        name: "New Folder",
        parentId: null,
        dataroomId: "room-1",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      mockFolderService.create.mockResolvedValue(mockFolder);

      const { result } = renderHook(() => useFolder(), {
        wrapper: TestWrapper,
      });

      let createResult: boolean;
      await act(async () => {
        createResult = await result.current.createFolder(
          "room-1",
          "New Folder"
        );
      });

      expect(createResult!).toBe(true);
      expect(result.current.folders).toEqual([mockFolder]);
      expect(mockFolderService.create).toHaveBeenCalledWith(
        "New Folder",
        "room-1",
        null
      );
      expect(mockToast.success).toHaveBeenCalledWith(
        'Folder "New Folder" created successfully'
      );
    });

    test("should handle create errors", async () => {
      const error = new Error("Creation failed");
      mockFolderService.create.mockRejectedValue(error);

      const { result } = renderHook(() => useFolder(), {
        wrapper: TestWrapper,
      });

      let createResult: boolean;
      await act(async () => {
        createResult = await result.current.createFolder(
          "room-1",
          "New Folder"
        );
      });

      expect(createResult!).toBe(false);
      expect(result.current.folders).toEqual([]);
      expect(mockToast.error).toHaveBeenCalledWith(
        "Failed to create folder: Creation failed"
      );
    });

    test("should add created folder to beginning of folders array", async () => {
      const existingFolder: Folder = {
        id: "existing",
        name: "Existing",
        parentId: null,
        dataroomId: "room-1",
        createdAt: Date.now() - 1000,
        updatedAt: Date.now() - 1000,
      };

      const newFolder: Folder = {
        id: "folder-1",
        name: "New Folder",
        parentId: null,
        dataroomId: "room-1",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      mockFolderService.listChildren.mockResolvedValue([existingFolder]);
      mockFolderService.create.mockResolvedValue(newFolder);

      const { result } = renderHook(() => useFolder(), {
        wrapper: TestWrapper,
      });

      // Load existing folders first
      await act(async () => {
        await result.current.loadFolders("room-1");
      });

      expect(result.current.folders).toEqual([existingFolder]);

      // Create new folder
      await act(async () => {
        await result.current.createFolder("room-1", "New Folder");
      });

      expect(result.current.folders).toEqual([newFolder, existingFolder]);
    });

    test("should create folder with specific parent", async () => {
      const mockFolder: Folder = {
        id: "folder-1",
        name: "New Folder",
        parentId: "parent-id",
        dataroomId: "room-1",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      mockFolderService.create.mockResolvedValue(mockFolder);

      const { result } = renderHook(() => useFolder(), {
        wrapper: TestWrapper,
      });

      await act(async () => {
        await result.current.createFolder("room-1", "New Folder", "parent-id");
      });

      expect(mockFolderService.create).toHaveBeenCalledWith(
        "New Folder",
        "room-1",
        "parent-id"
      );
    });
  });

  describe("renameFolder", () => {
    test("should rename folder successfully", async () => {
      const originalFolder: Folder = {
        id: "folder-1",
        name: "Old Name",
        parentId: null,
        dataroomId: "room-1",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const updatedFolder: Folder = {
        ...originalFolder,
        name: "New Name",
        updatedAt: Date.now(),
      };

      mockFolderService.listChildren.mockResolvedValue([originalFolder]);
      mockFolderService.rename.mockResolvedValue(updatedFolder);

      const { result } = renderHook(() => useFolder(), {
        wrapper: TestWrapper,
      });

      // Load folders first
      await act(async () => {
        await result.current.loadFolders("room-1");
      });

      let renameResult: boolean;
      await act(async () => {
        renameResult = await result.current.renameFolder(
          "folder-1",
          "New Name"
        );
      });

      expect(renameResult!).toBe(true);
      expect(result.current.folders).toEqual([updatedFolder]);
      expect(mockFolderService.rename).toHaveBeenCalledWith(
        "folder-1",
        "New Name"
      );
      expect(mockToast.success).toHaveBeenCalledWith(
        'Folder renamed to "New Name"'
      );
    });

    test("should handle rename errors", async () => {
      const error = new Error("Rename failed");
      mockFolderService.rename.mockRejectedValue(error);

      const { result } = renderHook(() => useFolder(), {
        wrapper: TestWrapper,
      });

      let renameResult: boolean;
      await act(async () => {
        renameResult = await result.current.renameFolder(
          "folder-1",
          "New Name"
        );
      });

      expect(renameResult!).toBe(false);
      expect(mockToast.error).toHaveBeenCalledWith(
        "Failed to rename folder: Rename failed"
      );
    });

    test("should not update folders array if folder not found", async () => {
      const existingFolder: Folder = {
        id: "other-folder",
        name: "Other",
        parentId: null,
        dataroomId: "room-1",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const updatedFolder: Folder = {
        id: "folder-1",
        name: "New Name",
        parentId: null,
        dataroomId: "room-1",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      mockFolderService.listChildren.mockResolvedValue([existingFolder]);
      mockFolderService.rename.mockResolvedValue(updatedFolder);

      const { result } = renderHook(() => useFolder(), {
        wrapper: TestWrapper,
      });

      // Load folders first
      await act(async () => {
        await result.current.loadFolders("room-1");
      });

      await act(async () => {
        await result.current.renameFolder("folder-1", "New Name");
      });

      // Should remain unchanged since folder-1 is not in the array
      expect(result.current.folders).toEqual([existingFolder]);
    });
  });

  describe("deleteFolder", () => {
    test("should delete folder successfully", async () => {
      const mockFolder: Folder = {
        id: "folder-1",
        name: "To Delete",
        parentId: null,
        dataroomId: "room-1",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const deleteStats = { folders: 1, files: 2 };

      mockFolderService.listChildren.mockResolvedValue([mockFolder]);
      mockFolderService.delete.mockResolvedValue(deleteStats);

      const { result } = renderHook(() => useFolder(), {
        wrapper: TestWrapper,
      });

      // Load folders first
      await act(async () => {
        await result.current.loadFolders("room-1");
      });

      let deleteResult: boolean;
      await act(async () => {
        deleteResult = await result.current.deleteFolder("folder-1");
      });

      expect(deleteResult!).toBe(true);
      expect(result.current.folders).toEqual([]);
      expect(mockFolderService.delete).toHaveBeenCalledWith("folder-1");
      expect(mockToast.success).toHaveBeenCalledWith(
        "Folder deleted successfully (1 folders, 2 files removed)"
      );
    });

    test("should handle delete errors", async () => {
      const error = new Error("Delete failed");
      mockFolderService.delete.mockRejectedValue(error);

      const { result } = renderHook(() => useFolder(), {
        wrapper: TestWrapper,
      });

      let deleteResult: boolean;
      await act(async () => {
        deleteResult = await result.current.deleteFolder("folder-1");
      });

      expect(deleteResult!).toBe(false);
      expect(mockToast.error).toHaveBeenCalledWith(
        "Failed to delete folder: Delete failed"
      );
    });
  });

  describe("getDeletionImpact", () => {
    test("should get deletion impact successfully", async () => {
      const impactStats = { folders: 3, files: 5 };
      mockFolderService.getDeletionImpact.mockResolvedValue(impactStats);

      const { result } = renderHook(() => useFolder(), {
        wrapper: TestWrapper,
      });

      let impact;
      await act(async () => {
        impact = await result.current.getDeletionImpact("folder-1");
      });

      expect(impact).toEqual(impactStats);
      expect(mockFolderService.getDeletionImpact).toHaveBeenCalledWith(
        "folder-1"
      );
    });

    test("should handle deletion impact errors", async () => {
      const error = new Error("Impact check failed");
      mockFolderService.getDeletionImpact.mockRejectedValue(error);

      const { result } = renderHook(() => useFolder(), {
        wrapper: TestWrapper,
      });

      let impact;
      await act(async () => {
        impact = await result.current.getDeletionImpact("folder-1");
      });

      expect(impact).toEqual({ folders: 0, files: 0 });
      expect(mockToast.error).toHaveBeenCalledWith(
        "Failed to get deletion info: Impact check failed"
      );
    });
  });

  describe("isNameAvailable", () => {
    test("should check name availability successfully", async () => {
      mockFolderService.isNameAvailable.mockResolvedValue(true);

      const { result } = renderHook(() => useFolder(), {
        wrapper: TestWrapper,
      });

      let isAvailable: boolean;
      await act(async () => {
        isAvailable = await result.current.isNameAvailable(
          "room-1",
          "Test Folder"
        );
      });

      expect(isAvailable!).toBe(true);
      expect(mockFolderService.isNameAvailable).toHaveBeenCalledWith(
        "Test Folder",
        null,
        "room-1",
        undefined
      );
    });

    test("should handle name availability check with parent and exclude ID", async () => {
      mockFolderService.isNameAvailable.mockResolvedValue(false);

      const { result } = renderHook(() => useFolder(), {
        wrapper: TestWrapper,
      });

      let isAvailable: boolean;
      await act(async () => {
        isAvailable = await result.current.isNameAvailable(
          "room-1",
          "Test Folder",
          "parent-id",
          "exclude-id"
        );
      });

      expect(isAvailable!).toBe(false);
      expect(mockFolderService.isNameAvailable).toHaveBeenCalledWith(
        "Test Folder",
        "parent-id",
        "room-1",
        "exclude-id"
      );
    });

    test("should return false on service error", async () => {
      mockFolderService.isNameAvailable.mockRejectedValue(
        new Error("Service error")
      );

      const { result } = renderHook(() => useFolder(), {
        wrapper: TestWrapper,
      });

      let isAvailable: boolean;
      await act(async () => {
        isAvailable = await result.current.isNameAvailable(
          "room-1",
          "Test Folder"
        );
      });

      expect(isAvailable!).toBe(false);
    });
  });

  describe("getFolder", () => {
    test("should return folder by ID when it exists", async () => {
      const folder1: Folder = {
        id: "folder-1",
        name: "First",
        parentId: null,
        dataroomId: "room-1",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const folder2: Folder = {
        id: "folder-2",
        name: "Second",
        parentId: null,
        dataroomId: "room-1",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      mockFolderService.listChildren.mockResolvedValue([folder1, folder2]);

      const { result } = renderHook(() => useFolder(), {
        wrapper: TestWrapper,
      });

      // Load folders first
      await act(async () => {
        await result.current.loadFolders("room-1");
      });

      const foundFolder = result.current.getFolder("folder-1");
      expect(foundFolder).toEqual(folder1);
    });

    test("should return undefined when folder does not exist", async () => {
      const folder1: Folder = {
        id: "folder-1",
        name: "First",
        parentId: null,
        dataroomId: "room-1",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      mockFolderService.listChildren.mockResolvedValue([folder1]);

      const { result } = renderHook(() => useFolder(), {
        wrapper: TestWrapper,
      });

      // Load folders first
      await act(async () => {
        await result.current.loadFolders("room-1");
      });

      const foundFolder = result.current.getFolder("non-existent");
      expect(foundFolder).toBeUndefined();
    });

    test("should return undefined when folders array is empty", () => {
      const { result } = renderHook(() => useFolder(), {
        wrapper: TestWrapper,
      });

      const foundFolder = result.current.getFolder("folder-1");
      expect(foundFolder).toBeUndefined();
    });
  });

  describe("State Management", () => {
    test("should maintain separate state across multiple hook instances", () => {
      const { result: result1 } = renderHook(() => useFolder(), {
        wrapper: TestWrapper,
      });
      const { result: result2 } = renderHook(() => useFolder(), {
        wrapper: TestWrapper,
      });

      expect(result1.current.folders).not.toBe(result2.current.folders);
      expect(result1.current.isLoading).toBe(result2.current.isLoading);
    });

    test("should preserve state stability when no changes occur", () => {
      const { result, rerender } = renderHook(() => useFolder(), {
        wrapper: TestWrapper,
      });

      const initialFolders = result.current.folders;
      const initialMethods = result.current.loadFolders;

      rerender();

      expect(result.current.folders).toBe(initialFolders);
      expect(result.current.loadFolders).toBe(initialMethods);
    });
  });

  describe("Error Recovery", () => {
    test("should reset loading state after error", async () => {
      mockFolderService.listChildren.mockRejectedValue(
        new Error("Network error")
      );

      const { result } = renderHook(() => useFolder(), {
        wrapper: TestWrapper,
      });

      await act(async () => {
        await result.current.loadFolders("room-1");
      });

      expect(result.current.isLoading).toBe(false);
    });

    test("should maintain folders array after operation error", async () => {
      const existingFolder: Folder = {
        id: "existing",
        name: "Existing",
        parentId: null,
        dataroomId: "room-1",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      // Load folders successfully first
      mockFolderService.listChildren.mockResolvedValue([existingFolder]);
      const { result } = renderHook(() => useFolder(), {
        wrapper: TestWrapper,
      });

      await act(async () => {
        await result.current.loadFolders("room-1");
      });

      expect(result.current.folders).toEqual([existingFolder]);

      // Now fail a create operation
      mockFolderService.create.mockRejectedValue(new Error("Create failed"));

      await act(async () => {
        await result.current.createFolder("room-1", "New Folder");
      });

      // Folders array should remain unchanged
      expect(result.current.folders).toEqual([existingFolder]);
    });
  });
});
