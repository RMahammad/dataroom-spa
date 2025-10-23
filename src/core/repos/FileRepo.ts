import { db } from "./db";
import type { FileObject, ID } from "../types";
import { DatabaseError, NotFoundError } from "../errors";

export const FileRepo = {
  async insert(file: FileObject): Promise<string> {
    try {
      await db.files.add(file);
      return file.id;
    } catch (error) {
      throw new DatabaseError("Failed to insert file", error as Error);
    }
  },

  async get(id: ID): Promise<FileObject | undefined> {
    try {
      return await db.files.get(id);
    } catch (error) {
      throw new DatabaseError("Failed to get file", error as Error);
    }
  },

  async getRequired(id: ID): Promise<FileObject> {
    const file = await this.get(id);
    if (!file) {
      throw new NotFoundError("File", id);
    }
    return file;
  },

  async listByParent(
    parentId: ID | null,
    dataroomId?: ID,
    sortBy: "name" | "createdAt" | "updatedAt" | "size" = "name",
    order: "asc" | "desc" = "asc"
  ): Promise<FileObject[]> {
    try {
      let files: FileObject[];

      if (dataroomId) {
        if (parentId !== null) {
          // Use compound index for non-null parentId
          files = await db.files.where({ dataroomId, parentId }).toArray();
        } else {
          // For null parentId, filter by dataroomId first then filter manually
          files = await db.files
            .where("dataroomId")
            .equals(dataroomId)
            .filter((file) => file.parentId === null)
            .toArray();
        }
      } else {
        if (parentId !== null) {
          files = await db.files.where("parentId").equals(parentId).toArray();
        } else {
          // For null parentId, we need to filter manually since Dexie doesn't handle null in equals()
          files = await db.files
            .filter((file) => file.parentId === null)
            .toArray();
        }
      }

      // Sort the results
      return files.sort((a, b) => {
        let comparison = 0;
        switch (sortBy) {
          case "name":
            comparison = a.name.localeCompare(b.name, undefined, {
              numeric: true,
            });
            break;
          case "createdAt":
            comparison = a.createdAt - b.createdAt;
            break;
          case "updatedAt":
            comparison = a.updatedAt - b.updatedAt;
            break;
          case "size":
            comparison = a.size - b.size;
            break;
        }
        return order === "desc" ? -comparison : comparison;
      });
    } catch (error) {
      throw new DatabaseError("Failed to list files by parent", error as Error);
    }
  },

  async listByDataroom(dataroomId: ID): Promise<FileObject[]> {
    try {
      return await db.files.where("dataroomId").equals(dataroomId).toArray();
    } catch (error) {
      throw new DatabaseError(
        "Failed to list files by dataroom",
        error as Error
      );
    }
  },

  async updateName(id: ID, name: string): Promise<number> {
    try {
      return await db.files.update(id, {
        name,
        updatedAt: Date.now(),
      });
    } catch (error) {
      throw new DatabaseError("Failed to update file name", error as Error);
    }
  },

  async touch(id: ID): Promise<number> {
    try {
      return await db.files.update(id, {
        updatedAt: Date.now(),
      });
    } catch (error) {
      throw new DatabaseError("Failed to touch file", error as Error);
    }
  },

  async delete(id: ID): Promise<void> {
    try {
      await db.files.delete(id);
    } catch (error) {
      throw new DatabaseError("Failed to delete file", error as Error);
    }
  },

  async nameExistsInParent(
    name: string,
    parentId: ID | null,
    dataroomId: ID,
    excludeId?: ID
  ): Promise<boolean> {
    try {
      const siblings = await this.listByParent(parentId, dataroomId);
      return siblings.some(
        (file) => file.name === name && file.id !== excludeId
      );
    } catch (error) {
      throw new DatabaseError(
        "Failed to check file name existence",
        error as Error
      );
    }
  },

  async countInFolder(parentId: ID | null, dataroomId: ID): Promise<number> {
    try {
      if (parentId !== null) {
        return await db.files.where({ dataroomId, parentId }).count();
      } else {
        // For null parentId, filter by dataroomId first then count manually
        return await db.files
          .where("dataroomId")
          .equals(dataroomId)
          .filter((file) => file.parentId === null)
          .count();
      }
    } catch (error) {
      throw new DatabaseError(
        "Failed to count files in folder",
        error as Error
      );
    }
  },

  async deleteByDataroom(dataroomId: ID): Promise<number> {
    try {
      return await db.files.where("dataroomId").equals(dataroomId).delete();
    } catch (error) {
      throw new DatabaseError(
        "Failed to delete files by dataroom",
        error as Error
      );
    }
  },

  async deleteByFolder(parentId: ID | null, dataroomId: ID): Promise<number> {
    try {
      if (parentId !== null) {
        return await db.files.where({ dataroomId, parentId }).delete();
      } else {
        // For null parentId, filter by dataroomId first then delete manually
        const filesToDelete = await db.files
          .where("dataroomId")
          .equals(dataroomId)
          .filter((file) => file.parentId === null)
          .toArray();

        const fileIds = filesToDelete.map((file) => file.id);
        await db.files.bulkDelete(fileIds);
        return filesToDelete.length;
      }
    } catch (error) {
      throw new DatabaseError(
        "Failed to delete files by folder",
        error as Error
      );
    }
  },

  async getTotalSizeInFolder(
    parentId: ID | null,
    dataroomId: ID
  ): Promise<number> {
    try {
      const files = await this.listByParent(parentId, dataroomId);
      return files.reduce((total, file) => total + file.size, 0);
    } catch (error) {
      throw new DatabaseError(
        "Failed to calculate folder size",
        error as Error
      );
    }
  },
};
