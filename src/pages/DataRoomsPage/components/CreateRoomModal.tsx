import { useState } from "react";
import { Modal } from "../../../components/common/Modal";
import { useDataroom } from "../../../hooks/useDataroom";
import { useUIStore } from "../../../store/useUIStore";

export const CreateRoomModal = () => {
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [nameError, setNameError] = useState("");

  const { createDataroom, isNameAvailable, loadDatarooms } = useDataroom();
  const { isCreateRoomModalOpen, closeCreateRoomModal } = useUIStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedName = name.trim();
    if (!trimmedName) {
      setNameError("Name is required");
      return;
    }

    if (trimmedName.length > 255) {
      setNameError("Name is too long (max 255 characters)");
      return;
    }

    setIsSubmitting(true);
    setNameError("");

    try {
      // Check if name is available
      const available = await isNameAvailable(trimmedName);
      if (!available) {
        setNameError("A data room with this name already exists");
        return;
      }

      // Create the data room
      const success = await createDataroom(trimmedName);
      if (success) {
        setName("");
        closeCreateRoomModal();
        await loadDatarooms(); // Refresh the list
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setName("");
      setNameError("");
      closeCreateRoomModal();
    }
  };

  return (
    <Modal
      isOpen={isCreateRoomModalOpen}
      onClose={handleClose}
      title="Create New Data Room"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="roomName"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Data Room Name
          </label>
          <input
            id="roomName"
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setNameError("");
            }}
            placeholder="Enter data room name"
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
            {isSubmitting ? "Creating..." : "Create"}
          </button>
        </div>
      </form>
    </Modal>
  );
};
