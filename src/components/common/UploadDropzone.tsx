import { useCallback, useState, useRef } from "react";

interface UploadDropzoneProps {
  onUpload: (files: File[]) => void;
  isUploading: boolean;
  accept?: string;
  multiple?: boolean;
  maxFiles?: number;
}

export const UploadDropzone = ({
  onUpload,
  isUploading,
  accept = ".pdf",
  multiple = true,
  maxFiles = 10,
}: UploadDropzoneProps) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [dragCounter, setDragCounter] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragCounter((prev) => prev + 1);
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragOver(true);
    }
  }, []);

  const handleDragLeave = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragCounter((prev) => prev - 1);
      if (dragCounter === 1) {
        setIsDragOver(false);
      }
    },
    [dragCounter]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const validateAndProcessFiles = useCallback(
    (fileList: FileList) => {
      const files = Array.from(fileList);

      // Filter PDF files
      const pdfFiles = files.filter(
        (file) =>
          file.type === "application/pdf" ||
          file.name.toLowerCase().endsWith(".pdf")
      );

      if (pdfFiles.length === 0) {
        alert("Only PDF files are allowed.");
        return;
      }

      if (pdfFiles.length !== files.length) {
        alert(
          `${files.length - pdfFiles.length} non-PDF files were skipped. Only PDF files are allowed.`
        );
      }

      // Check file limit
      const filesToUpload = pdfFiles.slice(0, maxFiles);
      if (pdfFiles.length > maxFiles) {
        alert(`Only the first ${maxFiles} files will be uploaded.`);
      }

      if (filesToUpload.length > 0) {
        onUpload(filesToUpload);
      }
    },
    [onUpload, maxFiles]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);
      setDragCounter(0);

      if (isUploading) return;

      const { files } = e.dataTransfer;
      if (files && files.length > 0) {
        validateAndProcessFiles(files);
      }
    },
    [isUploading, validateAndProcessFiles]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (isUploading) return;

      const files = e.target.files;
      if (files && files.length > 0) {
        validateAndProcessFiles(files);
      }

      // Reset input value so same file can be selected again
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    [isUploading, validateAndProcessFiles]
  );

  const handleClick = useCallback(() => {
    if (!isUploading && fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, [isUploading]);

  return (
    <div
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={handleClick}
      className={`
        relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
        ${
          isDragOver
            ? "border-blue-400 bg-blue-50"
            : "border-gray-300 hover:border-gray-400 hover:bg-gray-50"
        }
        ${isUploading ? "opacity-50 cursor-not-allowed" : ""}
      `}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleFileSelect}
        className="hidden"
        disabled={isUploading}
      />

      {isUploading ? (
        <div className="flex flex-col items-center">
          <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mb-4"></div>
          <p className="text-sm font-medium text-gray-900 mb-1">
            Uploading files...
          </p>
          <p className="text-xs text-gray-500">
            Please wait while files are being uploaded.
          </p>
        </div>
      ) : isDragOver ? (
        <div className="flex flex-col items-center">
          <svg
            className="h-12 w-12 text-blue-500 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"
            />
          </svg>
          <p className="text-sm font-medium text-blue-900 mb-1">
            Drop files here
          </p>
          <p className="text-xs text-blue-700">
            Release to upload your PDF files
          </p>
        </div>
      ) : (
        <div className="flex flex-col items-center">
          <svg
            className="h-12 w-12 text-gray-400 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
          <p className="text-sm font-medium text-gray-900 mb-1">
            Upload PDF files
          </p>
          <p className="text-xs text-gray-500 mb-3">
            Drag and drop PDF files here, or click to browse
          </p>
          <p className="text-xs text-gray-400">
            Maximum {maxFiles} files, PDF format only
          </p>
        </div>
      )}
    </div>
  );
};
