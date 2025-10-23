import { RouterProvider } from "react-router-dom";
import { router } from "./routes";
import { UIProvider } from "./providers/UIProvider";
import { ErrorBoundary } from "../components/common/ErrorBoundary";

export const App = () => {
  return (
    <ErrorBoundary>
      <UIProvider>
        <RouterProvider router={router} />
      </UIProvider>
    </ErrorBoundary>
  );
};
