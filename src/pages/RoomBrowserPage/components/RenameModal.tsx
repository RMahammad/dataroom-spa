import { useState, useEffect } from "react";
import { Modal } from "../../../components/common/Modal";

interface RenameModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemName: string;
  itemType: "folder" | "file";
  onRename: (newName: string) => Promise<boolean>;
}

export const RenameModal = ({
  isOpen,
  onClose,
  itemName,
  itemType,
  onRename,
}: RenameModalProps) => {
  const [name, setName] = useState(itemName);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [nameError, setNameError] = useState("");

  // Reset form when modal opens with new item
  useEffect(() => {
    if (isOpen) {
      setName(itemName);
      setNameError("");
    }
  }, [isOpen, itemName]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedName = name.trim();
    if (!trimmedName) {
      setNameError(
        `${itemType === "folder" ? "Folder" : "File"} name is required`
      );
      return;
    }

    if (trimmedName === itemName) {
      handleClose();
      return;
    }

    if (trimmedName.length > 255) {
      setNameError("Name is too long (max 255 characters)");
      return;
    }

    setIsSubmitting(true);
    setNameError("");

    try {
      const success = await onRename(trimmedName);
      if (success) {
        handleClose();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setName(itemName);
      setNameError("");
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={`Rename ${itemType === "folder" ? "Folder" : "File"}`}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="itemName"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            {itemType === "folder" ? "Folder" : "File"} Name
          </label>
          <input
            id="itemName"
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setNameError("");
            }}
            placeholder={`Enter ${itemType} name`}
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
            disabled={isSubmitting || !name.trim() || name.trim() === itemName}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Renaming..." : "Rename"}
          </button>
        </div>
      </form>
    </Modal>
  );
};
