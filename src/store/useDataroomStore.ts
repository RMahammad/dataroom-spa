import { create } from "zustand";
import { DataroomService } from "../core/services/DataroomService";
import { getErrorMessage } from "../core/errors";
import type { Dataroom, ID } from "../core/types";
import { toast } from "react-hot-toast";

interface DataroomState {
  // State
  datarooms: Dataroom[];
  isLoading: boolean;
  lastUpdated: number | null;

  // Actions
  loadDatarooms: () => Promise<void>;
  createDataroom: (name: string) => Promise<boolean>;
  renameDataroom: (id: ID, newName: string) => Promise<boolean>;
  deleteDataroom: (id: ID) => Promise<boolean>;
  getDeletionImpact: (id: ID) => Promise<{ folders: number; files: number }>;
  getDataroomStats: (
    id: ID
  ) => Promise<{ folderCount: number; fileCount: number; totalSize: number }>;
  isNameAvailable: (name: string, excludeId?: ID) => Promise<boolean>;
  getDataroom: (id: ID) => Dataroom | undefined;

  // Internal actions
  setLoading: (loading: boolean) => void;
  setDatarooms: (datarooms: Dataroom[]) => void;
  addDataroom: (dataroom: Dataroom) => void;
  updateDataroom: (id: ID, updates: Partial<Dataroom>) => void;
  removeDataroom: (id: ID) => void;
}

export const useDataroomStore = create<DataroomState>((set, get) => ({
  // Initial state
  datarooms: [],
  isLoading: false,
  lastUpdated: null,

  // Actions
  loadDatarooms: async () => {
    set({ isLoading: true });
    try {
      const rooms = await DataroomService.list("updatedAt", "desc");
      set({
        datarooms: rooms,
        isLoading: false,
        lastUpdated: Date.now(),
      });
    } catch (error) {
      const message = getErrorMessage(error);
      toast.error(`Failed to load data rooms: ${message}`);
      set({ isLoading: false });
    }
  },

  createDataroom: async (name: string): Promise<boolean> => {
    set({ isLoading: true });
    try {
      const dataroom = await DataroomService.create(name);
      set((state) => ({
        datarooms: [dataroom, ...state.datarooms],
        isLoading: false,
        lastUpdated: Date.now(),
      }));
      toast.success(`Data room "${name}" created successfully`);
      return true;
    } catch (error) {
      const message = getErrorMessage(error);
      toast.error(`Failed to create data room: ${message}`);
      set({ isLoading: false });
      return false;
    }
  },

  renameDataroom: async (id: ID, newName: string): Promise<boolean> => {
    set({ isLoading: true });
    try {
      const updatedDataroom = await DataroomService.rename(id, newName);
      set((state) => ({
        datarooms: state.datarooms.map((room) =>
          room.id === id ? updatedDataroom : room
        ),
        isLoading: false,
        lastUpdated: Date.now(),
      }));
      toast.success(`Data room renamed to "${newName}"`);
      return true;
    } catch (error) {
      const message = getErrorMessage(error);
      toast.error(`Failed to rename data room: ${message}`);
      set({ isLoading: false });
      return false;
    }
  },

  deleteDataroom: async (id: ID): Promise<boolean> => {
    set({ isLoading: true });
    try {
      const stats = await DataroomService.delete(id);
      set((state) => ({
        datarooms: state.datarooms.filter((room) => room.id !== id),
        isLoading: false,
        lastUpdated: Date.now(),
      }));
      toast.success(
        `Data room deleted successfully (${stats.folders} folders, ${stats.files} files removed)`
      );
      return true;
    } catch (error) {
      const message = getErrorMessage(error);
      toast.error(`Failed to delete data room: ${message}`);
      set({ isLoading: false });
      return false;
    }
  },

  getDeletionImpact: async (id: ID) => {
    try {
      return await DataroomService.getDeletionImpact(id);
    } catch (error) {
      const message = getErrorMessage(error);
      toast.error(`Failed to get deletion info: ${message}`);
      return { folders: 0, files: 0 };
    }
  },

  getDataroomStats: async (id: ID) => {
    try {
      return await DataroomService.getStats(id);
    } catch (error) {
      const message = getErrorMessage(error);
      toast.error(`Failed to get statistics: ${message}`);
      return { folderCount: 0, fileCount: 0, totalSize: 0 };
    }
  },

  isNameAvailable: async (name: string, excludeId?: ID): Promise<boolean> => {
    try {
      return await DataroomService.isNameAvailable(name, excludeId);
    } catch {
      return false;
    }
  },

  getDataroom: (id: ID): Dataroom | undefined => {
    return get().datarooms.find((room) => room.id === id);
  },

  // Internal actions
  setLoading: (loading: boolean) => set({ isLoading: loading }),

  setDatarooms: (datarooms: Dataroom[]) =>
    set({
      datarooms,
      lastUpdated: Date.now(),
    }),

  addDataroom: (dataroom: Dataroom) =>
    set((state) => ({
      datarooms: [dataroom, ...state.datarooms],
      lastUpdated: Date.now(),
    })),

  updateDataroom: (id: ID, updates: Partial<Dataroom>) =>
    set((state) => ({
      datarooms: state.datarooms.map((room) =>
        room.id === id ? { ...room, ...updates } : room
      ),
      lastUpdated: Date.now(),
    })),

  removeDataroom: (id: ID) =>
    set((state) => ({
      datarooms: state.datarooms.filter((room) => room.id !== id),
      lastUpdated: Date.now(),
    })),
}));
