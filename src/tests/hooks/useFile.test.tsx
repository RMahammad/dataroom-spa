import React from "react";
import { describe, test, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useFile } from "../../hooks/useFile";
import toast from "react-hot-toast";
import type { FileObject } from "../../core/types";

// Test wrapper to provide React context
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <div>{children}</div>
);

// Mock FileService
vi.mock("../../core/services/FileService");

import { FileService } from "../../core/services/FileService";

const mockFileService = vi.mocked(FileService, true);

// Mock react-hot-toast
vi.mock("react-hot-toast");
const mockToast = vi.mocked(toast);

describe("useFile Hook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("should initialize with empty state", () => {
    const { result } = renderHook(() => useFile(), { wrapper: TestWrapper });

    expect(result.current.files).toEqual([]);
    expect(result.current.isLoading).toBe(false);
  });

  test("should expose all expected methods", () => {
    const { result } = renderHook(() => useFile(), { wrapper: TestWrapper });

    expect(typeof result.current.loadFiles).toBe("function");
    expect(typeof result.current.uploadFile).toBe("function");
    expect(typeof result.current.renameFile).toBe("function");
    expect(typeof result.current.deleteFile).toBe("function");
    expect(typeof result.current.isNameAvailable).toBe("function");
    expect(typeof result.current.getFile).toBe("function");
    expect(typeof result.current.downloadFile).toBe("function");
  });

  test("should load files successfully", async () => {
    const mockFiles: FileObject[] = [
      {
        id: "file-1",
        name: "test.txt",
        size: 100,
        mimeType: "text/plain",
        blobKey: "blob-1",
        parentId: null,
        dataroomId: "room-1",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    ];

    mockFileService.listInFolder.mockResolvedValue(mockFiles);

    const { result } = renderHook(() => useFile(), { wrapper: TestWrapper });

    await act(async () => {
      await result.current.loadFiles("room-1", null);
    });

    expect(result.current.files).toEqual(mockFiles);
    expect(result.current.isLoading).toBe(false);
    expect(mockFileService.listInFolder).toHaveBeenCalledWith(null, "room-1");
  });

  test("should handle loading errors", async () => {
    const error = new Error("Network error");
    mockFileService.listInFolder.mockRejectedValue(error);

    const { result } = renderHook(() => useFile(), { wrapper: TestWrapper });

    await act(async () => {
      await result.current.loadFiles("room-1", null);
    });

    expect(result.current.files).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(mockToast.error).toHaveBeenCalledWith(
      "Failed to load files: Network error"
    );
  });

  test("should upload file successfully", async () => {
    const file = new File(["content"], "test.txt", { type: "application/pdf" });
    const mockFileObject: FileObject = {
      id: "file-1",
      name: "test.txt",
      size: 100,
      mimeType: "application/pdf",
      blobKey: "blob-1",
      parentId: null,
      dataroomId: "room-1",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    mockFileService.upload.mockResolvedValue(mockFileObject);

    const { result } = renderHook(() => useFile(), { wrapper: TestWrapper });

    let uploadResult: boolean;
    await act(async () => {
      uploadResult = await result.current.uploadFile(file, "room-1", null);
    });

    expect(uploadResult!).toBe(true);
    expect(result.current.files).toEqual([mockFileObject]);
    expect(mockFileService.upload).toHaveBeenCalledWith(file, "room-1", null);
  });

  test("should find file by ID after loading", async () => {
    const mockFiles: FileObject[] = [
      {
        id: "file-1",
        name: "test.txt",
        size: 100,
        mimeType: "text/plain",
        blobKey: "blob-1",
        parentId: null,
        dataroomId: "room-1",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    ];

    mockFileService.listInFolder.mockResolvedValue(mockFiles);

    const { result } = renderHook(() => useFile(), { wrapper: TestWrapper });

    // Load files first
    await act(async () => {
      await result.current.loadFiles("room-1", null);
    });

    // Now test getFile
    const foundFile = result.current.getFile("file-1");
    expect(foundFile).toEqual(mockFiles[0]);

    const notFoundFile = result.current.getFile("non-existent");
    expect(notFoundFile).toBeUndefined();
  });
});
