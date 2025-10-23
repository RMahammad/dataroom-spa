import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { EntryItem } from "../../components/common/EntryItem";
import type { Folder, FileObject } from "../../core/types";

const mockFolder: Folder = {
  id: "folder1",
  name: "Documents",
  parentId: null,
  dataroomId: "room1",
  createdAt: Date.now(),
  updatedAt: Date.now(),
};

const mockFile: FileObject = {
  id: "file1",
  name: "document.pdf",
  size: 1024,
  mimeType: "application/pdf",
  blobKey: "blob1",
  parentId: "folder1",
  dataroomId: "room1",
  createdAt: Date.now(),
  updatedAt: Date.now(),
};

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

describe("EntryItem Component", () => {
  describe("Folder Display", () => {
    it("should render folder with correct name and icon", () => {
      render(
        <TestWrapper>
          <EntryItem
            item={mockFolder}
            viewMode="grid"
            onRename={vi.fn()}
            onDelete={vi.fn()}
            dataroomId="room1"
          />
        </TestWrapper>
      );

      expect(screen.getByText("Documents")).toBeInTheDocument();
      expect(screen.getByRole("link")).toBeInTheDocument();
    });

    it("should render as link for navigation", () => {
      render(
        <TestWrapper>
          <EntryItem
            item={mockFolder}
            viewMode="grid"
            onRename={vi.fn()}
            onDelete={vi.fn()}
            dataroomId="room1"
          />
        </TestWrapper>
      );

      const link = screen.getByRole("link");
      expect(link).toHaveAttribute("href", "/datarooms/room1/folders/folder1");
    });
  });

  describe("File Display", () => {
    it("should render file with correct name and size", () => {
      render(
        <TestWrapper>
          <EntryItem
            item={mockFile}
            viewMode="grid"
            onRename={vi.fn()}
            onDelete={vi.fn()}
            dataroomId="room1"
          />
        </TestWrapper>
      );

      expect(screen.getByText("document.pdf")).toBeInTheDocument();
      expect(screen.getByText("1 KB")).toBeInTheDocument();
    });

    it("should display file size in appropriate units", () => {
      const largeFile: FileObject = {
        ...mockFile,
        size: 1048576, // 1 MB
      };

      render(
        <TestWrapper>
          <EntryItem
            item={largeFile}
            viewMode="grid"
            onRename={vi.fn()}
            onDelete={vi.fn()}
            dataroomId="room1"
          />
        </TestWrapper>
      );

      expect(screen.getByText("1 MB")).toBeInTheDocument();
    });

    it("should call onFileClick when file link is clicked", () => {
      const onFileClick = vi.fn();

      render(
        <TestWrapper>
          <EntryItem
            item={mockFile}
            viewMode="grid"
            onRename={vi.fn()}
            onDelete={vi.fn()}
            onFileClick={onFileClick}
            dataroomId="room1"
          />
        </TestWrapper>
      );

      fireEvent.click(screen.getByRole("link"));
      expect(onFileClick).toHaveBeenCalledWith(mockFile);
    });
  });

  describe("Context Menu", () => {
    it("should show rename and delete buttons", () => {
      render(
        <TestWrapper>
          <EntryItem
            item={mockFolder}
            viewMode="grid"
            onRename={vi.fn()}
            onDelete={vi.fn()}
            dataroomId="room1"
          />
        </TestWrapper>
      );

      expect(screen.getByTitle("Rename")).toBeInTheDocument();
      expect(screen.getByTitle("Delete")).toBeInTheDocument();
    });

    it("should call onRename when rename is clicked", () => {
      const onRename = vi.fn();

      render(
        <TestWrapper>
          <EntryItem
            item={mockFolder}
            viewMode="grid"
            onRename={onRename}
            onDelete={vi.fn()}
            dataroomId="room1"
          />
        </TestWrapper>
      );

      fireEvent.click(screen.getByTitle("Rename"));
      expect(onRename).toHaveBeenCalledWith(mockFolder.id);
    });

    it("should call onDelete when delete is clicked", () => {
      const onDelete = vi.fn();

      render(
        <TestWrapper>
          <EntryItem
            item={mockFolder}
            viewMode="grid"
            onRename={vi.fn()}
            onDelete={onDelete}
            dataroomId="room1"
          />
        </TestWrapper>
      );

      fireEvent.click(screen.getByTitle("Delete"));
      expect(onDelete).toHaveBeenCalledWith(mockFolder.id);
    });
  });

  describe("View Modes", () => {
    it("should render differently in list mode", () => {
      const { container } = render(
        <TestWrapper>
          <EntryItem
            item={mockFolder}
            viewMode="list"
            onRename={vi.fn()}
            onDelete={vi.fn()}
            dataroomId="room1"
          />
        </TestWrapper>
      );

      expect(container.querySelector(".group.flex")).toBeInTheDocument();
    });

    it("should render correctly in grid mode", () => {
      const { container } = render(
        <TestWrapper>
          <EntryItem
            item={mockFolder}
            viewMode="grid"
            onRename={vi.fn()}
            onDelete={vi.fn()}
            dataroomId="room1"
          />
        </TestWrapper>
      );

      expect(
        container.querySelector(".group.relative.block")
      ).toBeInTheDocument();
    });
  });
});
