import { describe, test, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useUIStore } from "../../store/useUIStore";

describe("useUIStore", () => {
  beforeEach(() => {
    // Reset store to initial state before each test
    useUIStore.setState({
      viewMode: "grid",
      sortBy: "modified",
      sortOrder: "desc",
      isCreateRoomModalOpen: false,
      isDeleteConfirmModalOpen: false,
      isRenameModalOpen: false,
      isLoading: false,
      selectedItemId: null,
    });
  });

  describe("Initial State", () => {
    test("should have correct initial state", () => {
      const { result } = renderHook(() => useUIStore());

      expect(result.current.viewMode).toBe("grid");
      expect(result.current.sortBy).toBe("modified");
      expect(result.current.sortOrder).toBe("desc");
      expect(result.current.isCreateRoomModalOpen).toBe(false);
      expect(result.current.isDeleteConfirmModalOpen).toBe(false);
      expect(result.current.isRenameModalOpen).toBe(false);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.selectedItemId).toBeNull();
    });

    test("should expose all expected actions", () => {
      const { result } = renderHook(() => useUIStore());

      expect(typeof result.current.setViewMode).toBe("function");
      expect(typeof result.current.setSorting).toBe("function");
      expect(typeof result.current.openCreateRoomModal).toBe("function");
      expect(typeof result.current.closeCreateRoomModal).toBe("function");
      expect(typeof result.current.openDeleteConfirmModal).toBe("function");
      expect(typeof result.current.closeDeleteConfirmModal).toBe("function");
      expect(typeof result.current.openRenameModal).toBe("function");
      expect(typeof result.current.closeRenameModal).toBe("function");
      expect(typeof result.current.setLoading).toBe("function");
      expect(typeof result.current.setSelectedItem).toBe("function");
    });
  });

  describe("View Mode Management", () => {
    test("should set view mode to grid", () => {
      const { result } = renderHook(() => useUIStore());

      act(() => {
        result.current.setViewMode("grid");
      });

      expect(result.current.viewMode).toBe("grid");
    });

    test("should set view mode to list", () => {
      const { result } = renderHook(() => useUIStore());

      act(() => {
        result.current.setViewMode("list");
      });

      expect(result.current.viewMode).toBe("list");
    });

    test("should update view mode from different initial state", () => {
      // Set initial state to list
      useUIStore.setState({ viewMode: "list" });

      const { result } = renderHook(() => useUIStore());

      expect(result.current.viewMode).toBe("list");

      act(() => {
        result.current.setViewMode("grid");
      });

      expect(result.current.viewMode).toBe("grid");
    });
  });

  describe("Sorting Management", () => {
    test("should set sorting by name with default ascending order", () => {
      const { result } = renderHook(() => useUIStore());

      act(() => {
        result.current.setSorting("name");
      });

      expect(result.current.sortBy).toBe("name");
      expect(result.current.sortOrder).toBe("asc");
    });

    test("should set sorting by name with explicit descending order", () => {
      const { result } = renderHook(() => useUIStore());

      act(() => {
        result.current.setSorting("name", "desc");
      });

      expect(result.current.sortBy).toBe("name");
      expect(result.current.sortOrder).toBe("desc");
    });

    test("should set sorting by modified with default descending order", () => {
      const { result } = renderHook(() => useUIStore());

      act(() => {
        result.current.setSorting("modified");
      });

      expect(result.current.sortBy).toBe("modified");
      expect(result.current.sortOrder).toBe("desc");
    });

    test("should set sorting by type with default descending order", () => {
      const { result } = renderHook(() => useUIStore());

      act(() => {
        result.current.setSorting("type");
      });

      expect(result.current.sortBy).toBe("type");
      expect(result.current.sortOrder).toBe("desc");
    });

    test("should set sorting by size with default descending order", () => {
      const { result } = renderHook(() => useUIStore());

      act(() => {
        result.current.setSorting("size");
      });

      expect(result.current.sortBy).toBe("size");
      expect(result.current.sortOrder).toBe("desc");
    });

    test("should override default order when explicitly provided", () => {
      const { result } = renderHook(() => useUIStore());

      act(() => {
        result.current.setSorting("modified", "asc");
      });

      expect(result.current.sortBy).toBe("modified");
      expect(result.current.sortOrder).toBe("asc");
    });

    test("should handle multiple sorting changes", () => {
      const { result } = renderHook(() => useUIStore());

      act(() => {
        result.current.setSorting("name", "asc");
      });

      expect(result.current.sortBy).toBe("name");
      expect(result.current.sortOrder).toBe("asc");

      act(() => {
        result.current.setSorting("size", "desc");
      });

      expect(result.current.sortBy).toBe("size");
      expect(result.current.sortOrder).toBe("desc");
    });
  });

  describe("Create Room Modal Management", () => {
    test("should open create room modal", () => {
      const { result } = renderHook(() => useUIStore());

      expect(result.current.isCreateRoomModalOpen).toBe(false);

      act(() => {
        result.current.openCreateRoomModal();
      });

      expect(result.current.isCreateRoomModalOpen).toBe(true);
    });

    test("should close create room modal", () => {
      // Set initial state with modal open
      useUIStore.setState({ isCreateRoomModalOpen: true });

      const { result } = renderHook(() => useUIStore());

      expect(result.current.isCreateRoomModalOpen).toBe(true);

      act(() => {
        result.current.closeCreateRoomModal();
      });

      expect(result.current.isCreateRoomModalOpen).toBe(false);
    });

    test("should handle multiple open/close operations", () => {
      const { result } = renderHook(() => useUIStore());

      act(() => {
        result.current.openCreateRoomModal();
      });
      expect(result.current.isCreateRoomModalOpen).toBe(true);

      act(() => {
        result.current.closeCreateRoomModal();
      });
      expect(result.current.isCreateRoomModalOpen).toBe(false);

      act(() => {
        result.current.openCreateRoomModal();
      });
      expect(result.current.isCreateRoomModalOpen).toBe(true);
    });
  });

  describe("Delete Confirm Modal Management", () => {
    test("should open delete confirm modal with item ID", () => {
      const { result } = renderHook(() => useUIStore());

      expect(result.current.isDeleteConfirmModalOpen).toBe(false);
      expect(result.current.selectedItemId).toBeNull();

      act(() => {
        result.current.openDeleteConfirmModal("item-123");
      });

      expect(result.current.isDeleteConfirmModalOpen).toBe(true);
      expect(result.current.selectedItemId).toBe("item-123");
    });

    test("should close delete confirm modal and clear selection", () => {
      // Set initial state with modal open and item selected
      useUIStore.setState({
        isDeleteConfirmModalOpen: true,
        selectedItemId: "item-123",
      });

      const { result } = renderHook(() => useUIStore());

      expect(result.current.isDeleteConfirmModalOpen).toBe(true);
      expect(result.current.selectedItemId).toBe("item-123");

      act(() => {
        result.current.closeDeleteConfirmModal();
      });

      expect(result.current.isDeleteConfirmModalOpen).toBe(false);
      expect(result.current.selectedItemId).toBeNull();
    });

    test("should handle opening modal for different items", () => {
      const { result } = renderHook(() => useUIStore());

      act(() => {
        result.current.openDeleteConfirmModal("item-1");
      });

      expect(result.current.isDeleteConfirmModalOpen).toBe(true);
      expect(result.current.selectedItemId).toBe("item-1");

      act(() => {
        result.current.openDeleteConfirmModal("item-2");
      });

      expect(result.current.isDeleteConfirmModalOpen).toBe(true);
      expect(result.current.selectedItemId).toBe("item-2");
    });
  });

  describe("Rename Modal Management", () => {
    test("should open rename modal with item ID", () => {
      const { result } = renderHook(() => useUIStore());

      expect(result.current.isRenameModalOpen).toBe(false);
      expect(result.current.selectedItemId).toBeNull();

      act(() => {
        result.current.openRenameModal("item-456");
      });

      expect(result.current.isRenameModalOpen).toBe(true);
      expect(result.current.selectedItemId).toBe("item-456");
    });

    test("should close rename modal and clear selection", () => {
      // Set initial state with modal open and item selected
      useUIStore.setState({
        isRenameModalOpen: true,
        selectedItemId: "item-456",
      });

      const { result } = renderHook(() => useUIStore());

      expect(result.current.isRenameModalOpen).toBe(true);
      expect(result.current.selectedItemId).toBe("item-456");

      act(() => {
        result.current.closeRenameModal();
      });

      expect(result.current.isRenameModalOpen).toBe(false);
      expect(result.current.selectedItemId).toBeNull();
    });

    test("should handle opening rename modal for different items", () => {
      const { result } = renderHook(() => useUIStore());

      act(() => {
        result.current.openRenameModal("item-a");
      });

      expect(result.current.isRenameModalOpen).toBe(true);
      expect(result.current.selectedItemId).toBe("item-a");

      act(() => {
        result.current.openRenameModal("item-b");
      });

      expect(result.current.isRenameModalOpen).toBe(true);
      expect(result.current.selectedItemId).toBe("item-b");
    });
  });

  describe("Loading State Management", () => {
    test("should set loading to true", () => {
      const { result } = renderHook(() => useUIStore());

      expect(result.current.isLoading).toBe(false);

      act(() => {
        result.current.setLoading(true);
      });

      expect(result.current.isLoading).toBe(true);
    });

    test("should set loading to false", () => {
      // Set initial state with loading true
      useUIStore.setState({ isLoading: true });

      const { result } = renderHook(() => useUIStore());

      expect(result.current.isLoading).toBe(true);

      act(() => {
        result.current.setLoading(false);
      });

      expect(result.current.isLoading).toBe(false);
    });

    test("should handle multiple loading state changes", () => {
      const { result } = renderHook(() => useUIStore());

      act(() => {
        result.current.setLoading(true);
      });
      expect(result.current.isLoading).toBe(true);

      act(() => {
        result.current.setLoading(false);
      });
      expect(result.current.isLoading).toBe(false);

      act(() => {
        result.current.setLoading(true);
      });
      expect(result.current.isLoading).toBe(true);
    });
  });

  describe("Selected Item Management", () => {
    test("should set selected item ID", () => {
      const { result } = renderHook(() => useUIStore());

      expect(result.current.selectedItemId).toBeNull();

      act(() => {
        result.current.setSelectedItem("item-789");
      });

      expect(result.current.selectedItemId).toBe("item-789");
    });

    test("should clear selected item", () => {
      // Set initial state with item selected
      useUIStore.setState({ selectedItemId: "item-789" });

      const { result } = renderHook(() => useUIStore());

      expect(result.current.selectedItemId).toBe("item-789");

      act(() => {
        result.current.setSelectedItem(null);
      });

      expect(result.current.selectedItemId).toBeNull();
    });

    test("should change selected item", () => {
      const { result } = renderHook(() => useUIStore());

      act(() => {
        result.current.setSelectedItem("item-1");
      });

      expect(result.current.selectedItemId).toBe("item-1");

      act(() => {
        result.current.setSelectedItem("item-2");
      });

      expect(result.current.selectedItemId).toBe("item-2");
    });
  });

  describe("Modal Interaction Scenarios", () => {
    test("should maintain separate modal states", () => {
      const { result } = renderHook(() => useUIStore());

      act(() => {
        result.current.openCreateRoomModal();
      });

      expect(result.current.isCreateRoomModalOpen).toBe(true);
      expect(result.current.isDeleteConfirmModalOpen).toBe(false);
      expect(result.current.isRenameModalOpen).toBe(false);

      act(() => {
        result.current.openDeleteConfirmModal("item-1");
      });

      expect(result.current.isCreateRoomModalOpen).toBe(true);
      expect(result.current.isDeleteConfirmModalOpen).toBe(true);
      expect(result.current.isRenameModalOpen).toBe(false);
      expect(result.current.selectedItemId).toBe("item-1");
    });

    test("should handle closing one modal while others remain open", () => {
      // Set initial state with multiple modals open
      useUIStore.setState({
        isCreateRoomModalOpen: true,
        isDeleteConfirmModalOpen: true,
        selectedItemId: "item-1",
      });

      const { result } = renderHook(() => useUIStore());

      act(() => {
        result.current.closeCreateRoomModal();
      });

      expect(result.current.isCreateRoomModalOpen).toBe(false);
      expect(result.current.isDeleteConfirmModalOpen).toBe(true);
      expect(result.current.selectedItemId).toBe("item-1"); // Should remain
    });

    test("should handle selected item changes with modal operations", () => {
      const { result } = renderHook(() => useUIStore());

      act(() => {
        result.current.setSelectedItem("manual-selection");
      });

      expect(result.current.selectedItemId).toBe("manual-selection");

      act(() => {
        result.current.openDeleteConfirmModal("delete-item");
      });

      expect(result.current.selectedItemId).toBe("delete-item");

      act(() => {
        result.current.openRenameModal("rename-item");
      });

      expect(result.current.selectedItemId).toBe("rename-item");
    });
  });

  describe("State Management", () => {
    test("should maintain state across multiple hook instances", () => {
      const { result: result1 } = renderHook(() => useUIStore());
      const { result: result2 } = renderHook(() => useUIStore());

      act(() => {
        result1.current.setViewMode("list");
      });

      expect(result2.current.viewMode).toBe("list");

      act(() => {
        result2.current.openCreateRoomModal();
      });

      expect(result1.current.isCreateRoomModalOpen).toBe(true);
    });

    test("should preserve state stability when no changes occur", () => {
      const { result, rerender } = renderHook(() => useUIStore());

      const initialViewMode = result.current.viewMode;
      const initialSortBy = result.current.sortBy;
      const initialLoading = result.current.isLoading;

      rerender();

      expect(result.current.viewMode).toBe(initialViewMode);
      expect(result.current.sortBy).toBe(initialSortBy);
      expect(result.current.isLoading).toBe(initialLoading);
    });
  });

  describe("Complex State Scenarios", () => {
    test("should handle complete workflow simulation", () => {
      const { result } = renderHook(() => useUIStore());

      // Start with grid view, modify sorting
      act(() => {
        result.current.setViewMode("grid");
        result.current.setSorting("name", "asc");
      });

      expect(result.current.viewMode).toBe("grid");
      expect(result.current.sortBy).toBe("name");
      expect(result.current.sortOrder).toBe("asc");

      // Open create room modal
      act(() => {
        result.current.openCreateRoomModal();
      });

      expect(result.current.isCreateRoomModalOpen).toBe(true);

      // Switch to list view while modal is open
      act(() => {
        result.current.setViewMode("list");
      });

      expect(result.current.viewMode).toBe("list");
      expect(result.current.isCreateRoomModalOpen).toBe(true);

      // Close create modal, open delete modal
      act(() => {
        result.current.closeCreateRoomModal();
        result.current.openDeleteConfirmModal("room-to-delete");
      });

      expect(result.current.isCreateRoomModalOpen).toBe(false);
      expect(result.current.isDeleteConfirmModalOpen).toBe(true);
      expect(result.current.selectedItemId).toBe("room-to-delete");

      // Change sorting while delete modal is open
      act(() => {
        result.current.setSorting("modified", "desc");
      });

      expect(result.current.sortBy).toBe("modified");
      expect(result.current.sortOrder).toBe("desc");
      expect(result.current.isDeleteConfirmModalOpen).toBe(true);

      // Close all modals and clear selection
      act(() => {
        result.current.closeDeleteConfirmModal();
      });

      expect(result.current.isDeleteConfirmModalOpen).toBe(false);
      expect(result.current.selectedItemId).toBeNull();
      expect(result.current.viewMode).toBe("list"); // Should remain
      expect(result.current.sortBy).toBe("modified"); // Should remain
    });

    test("should handle rapid state changes without conflicts", () => {
      const { result } = renderHook(() => useUIStore());

      act(() => {
        result.current.setViewMode("list");
        result.current.setSorting("name", "asc");
        result.current.setLoading(true);
        result.current.openCreateRoomModal();
        result.current.setSelectedItem("item-1");
      });

      expect(result.current.viewMode).toBe("list");
      expect(result.current.sortBy).toBe("name");
      expect(result.current.sortOrder).toBe("asc");
      expect(result.current.isLoading).toBe(true);
      expect(result.current.isCreateRoomModalOpen).toBe(true);
      expect(result.current.selectedItemId).toBe("item-1");

      act(() => {
        result.current.setViewMode("grid");
        result.current.setSorting("modified", "desc");
        result.current.setLoading(false);
        result.current.closeCreateRoomModal();
        result.current.openRenameModal("item-2");
      });

      expect(result.current.viewMode).toBe("grid");
      expect(result.current.sortBy).toBe("modified");
      expect(result.current.sortOrder).toBe("desc");
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isCreateRoomModalOpen).toBe(false);
      expect(result.current.isRenameModalOpen).toBe(true);
      expect(result.current.selectedItemId).toBe("item-2");
    });
  });
});
