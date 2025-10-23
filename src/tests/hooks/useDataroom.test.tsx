import React from "react";
import { describe, test, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useDataroom } from "../../hooks/useDataroom";
import toast from "react-hot-toast";
import type { Dataroom } from "../../core/types";

// Test wrapper to provide React context
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <div>{children}</div>
);

// Mock DataroomService
vi.mock("../../core/services/DataroomService");

import { DataroomService } from "../../core/services/DataroomService";

const mockDataroomService = vi.mocked(DataroomService, true);

// Mock react-hot-toast
vi.mock("react-hot-toast");
const mockToast = vi.mocked(toast);

describe("useDataroom Hook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset the store state between tests
    const { result } = renderHook(() => useDataroom(), {
      wrapper: TestWrapper,
    });
    act(() => {
      result.current.setDatarooms([]);
      result.current.setLoading(false);
    });
  });

  describe("Initial State", () => {
    test("should initialize with empty state", () => {
      const { result } = renderHook(() => useDataroom(), {
        wrapper: TestWrapper,
      });

      expect(result.current.datarooms).toEqual([]);
      expect(result.current.isLoading).toBe(false);
      // Note: lastUpdated might not be null due to the reset in beforeEach
      expect(typeof result.current.lastUpdated).toBe("number");
    });

    test("should expose all expected methods", () => {
      const { result } = renderHook(() => useDataroom(), {
        wrapper: TestWrapper,
      });

      expect(typeof result.current.loadDatarooms).toBe("function");
      expect(typeof result.current.createDataroom).toBe("function");
      expect(typeof result.current.renameDataroom).toBe("function");
      expect(typeof result.current.deleteDataroom).toBe("function");
      expect(typeof result.current.getDeletionImpact).toBe("function");
      expect(typeof result.current.getDataroomStats).toBe("function");
      expect(typeof result.current.isNameAvailable).toBe("function");
      expect(typeof result.current.getDataroom).toBe("function");
      expect(typeof result.current.setLoading).toBe("function");
      expect(typeof result.current.setDatarooms).toBe("function");
      expect(typeof result.current.addDataroom).toBe("function");
      expect(typeof result.current.updateDataroom).toBe("function");
      expect(typeof result.current.removeDataroom).toBe("function");
    });
  });

  describe("loadDatarooms", () => {
    test("should load datarooms successfully", async () => {
      const mockDatarooms: Dataroom[] = [
        {
          id: "room-1",
          name: "Room 1",
          createdAt: Date.now() - 1000,
          updatedAt: Date.now() - 1000,
        },
        {
          id: "room-2",
          name: "Room 2",
          createdAt: Date.now() - 2000,
          updatedAt: Date.now() - 2000,
        },
      ];

      mockDataroomService.list.mockResolvedValue(mockDatarooms);

      const { result } = renderHook(() => useDataroom(), {
        wrapper: TestWrapper,
      });

      await act(async () => {
        await result.current.loadDatarooms();
      });

      expect(result.current.datarooms).toEqual(mockDatarooms);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.lastUpdated).toBeGreaterThan(0);
      expect(mockDataroomService.list).toHaveBeenCalledWith(
        "updatedAt",
        "desc"
      );
    });

    test("should handle loading state correctly", async () => {
      mockDataroomService.list.mockResolvedValue([]);

      const { result } = renderHook(() => useDataroom(), {
        wrapper: TestWrapper,
      });

      expect(result.current.isLoading).toBe(false);

      const loadPromise = act(async () => {
        await result.current.loadDatarooms();
      });

      await loadPromise;

      expect(result.current.isLoading).toBe(false);
    });

    test("should handle errors and show toast message", async () => {
      const error = new Error("Network error");
      mockDataroomService.list.mockRejectedValue(error);

      const { result } = renderHook(() => useDataroom(), {
        wrapper: TestWrapper,
      });

      await act(async () => {
        await result.current.loadDatarooms();
      });

      expect(result.current.datarooms).toEqual([]);
      expect(result.current.isLoading).toBe(false);
      expect(mockToast.error).toHaveBeenCalledWith(
        "Failed to load data rooms: Network error"
      );
    });
  });

  describe("createDataroom", () => {
    test("should create dataroom successfully", async () => {
      const mockDataroom: Dataroom = {
        id: "room-1",
        name: "New Room",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      mockDataroomService.create.mockResolvedValue(mockDataroom);

      const { result } = renderHook(() => useDataroom(), {
        wrapper: TestWrapper,
      });

      let createResult: boolean;
      await act(async () => {
        createResult = await result.current.createDataroom("New Room");
      });

      expect(createResult!).toBe(true);
      expect(result.current.datarooms).toEqual([mockDataroom]);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.lastUpdated).toBeGreaterThan(0);
      expect(mockDataroomService.create).toHaveBeenCalledWith("New Room");
      expect(mockToast.success).toHaveBeenCalledWith(
        'Data room "New Room" created successfully'
      );
    });

    test("should handle create errors", async () => {
      const error = new Error("Creation failed");
      mockDataroomService.create.mockRejectedValue(error);

      const { result } = renderHook(() => useDataroom(), {
        wrapper: TestWrapper,
      });

      let createResult: boolean;
      await act(async () => {
        createResult = await result.current.createDataroom("New Room");
      });

      expect(createResult!).toBe(false);
      expect(result.current.datarooms).toEqual([]);
      expect(result.current.isLoading).toBe(false);
      expect(mockToast.error).toHaveBeenCalledWith(
        "Failed to create data room: Creation failed"
      );
    });

    test("should add created dataroom to beginning of datarooms array", async () => {
      const existingDataroom: Dataroom = {
        id: "existing",
        name: "Existing",
        createdAt: Date.now() - 1000,
        updatedAt: Date.now() - 1000,
      };

      const newDataroom: Dataroom = {
        id: "room-1",
        name: "New Room",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      mockDataroomService.list.mockResolvedValue([existingDataroom]);
      mockDataroomService.create.mockResolvedValue(newDataroom);

      const { result } = renderHook(() => useDataroom(), {
        wrapper: TestWrapper,
      });

      // Load existing datarooms first
      await act(async () => {
        await result.current.loadDatarooms();
      });

      expect(result.current.datarooms).toEqual([existingDataroom]);

      // Create new dataroom
      await act(async () => {
        await result.current.createDataroom("New Room");
      });

      expect(result.current.datarooms).toEqual([newDataroom, existingDataroom]);
    });
  });

  describe("renameDataroom", () => {
    test("should rename dataroom successfully", async () => {
      const originalDataroom: Dataroom = {
        id: "room-1",
        name: "Old Name",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const updatedDataroom: Dataroom = {
        ...originalDataroom,
        name: "New Name",
        updatedAt: Date.now(),
      };

      mockDataroomService.list.mockResolvedValue([originalDataroom]);
      mockDataroomService.rename.mockResolvedValue(updatedDataroom);

      const { result } = renderHook(() => useDataroom(), {
        wrapper: TestWrapper,
      });

      // Load datarooms first
      await act(async () => {
        await result.current.loadDatarooms();
      });

      let renameResult: boolean;
      await act(async () => {
        renameResult = await result.current.renameDataroom(
          "room-1",
          "New Name"
        );
      });

      expect(renameResult!).toBe(true);
      expect(result.current.datarooms).toEqual([updatedDataroom]);
      expect(result.current.isLoading).toBe(false);
      expect(mockDataroomService.rename).toHaveBeenCalledWith(
        "room-1",
        "New Name"
      );
      expect(mockToast.success).toHaveBeenCalledWith(
        'Data room renamed to "New Name"'
      );
    });

    test("should handle rename errors", async () => {
      const error = new Error("Rename failed");
      mockDataroomService.rename.mockRejectedValue(error);

      const { result } = renderHook(() => useDataroom(), {
        wrapper: TestWrapper,
      });

      let renameResult: boolean;
      await act(async () => {
        renameResult = await result.current.renameDataroom(
          "room-1",
          "New Name"
        );
      });

      expect(renameResult!).toBe(false);
      expect(result.current.isLoading).toBe(false);
      expect(mockToast.error).toHaveBeenCalledWith(
        "Failed to rename data room: Rename failed"
      );
    });

    test("should not update datarooms array if dataroom not found", async () => {
      const existingDataroom: Dataroom = {
        id: "other-room",
        name: "Other",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const updatedDataroom: Dataroom = {
        id: "room-1",
        name: "New Name",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      mockDataroomService.list.mockResolvedValue([existingDataroom]);
      mockDataroomService.rename.mockResolvedValue(updatedDataroom);

      const { result } = renderHook(() => useDataroom(), {
        wrapper: TestWrapper,
      });

      // Load datarooms first
      await act(async () => {
        await result.current.loadDatarooms();
      });

      await act(async () => {
        await result.current.renameDataroom("room-1", "New Name");
      });

      // Should remain unchanged since room-1 is not in the array
      expect(result.current.datarooms).toEqual([existingDataroom]);
    });
  });

  describe("deleteDataroom", () => {
    test("should delete dataroom successfully", async () => {
      const mockDataroom: Dataroom = {
        id: "room-1",
        name: "To Delete",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const deleteStats = { folders: 2, files: 5, blobs: 5 };

      mockDataroomService.list.mockResolvedValue([mockDataroom]);
      mockDataroomService.delete.mockResolvedValue(deleteStats);

      const { result } = renderHook(() => useDataroom(), {
        wrapper: TestWrapper,
      });

      // Load datarooms first
      await act(async () => {
        await result.current.loadDatarooms();
      });

      let deleteResult: boolean;
      await act(async () => {
        deleteResult = await result.current.deleteDataroom("room-1");
      });

      expect(deleteResult!).toBe(true);
      expect(result.current.datarooms).toEqual([]);
      expect(result.current.isLoading).toBe(false);
      expect(mockDataroomService.delete).toHaveBeenCalledWith("room-1");
      expect(mockToast.success).toHaveBeenCalledWith(
        "Data room deleted successfully (2 folders, 5 files removed)"
      );
    });

    test("should handle delete errors", async () => {
      const error = new Error("Delete failed");
      mockDataroomService.delete.mockRejectedValue(error);

      const { result } = renderHook(() => useDataroom(), {
        wrapper: TestWrapper,
      });

      let deleteResult: boolean;
      await act(async () => {
        deleteResult = await result.current.deleteDataroom("room-1");
      });

      expect(deleteResult!).toBe(false);
      expect(result.current.isLoading).toBe(false);
      expect(mockToast.error).toHaveBeenCalledWith(
        "Failed to delete data room: Delete failed"
      );
    });
  });

  describe("getDeletionImpact", () => {
    test("should get deletion impact successfully", async () => {
      const impactStats = { folders: 3, files: 7 };
      mockDataroomService.getDeletionImpact.mockResolvedValue(impactStats);

      const { result } = renderHook(() => useDataroom(), {
        wrapper: TestWrapper,
      });

      let impact;
      await act(async () => {
        impact = await result.current.getDeletionImpact("room-1");
      });

      expect(impact).toEqual(impactStats);
      expect(mockDataroomService.getDeletionImpact).toHaveBeenCalledWith(
        "room-1"
      );
    });

    test("should handle deletion impact errors", async () => {
      const error = new Error("Impact check failed");
      mockDataroomService.getDeletionImpact.mockRejectedValue(error);

      const { result } = renderHook(() => useDataroom(), {
        wrapper: TestWrapper,
      });

      let impact;
      await act(async () => {
        impact = await result.current.getDeletionImpact("room-1");
      });

      expect(impact).toEqual({ folders: 0, files: 0 });
      expect(mockToast.error).toHaveBeenCalledWith(
        "Failed to get deletion info: Impact check failed"
      );
    });
  });

  describe("getDataroomStats", () => {
    test("should get dataroom stats successfully", async () => {
      const stats = { folderCount: 5, fileCount: 10, totalSize: 1024 };
      mockDataroomService.getStats.mockResolvedValue(stats);

      const { result } = renderHook(() => useDataroom(), {
        wrapper: TestWrapper,
      });

      let dataroomStats;
      await act(async () => {
        dataroomStats = await result.current.getDataroomStats("room-1");
      });

      expect(dataroomStats).toEqual(stats);
      expect(mockDataroomService.getStats).toHaveBeenCalledWith("room-1");
    });

    test("should handle stats errors", async () => {
      const error = new Error("Stats failed");
      mockDataroomService.getStats.mockRejectedValue(error);

      const { result } = renderHook(() => useDataroom(), {
        wrapper: TestWrapper,
      });

      let dataroomStats;
      await act(async () => {
        dataroomStats = await result.current.getDataroomStats("room-1");
      });

      expect(dataroomStats).toEqual({
        folderCount: 0,
        fileCount: 0,
        totalSize: 0,
      });
      expect(mockToast.error).toHaveBeenCalledWith(
        "Failed to get statistics: Stats failed"
      );
    });
  });

  describe("isNameAvailable", () => {
    test("should check name availability successfully", async () => {
      mockDataroomService.isNameAvailable.mockResolvedValue(true);

      const { result } = renderHook(() => useDataroom(), {
        wrapper: TestWrapper,
      });

      let isAvailable: boolean;
      await act(async () => {
        isAvailable = await result.current.isNameAvailable("Test Room");
      });

      expect(isAvailable!).toBe(true);
      expect(mockDataroomService.isNameAvailable).toHaveBeenCalledWith(
        "Test Room",
        undefined
      );
    });

    test("should handle name availability check with exclude ID", async () => {
      mockDataroomService.isNameAvailable.mockResolvedValue(false);

      const { result } = renderHook(() => useDataroom(), {
        wrapper: TestWrapper,
      });

      let isAvailable: boolean;
      await act(async () => {
        isAvailable = await result.current.isNameAvailable(
          "Test Room",
          "exclude-id"
        );
      });

      expect(isAvailable!).toBe(false);
      expect(mockDataroomService.isNameAvailable).toHaveBeenCalledWith(
        "Test Room",
        "exclude-id"
      );
    });

    test("should return false on service error", async () => {
      mockDataroomService.isNameAvailable.mockRejectedValue(
        new Error("Service error")
      );

      const { result } = renderHook(() => useDataroom(), {
        wrapper: TestWrapper,
      });

      let isAvailable: boolean;
      await act(async () => {
        isAvailable = await result.current.isNameAvailable("Test Room");
      });

      expect(isAvailable!).toBe(false);
    });
  });

  describe("getDataroom", () => {
    test("should return dataroom by ID when it exists", async () => {
      const dataroom1: Dataroom = {
        id: "room-1",
        name: "Room 1",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const dataroom2: Dataroom = {
        id: "room-2",
        name: "Room 2",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      mockDataroomService.list.mockResolvedValue([dataroom1, dataroom2]);

      const { result } = renderHook(() => useDataroom(), {
        wrapper: TestWrapper,
      });

      // Load datarooms first
      await act(async () => {
        await result.current.loadDatarooms();
      });

      const foundDataroom = result.current.getDataroom("room-1");
      expect(foundDataroom).toEqual(dataroom1);
    });

    test("should return undefined when dataroom does not exist", async () => {
      const dataroom1: Dataroom = {
        id: "room-1",
        name: "Room 1",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      mockDataroomService.list.mockResolvedValue([dataroom1]);

      const { result } = renderHook(() => useDataroom(), {
        wrapper: TestWrapper,
      });

      // Load datarooms first
      await act(async () => {
        await result.current.loadDatarooms();
      });

      const foundDataroom = result.current.getDataroom("non-existent");
      expect(foundDataroom).toBeUndefined();
    });

    test("should return undefined when datarooms array is empty", () => {
      const { result } = renderHook(() => useDataroom(), {
        wrapper: TestWrapper,
      });

      const foundDataroom = result.current.getDataroom("room-1");
      expect(foundDataroom).toBeUndefined();
    });
  });

  describe("Internal Store Actions", () => {
    test("should set loading state", () => {
      const { result } = renderHook(() => useDataroom(), {
        wrapper: TestWrapper,
      });

      act(() => {
        result.current.setLoading(true);
      });

      expect(result.current.isLoading).toBe(true);

      act(() => {
        result.current.setLoading(false);
      });

      expect(result.current.isLoading).toBe(false);
    });

    test("should set datarooms", () => {
      const datarooms: Dataroom[] = [
        {
          id: "room-1",
          name: "Room 1",
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ];

      const { result } = renderHook(() => useDataroom(), {
        wrapper: TestWrapper,
      });

      act(() => {
        result.current.setDatarooms(datarooms);
      });

      expect(result.current.datarooms).toEqual(datarooms);
      expect(result.current.lastUpdated).toBeGreaterThan(0);
    });

    test("should add dataroom", () => {
      const dataroom: Dataroom = {
        id: "room-1",
        name: "Room 1",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const { result } = renderHook(() => useDataroom(), {
        wrapper: TestWrapper,
      });

      act(() => {
        result.current.addDataroom(dataroom);
      });

      expect(result.current.datarooms).toEqual([dataroom]);
      expect(result.current.lastUpdated).toBeGreaterThan(0);
    });

    test("should update dataroom", () => {
      const dataroom: Dataroom = {
        id: "room-1",
        name: "Old Name",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const { result } = renderHook(() => useDataroom(), {
        wrapper: TestWrapper,
      });

      // Add dataroom first
      act(() => {
        result.current.addDataroom(dataroom);
      });

      // Update it
      act(() => {
        result.current.updateDataroom("room-1", { name: "New Name" });
      });

      expect(result.current.datarooms[0].name).toBe("New Name");
      expect(result.current.lastUpdated).toBeGreaterThan(0);
    });

    test("should remove dataroom", () => {
      const dataroom: Dataroom = {
        id: "room-1",
        name: "Room 1",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const { result } = renderHook(() => useDataroom(), {
        wrapper: TestWrapper,
      });

      // Add dataroom first
      act(() => {
        result.current.addDataroom(dataroom);
      });

      expect(result.current.datarooms).toEqual([dataroom]);

      // Remove it
      act(() => {
        result.current.removeDataroom("room-1");
      });

      expect(result.current.datarooms).toEqual([]);
      expect(result.current.lastUpdated).toBeGreaterThan(0);
    });
  });

  describe("State Management", () => {
    test("should maintain shared state across multiple hook instances", () => {
      const { result: result1 } = renderHook(() => useDataroom(), {
        wrapper: TestWrapper,
      });
      const { result: result2 } = renderHook(() => useDataroom(), {
        wrapper: TestWrapper,
      });

      // Both should point to the same state (Zustand store)
      expect(result1.current.datarooms).toBe(result2.current.datarooms);
      expect(result1.current.isLoading).toBe(result2.current.isLoading);

      // Changes in one should reflect in the other
      act(() => {
        result1.current.setLoading(true);
      });

      expect(result2.current.isLoading).toBe(true);
    });

    test("should preserve state stability when no changes occur", () => {
      const { result, rerender } = renderHook(() => useDataroom(), {
        wrapper: TestWrapper,
      });

      const initialDatarooms = result.current.datarooms;
      const initialMethods = result.current.loadDatarooms;

      rerender();

      expect(result.current.datarooms).toBe(initialDatarooms);
      expect(result.current.loadDatarooms).toBe(initialMethods);
    });
  });

  describe("Error Recovery", () => {
    test("should reset loading state after error", async () => {
      mockDataroomService.list.mockRejectedValue(new Error("Network error"));

      const { result } = renderHook(() => useDataroom(), {
        wrapper: TestWrapper,
      });

      await act(async () => {
        await result.current.loadDatarooms();
      });

      expect(result.current.isLoading).toBe(false);
    });

    test("should maintain datarooms array after operation error", async () => {
      const existingDataroom: Dataroom = {
        id: "existing",
        name: "Existing",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      // Load datarooms successfully first
      mockDataroomService.list.mockResolvedValue([existingDataroom]);
      const { result } = renderHook(() => useDataroom(), {
        wrapper: TestWrapper,
      });

      await act(async () => {
        await result.current.loadDatarooms();
      });

      expect(result.current.datarooms).toEqual([existingDataroom]);

      // Now fail a create operation
      mockDataroomService.create.mockRejectedValue(new Error("Create failed"));

      await act(async () => {
        await result.current.createDataroom("New Room");
      });

      // Datarooms array should remain unchanged
      expect(result.current.datarooms).toEqual([existingDataroom]);
    });
  });
});
