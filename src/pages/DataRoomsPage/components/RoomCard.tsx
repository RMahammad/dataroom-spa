import { Link } from "react-router-dom";
import type { Dataroom } from "../../../core/types";
import { useUIStore } from "../../../store/useUIStore";
import { useDataroom } from "../../../hooks/useDataroom";
import { useState, useEffect } from "react";

interface RoomCardProps {
  dataroom: Dataroom;
}

export const RoomCard = ({ dataroom }: RoomCardProps) => {
  const [stats, setStats] = useState({
    folderCount: 0,
    fileCount: 0,
    totalSize: 0,
  });
  const { getDataroomStats } = useDataroom();
  const { openRenameModal, openDeleteConfirmModal } = useUIStore();

  useEffect(() => {
    const loadStats = async () => {
      const roomStats = await getDataroomStats(dataroom.id);
      setStats(roomStats);
    };
    loadStats();
  }, [dataroom.id, getDataroomStats]);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const handleRename = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    openRenameModal(dataroom.id);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    openDeleteConfirmModal(dataroom.id);
  };

  return (
    <Link
      to={`/datarooms/${dataroom.id}`}
      className="group relative block p-4 sm:p-6 bg-white border border-gray-200 rounded-lg hover:border-gray-300 hover:shadow-md transition-all duration-200"
    >
      {/* Room icon and name */}
      <div className="flex items-start justify-between mb-3 sm:mb-4">
        <div className="flex items-center min-w-0 flex-1">
          <div className="shrink-0 h-8 w-8 sm:h-10 sm:w-10 text-blue-500">
            <svg fill="currentColor" viewBox="0 0 24 24">
              <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
              <path d="M8 5a2 2 0 012-2h4a2 2 0 012 2v4H8V5z" />
            </svg>
          </div>
          <div className="ml-3 flex-1 min-w-0">
            <h3 className="text-base sm:text-lg font-medium text-gray-900 truncate group-hover:text-blue-600 transition-colors">
              {dataroom.name}
            </h3>
          </div>
        </div>

        {/* Actions menu */}
        <div className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity ml-2">
          <div className="flex space-x-1">
            <button
              onClick={handleRename}
              className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
              title="Rename"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                />
              </svg>
            </button>
            <button
              onClick={handleDelete}
              className="p-1 text-gray-400 hover:text-red-600 transition-colors"
              title="Delete"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-gray-500">
        <div className="flex justify-between">
          <span>Folders:</span>
          <span className="font-medium">{stats.folderCount}</span>
        </div>
        <div className="flex justify-between">
          <span>Files:</span>
          <span className="font-medium">{stats.fileCount}</span>
        </div>
        <div className="flex justify-between">
          <span>Size:</span>
          <span className="font-medium">{formatFileSize(stats.totalSize)}</span>
        </div>
      </div>

      {/* Last modified */}
      <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-100">
        <p className="text-xs text-gray-400">
          Modified {formatDate(dataroom.updatedAt)}
        </p>
      </div>
    </Link>
  );
};
