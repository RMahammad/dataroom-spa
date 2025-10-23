import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useDataroomStore } from "../../store/useDataroomStore";
import { DataroomService } from "../../core/services/DataroomService";
import toast from "react-hot-toast";
import type { Dataroom } from "../../core/types";

// Mock dependencies
vi.mock("../../core/services/DataroomService");
vi.mock("react-hot-toast");
vi.mock("../../core/errors", () => ({
  getErrorMessage: vi.fn((error) => error.message || "Unknown error"),
}));

describe("useDataroomStore", () => {
  const mockDataroomService = vi.mocked(DataroomService);
  const mockToast = vi.mocked(toast);

  beforeEach(() => {
    vi.clearAllMocks();
    mockToast.success = vi.fn();
    mockToast.error = vi.fn();

    // Clear store state
    useDataroomStore.setState({
      datarooms: [],
      isLoading: false,
      lastUpdated: null,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  const createMockDataroom = (id: string, name: string): Dataroom => ({
    id,
    name,
    createdAt: Date.now() - 1000,
    updatedAt: Date.now(),
  });

  describe("Initial State", () => {
    test("should have correct initial state", () => {
      const { result } = renderHook(() => useDataroomStore());

      expect(result.current.datarooms).toEqual([]);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.lastUpdated).toBeNull();
    });

    test("should expose all expected actions", () => {
      const { result } = renderHook(() => useDataroomStore());

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
      const mockDatarooms = [
        createMockDataroom("room-1", "Room 1"),
        createMockDataroom("room-2", "Room 2"),
      ];

      mockDataroomService.list.mockResolvedValue(mockDatarooms);

      const { result } = renderHook(() => useDataroomStore());

      expect(result.current.isLoading).toBe(false);

      await act(async () => {
        await result.current.loadDatarooms();
      });

      expect(result.current.datarooms).toEqual(mockDatarooms);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.lastUpdated).toBeTypeOf("number");
      expect(mockDataroomService.list).toHaveBeenCalledWith(
        "updatedAt",
        "desc"
      );
    });

    test("should handle loading state correctly", async () => {
      const mockDatarooms = [createMockDataroom("room-1", "Room 1")];
      mockDataroomService.list.mockResolvedValue(mockDatarooms);

      const { result } = renderHook(() => useDataroomStore());

      expect(result.current.isLoading).toBe(false);

      // Start loading
      const promise = act(async () => {
        await result.current.loadDatarooms();
      });

      // Check loading state (this might be tricky to catch)
      await promise;

      expect(result.current.isLoading).toBe(false);
      expect(result.current.datarooms).toEqual(mockDatarooms);
    });

    test("should handle errors and show toast message", async () => {
      const error = new Error("Network error");
      mockDataroomService.list.mockRejectedValue(error);

      const { result } = renderHook(() => useDataroomStore());

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
      const newDataroom = createMockDataroom("room-1", "New Room");
      mockDataroomService.create.mockResolvedValue(newDataroom);

      const { result } = renderHook(() => useDataroomStore());

      let createResult: boolean;
      await act(async () => {
        createResult = await result.current.createDataroom("New Room");
      });

      expect(createResult!).toBe(true);
      expect(result.current.datarooms).toEqual([newDataroom]);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.lastUpdated).toBeTypeOf("number");
      expect(mockDataroomService.create).toHaveBeenCalledWith("New Room");
      expect(mockToast.success).toHaveBeenCalledWith(
        'Data room "New Room" created successfully'
      );
    });

    test("should add new dataroom to beginning of list", async () => {
      const existingDataroom = createMockDataroom("room-1", "Existing Room");
      const newDataroom = createMockDataroom("room-2", "New Room");

      // Set initial state
      useDataroomStore.setState({ datarooms: [existingDataroom] });

      mockDataroomService.create.mockResolvedValue(newDataroom);

      const { result } = renderHook(() => useDataroomStore());

      await act(async () => {
        await result.current.createDataroom("New Room");
      });

      expect(result.current.datarooms).toEqual([newDataroom, existingDataroom]);
    });

    test("should handle create errors", async () => {
      const error = new Error("Create failed");
      mockDataroomService.create.mockRejectedValue(error);

      const { result } = renderHook(() => useDataroomStore());

      let createResult: boolean;
      await act(async () => {
        createResult = await result.current.createDataroom("New Room");
      });

      expect(createResult!).toBe(false);
      expect(result.current.datarooms).toEqual([]);
      expect(result.current.isLoading).toBe(false);
      expect(mockToast.error).toHaveBeenCalledWith(
        "Failed to create data room: Create failed"
      );
    });
  });

  describe("renameDataroom", () => {
    test("should rename dataroom successfully", async () => {
      const originalDataroom = createMockDataroom("room-1", "Original Name");
      const updatedDataroom = { ...originalDataroom, name: "New Name" };

      // Set initial state
      useDataroomStore.setState({ datarooms: [originalDataroom] });

      mockDataroomService.rename.mockResolvedValue(updatedDataroom);

      const { result } = renderHook(() => useDataroomStore());

      let renameResult: boolean;
      await act(async () => {
        renameResult = await result.current.renameDataroom(
          "room-1",
          "New Name"
        );
      });

      expect(renameResult!).toBe(true);
      expect(result.current.datarooms[0].name).toBe("New Name");
      expect(result.current.isLoading).toBe(false);
      expect(result.current.lastUpdated).toBeTypeOf("number");
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

      const { result } = renderHook(() => useDataroomStore());

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

    test("should not update non-matching datarooms", async () => {
      const dataroom1 = createMockDataroom("room-1", "Room 1");
      const dataroom2 = createMockDataroom("room-2", "Room 2");
      const updatedDataroom = { ...dataroom1, name: "Updated Room 1" };

      // Set initial state
      useDataroomStore.setState({ datarooms: [dataroom1, dataroom2] });

      mockDataroomService.rename.mockResolvedValue(updatedDataroom);

      const { result } = renderHook(() => useDataroomStore());

      await act(async () => {
        await result.current.renameDataroom("room-1", "Updated Room 1");
      });

      expect(result.current.datarooms[0].name).toBe("Updated Room 1");
      expect(result.current.datarooms[1].name).toBe("Room 2"); // Unchanged
    });
  });

  describe("deleteDataroom", () => {
    test("should delete dataroom successfully", async () => {
      const dataroom1 = createMockDataroom("room-1", "Room 1");
      const dataroom2 = createMockDataroom("room-2", "Room 2");
      const deleteStats = { folders: 5, files: 10, blobs: 12 };

      // Set initial state
      useDataroomStore.setState({ datarooms: [dataroom1, dataroom2] });

      mockDataroomService.delete.mockResolvedValue(deleteStats);

      const { result } = renderHook(() => useDataroomStore());

      let deleteResult: boolean;
      await act(async () => {
        deleteResult = await result.current.deleteDataroom("room-1");
      });

      expect(deleteResult!).toBe(true);
      expect(result.current.datarooms).toEqual([dataroom2]);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.lastUpdated).toBeTypeOf("number");
      expect(mockDataroomService.delete).toHaveBeenCalledWith("room-1");
      expect(mockToast.success).toHaveBeenCalledWith(
        "Data room deleted successfully (5 folders, 10 files removed)"
      );
    });

    test("should handle delete errors", async () => {
      const error = new Error("Delete failed");
      mockDataroomService.delete.mockRejectedValue(error);

      const { result } = renderHook(() => useDataroomStore());

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
      const impact = { folders: 3, files: 7 };
      mockDataroomService.getDeletionImpact.mockResolvedValue(impact);

      const { result } = renderHook(() => useDataroomStore());

      let impactResult: { folders: number; files: number };
      await act(async () => {
        impactResult = await result.current.getDeletionImpact("room-1");
      });

      expect(impactResult!).toEqual(impact);
      expect(mockDataroomService.getDeletionImpact).toHaveBeenCalledWith(
        "room-1"
      );
    });

    test("should handle deletion impact errors", async () => {
      const error = new Error("Impact failed");
      mockDataroomService.getDeletionImpact.mockRejectedValue(error);

      const { result } = renderHook(() => useDataroomStore());

      let impactResult: { folders: number; files: number };
      await act(async () => {
        impactResult = await result.current.getDeletionImpact("room-1");
      });

      expect(impactResult!).toEqual({ folders: 0, files: 0 });
      expect(mockToast.error).toHaveBeenCalledWith(
        "Failed to get deletion info: Impact failed"
      );
    });
  });

  describe("getDataroomStats", () => {
    test("should get dataroom stats successfully", async () => {
      const stats = { folderCount: 5, fileCount: 15, totalSize: 1024000 };
      mockDataroomService.getStats.mockResolvedValue(stats);

      const { result } = renderHook(() => useDataroomStore());

      let statsResult: {
        folderCount: number;
        fileCount: number;
        totalSize: number;
      };
      await act(async () => {
        statsResult = await result.current.getDataroomStats("room-1");
      });

      expect(statsResult!).toEqual(stats);
      expect(mockDataroomService.getStats).toHaveBeenCalledWith("room-1");
    });

    test("should handle stats errors", async () => {
      const error = new Error("Stats failed");
      mockDataroomService.getStats.mockRejectedValue(error);

      const { result } = renderHook(() => useDataroomStore());

      let statsResult: {
        folderCount: number;
        fileCount: number;
        totalSize: number;
      };
      await act(async () => {
        statsResult = await result.current.getDataroomStats("room-1");
      });

      expect(statsResult!).toEqual({
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

      const { result } = renderHook(() => useDataroomStore());

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

    test("should check name availability with exclude ID", async () => {
      mockDataroomService.isNameAvailable.mockResolvedValue(false);

      const { result } = renderHook(() => useDataroomStore());

      let isAvailable: boolean;
      await act(async () => {
        isAvailable = await result.current.isNameAvailable(
          "Test Room",
          "room-1"
        );
      });

      expect(isAvailable!).toBe(false);
      expect(mockDataroomService.isNameAvailable).toHaveBeenCalledWith(
        "Test Room",
        "room-1"
      );
    });

    test("should return false on service error", async () => {
      mockDataroomService.isNameAvailable.mockRejectedValue(
        new Error("Service error")
      );

      const { result } = renderHook(() => useDataroomStore());

      let isAvailable: boolean;
      await act(async () => {
        isAvailable = await result.current.isNameAvailable("Test Room");
      });

      expect(isAvailable!).toBe(false);
    });
  });

  describe("getDataroom", () => {
    test("should return dataroom by ID when it exists", () => {
      const dataroom1 = createMockDataroom("room-1", "Room 1");
      const dataroom2 = createMockDataroom("room-2", "Room 2");

      // Set initial state
      useDataroomStore.setState({ datarooms: [dataroom1, dataroom2] });

      const { result } = renderHook(() => useDataroomStore());

      const foundDataroom = result.current.getDataroom("room-2");
      expect(foundDataroom).toEqual(dataroom2);
    });

    test("should return undefined when dataroom does not exist", () => {
      const dataroom1 = createMockDataroom("room-1", "Room 1");

      // Set initial state
      useDataroomStore.setState({ datarooms: [dataroom1] });

      const { result } = renderHook(() => useDataroomStore());

      const foundDataroom = result.current.getDataroom("room-2");
      expect(foundDataroom).toBeUndefined();
    });

    test("should return undefined when datarooms array is empty", () => {
      const { result } = renderHook(() => useDataroomStore());

      const foundDataroom = result.current.getDataroom("room-1");
      expect(foundDataroom).toBeUndefined();
    });
  });

  describe("Internal Store Actions", () => {
    test("setLoading should update loading state", () => {
      const { result } = renderHook(() => useDataroomStore());

      act(() => {
        result.current.setLoading(true);
      });

      expect(result.current.isLoading).toBe(true);

      act(() => {
        result.current.setLoading(false);
      });

      expect(result.current.isLoading).toBe(false);
    });

    test("setDatarooms should update datarooms and lastUpdated", () => {
      const mockDatarooms = [
        createMockDataroom("room-1", "Room 1"),
        createMockDataroom("room-2", "Room 2"),
      ];

      const { result } = renderHook(() => useDataroomStore());

      act(() => {
        result.current.setDatarooms(mockDatarooms);
      });

      expect(result.current.datarooms).toEqual(mockDatarooms);
      expect(result.current.lastUpdated).toBeTypeOf("number");
    });

    test("addDataroom should add dataroom to beginning of list", () => {
      const existingDataroom = createMockDataroom("room-1", "Room 1");
      const newDataroom = createMockDataroom("room-2", "Room 2");

      // Set initial state
      useDataroomStore.setState({ datarooms: [existingDataroom] });

      const { result } = renderHook(() => useDataroomStore());

      act(() => {
        result.current.addDataroom(newDataroom);
      });

      expect(result.current.datarooms).toEqual([newDataroom, existingDataroom]);
      expect(result.current.lastUpdated).toBeTypeOf("number");
    });

    test("updateDataroom should update specific dataroom", () => {
      const dataroom1 = createMockDataroom("room-1", "Room 1");
      const dataroom2 = createMockDataroom("room-2", "Room 2");

      // Set initial state
      useDataroomStore.setState({ datarooms: [dataroom1, dataroom2] });

      const { result } = renderHook(() => useDataroomStore());

      act(() => {
        result.current.updateDataroom("room-1", { name: "Updated Room 1" });
      });

      expect(result.current.datarooms[0].name).toBe("Updated Room 1");
      expect(result.current.datarooms[1].name).toBe("Room 2"); // Unchanged
      expect(result.current.lastUpdated).toBeTypeOf("number");
    });

    test("removeDataroom should remove dataroom from list", () => {
      const dataroom1 = createMockDataroom("room-1", "Room 1");
      const dataroom2 = createMockDataroom("room-2", "Room 2");

      // Set initial state
      useDataroomStore.setState({ datarooms: [dataroom1, dataroom2] });

      const { result } = renderHook(() => useDataroomStore());

      act(() => {
        result.current.removeDataroom("room-1");
      });

      expect(result.current.datarooms).toEqual([dataroom2]);
      expect(result.current.lastUpdated).toBeTypeOf("number");
    });
  });

  describe("State Management", () => {
    test("should maintain state across multiple hook instances", () => {
      const mockDataroom = createMockDataroom("room-1", "Shared Room");

      const { result: result1 } = renderHook(() => useDataroomStore());
      const { result: result2 } = renderHook(() => useDataroomStore());

      act(() => {
        result1.current.addDataroom(mockDataroom);
      });

      expect(result2.current.datarooms).toEqual([mockDataroom]);
    });

    test("should preserve state stability when no changes occur", () => {
      const { result, rerender } = renderHook(() => useDataroomStore());

      const initialDatarooms = result.current.datarooms;
      const initialLoading = result.current.isLoading;

      rerender();

      expect(result.current.datarooms).toBe(initialDatarooms);
      expect(result.current.isLoading).toBe(initialLoading);
    });
  });

  describe("Error Recovery", () => {
    test("should reset loading state after load error", async () => {
      mockDataroomService.list.mockRejectedValue(new Error("Network error"));

      const { result } = renderHook(() => useDataroomStore());

      await act(async () => {
        await result.current.loadDatarooms();
      });

      expect(result.current.isLoading).toBe(false);
    });

    test("should maintain datarooms array after operation error", async () => {
      const existingDataroom = createMockDataroom("room-1", "Existing Room");

      // Set initial state
      useDataroomStore.setState({ datarooms: [existingDataroom] });

      // Fail create operation
      mockDataroomService.create.mockRejectedValue(new Error("Create failed"));

      const { result } = renderHook(() => useDataroomStore());

      await act(async () => {
        await result.current.createDataroom("New Room");
      });

      // Original dataroom should still be there
      expect(result.current.datarooms).toEqual([existingDataroom]);
    });
  });
});
