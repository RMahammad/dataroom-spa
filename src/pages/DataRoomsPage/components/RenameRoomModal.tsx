import { useState, useEffect } from "react";
import { Modal } from "../../../components/common/Modal";
import { useDataroom } from "../../../hooks/useDataroom";
import { useUIStore } from "../../../store/useUIStore";

export const RenameRoomModal = () => {
  const [name, setName] = useState("");
  const [originalName, setOriginalName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [nameError, setNameError] = useState("");

  const { renameDataroom, isNameAvailable, getDataroom, loadDatarooms } =
    useDataroom();
  const { isRenameModalOpen, closeRenameModal, selectedItemId } = useUIStore();

  useEffect(() => {
    if (isRenameModalOpen && selectedItemId) {
      const dataroom = getDataroom(selectedItemId);
      if (dataroom) {
        setName(dataroom.name);
        setOriginalName(dataroom.name);
      }
    }
  }, [isRenameModalOpen, selectedItemId, getDataroom]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedItemId) return;

    const trimmedName = name.trim();
    if (!trimmedName) {
      setNameError("Name is required");
      return;
    }

    if (trimmedName.length > 255) {
      setNameError("Name is too long (max 255 characters)");
      return;
    }

    // If name hasn't changed, just close
    if (trimmedName === originalName) {
      handleClose();
      return;
    }

    setIsSubmitting(true);
    setNameError("");

    try {
      // Check if name is available (excluding current item)
      const available = await isNameAvailable(trimmedName, selectedItemId);
      if (!available) {
        setNameError("A data room with this name already exists");
        return;
      }

      // Rename the data room
      const success = await renameDataroom(selectedItemId, trimmedName);
      if (success) {
        handleClose();
        await loadDatarooms(); // Refresh the list
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setName("");
      setOriginalName("");
      setNameError("");
      closeRenameModal();
    }
  };

  const hasChanges = name.trim() !== originalName;

  return (
    <Modal
      isOpen={isRenameModalOpen}
      onClose={handleClose}
      title="Rename Data Room"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="newRoomName"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Data Room Name
          </label>
          <input
            id="newRoomName"
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setNameError("");
            }}
            placeholder="Enter new name"
            className={`w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              nameError ? "border-red-300" : "border-gray-300"
            }`}
            disabled={isSubmitting}
            autoFocus
            onFocus={(e) => e.target.select()}
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
            disabled={isSubmitting || !name.trim() || !hasChanges}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Renaming..." : "Rename"}
          </button>
        </div>
      </form>
    </Modal>
  );
};
