import { db } from "./db";
import type { Dataroom, ID } from "../types";
import { DatabaseError, NotFoundError } from "../errors";

export const DataroomRepo = {
  async insert(dataroom: Dataroom): Promise<string> {
    try {
      await db.datarooms.add(dataroom);
      return dataroom.id;
    } catch (error) {
      throw new DatabaseError("Failed to insert dataroom", error as Error);
    }
  },

  async get(id: ID): Promise<Dataroom | undefined> {
    try {
      return await db.datarooms.get(id);
    } catch (error) {
      throw new DatabaseError("Failed to get dataroom", error as Error);
    }
  },

  async getRequired(id: ID): Promise<Dataroom> {
    const dataroom = await this.get(id);
    if (!dataroom) {
      throw new NotFoundError("Dataroom", id);
    }
    return dataroom;
  },

  async list(
    sortBy: "name" | "createdAt" | "updatedAt" = "updatedAt",
    order: "asc" | "desc" = "desc"
  ): Promise<Dataroom[]> {
    try {
      let query = db.datarooms.orderBy(sortBy);
      if (order === "desc") {
        query = query.reverse();
      }
      return await query.toArray();
    } catch (error) {
      throw new DatabaseError("Failed to list datarooms", error as Error);
    }
  },

  async updateName(id: ID, name: string): Promise<number> {
    try {
      return await db.datarooms.update(id, {
        name,
        updatedAt: Date.now(),
      });
    } catch (error) {
      throw new DatabaseError("Failed to update dataroom name", error as Error);
    }
  },

  async touch(id: ID): Promise<number> {
    try {
      return await db.datarooms.update(id, {
        updatedAt: Date.now(),
      });
    } catch (error) {
      throw new DatabaseError("Failed to touch dataroom", error as Error);
    }
  },

  async delete(id: ID): Promise<void> {
    try {
      await db.datarooms.delete(id);
    } catch (error) {
      throw new DatabaseError("Failed to delete dataroom", error as Error);
    }
  },

  async nameExists(name: string, excludeId?: ID): Promise<boolean> {
    try {
      const existing = await db.datarooms.where("name").equals(name).toArray();
      return existing.some((dataroom) => dataroom.id !== excludeId);
    } catch (error) {
      throw new DatabaseError(
        "Failed to check dataroom name existence",
        error as Error
      );
    }
  },

  async count(): Promise<number> {
    try {
      return await db.datarooms.count();
    } catch (error) {
      throw new DatabaseError("Failed to count datarooms", error as Error);
    }
  },
};
