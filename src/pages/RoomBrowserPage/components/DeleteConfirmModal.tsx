import { useState } from "react";
import { Modal } from "../../../components/common/Modal";

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemName: string;
  itemType: "folder" | "file";
  onDelete: () => Promise<boolean>;
}

export const DeleteConfirmModal = ({
  isOpen,
  onClose,
  itemName,
  itemType,
  onDelete,
}: DeleteConfirmModalProps) => {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const success = await onDelete();
      if (success) {
        onClose();
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClose = () => {
    if (!isDeleting) {
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={`Delete ${itemType === "folder" ? "Folder" : "File"}`}
    >
      <div className="space-y-4">
        <div className="flex items-center space-x-3">
          <div className="shrink-0 w-10 h-10 mx-auto bg-red-100 rounded-full flex items-center justify-center">
            <svg
              className="w-6 h-6 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-sm text-gray-600">
              Are you sure you want to delete{" "}
              <span className="font-medium text-gray-900">"{itemName}"</span>?
            </p>
            {itemType === "folder" && (
              <p className="text-sm text-red-600 mt-1">
                This will also delete all contents inside this folder.
              </p>
            )}
            <p className="text-sm text-gray-600 mt-1">
              This action cannot be undone.
            </p>
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-4">
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
