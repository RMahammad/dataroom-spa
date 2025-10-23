import { db, type DBBlob } from "./db";
import type { ID } from "../types";
import { BlobError, NotFoundError } from "../errors";

export const BlobRepo = {
  async put(key: ID, data: Blob): Promise<string> {
    try {
      const blob: DBBlob = { key, data };
      await db.blobs.put(blob);
      return key;
    } catch (error) {
      throw new BlobError("Failed to store blob", error as Error);
    }
  },

  async get(key: ID): Promise<Blob | undefined> {
    try {
      const record = await db.blobs.get(key);
      return record?.data;
    } catch (error) {
      throw new BlobError("Failed to retrieve blob", error as Error);
    }
  },

  async getRequired(key: ID): Promise<Blob> {
    const blob = await this.get(key);
    if (!blob) {
      throw new NotFoundError("Blob", key);
    }
    return blob;
  },

  async exists(key: ID): Promise<boolean> {
    try {
      const record = await db.blobs.get(key);
      return record !== undefined;
    } catch (error) {
      throw new BlobError("Failed to check blob existence", error as Error);
    }
  },

  async delete(key: ID): Promise<void> {
    try {
      await db.blobs.delete(key);
    } catch (error) {
      throw new BlobError("Failed to delete blob", error as Error);
    }
  },

  async deleteMany(keys: ID[]): Promise<number> {
    try {
      let deletedCount = 0;
      await db.transaction("rw", db.blobs, async () => {
        for (const key of keys) {
          const existed = await this.exists(key);
          if (existed) {
            await db.blobs.delete(key);
            deletedCount++;
          }
        }
      });
      return deletedCount;
    } catch (error) {
      throw new BlobError("Failed to delete multiple blobs", error as Error);
    }
  },

  async count(): Promise<number> {
    try {
      return await db.blobs.count();
    } catch (error) {
      throw new BlobError("Failed to count blobs", error as Error);
    }
  },

  async clear(): Promise<void> {
    try {
      await db.blobs.clear();
    } catch (error) {
      throw new BlobError("Failed to clear blobs", error as Error);
    }
  },

  async createBlobUrl(key: ID): Promise<string | null> {
    try {
      const blob = await this.get(key);
      if (!blob) {
        return null;
      }
      return URL.createObjectURL(blob);
    } catch (error) {
      throw new BlobError("Failed to create blob URL", error as Error);
    }
  },

  revokeBlobUrl(url: string): void {
    try {
      URL.revokeObjectURL(url);
    } catch (error) {
      // Ignore errors when revoking URLs
      console.warn("Failed to revoke blob URL:", error);
    }
  },
};
