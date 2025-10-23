import { useState } from "react";
import { Modal } from "../../../components/common/Modal";
import { useFolder } from "../../../hooks/useFolder";

interface CreateFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  dataroomId: string;
  parentId?: string | null;
  onSuccess?: () => void;
}

export const CreateFolderModal = ({
  isOpen,
  onClose,
  dataroomId,
  parentId,
  onSuccess,
}: CreateFolderModalProps) => {
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [nameError, setNameError] = useState("");

  const { createFolder } = useFolder();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedName = name.trim();
    if (!trimmedName) {
      setNameError("Folder name is required");
      return;
    }

    if (trimmedName.length > 255) {
      setNameError("Folder name is too long (max 255 characters)");
      return;
    }

    setIsSubmitting(true);
    setNameError("");

    try {
      const success = await createFolder(
        dataroomId,
        trimmedName,
        parentId || undefined
      );
      if (success) {
        handleClose();
        onSuccess?.();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setName("");
      setNameError("");
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Create New Folder">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="folderName"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Folder Name
          </label>
          <input
            id="folderName"
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setNameError("");
            }}
            placeholder="Enter folder name"
            className={`w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              nameError ? "border-red-300" : "border-gray-300"
            }`}
            disabled={isSubmitting}
            autoFocus
          />
          {nameError && (
            <p className="mt-1 text-sm text-red-600">{nameError}</p>
          )}
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !name.trim()}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Creating..." : "Create Folder"}
          </button>
        </div>
      </form>
    </Modal>
  );
};
