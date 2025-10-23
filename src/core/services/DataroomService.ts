import { DataroomRepo } from "../repos/DataroomRepo";
import { FolderRepo } from "../repos/FolderRepo";
import { FileRepo } from "../repos/FileRepo";
import { BlobRepo } from "../repos/BlobRepo";
import { generateId } from "../utils/ids";
import { validateName } from "../utils/names";
import {
  resolveDataroomNameCollision,
  isNameAvailable,
} from "../utils/nameCollision";
import type { Dataroom, ID } from "../types";

export const DataroomService = {
  async create(name: string): Promise<Dataroom> {
    validateName(name, "folder");

    // Get existing datarooms to check for collision
    const existingDatarooms = await DataroomRepo.list();

    // Resolve name collision
    const { finalName } = await resolveDataroomNameCollision(
      name,
      "cancel", // Always fail on collision for create
      existingDatarooms
    );

    const now = Date.now();
    const dataroom: Dataroom = {
      id: generateId(),
      name: finalName,
      createdAt: now,
      updatedAt: now,
    };

    await DataroomRepo.insert(dataroom);
    return dataroom;
  },

  async get(id: ID): Promise<Dataroom> {
    return await DataroomRepo.getRequired(id);
  },

  async list(
    sortBy: "name" | "createdAt" | "updatedAt" = "updatedAt",
    order: "asc" | "desc" = "desc"
  ): Promise<Dataroom[]> {
    return await DataroomRepo.list(sortBy, order);
  },

  async rename(id: ID, name: string): Promise<Dataroom> {
    validateName(name, "folder");

    // Get existing datarooms to check for collision
    const existingDatarooms = await DataroomRepo.list();

    // Resolve name collision
    const { finalName } = await resolveDataroomNameCollision(
      name,
      "cancel", // Always fail on collision for rename
      existingDatarooms,
      id
    );

    await DataroomRepo.updateName(id, finalName);
    return await this.get(id);
  },

  async delete(
    id: ID
  ): Promise<{ folders: number; files: number; blobs: number }> {
    // Get all files in the dataroom to delete their blobs
    const files = await FileRepo.listByDataroom(id);

    let deletedBlobs = 0;

    // Delete all file blobs first
    if (files.length > 0) {
      const blobKeys = files.map((file) => file.blobKey);
      deletedBlobs = await BlobRepo.deleteMany(blobKeys);
    }

    // Delete all files and folders in the dataroom
    const [deletedFiles, deletedFolders] = await Promise.all([
      FileRepo.deleteByDataroom(id),
      FolderRepo.deleteByDataroom(id),
    ]);

    // Finally delete the dataroom itself
    await DataroomRepo.delete(id);

    return {
      folders: deletedFolders,
      files: deletedFiles,
      blobs: deletedBlobs,
    };
  },

  async getStats(id: ID): Promise<{
    folderCount: number;
    fileCount: number;
    totalSize: number;
  }> {
    const [folders, files] = await Promise.all([
      FolderRepo.listByDataroom(id),
      FileRepo.listByDataroom(id),
    ]);

    const totalSize = files.reduce((sum, file) => sum + file.size, 0);

    return {
      folderCount: folders.length,
      fileCount: files.length,
      totalSize,
    };
  },

  async getDeletionImpact(id: ID): Promise<{ folders: number; files: number }> {
    const [folders, files] = await Promise.all([
      FolderRepo.listByDataroom(id),
      FileRepo.listByDataroom(id),
    ]);

    return {
      folders: folders.length,
      files: files.length,
    };
  },

  async isNameAvailable(name: string, excludeId?: ID): Promise<boolean> {
    try {
      validateName(name, "folder");
      const existingDatarooms = await DataroomRepo.list();
      return isNameAvailable(name, existingDatarooms, excludeId);
    } catch {
      return false; // Invalid names are not available
    }
  },

  async touch(id: ID): Promise<void> {
    await DataroomRepo.touch(id);
  },
};
