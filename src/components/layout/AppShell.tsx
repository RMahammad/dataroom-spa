import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { CreateRoomModal } from "../../pages/DataRoomsPage/components/CreateRoomModal";
import { RenameRoomModal } from "../../pages/DataRoomsPage/components/RenameRoomModal";
import { DeleteConfirmModal } from "../../pages/DataRoomsPage/components/DeleteConfirmModal";

export const AppShell = () => {
  return (
    <div className="h-screen flex bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 shrink-0">
        <Sidebar />
      </div>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center px-6 shrink-0">
          <div className="flex items-center justify-between w-full">
            <h1 className="text-lg font-semibold text-gray-900">Data Room</h1>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>

      {/* Global Modals */}
      <CreateRoomModal />
      <RenameRoomModal />
      <DeleteConfirmModal />
    </div>
  );
};
