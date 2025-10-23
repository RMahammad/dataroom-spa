import { db } from "./db";
import type { Folder, ID } from "../types";
import { DatabaseError, NotFoundError } from "../errors";

export const FolderRepo = {
  async insert(folder: Folder): Promise<string> {
    try {
      await db.folders.add(folder);
      return folder.id;
    } catch (error) {
      throw new DatabaseError("Failed to insert folder", error as Error);
    }
  },

  async get(id: ID): Promise<Folder | undefined> {
    try {
      return await db.folders.get(id);
    } catch (error) {
      throw new DatabaseError("Failed to get folder", error as Error);
    }
  },

  async getRequired(id: ID): Promise<Folder> {
    const folder = await this.get(id);
    if (!folder) {
      throw new NotFoundError("Folder", id);
    }
    return folder;
  },

  async listByParent(
    parentId: ID | null,
    dataroomId: ID,
    sortBy: "name" | "createdAt" | "updatedAt" = "name",
    order: "asc" | "desc" = "asc"
  ): Promise<Folder[]> {
    try {
      // Query folders by dataroom and parent ID
      let folders: Folder[];
      if (parentId === null) {
        // Get root level folders (parentId is null)
        folders = await db.folders
          .where("dataroomId")
          .equals(dataroomId)
          .and((folder) => folder.parentId === null)
          .toArray();
      } else {
        // Get folders with specific parent ID
        folders = await db.folders.where({ dataroomId, parentId }).toArray();
      }

      // Sort the results
      return folders.sort((a, b) => {
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
        }
        return order === "desc" ? -comparison : comparison;
      });
    } catch (error) {
      throw new DatabaseError(
        "Failed to list folders by parent",
        error as Error
      );
    }
  },

  async listByDataroom(dataroomId: ID): Promise<Folder[]> {
    try {
      return await db.folders.where("dataroomId").equals(dataroomId).toArray();
    } catch (error) {
      throw new DatabaseError(
        "Failed to list folders by dataroom",
        error as Error
      );
    }
  },

  async updateName(id: ID, name: string): Promise<number> {
    try {
      return await db.folders.update(id, {
        name,
        updatedAt: Date.now(),
      });
    } catch (error) {
      throw new DatabaseError("Failed to update folder name", error as Error);
    }
  },

  async touch(id: ID): Promise<number> {
    try {
      return await db.folders.update(id, {
        updatedAt: Date.now(),
      });
    } catch (error) {
      throw new DatabaseError("Failed to touch folder", error as Error);
    }
  },

  async delete(id: ID): Promise<void> {
    try {
      await db.folders.delete(id);
    } catch (error) {
      throw new DatabaseError("Failed to delete folder", error as Error);
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
        (folder) => folder.name === name && folder.id !== excludeId
      );
    } catch (error) {
      throw new DatabaseError(
        "Failed to check folder name existence",
        error as Error
      );
    }
  },

  async countChildren(parentId: ID, dataroomId: ID): Promise<number> {
    try {
      return await db.folders.where({ dataroomId, parentId }).count();
    } catch (error) {
      throw new DatabaseError("Failed to count child folders", error as Error);
    }
  },

  async deleteByDataroom(dataroomId: ID): Promise<number> {
    try {
      return await db.folders.where("dataroomId").equals(dataroomId).delete();
    } catch (error) {
      throw new DatabaseError(
        "Failed to delete folders by dataroom",
        error as Error
      );
    }
  },
};
