import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { useDataroom } from "../../hooks/useDataroom";
import { useUIStore } from "../../store/useUIStore";

interface SidebarProps {
  onClose?: () => void;
}

export const Sidebar = ({ onClose }: SidebarProps) => {
  const location = useLocation();
  const { datarooms, loadDatarooms, isLoading } = useDataroom();
  const { openCreateRoomModal } = useUIStore();

  const handleLinkClick = () => {
    // Close sidebar on mobile when a link is clicked
    if (onClose) {
      onClose();
    }
  };

  useEffect(() => {
    loadDatarooms();
  }, [loadDatarooms]);

  return (
    <div className="h-full flex flex-col">
      {/* Logo/Brand */}
      <div className="h-14 sm:h-16 flex items-center justify-between px-4 border-b border-gray-200 shrink-0">
        <h2 className="text-lg font-semibold text-gray-900">DataRoom</h2>
        {/* Close button for mobile */}
        <button
          onClick={onClose}
          className="lg:hidden p-2 -mr-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
          aria-label="Close sidebar"
        >
          <svg
            className="h-6 w-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <Link
          to="/"
          onClick={handleLinkClick}
          className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
            location.pathname === "/"
              ? "bg-blue-50 text-blue-700"
              : "text-gray-700 hover:bg-gray-50"
          }`}
        >
          <svg
            className="mr-3 h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 5a2 2 0 012-2h4a2 2 0 012 2v4H8V5z"
            />
          </svg>
          All Data Rooms
        </Link>

        {/* Dynamic list of data rooms */}
        <div className="mt-6">
          <div className="px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
            Your Rooms
          </div>
          <div className="mt-2 space-y-1">
            {isLoading ? (
              <div className="px-3 py-2 text-sm text-gray-500">Loading...</div>
            ) : datarooms.length === 0 ? (
              <div className="px-3 py-2 text-sm text-gray-500 italic">
                No rooms yet
              </div>
            ) : (
              datarooms.slice(0, 8).map((room) => (
                <Link
                  key={room.id}
                  to={`/datarooms/${room.id}`}
                  onClick={handleLinkClick}
                  className={
                    location.pathname.startsWith(`/datarooms/${room.id}`)
                      ? "flex items-center px-3 py-2 text-sm font-medium rounded-md bg-blue-100 text-blue-700"
                      : "flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors"
                  }
                  title={room.name}
                >
                  <div className="flex items-center">
                    <svg
                      className="mr-2 h-4 w-4 shrink-0 text-blue-500"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                    </svg>
                    <span className="truncate">{room.name}</span>
                  </div>
                </Link>
              ))
            )}
            {datarooms.length > 8 && (
              <Link
                to="/"
                onClick={handleLinkClick}
                className="block px-3 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                + {datarooms.length - 8} more rooms
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-gray-200 shrink-0">
        <button
          type="button"
          onClick={openCreateRoomModal}
          className="w-full flex items-center justify-center px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
        >
          <svg
            className="mr-2 h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          New Room
        </button>
      </div>
    </div>
  );
};
