import { create } from "zustand";
import type { ViewMode, SortBy, SortOrder } from "../core/types";

interface UIState {
  // View preferences
  viewMode: ViewMode;
  sortBy: SortBy;
  sortOrder: SortOrder;

  // Modal states
  isCreateRoomModalOpen: boolean;
  isDeleteConfirmModalOpen: boolean;
  isRenameModalOpen: boolean;

  // Loading states
  isLoading: boolean;

  // Current item being acted upon
  selectedItemId: string | null;

  // Actions
  setViewMode: (mode: ViewMode) => void;
  setSorting: (sortBy: SortBy, order?: SortOrder) => void;

  // Modal actions
  openCreateRoomModal: () => void;
  closeCreateRoomModal: () => void;
  openDeleteConfirmModal: (itemId: string) => void;
  closeDeleteConfirmModal: () => void;
  openRenameModal: (itemId: string) => void;
  closeRenameModal: () => void;

  // Loading actions
  setLoading: (loading: boolean) => void;

  // Selection actions
  setSelectedItem: (itemId: string | null) => void;
}

export const useUIStore = create<UIState>((set) => ({
  // Initial state
  viewMode: "grid",
  sortBy: "modified",
  sortOrder: "desc",

  isCreateRoomModalOpen: false,
  isDeleteConfirmModalOpen: false,
  isRenameModalOpen: false,

  isLoading: false,
  selectedItemId: null,

  // Actions
  setViewMode: (mode) => set({ viewMode: mode }),
  setSorting: (sortBy, order) =>
    set({
      sortBy,
      sortOrder: order || (sortBy === "name" ? "asc" : "desc"),
    }),

  // Modal actions
  openCreateRoomModal: () => set({ isCreateRoomModalOpen: true }),
  closeCreateRoomModal: () => set({ isCreateRoomModalOpen: false }),
  openDeleteConfirmModal: (itemId) =>
    set({
      isDeleteConfirmModalOpen: true,
      selectedItemId: itemId,
    }),
  closeDeleteConfirmModal: () =>
    set({
      isDeleteConfirmModalOpen: false,
      selectedItemId: null,
    }),
  openRenameModal: (itemId) =>
    set({
      isRenameModalOpen: true,
      selectedItemId: itemId,
    }),
  closeRenameModal: () =>
    set({
      isRenameModalOpen: false,
      selectedItemId: null,
    }),

  // Loading actions
  setLoading: (loading) => set({ isLoading: loading }),

  // Selection actions
  setSelectedItem: (itemId) => set({ selectedItemId: itemId }),
}));
