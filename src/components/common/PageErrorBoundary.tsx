import type { ReactNode } from "react";
import { ErrorBoundary } from "./ErrorBoundary";

interface Props {
  children: ReactNode;
  pageName: string;
}

export const PageErrorBoundary = ({ children, pageName }: Props) => {
  const handleError = (error: Error) => {
    console.error(`Page error in ${pageName}:`, error);
  };

  const fallbackUI = (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="sm:mx-auto sm:w-full sm:max-w-md">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
              <svg
                className="h-6 w-6 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <div className="mt-3 text-center">
              <h3 className="text-lg font-medium text-gray-900">Page Error</h3>
              <div className="mt-2">
                <p className="text-sm text-gray-500">
                  There was an error loading the {pageName} page. This might be
                  a temporary issue.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Reload Page
            </button>

            <button
              type="button"
              onClick={() => (window.location.href = "/")}
              className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Go to Home Page
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <ErrorBoundary fallback={fallbackUI} onError={handleError}>
      {children}
    </ErrorBoundary>
  );
};
