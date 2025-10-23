import { useState, useCallback } from "react";
import { toast } from "react-hot-toast";
import { FileService } from "../core/services/FileService";
import type { FileObject, ID } from "../core/types";
import { getErrorMessage } from "../core/errors";

export const useFile = () => {
  const [files, setFiles] = useState<FileObject[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadFiles = useCallback(async (dataroomId: ID, parentId: ID | null) => {
    setIsLoading(true);
    try {
      const fileList = await FileService.listInFolder(parentId, dataroomId);
      setFiles(fileList);
    } catch (error) {
      const message = getErrorMessage(error);
      toast.error(`Failed to load files: ${message}`);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const uploadFile = useCallback(
    async (
      file: File,
      dataroomId: ID,
      parentId: ID | null
    ): Promise<boolean> => {
      setIsLoading(true);
      try {
        const fileObject = await FileService.upload(file, dataroomId, parentId);
        setFiles((prev) => [fileObject, ...prev]);
        toast.success(`File "${file.name}" uploaded successfully`);
        return true;
      } catch (error) {
        const message = getErrorMessage(error);
        toast.error(`Failed to upload file: ${message}`);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const renameFile = useCallback(
    async (id: ID, newName: string): Promise<boolean> => {
      setIsLoading(true);
      try {
        const updatedFile = await FileService.rename(id, newName);
        setFiles((prev) =>
          prev.map((file) => (file.id === id ? updatedFile : file))
        );
        toast.success(`File renamed to "${newName}"`);
        return true;
      } catch (error) {
        const message = getErrorMessage(error);
        toast.error(`Failed to rename file: ${message}`);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const deleteFile = useCallback(async (id: ID): Promise<boolean> => {
    setIsLoading(true);
    try {
      await FileService.delete(id);
      setFiles((prev) => prev.filter((file) => file.id !== id));
      toast.success("File deleted successfully");
      return true;
    } catch (error) {
      const message = getErrorMessage(error);
      toast.error(`Failed to delete file: ${message}`);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const isNameAvailable = useCallback(
    async (
      dataroomId: ID,
      name: string,
      parentId: ID,
      excludeId?: ID
    ): Promise<boolean> => {
      try {
        return await FileService.isNameAvailable(
          name,
          parentId,
          dataroomId,
          excludeId
        );
      } catch {
        return false;
      }
    },
    []
  );

  const getFile = useCallback(
    (id: ID): FileObject | undefined => {
      return files.find((file) => file.id === id);
    },
    [files]
  );

  const downloadFile = useCallback(async (id: ID): Promise<void> => {
    try {
      const result = await FileService.downloadBlob(id);
      if (result) {
        // Create download link
        const url = URL.createObjectURL(result.blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = result.filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      const message = getErrorMessage(error);
      toast.error(`Failed to download file: ${message}`);
    }
  }, []);

  return {
    // State
    files,
    isLoading,

    // Actions
    loadFiles,
    uploadFile,
    renameFile,
    deleteFile,
    isNameAvailable,
    getFile,
    downloadFile,
  };
};
