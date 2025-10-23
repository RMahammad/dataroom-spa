import Dexie, { type Table } from "dexie";
import type { Dataroom, Folder, FileObject } from "../types";

export interface DBBlob {
  key: string;
  data: Blob;
}

class AppDB extends Dexie {
  datarooms!: Table<Dataroom, string>;
  folders!: Table<Folder, string>;
  files!: Table<FileObject, string>;
  blobs!: Table<DBBlob, string>;

  constructor() {
    super("dataroom-db");

    this.version(1).stores({
      // Dataroom table - indexed by id, name for searching, createdAt and updatedAt for sorting
      datarooms: "id, name, createdAt, updatedAt",

      // Folders table - compound indexes for efficient parent/child queries
      folders:
        "id, dataroomId, parentId, name, createdAt, updatedAt, [dataroomId+parentId]",

      // Files table - indexed for efficient folder queries and file type filtering
      files:
        "id, dataroomId, parentId, name, createdAt, updatedAt, mimeType, [dataroomId+parentId]",

      // Blobs table - simple key-value store for binary data
      blobs: "key",
    });
  }
}

export const db = new AppDB();

export async function initializeDatabase(): Promise<void> {
  try {
    await db.open();
    console.log("Database initialized successfully");
  } catch (error) {
    console.error("Failed to initialize database:", error);
    throw error;
  }
}

export async function closeDatabase(): Promise<void> {
  try {
    await db.close();
    console.log("Database closed successfully");
  } catch (error) {
    console.error("Failed to close database:", error);
    throw error;
  }
}

export async function clearDatabase(): Promise<void> {
  try {
    await db.transaction(
      "rw",
      [db.datarooms, db.folders, db.files, db.blobs],
      async () => {
        await db.datarooms.clear();
        await db.folders.clear();
        await db.files.clear();
        await db.blobs.clear();
      }
    );
    console.log("Database cleared successfully");
  } catch (error) {
    console.error("Failed to clear database:", error);
    throw error;
  }
}
