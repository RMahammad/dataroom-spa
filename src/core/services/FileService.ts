

import { FileRepo } from "../repos/FileRepo";
import { BlobRepo } from "../repos/BlobRepo";
import { FolderRepo } from "../repos/FolderRepo";
import { DataroomRepo } from "../repos/DataroomRepo";
import { generateId } from "../utils/ids";
import {
  validateName,
  normalizeName,
  generateUniqueName,
} from "../utils/names";
import type { FileObject, ID, NameCollisionAction } from "../types";
import { FileValidationError, AlreadyExistsError } from "../errors";

export const FileService = {
  async upload(
    file: File,
    dataroomId: ID,
    parentId: ID | null,
    onNameCollision: NameCollisionAction = "keep-both"
  ): Promise<FileObject> {
    // Validate file type
    if (file.type !== "application/pdf") {
      throw new FileValidationError("Only PDF files are allowed");
    }

    // Validate file size (e.g., max 50MB)
    const maxSizeBytes = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSizeBytes) {
      throw new FileValidationError("File size exceeds maximum limit of 50MB");
    }

    const normalizedName = normalizeName(file.name);
    validateName(normalizedName, "file");

    // Verify dataroom and parent folder exist
    await DataroomRepo.getRequired(dataroomId);
    if (parentId) {
      await FolderRepo.getRequired(parentId);
    }

    // Check for name collision
    const nameExists = await FileRepo.nameExistsInParent(
      normalizedName,
      parentId,
      dataroomId
    );

    let finalName = normalizedName;
    if (nameExists) {
      switch (onNameCollision) {
        case "cancel":
          throw new AlreadyExistsError("File", normalizedName);
        case "replace": {
          // Find and delete existing file
          const existingFiles = await FileRepo.listByParent(
            parentId,
            dataroomId
          );
          const existingFile = existingFiles.find(
            (f) => f.name === normalizedName
          );
          if (existingFile) {
            await this.delete(existingFile.id);
          }
          break;
        }
        case "keep-both": {
          // Generate unique name with suffix
          const siblings = await FileRepo.listByParent(parentId, dataroomId);
          const existingNames = new Set(siblings.map((f) => f.name));
          finalName = generateUniqueName(normalizedName, existingNames);
          break;
        }
      }
    }

    // Store the blob
    const blobKey = generateId();
    await BlobRepo.put(blobKey, file);

    // Create file record
    const now = Date.now();
    const fileObject: FileObject = {
      id: generateId(),
      dataroomId,
      parentId,
      name: finalName,
      mimeType: file.type,
      size: file.size,
      blobKey,
      createdAt: now,
      updatedAt: now,
    };

    await FileRepo.insert(fileObject);

    // Touch parent dataroom to update its modified time
    await DataroomRepo.touch(dataroomId);

    return fileObject;
  },

  async get(id: ID): Promise<FileObject> {
    return await FileRepo.getRequired(id);
  },


  async listInFolder(
    parentId: ID | null,
    dataroomId: ID,
    sortBy: "name" | "createdAt" | "updatedAt" | "size" = "name",
    order: "asc" | "desc" = "asc"
  ): Promise<FileObject[]> {
    return await FileRepo.listByParent(parentId, dataroomId, sortBy, order);
  },


  async rename(
    id: ID,
    name: string,
    onNameCollision: NameCollisionAction = "keep-both"
  ): Promise<FileObject> {
    const normalizedName = normalizeName(name);
    validateName(normalizedName, "file");

    const file = await FileRepo.getRequired(id);

    // Check for name collision (excluding current file)
    const nameExists = await FileRepo.nameExistsInParent(
      normalizedName,
      file.parentId,
      file.dataroomId,
      id
    );

    let finalName = normalizedName;
    if (nameExists) {
      switch (onNameCollision) {
        case "cancel":
          throw new AlreadyExistsError("File", normalizedName);
        case "replace": {
          // Find and delete existing file
          const existingFiles = await FileRepo.listByParent(
            file.parentId,
            file.dataroomId
          );
          const existingFile = existingFiles.find(
            (f) => f.name === normalizedName && f.id !== id
          );
          if (existingFile) {
            await this.delete(existingFile.id);
          }
          break;
        }
        case "keep-both": {
          // Generate unique name with suffix
          const siblings = await FileRepo.listByParent(
            file.parentId,
            file.dataroomId
          );
          const existingNames = new Set(
            siblings.filter((f) => f.id !== id).map((f) => f.name)
          );
          finalName = generateUniqueName(normalizedName, existingNames);
          break;
        }
      }
    }

    await FileRepo.updateName(id, finalName);

    // Touch parent dataroom
    await DataroomRepo.touch(file.dataroomId);

    return await this.get(id);
  },


  async delete(id: ID): Promise<void> {
    const file = await FileRepo.getRequired(id);

    // Delete the blob first
    await BlobRepo.delete(file.blobKey);

    // Delete the file record
    await FileRepo.delete(id);

    // Touch parent dataroom
    await DataroomRepo.touch(file.dataroomId);
  },


  async getBlobUrl(id: ID): Promise<string | null> {
    const file = await FileRepo.get(id);
    if (!file) {
      return null;
    }

    return await BlobRepo.createBlobUrl(file.blobKey);
  },


  revokeBlobUrl(url: string): void {
    BlobRepo.revokeBlobUrl(url);
  },


  async downloadBlob(id: ID): Promise<{ blob: Blob; filename: string } | null> {
    const file = await FileRepo.get(id);
    if (!file) {
      return null;
    }

    const blob = await BlobRepo.get(file.blobKey);
    if (!blob) {
      return null;
    }

    return {
      blob,
      filename: file.name,
    };
  },


  async move(id: ID, newParentId: ID): Promise<FileObject> {
    const file = await FileRepo.getRequired(id);

    // Verify new parent exists
    await FolderRepo.getRequired(newParentId);

    // Check for name collision in new location
    const nameExists = await FileRepo.nameExistsInParent(
      file.name,
      newParentId,
      file.dataroomId,
      id
    );

    if (nameExists) {
      throw new AlreadyExistsError("File", file.name);
    }

    // Update the file's parent
    await FileRepo.updateName(id, file.name); // This will update the timestamp

    // Touch parent dataroom
    await DataroomRepo.touch(file.dataroomId);

    return await this.get(id);
  },


  async isNameAvailable(
    name: string,
    parentId: ID,
    dataroomId: ID,
    excludeId?: ID
  ): Promise<boolean> {
    try {
      const normalizedName = normalizeName(name);
      validateName(normalizedName, "file");
      return !(await FileRepo.nameExistsInParent(
        normalizedName,
        parentId,
        dataroomId,
        excludeId
      ));
    } catch {
      return false; // Invalid names are not available
    }
  },
};
