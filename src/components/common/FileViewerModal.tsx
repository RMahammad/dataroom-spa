import { useEffect, useState } from "react";
import { Modal } from "./Modal";
import { BlobRepo } from "../../core/repos/BlobRepo";
import type { FileObject } from "../../core/types";

interface FileViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  file: FileObject | null;
}

export const FileViewerModal = ({
  isOpen,
  onClose,
  file,
}: FileViewerModalProps) => {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadFile = async () => {
      if (isOpen && file) {
        setLoading(true);
        setError(null);

        try {
          const url = await BlobRepo.createBlobUrl(file.blobKey);
          if (isMounted) {
            if (url) {
              setBlobUrl(url);
            } else {
              setError("File not found");
            }
          }
        } catch (err) {
          if (isMounted) {
            setError("Failed to load file");
            console.error("Error loading file:", err);
          }
        } finally {
          if (isMounted) {
            setLoading(false);
          }
        }
      }
    };

    loadFile();

    return () => {
      isMounted = false;
    };
  }, [isOpen, file]);

  const handleClose = () => {
    if (blobUrl) {
      BlobRepo.revokeBlobUrl(blobUrl);
      setBlobUrl(null);
    }
    setError(null);
    setLoading(false);
    onClose();
  };

  if (!isOpen || !file) {
    return null;
  }

  return (
    <Modal
      maxWidth="max-w-full sm:max-w-5xl"
      isOpen={isOpen}
      onClose={handleClose}
      title={file.name}
    >
      <div className="w-full h-[60vh] sm:h-[70vh] md:h-[80vh]">
        {loading && (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-sm sm:text-base text-gray-600 mt-2">
              Loading file...
            </span>
          </div>
        )}

        {error && (
          <div className="flex items-center justify-center h-full px-4">
            <div className="text-center">
              <svg
                className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-red-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <h3 className="mt-2 text-sm sm:text-base font-medium text-gray-900">
                Error loading file
              </h3>
              <p className="mt-1 text-xs sm:text-sm text-gray-500">{error}</p>
            </div>
          </div>
        )}

        {blobUrl && !loading && !error && (
          <iframe
            src={`${blobUrl}#toolbar=1&navpanes=0&scrollbar=1&view=FitH`}
            className="w-full h-full border border-gray-300 rounded-lg"
            title={`PDF Viewer - ${file.name}`}
          />
        )}

        {/* Footer with file info */}
        <div className="mt-3 sm:mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs sm:text-sm text-gray-500 border-t pt-3 sm:pt-4">
          <div>
            <span className="font-medium">Size:</span>{" "}
            {formatFileSize(file.size)}
          </div>
          <div>
            <span className="font-medium">Last modified:</span>{" "}
            {new Date(file.updatedAt).toLocaleDateString()}
          </div>
        </div>
      </div>
    </Modal>
  );
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
};
