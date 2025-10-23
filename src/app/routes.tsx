import { createBrowserRouter, Navigate } from "react-router-dom";
import { AppShell } from "../components/layout/AppShell";
import { DataRoomsPage } from "../pages/DataRoomsPage/DataRoomsPage";
import { RoomBrowserPage } from "../pages/RoomBrowserPage/RoomBrowserPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppShell />,
    children: [
      {
        index: true,
        element: <DataRoomsPage />,
      },
      {
        path: "datarooms/:dataroomId",
        element: <RoomBrowserPage />,
      },
      {
        path: "datarooms/:dataroomId/folders/:folderId",
        element: <RoomBrowserPage />,
      },
      {
        path: "*",
        element: <Navigate to="/" replace />,
      },
    ],
  },
]);
