import { useState, useCallback } from "react";
import { toast } from "react-hot-toast";
import { FolderService } from "../core/services/FolderService";
import type { Folder, ID } from "../core/types";
import { getErrorMessage } from "../core/errors";

export const useFolder = () => {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadFolders = useCallback(
    async (dataroomId: ID, parentId?: ID | null) => {
      setIsLoading(true);
      try {
        const folderList = await FolderService.listChildren(
          parentId || null,
          dataroomId
        );
        setFolders(folderList);
      } catch (error) {
        const message = getErrorMessage(error);
        toast.error(`Failed to load folders: ${message}`);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const createFolder = useCallback(
    async (dataroomId: ID, name: string, parentId?: ID): Promise<boolean> => {
      setIsLoading(true);
      try {
        const folder = await FolderService.create(
          name,
          dataroomId,
          parentId || null
        );
        setFolders((prev) => [folder, ...prev]);
        toast.success(`Folder "${name}" created successfully`);
        return true;
      } catch (error) {
        const message = getErrorMessage(error);
        toast.error(`Failed to create folder: ${message}`);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const renameFolder = useCallback(
    async (id: ID, newName: string): Promise<boolean> => {
      setIsLoading(true);
      try {
        const updatedFolder = await FolderService.rename(id, newName);
        setFolders((prev) =>
          prev.map((folder) => (folder.id === id ? updatedFolder : folder))
        );
        toast.success(`Folder renamed to "${newName}"`);
        return true;
      } catch (error) {
        const message = getErrorMessage(error);
        toast.error(`Failed to rename folder: ${message}`);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const deleteFolder = useCallback(async (id: ID): Promise<boolean> => {
    setIsLoading(true);
    try {
      const stats = await FolderService.delete(id);
      setFolders((prev) => prev.filter((folder) => folder.id !== id));
      toast.success(
        `Folder deleted successfully (${stats.folders} folders, ${stats.files} files removed)`
      );
      return true;
    } catch (error) {
      const message = getErrorMessage(error);
      toast.error(`Failed to delete folder: ${message}`);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getDeletionImpact = useCallback(async (id: ID) => {
    try {
      return await FolderService.getDeletionImpact(id);
    } catch (error) {
      const message = getErrorMessage(error);
      toast.error(`Failed to get deletion info: ${message}`);
      return { folders: 0, files: 0 };
    }
  }, []);

  const isNameAvailable = useCallback(
    async (
      dataroomId: ID,
      name: string,
      parentId?: ID,
      excludeId?: ID
    ): Promise<boolean> => {
      try {
        return await FolderService.isNameAvailable(
          name,
          parentId || null,
          dataroomId,
          excludeId
        );
      } catch {
        return false;
      }
    },
    []
  );

  const getFolder = useCallback(
    (id: ID): Folder | undefined => {
      return folders.find((folder) => folder.id === id);
    },
    [folders]
  );

  return {
    // State
    folders,
    isLoading,

    // Actions
    loadFolders,
    createFolder,
    renameFolder,
    deleteFolder,
    getDeletionImpact,
    isNameAvailable,
    getFolder,
  };
};
