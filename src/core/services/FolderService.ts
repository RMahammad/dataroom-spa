import { FolderRepo } from "../repos/FolderRepo";
import { FileRepo } from "../repos/FileRepo";
import { DataroomRepo } from "../repos/DataroomRepo";
import { generateId } from "../utils/ids";
import {
  validateName,
  normalizeName,
  generateUniqueName,
} from "../utils/names";
import { getDescendantFolderIds, countDescendants } from "../utils/tree";
import type { Folder, ID, NameCollisionAction } from "../types";
import { AlreadyExistsError, InvalidOperationError } from "../errors";
import { FileService } from "./FileService";

export const FolderService = {
  async create(
    name: string,
    dataroomId: ID,
    parentId: ID | null = null,
    onNameCollision: NameCollisionAction = "keep-both"
  ): Promise<Folder> {
    const normalizedName = normalizeName(name);
    validateName(normalizedName, "folder");

    // Verify dataroom exists
    await DataroomRepo.getRequired(dataroomId);

    // Verify parent folder exists if specified
    if (parentId) {
      await FolderRepo.getRequired(parentId);
    }

    // Check for name collision
    const nameExists = await FolderRepo.nameExistsInParent(
      normalizedName,
      parentId,
      dataroomId
    );

    let finalName = normalizedName;
    if (nameExists) {
      switch (onNameCollision) {
        case "cancel":
          throw new AlreadyExistsError("Folder", normalizedName);
        case "replace":
          throw new InvalidOperationError(
            "create folder",
            "Replace not supported for folders"
          );
        case "keep-both": {
          // Generate unique name with suffix
          const siblings = await FolderRepo.listByParent(parentId, dataroomId);
          const existingNames = new Set(siblings.map((f) => f.name));
          finalName = generateUniqueName(normalizedName, existingNames);
          break;
        }
      }
    }

    const now = Date.now();
    const folder: Folder = {
      id: generateId(),
      dataroomId,
      parentId,
      name: finalName,
      createdAt: now,
      updatedAt: now,
    };

    await FolderRepo.insert(folder);

    // Touch parent dataroom to update its modified time
    await DataroomRepo.touch(dataroomId);

    return folder;
  },

  async get(id: ID): Promise<Folder> {
    return await FolderRepo.getRequired(id);
  },

  async listChildren(
    parentId: ID | null,
    dataroomId: ID,
    sortBy: "name" | "createdAt" | "updatedAt" = "name",
    order: "asc" | "desc" = "asc"
  ): Promise<Folder[]> {
    return await FolderRepo.listByParent(parentId, dataroomId, sortBy, order);
  },

  async rename(
    id: ID,
    name: string,
    onNameCollision: NameCollisionAction = "keep-both"
  ): Promise<Folder> {
    const normalizedName = normalizeName(name);
    validateName(normalizedName, "folder");

    const folder = await FolderRepo.getRequired(id);

    // Check for name collision (excluding current folder)
    const nameExists = await FolderRepo.nameExistsInParent(
      normalizedName,
      folder.parentId,
      folder.dataroomId,
      id
    );

    let finalName = normalizedName;
    if (nameExists) {
      switch (onNameCollision) {
        case "cancel":
          throw new AlreadyExistsError("Folder", normalizedName);
        case "replace":
          throw new InvalidOperationError(
            "rename folder",
            "Replace not supported for folders"
          );
        case "keep-both": {
          // Generate unique name with suffix
          const siblings = await FolderRepo.listByParent(
            folder.parentId,
            folder.dataroomId
          );
          const existingNames = new Set(
            siblings.filter((f) => f.id !== id).map((f) => f.name)
          );
          finalName = generateUniqueName(normalizedName, existingNames);
          break;
        }
      }
    }

    await FolderRepo.updateName(id, finalName);

    // Touch parent dataroom
    await DataroomRepo.touch(folder.dataroomId);

    return await this.get(id);
  },

  async delete(id: ID): Promise<{ folders: number; files: number }> {
    const folder = await FolderRepo.getRequired(id);

    // Get all descendant folders and files that will be deleted
    const allFolders = await FolderRepo.listByDataroom(folder.dataroomId);
    const allFiles = await FileRepo.listByDataroom(folder.dataroomId);

    const descendantFolderIds = getDescendantFolderIds(id, allFolders);
    const allAffectedFolderIds = [id, ...descendantFolderIds];

    // Delete files in all affected folders
    let deletedFiles = 0;
    for (const folderId of allAffectedFolderIds) {
      const folderFiles = allFiles.filter((f) => f.parentId === folderId);
      for (const file of folderFiles) {
        await FileService.delete(file.id);
        deletedFiles++;
      }
    }

    // Delete all descendant folders (bottom-up)
    const sortedFolderIds = [...descendantFolderIds].reverse(); // Start with deepest
    let deletedFolders = 0;

    for (const folderId of sortedFolderIds) {
      await FolderRepo.delete(folderId);
      deletedFolders++;
    }

    // Finally delete the target folder itself
    await FolderRepo.delete(id);
    deletedFolders++;

    // Touch parent dataroom
    await DataroomRepo.touch(folder.dataroomId);

    return {
      folders: deletedFolders,
      files: deletedFiles,
    };
  },

  async getDeletionImpact(id: ID): Promise<{ folders: number; files: number }> {
    const folder = await FolderRepo.getRequired(id);
    const allFolders = await FolderRepo.listByDataroom(folder.dataroomId);
    const allFiles = await FileRepo.listByDataroom(folder.dataroomId);

    const counts = countDescendants(id, allFolders, allFiles);

    return {
      folders: counts.folders + 1, // +1 for the folder itself
      files: counts.files,
    };
  },

  async move(id: ID, newParentId: ID | null): Promise<Folder> {
    const folder = await FolderRepo.getRequired(id);

    // Verify new parent exists if specified
    if (newParentId) {
      await FolderRepo.getRequired(newParentId);

      // Check for circular reference (moving folder into its own descendant)
      const allFolders = await FolderRepo.listByDataroom(folder.dataroomId);
      const descendantIds = getDescendantFolderIds(id, allFolders);
      if (descendantIds.includes(newParentId)) {
        throw new InvalidOperationError(
          "move folder",
          "Cannot move folder into its own descendant"
        );
      }
    }

    // Check for name collision in new location
    const nameExists = await FolderRepo.nameExistsInParent(
      folder.name,
      newParentId,
      folder.dataroomId,
      id
    );

    if (nameExists) {
      throw new AlreadyExistsError("Folder", folder.name);
    }

    // Update the folder's parent
    await FolderRepo.updateName(id, folder.name); // This will update the timestamp

    // Touch parent dataroom
    await DataroomRepo.touch(folder.dataroomId);

    return await this.get(id);
  },

  async isNameAvailable(
    name: string,
    parentId: ID | null,
    dataroomId: ID,
    excludeId?: ID
  ): Promise<boolean> {
    try {
      const normalizedName = normalizeName(name);
      validateName(normalizedName, "folder");
      return !(await FolderRepo.nameExistsInParent(
        normalizedName,
        parentId,
        dataroomId,
        excludeId
      ));
    } catch {
      return false; // Invalid names are not available
    }
  },

  async calculateTotalSize(id: ID): Promise<number> {
    const folder = await FolderRepo.getRequired(id);

    // Get all folders and files in the dataroom
    const allFolders = await FolderRepo.listByDataroom(folder.dataroomId);
    const allFiles = await FileRepo.listByDataroom(folder.dataroomId);

    // Get all descendant folder IDs including the current folder
    const descendantFolderIds = getDescendantFolderIds(id, allFolders);
    const allAffectedFolderIds = [id, ...descendantFolderIds];

    // Calculate total size of all files in this folder and all subfolders
    let totalSize = 0;
    for (const folderId of allAffectedFolderIds) {
      const folderFiles = allFiles.filter((f) => f.parentId === folderId);
      totalSize += folderFiles.reduce((sum, file) => sum + file.size, 0);
    }

    return totalSize;
  },
};
