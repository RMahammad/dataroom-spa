import { useState, useEffect } from "react";
import { Modal } from "../../../components/common/Modal";
import { useDataroom } from "../../../hooks/useDataroom";
import { useUIStore } from "../../../store/useUIStore";

export const DeleteConfirmModal = () => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletionInfo, setDeletionInfo] = useState({ folders: 0, files: 0 });
  const [dataroomName, setDataroomName] = useState("");

  const { deleteDataroom, getDeletionImpact, getDataroom, loadDatarooms } =
    useDataroom();
  const { isDeleteConfirmModalOpen, closeDeleteConfirmModal, selectedItemId } =
    useUIStore();

  useEffect(() => {
    if (isDeleteConfirmModalOpen && selectedItemId) {
      const dataroom = getDataroom(selectedItemId);
      if (dataroom) {
        setDataroomName(dataroom.name);
        getDeletionImpact(selectedItemId).then(setDeletionInfo);
      }
    }
  }, [
    isDeleteConfirmModalOpen,
    selectedItemId,
    getDataroom,
    getDeletionImpact,
  ]);

  const handleDelete = async () => {
    if (!selectedItemId) return;

    setIsDeleting(true);
    try {
      const success = await deleteDataroom(selectedItemId);
      if (success) {
        closeDeleteConfirmModal();
        await loadDatarooms(); // Refresh the list
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClose = () => {
    if (!isDeleting) {
      closeDeleteConfirmModal();
    }
  };

  const hasContent = deletionInfo.folders > 0 || deletionInfo.files > 0;

  return (
    <Modal
      isOpen={isDeleteConfirmModalOpen}
      onClose={handleClose}
      title="Delete Data Room"
    >
      <div className="space-y-4">
        <div className="flex items-start space-x-3">
          <div className="shrink-0 h-10 w-10 text-red-500">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-medium text-gray-900">
              Are you sure you want to delete "{dataroomName}"?
            </h3>
            <div className="mt-2 text-sm text-gray-500">
              {hasContent ? (
                <div>
                  <p className="mb-2">This action will permanently delete:</p>
                  <ul className="space-y-1 ml-4">
                    {deletionInfo.folders > 0 && (
                      <li className="flex items-center">
                        <span className="w-2 h-2 bg-gray-400 rounded-full mr-2"></span>
                        {deletionInfo.folders} folder
                        {deletionInfo.folders !== 1 ? "s" : ""}
                      </li>
                    )}
                    {deletionInfo.files > 0 && (
                      <li className="flex items-center">
                        <span className="w-2 h-2 bg-gray-400 rounded-full mr-2"></span>
                        {deletionInfo.files} file
                        {deletionInfo.files !== 1 ? "s" : ""}
                      </li>
                    )}
                  </ul>
                  <p className="mt-3 font-medium text-red-600">
                    This action cannot be undone.
                  </p>
                </div>
              ) : (
                <p>This data room is empty and will be permanently deleted.</p>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={handleClose}
            disabled={isDeleting}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </Modal>
  );
};
