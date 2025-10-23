import { Link } from "react-router-dom";
import type { Folder, FileObject, ViewMode } from "../../core/types";

interface EntryItemProps {
  item: Folder | FileObject;
  viewMode: ViewMode;
  onRename: (id: string) => void;
  onDelete: (id: string) => void;
  onDownload?: (id: string) => void;
  onFileClick?: (file: FileObject) => void;
  dataroomId: string;
  folderSize?: number; // Size in bytes for folders
}

export const EntryItem = ({
  item,
  viewMode,
  onRename,
  onDelete,
  onDownload,
  onFileClick,
  dataroomId,
  folderSize,
}: EntryItemProps) => {
  const isFolder = "parentId" in item && !("size" in item);
  const isFile = "size" in item;

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
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
    onRename(item.id);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onDelete(item.id);
  };

  const handleDownload = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onDownload) {
      onDownload(item.id);
    }
  };

  const getItemIcon = () => {
    if (isFolder) {
      return (
        <svg
          className="h-5 w-5 text-blue-500"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
        </svg>
      );
    }
    return (
      <svg
        className="h-5 w-5 text-red-500"
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path
          fillRule="evenodd"
          d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
          clipRule="evenodd"
        />
      </svg>
    );
  };

  const getNavigationPath = () => {
    if (isFolder) {
      return `/datarooms/${dataroomId}/folders/${item.id}`;
    }
    // Files are handled by onFileClick, so no navigation needed
    return "#";
  };

  const handleMainClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isFile && onFileClick) {
      onFileClick(item as FileObject);
    }
    // For folders, Link navigation will still work
  };

  if (viewMode === "grid") {
    return (
      <Link
        to={isFolder ? getNavigationPath() : "#"}
        onClick={isFile ? handleMainClick : undefined}
        className="group relative block p-4 bg-white border border-gray-200 rounded-lg hover:border-gray-300 hover:shadow-md transition-all duration-200"
      >
        {/* Content */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center min-w-0 flex-1">
            <div className="shrink-0 mr-3">{getItemIcon()}</div>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-medium text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                {item.name}
              </h3>
            </div>
          </div>

          {/* Actions menu */}
          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
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
              {isFile && onDownload && (
                <button
                  onClick={handleDownload}
                  className="p-1 text-gray-400 hover:text-green-600 transition-colors"
                  title="Download"
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
                      d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </button>
              )}
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

        {/* Details */}
        <div className="space-y-1 text-xs text-gray-500">
          {isFile && (
            <div className="flex justify-between">
              <span>Size:</span>
              <span>{formatFileSize((item as FileObject).size)}</span>
            </div>
          )}
          {isFolder && folderSize !== undefined && (
            <div className="flex justify-between">
              <span>Size:</span>
              <span>{formatFileSize(folderSize)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span>Modified:</span>
            <span>{formatDate(item.updatedAt)}</span>
          </div>
        </div>
      </Link>
    );
  }

  // List view
  return (
    <Link
      to={isFolder ? getNavigationPath() : "#"}
      onClick={isFile ? handleMainClick : undefined}
      className="group flex items-center px-4 py-3 bg-white hover:bg-gray-50 border-b border-gray-200 transition-colors"
    >
      <div className="shrink-0 mr-3">{getItemIcon()}</div>

      <div className="flex-1 min-w-0 mr-4">
        <p className="text-sm font-medium text-gray-900 truncate group-hover:text-blue-600 transition-colors">
          {item.name}
        </p>
      </div>

      <div className="shrink-0 flex items-center space-x-4 text-xs text-gray-500">
        {isFile && (
          <span className="w-16 text-right">
            {formatFileSize((item as FileObject).size)}
          </span>
        )}
        {isFolder && folderSize !== undefined && (
          <span className="w-16 text-right">{formatFileSize(folderSize)}</span>
        )}
        {isFolder && folderSize === undefined && (
          <span className="w-16 text-right">-</span>
        )}
        <span className="w-24 text-right">{formatDate(item.updatedAt)}</span>

        {/* Actions */}
        <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
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
          {isFile && onDownload && (
            <button
              onClick={handleDownload}
              className="p-1 text-gray-400 hover:text-green-600 transition-colors"
              title="Download"
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
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </button>
          )}
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
    </Link>
  );
};
