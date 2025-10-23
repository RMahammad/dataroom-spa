import { normalizeName, generateUniqueName, validateName } from "./names";
import type { NameCollisionAction, DataroomEntry } from "../types";
import { AlreadyExistsError, InvalidOperationError } from "../errors";

export interface NameCollisionContext<T extends DataroomEntry = DataroomEntry> {
  /** The type of entity being created/renamed */
  entityType: "file" | "folder" | "dataroom";
  /** The desired name (will be normalized) */
  name: string;
  /** The collision action to take */
  action: NameCollisionAction;
  /** Existing siblings to check against */
  existingSiblings: T[];
  /** ID to exclude from collision check (for renames) */
  excludeId?: string;
  /** Whether replace action is supported for this entity type */
  supportsReplace?: boolean;
}

export interface NameCollisionResult<T extends DataroomEntry = DataroomEntry> {
  /** The final name to use (may be modified to avoid collision) */
  finalName: string;
  /** Whether an existing item should be replaced */
  shouldReplace: boolean;
  /** The existing item that should be replaced (if any) */
  existingItem?: T;
}

export async function resolveNameCollision<
  T extends DataroomEntry = DataroomEntry,
>(context: NameCollisionContext<T>): Promise<NameCollisionResult<T>> {
  const {
    entityType,
    name,
    action,
    existingSiblings,
    excludeId,
    supportsReplace = false,
  } = context;

  // Validate the name first
  if (entityType !== "dataroom") {
    validateName(name, entityType);
  }

  const normalizedName = normalizeName(name);

  // Find existing item with the same name (excluding the item being updated)
  const existingItem = existingSiblings.find(
    (item) => item.name === normalizedName && item.id !== excludeId
  );

  // No collision - use the name as-is
  if (!existingItem) {
    return {
      finalName: normalizedName,
      shouldReplace: false,
    };
  }

  // Handle collision based on action
  switch (action) {
    case "cancel":
      throw new AlreadyExistsError(
        entityType.charAt(0).toUpperCase() + entityType.slice(1),
        normalizedName
      );

    case "replace":
      if (!supportsReplace) {
        throw new InvalidOperationError(
          `${action} ${entityType}`,
          `Replace not supported for ${entityType}s`
        );
      }
      return {
        finalName: normalizedName,
        shouldReplace: true,
        existingItem,
      };

    case "keep-both": {
      // Generate unique name with suffix
      const existingNames = new Set(
        existingSiblings
          .filter((item) => item.id !== excludeId)
          .map((item) => item.name)
      );
      const uniqueName = generateUniqueName(normalizedName, existingNames);
      return {
        finalName: uniqueName,
        shouldReplace: false,
      };
    }

    default: {
      // TypeScript exhaustiveness check
      const exhaustiveCheck: never = action;
      throw new Error(`Unhandled collision action: ${exhaustiveCheck}`);
    }
  }
}

export function isNameAvailable<T extends { id: string; name: string }>(
  name: string,
  existingSiblings: T[],
  excludeId?: string
): boolean {
  const normalizedName = normalizeName(name);
  return !existingSiblings.some(
    (item) => item.name === normalizedName && item.id !== excludeId
  );
}

export function resolveDataroomNameCollision(
  name: string,
  action: NameCollisionAction,
  existingDatarooms: Array<{ id: string; name: string }>,
  excludeId?: string
) {
  return resolveNameCollision({
    entityType: "dataroom",
    name,
    action,
    existingSiblings: existingDatarooms as DataroomEntry[],
    excludeId,
    supportsReplace: false,
  });
}

export function resolveFolderNameCollision<
  T extends DataroomEntry = DataroomEntry,
>(
  name: string,
  action: NameCollisionAction,
  existingFolders: T[],
  excludeId?: string
) {
  return resolveNameCollision({
    entityType: "folder",
    name,
    action,
    existingSiblings: existingFolders,
    excludeId,
    supportsReplace: false,
  });
}

export function resolveFileNameCollision<
  T extends DataroomEntry = DataroomEntry,
>(
  name: string,
  action: NameCollisionAction,
  existingFiles: T[],
  excludeId?: string
) {
  return resolveNameCollision({
    entityType: "file",
    name,
    action,
    existingSiblings: existingFiles,
    excludeId,
    supportsReplace: true,
  });
}
