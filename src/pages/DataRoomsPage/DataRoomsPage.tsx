import { useEffect, useState } from "react";
import { useDataroom } from "../../hooks/useDataroom";
import { useUIStore } from "../../store/useUIStore";
import { LoadingSpinner } from "../../components/common/LoadingSpinner";
import { PageErrorBoundary } from "../../components/common/PageErrorBoundary";
import { RoomCard } from "./components/RoomCard";

const DataRoomsPageContent = () => {
  const { datarooms, loadDatarooms, isLoading } = useDataroom();

  const {
    openCreateRoomModal,
    viewMode,
    setViewMode,
    sortBy,
    sortOrder,
    setSorting,
  } = useUIStore();

  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadDatarooms();
  }, [loadDatarooms]);

  // Filter and sort datarooms
  const filteredDatarooms = datarooms.filter((room) =>
    room.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedDatarooms = [...filteredDatarooms].sort((a, b) => {
    let aValue: string | number;
    let bValue: string | number;

    switch (sortBy) {
      case "name":
        aValue = a.name.toLowerCase();
        bValue = b.name.toLowerCase();
        break;
      case "modified":
        aValue = a.updatedAt;
        bValue = b.updatedAt;
        break;
      default:
        return 0;
    }

    if (aValue < bValue) return sortOrder === "asc" ? -1 : 1;
    if (aValue > bValue) return sortOrder === "asc" ? 1 : -1;
    return 0;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Data Rooms</h1>
        <button
          onClick={openCreateRoomModal}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <svg
            className="w-4 h-4"
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
          Create Data Room
        </button>
      </div>

      {/* Search and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            placeholder="Search data rooms..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <svg
            className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>

        <div className="flex items-center gap-4">
          {/* Sort Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Sort by:</span>
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [field, order] = e.target.value.split("-");
                setSorting(
                  field as "name" | "modified",
                  order as "asc" | "desc"
                );
              }}
              className="text-sm border border-gray-300 rounded px-2 py-1 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="name-asc">Name A-Z</option>
              <option value="name-desc">Name Z-A</option>
              <option value="modified-desc">Recently Modified</option>
              <option value="modified-asc">Least Recently Modified</option>
            </select>
          </div>

          {/* View Toggle */}
          <div className="flex rounded-lg border border-gray-300 overflow-hidden">
            <button
              onClick={() => setViewMode("grid")}
              className={`px-3 py-2 text-sm ${
                viewMode === "grid"
                  ? "bg-blue-500 text-white"
                  : "bg-white text-gray-600 hover:bg-gray-50"
              } transition-colors`}
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                />
              </svg>
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`px-3 py-2 text-sm ${
                viewMode === "list"
                  ? "bg-blue-500 text-white"
                  : "bg-white text-gray-600 hover:bg-gray-50"
              } transition-colors`}
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 10h16M4 14h16M4 18h16"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Results Count */}
      {searchTerm && (
        <div className="mb-4">
          <p className="text-sm text-gray-600">
            {sortedDatarooms.length} of {datarooms.length} data rooms
          </p>
        </div>
      )}

      {/* Content */}
      {sortedDatarooms.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
          {searchTerm ? (
            <>
              <svg
                className="mx-auto h-12 w-12 text-gray-400 mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No data rooms found
              </h3>
              <p className="text-gray-500 mb-4">
                No data rooms match your search for "{searchTerm}"
              </p>
              <button
                onClick={() => setSearchTerm("")}
                className="text-blue-600 hover:text-blue-800 underline"
              >
                Clear search
              </button>
            </>
          ) : (
            <>
              <svg
                className="mx-auto h-12 w-12 text-gray-400 mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No data rooms yet
              </h3>
              <p className="text-gray-500 mb-4">
                Get started by creating your first data room to organize and
                share files securely.
              </p>
              <button
                onClick={openCreateRoomModal}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create Data Room
              </button>
            </>
          )}
        </div>
      ) : (
        <div
          className={
            viewMode === "grid"
              ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
              : "space-y-2"
          }
        >
          {sortedDatarooms.map((dataroom) => (
            <RoomCard key={dataroom.id} dataroom={dataroom} />
          ))}
        </div>
      )}
    </div>
  );
};

// Wrapper with error boundary
export const DataRoomsPage = () => {
  return (
    <PageErrorBoundary pageName="Data Rooms">
      <DataRoomsPageContent />
    </PageErrorBoundary>
  );
};
