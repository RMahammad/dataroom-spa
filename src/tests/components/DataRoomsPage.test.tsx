import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { DataRoomsPage } from "../../pages/DataRoomsPage/DataRoomsPage";
import type { Dataroom } from "../../core/types";

vi.mock("../../components/common/LoadingSpinner", () => ({
  LoadingSpinner: () => <div>Loading...</div>,
}));

const mockDatarooms: Dataroom[] = [
  {
    id: "room1",
    name: "Test Room 1",
    createdAt: Date.now() - 86400000,
    updatedAt: Date.now() - 86400000,
  },
  {
    id: "room2",
    name: "Test Room 2",
    createdAt: Date.now() - 172800000,
    updatedAt: Date.now() - 172800000,
  },
];

vi.mock("../../hooks/useDataroom", () => ({
  useDataroom: () => ({
    datarooms: mockDatarooms,
    loadDatarooms: vi.fn(),
    isLoading: false,
  }),
}));

vi.mock("../../store/useUIStore", () => ({
  useUIStore: () => ({
    openCreateRoomModal: vi.fn(),
    viewMode: "grid",
    setViewMode: vi.fn(),
    sortBy: "modified",
    sortOrder: "desc",
    setSorting: vi.fn(),
  }),
}));

vi.mock("../../pages/DataRoomsPage/components/RoomCard", () => ({
  RoomCard: ({ dataroom }: { dataroom: Dataroom }) => (
    <div data-testid="room-card">
      <h3>{dataroom.name}</h3>
      <p>Room ID: {dataroom.id}</p>
    </div>
  ),
}));

// Test wrapper
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

describe("DataRoomsPage Component", () => {
  describe("Basic Rendering", () => {
    it("should render page title and create button", () => {
      render(
        <TestWrapper>
          <DataRoomsPage />
        </TestWrapper>
      );

      expect(screen.getByText("Data Rooms")).toBeInTheDocument();
      expect(screen.getByText("Create Data Room")).toBeInTheDocument();
    });

    it("should render search input", () => {
      render(
        <TestWrapper>
          <DataRoomsPage />
        </TestWrapper>
      );

      expect(
        screen.getByPlaceholderText("Search data rooms...")
      ).toBeInTheDocument();
    });

    it("should render room cards", () => {
      render(
        <TestWrapper>
          <DataRoomsPage />
        </TestWrapper>
      );

      expect(screen.getByText("Test Room 1")).toBeInTheDocument();
      expect(screen.getByText("Test Room 2")).toBeInTheDocument();
    });
  });

  describe("User Interactions", () => {
    it("should handle search input changes", () => {
      render(
        <TestWrapper>
          <DataRoomsPage />
        </TestWrapper>
      );

      const searchInput = screen.getByPlaceholderText("Search data rooms...");
      fireEvent.change(searchInput, { target: { value: "Test Room 1" } });

      expect(searchInput).toHaveValue("Test Room 1");
    });

    it("should display sorting controls", () => {
      render(
        <TestWrapper>
          <DataRoomsPage />
        </TestWrapper>
      );

      expect(screen.getByText("Sort by:")).toBeInTheDocument();
      expect(screen.getByDisplayValue("Recently Modified")).toBeInTheDocument();
    });
  });

  describe("Layout and Structure", () => {
    it("should have view mode controls", () => {
      render(
        <TestWrapper>
          <DataRoomsPage />
        </TestWrapper>
      );

      const buttons = screen.getAllByRole("button");
      // Should have at least the create button and view mode buttons
      expect(buttons.length).toBeGreaterThan(1);
    });

    it("should render room cards in a grid", () => {
      render(
        <TestWrapper>
          <DataRoomsPage />
        </TestWrapper>
      );

      const roomCards = screen.getAllByTestId("room-card");
      expect(roomCards).toHaveLength(2);
    });
  });
});
