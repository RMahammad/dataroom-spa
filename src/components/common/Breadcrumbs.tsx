import { Link } from "react-router-dom";
import type { Folder, ID } from "../../core/types";

interface BreadcrumbItem {
  id: ID;
  name: string;
  path: string;
}

interface BreadcrumbsProps {
  dataroomName: string;
  dataroomId: ID;
  folders: Folder[];
  currentFolderId?: ID;
}

export const Breadcrumbs = ({
  dataroomName,
  dataroomId,
  folders,
  currentFolderId,
}: BreadcrumbsProps) => {
  // Build breadcrumb path from current folder up to root
  const buildBreadcrumbs = (): BreadcrumbItem[] => {
    const items: BreadcrumbItem[] = [
      {
        id: dataroomId,
        name: dataroomName,
        path: `/datarooms/${dataroomId}`,
      },
    ];

    if (!currentFolderId) {
      return items;
    }

    // Find path from current folder to root
    const path: Folder[] = [];
    let current = folders.find((f) => f.id === currentFolderId);

    while (current) {
      path.unshift(current);
      current = current.parentId
        ? folders.find((f) => f.id === current!.parentId)
        : undefined;
    }

    // Add folders to breadcrumb
    path.forEach((folder) => {
      items.push({
        id: folder.id,
        name: folder.name,
        path: `/datarooms/${dataroomId}/folders/${folder.id}`,
      });
    });

    return items;
  };

  const breadcrumbs = buildBreadcrumbs();

  return (
    <nav className="flex items-center space-x-0.5 sm:space-x-1 text-xs sm:text-sm text-gray-600 min-w-0">
      {breadcrumbs.map((item, index) => (
        <div
          key={item.id}
          className="flex items-center space-x-0.5 sm:space-x-1 min-w-0 shrink"
        >
          {index > 0 && (
            <svg
              className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400 shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                clipRule="evenodd"
              />
            </svg>
          )}

          {index === breadcrumbs.length - 1 ? (
            // Current page - not a link
            <span className="font-medium text-gray-900 max-w-[120px] sm:max-w-[200px] truncate">
              {item.name}
            </span>
          ) : (
            // Clickable breadcrumb
            <Link
              to={item.path}
              className="hover:text-blue-600 transition-colors max-w-20 sm:max-w-[150px] md:max-w-[200px] truncate shrink"
              title={item.name}
            >
              {item.name}
            </Link>
          )}
        </div>
      ))}
    </nav>
  );
};
