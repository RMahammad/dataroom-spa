import { useParams, Navigate, useNavigate } from "react-router-dom";
import { useState, useEffect, useCallback } from "react";
import { Breadcrumbs } from "../../components/common/Breadcrumbs";
import { EntryItem } from "../../components/common/EntryItem";
import { FileViewerModal } from "../../components/common/FileViewerModal";
import { LoadingSpinner } from "../../components/common/LoadingSpinner";
import { UploadDropzone } from "../../components/common/UploadDropzone";
import { PageErrorBoundary } from "../../components/common/PageErrorBoundary";
import { useDataroom } from "../../hooks/useDataroom";
import { useFolder } from "../../hooks/useFolder";
import { useFile } from "../../hooks/useFile";
import { useUIStore } from "../../store/useUIStore";
import type { FileObject, Folder } from "../../core/types";

import { CreateFolderModal } from "./components/CreateFolderModal";
import { RenameModal } from "./components/RenameModal";
import { DeleteConfirmModal } from "./components/DeleteConfirmModal";
import { Toolbar } from "./components/Toolbar";

interface ModalState {
  type: "createFolder" | "rename" | "delete" | null;
  data?: {
    id: string;
    name: string;
    type: "folder" | "file";
  };
}

const RoomBrowserPageContent = () => {
  const { dataroomId, folderId } = useParams<{
    dataroomId: string;
    folderId?: string;
  }>();
  const navigate = useNavigate();
  const [modalState, setModalState] = useState<ModalState>({ type: null });
  const [selectedFile, setSelectedFile] = useState<FileObject | null>(null);
  const [allFolders, setAllFolders] = useState<Folder[]>([]);
  const [folderSizes, setFolderSizes] = useState<Map<string, number>>(
    new Map()
  );

  const { datarooms, isLoading: dataroomsLoading } = useDataroom();
  const {
    folders,
    isLoading: foldersLoading,
    loadFolders,
    renameFolder,
    deleteFolder,
  } = useFolder();
  const {
    files,
    isLoading: filesLoading,
    uploadFile,
    loadFiles,
    renameFile,
    deleteFile,
    downloadFile,
  } = useFile();

  const { viewMode } = useUIStore();

  const currentDataroom = datarooms.find((room) => room.id === dataroomId);

  // Helper function to reload all folders
  const reloadAllFolders = useCallback(async () => {
    if (!dataroomId) return;
    try {
      const { FolderRepo } = await import("../../core/repos/FolderRepo");
      const allFoldersData = await FolderRepo.listByDataroom(dataroomId);
      setAllFolders(allFoldersData);
    } catch (error) {
      console.error("Failed to reload all folders:", error);
    }
  }, [dataroomId]);

  // Helper function to calculate folder sizes
  const calculateFolderSizes = useCallback(async () => {
    if (!dataroomId || folders.length === 0) return;

    try {
      const { FolderService } = await import(
        "../../core/services/FolderService"
      );
      const sizes = new Map<string, number>();

      // Calculate size for each folder in the current view
      for (const folder of folders) {
        try {
          const size = await FolderService.calculateTotalSize(folder.id);
          sizes.set(folder.id, size);
        } catch (error) {
          console.error(
            `Failed to calculate size for folder ${folder.id}:`,
            error
          );
          // Set size to 0 if calculation fails
          sizes.set(folder.id, 0);
        }
      }

      setFolderSizes(sizes);
    } catch (error) {
      console.error("Failed to calculate folder sizes:", error);
    }
  }, [dataroomId, folders]);

  useEffect(() => {
    if (!dataroomId) return;

    loadFolders(dataroomId, folderId || null);
    loadFiles(dataroomId, folderId || null);
  }, [dataroomId, folderId, loadFolders, loadFiles]);

  useEffect(() => {
    reloadAllFolders();
  }, [dataroomId, reloadAllFolders]);

  useEffect(() => {
    calculateFolderSizes();
  }, [calculateFolderSizes]);

  const handleCreateFolderSuccess = () => {
    if (dataroomId) {
      loadFolders(dataroomId, folderId || null);
      reloadAllFolders();
    }
  };

  const handleRenameFolder = async (newName: string): Promise<boolean> => {
    if (!modalState.data || !dataroomId) return false;

    const success = await renameFolder(modalState.data.id, newName);
    if (success) {
      loadFolders(dataroomId, folderId || null);
      reloadAllFolders();
    }
    return success;
  };

  const handleRenameFile = async (newName: string): Promise<boolean> => {
    if (!modalState.data || !dataroomId) return false;

    const success = await renameFile(modalState.data.id, newName);
    if (success) {
      loadFiles(dataroomId, folderId || null);
    }
    return success;
  };

  const handleDeleteFolder = async (): Promise<boolean> => {
    if (!modalState.data || !dataroomId) return false;

    const success = await deleteFolder(modalState.data.id);
    if (success) {
      loadFolders(dataroomId, folderId || null);
      reloadAllFolders();
    }
    return success;
  };

  const handleDeleteFile = async (): Promise<boolean> => {
    if (!modalState.data || !dataroomId) return false;

    const success = await deleteFile(modalState.data.id);
    if (success) {
      loadFiles(dataroomId, folderId || null);
      calculateFolderSizes(); // Recalculate since a file was deleted
    }
    return success;
  };

  const handleUpload = useCallback(
    async (uploadedFiles: File[]) => {
      if (!dataroomId) {
        console.warn("Cannot upload files: Missing dataroomId.");
        return;
      }

      for (const file of uploadedFiles) {
        await uploadFile(file, dataroomId, folderId || null);
      }

      loadFiles(dataroomId, folderId || null);
      calculateFolderSizes();
    },
    [dataroomId, folderId, uploadFile, loadFiles, calculateFolderSizes]
  );

  useEffect(() => {
    const handleCreateFolder = () => {
      openCreateFolderModal();
    };

    const handleUploadFiles = (event: CustomEvent) => {
      const files = event.detail as File[];
      handleUpload(files);
    };

    window.addEventListener("createFolder", handleCreateFolder);
    window.addEventListener("uploadFiles", handleUploadFiles as EventListener);

    return () => {
      window.removeEventListener("createFolder", handleCreateFolder);
      window.removeEventListener(
        "uploadFiles",
        handleUploadFiles as EventListener
      );
    };
  }, [handleUpload]);

  const openCreateFolderModal = () => {
    setModalState({ type: "createFolder" });
  };

  const openRenameModal = (item: {
    id: string;
    name: string;
    type: "folder" | "file";
  }) => {
    setModalState({ type: "rename", data: item });
  };

  const openDeleteModal = (item: {
    id: string;
    name: string;
    type: "folder" | "file";
  }) => {
    setModalState({ type: "delete", data: item });
  };

  const closeModal = () => {
    setModalState({ type: null });
  };

  const handleBack = () => {
    if (!folderId) {
      return;
    }

    const currentFolder = allFolders.find((f) => f.id === folderId);

    if (currentFolder?.parentId) {
      // Navigate to parent folder
      navigate(`/datarooms/${dataroomId}/folders/${currentFolder.parentId}`);
    } else {
      // Navigate to dataroom root (parent is null)
      navigate(`/datarooms/${dataroomId}`);
    }
  };

  const handleFileClick = (file: FileObject) => {
    setSelectedFile(file);
  };

  const handleCloseFileViewer = () => {
    setSelectedFile(null);
  };

  // Loading state
  if (dataroomsLoading) {
    return <LoadingSpinner />;
  }

  // If dataroom doesn't exist, redirect to data rooms page
  if (!currentDataroom) {
    return <Navigate to="/data-rooms" replace />;
  }

  const isLoading = foldersLoading || filesLoading;

  return (
    <div className="flex-1 flex flex-col">
      {/* Toolbar */}
      <Toolbar
        onCreateFolder={() => setModalState({ type: "createFolder" })}
        onUpload={handleUpload}
        dataroomId={dataroomId!}
        showBackButton={!!folderId}
        onBack={handleBack}
      />{" "}
      {/* Breadcrumbs */}
      <div className="bg-gray-50 border-b border-gray-200 px-6 py-3">
        <Breadcrumbs
          dataroomName={currentDataroom.name}
          dataroomId={dataroomId!}
          folders={allFolders}
          currentFolderId={folderId}
        />
      </div>
      {/* Content Area */}
      <div className="flex-1 bg-gray-50 p-6">
        {/* Upload Dropzone - Available at root level and inside folders */}
        <div className="mb-6">
          <UploadDropzone
            onUpload={handleUpload}
            isUploading={isLoading}
            accept=".pdf"
            multiple={true}
            maxFiles={10}
          />
        </div>

        {/* Files and Folders List */}
        <div className="">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner />
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {folders.length === 0 && files.length === 0 ? (
                <div className="text-center py-12">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-5l-2-2H5a2 2 0 00-2 2z"
                    />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">
                    No items
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {folderId
                      ? "This folder is empty. Create a new folder or upload files to get started."
                      : "This data room is empty. Create a new folder or upload files to get started."}
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {folders.map((folder) => (
                    <EntryItem
                      key={folder.id}
                      item={folder}
                      viewMode={viewMode}
                      dataroomId={dataroomId!}
                      folderSize={folderSizes.get(folder.id)}
                      onRename={(id) =>
                        openRenameModal({
                          id,
                          name: folder.name,
                          type: "folder",
                        })
                      }
                      onDelete={(id) =>
                        openDeleteModal({
                          id,
                          name: folder.name,
                          type: "folder",
                        })
                      }
                    />
                  ))}
                  {files.map((file) => (
                    <EntryItem
                      key={file.id}
                      item={file}
                      viewMode={viewMode}
                      dataroomId={dataroomId!}
                      onRename={(id) =>
                        openRenameModal({ id, name: file.name, type: "file" })
                      }
                      onDelete={(id) =>
                        openDeleteModal({ id, name: file.name, type: "file" })
                      }
                      onFileClick={handleFileClick}
                      onDownload={downloadFile}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      {/* Modals */}
      <CreateFolderModal
        isOpen={modalState.type === "createFolder"}
        onClose={closeModal}
        dataroomId={dataroomId!}
        parentId={folderId}
        onSuccess={handleCreateFolderSuccess}
      />
      {modalState.data && (
        <RenameModal
          isOpen={modalState.type === "rename"}
          onClose={closeModal}
          itemName={modalState.data.name}
          itemType={modalState.data.type}
          onRename={
            modalState.data.type === "folder"
              ? handleRenameFolder
              : handleRenameFile
          }
        />
      )}
      {modalState.data && (
        <DeleteConfirmModal
          isOpen={modalState.type === "delete"}
          onClose={closeModal}
          itemName={modalState.data.name}
          itemType={modalState.data.type}
          onDelete={
            modalState.data.type === "folder"
              ? handleDeleteFolder
              : handleDeleteFile
          }
        />
      )}
      {/* File Viewer Modal */}
      <FileViewerModal
        isOpen={selectedFile !== null}
        onClose={handleCloseFileViewer}
        file={selectedFile}
      />
    </div>
  );
};

// Wrapper with error boundary
export const RoomBrowserPage = () => {
  return (
    <PageErrorBoundary pageName="Room Browser">
      <RoomBrowserPageContent />
    </PageErrorBoundary>
  );
};
