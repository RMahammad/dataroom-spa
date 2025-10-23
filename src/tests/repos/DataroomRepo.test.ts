import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { DataroomRepo } from "../../core/repos/DataroomRepo";
import { db, clearDatabase } from "../../core/repos/db";
import type { Dataroom } from "../../core/types";
import { DatabaseError, NotFoundError } from "../../core/errors";

describe("DataroomRepo", () => {
  const mockDataroom: Dataroom = {
    id: "dataroom-1",
    name: "Test Dataroom",
    createdAt: 1000000,
    updatedAt: 1000000,
  };

  const mockDataroom2: Dataroom = {
    id: "dataroom-2",
    name: "Another Dataroom",
    createdAt: 2000000,
    updatedAt: 2000000,
  };

  beforeEach(async () => {
    // Clear the database before each test
    await clearDatabase();
  });

  afterEach(async () => {
    // Clean up after each test
    await clearDatabase();
  });

  describe("insert", () => {
    it("should insert a new dataroom successfully", async () => {
      const result = await DataroomRepo.insert(mockDataroom);

      expect(result).toBe("dataroom-1");

      // Verify the dataroom was actually inserted
      const retrieved = await db.datarooms.get("dataroom-1");
      expect(retrieved).toEqual(mockDataroom);
    });

    it("should throw DatabaseError if insertion fails", async () => {
      // Insert the same dataroom twice to cause a duplicate key error
      await DataroomRepo.insert(mockDataroom);

      await expect(DataroomRepo.insert(mockDataroom)).rejects.toThrow(
        DatabaseError
      );
    });
  });

  describe("get", () => {
    it("should return dataroom when it exists", async () => {
      await db.datarooms.add(mockDataroom);

      const result = await DataroomRepo.get("dataroom-1");

      expect(result).toEqual(mockDataroom);
    });

    it("should return undefined when dataroom does not exist", async () => {
      const result = await DataroomRepo.get("nonexistent");

      expect(result).toBeUndefined();
    });

    it("should throw DatabaseError on database failure", async () => {
      // Close the database to simulate failure
      await db.close();

      await expect(DataroomRepo.get("dataroom-1")).rejects.toThrow(
        DatabaseError
      );

      // Reopen for cleanup
      await db.open();
    });
  });

  describe("getRequired", () => {
    it("should return dataroom when it exists", async () => {
      await db.datarooms.add(mockDataroom);

      const result = await DataroomRepo.getRequired("dataroom-1");

      expect(result).toEqual(mockDataroom);
    });

    it("should throw NotFoundError when dataroom does not exist", async () => {
      await expect(DataroomRepo.getRequired("nonexistent")).rejects.toThrow(
        NotFoundError
      );
    });
  });

  describe("list", () => {
    beforeEach(async () => {
      await db.datarooms.bulkAdd([mockDataroom, mockDataroom2]);
    });

    it("should return all datarooms with default sorting (updatedAt desc)", async () => {
      const result = await DataroomRepo.list();

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual(mockDataroom2); // More recent first
      expect(result[1]).toEqual(mockDataroom);
    });

    it("should sort by name ascending", async () => {
      const result = await DataroomRepo.list("name", "asc");

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual(mockDataroom2); // "Another" comes before "Test"
      expect(result[1]).toEqual(mockDataroom);
    });

    it("should sort by name descending", async () => {
      const result = await DataroomRepo.list("name", "desc");

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual(mockDataroom); // "Test" comes after "Another" in desc
      expect(result[1]).toEqual(mockDataroom2);
    });

    it("should sort by createdAt ascending", async () => {
      const result = await DataroomRepo.list("createdAt", "asc");

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual(mockDataroom); // Earlier timestamp first
      expect(result[1]).toEqual(mockDataroom2);
    });

    it("should return empty array when no datarooms exist", async () => {
      await clearDatabase();

      const result = await DataroomRepo.list();

      expect(result).toEqual([]);
    });

    it("should throw DatabaseError on database failure", async () => {
      await db.close();

      await expect(DataroomRepo.list()).rejects.toThrow(DatabaseError);

      await db.open();
    });
  });

  describe("updateName", () => {
    beforeEach(async () => {
      await db.datarooms.add(mockDataroom);
    });

    it("should update dataroom name and timestamp", async () => {
      const newName = "Updated Dataroom";
      const beforeUpdate = Date.now();

      const result = await DataroomRepo.updateName("dataroom-1", newName);

      expect(result).toBe(1); // Number of updated records

      const updated = await db.datarooms.get("dataroom-1");
      expect(updated).toBeDefined();
      expect(updated!.name).toBe(newName);
      expect(updated!.updatedAt).toBeGreaterThanOrEqual(beforeUpdate);
      expect(updated!.createdAt).toBe(mockDataroom.createdAt); // Should not change
    });

    it("should return 0 when dataroom does not exist", async () => {
      const result = await DataroomRepo.updateName("nonexistent", "New Name");

      expect(result).toBe(0);
    });

    it("should throw DatabaseError on database failure", async () => {
      await db.close();

      await expect(
        DataroomRepo.updateName("dataroom-1", "New Name")
      ).rejects.toThrow(DatabaseError);

      await db.open();
    });
  });

  describe("touch", () => {
    beforeEach(async () => {
      await db.datarooms.add(mockDataroom);
    });

    it("should update only the timestamp", async () => {
      const beforeTouch = Date.now();

      const result = await DataroomRepo.touch("dataroom-1");

      expect(result).toBe(1);

      const touched = await db.datarooms.get("dataroom-1");
      expect(touched).toBeDefined();
      expect(touched!.name).toBe(mockDataroom.name); // Should not change
      expect(touched!.updatedAt).toBeGreaterThanOrEqual(beforeTouch);
      expect(touched!.createdAt).toBe(mockDataroom.createdAt); // Should not change
    });

    it("should return 0 when dataroom does not exist", async () => {
      const result = await DataroomRepo.touch("nonexistent");

      expect(result).toBe(0);
    });

    it("should throw DatabaseError on database failure", async () => {
      await db.close();

      await expect(DataroomRepo.touch("dataroom-1")).rejects.toThrow(
        DatabaseError
      );

      await db.open();
    });
  });

  describe("delete", () => {
    beforeEach(async () => {
      await db.datarooms.add(mockDataroom);
    });

    it("should delete existing dataroom", async () => {
      await DataroomRepo.delete("dataroom-1");

      const deleted = await db.datarooms.get("dataroom-1");
      expect(deleted).toBeUndefined();
    });

    it("should not throw error when deleting non-existent dataroom", async () => {
      await expect(DataroomRepo.delete("nonexistent")).resolves.not.toThrow();
    });

    it("should throw DatabaseError on database failure", async () => {
      await db.close();

      await expect(DataroomRepo.delete("dataroom-1")).rejects.toThrow(
        DatabaseError
      );

      await db.open();
    });
  });

  describe("nameExists", () => {
    beforeEach(async () => {
      await db.datarooms.bulkAdd([mockDataroom, mockDataroom2]);
    });

    it("should return true when name exists", async () => {
      const result = await DataroomRepo.nameExists("Test Dataroom");

      expect(result).toBe(true);
    });

    it("should return false when name does not exist", async () => {
      const result = await DataroomRepo.nameExists("Nonexistent Dataroom");

      expect(result).toBe(false);
    });

    it("should exclude specified ID when checking existence", async () => {
      const result = await DataroomRepo.nameExists(
        "Test Dataroom",
        "dataroom-1"
      );

      expect(result).toBe(false); // Should exclude the dataroom with the same name
    });

    it("should not exclude other datarooms with same name", async () => {
      const result = await DataroomRepo.nameExists(
        "Test Dataroom",
        "different-id"
      );

      expect(result).toBe(true); // Should find the existing dataroom
    });

    it("should throw DatabaseError on database failure", async () => {
      await db.close();

      await expect(DataroomRepo.nameExists("Test Dataroom")).rejects.toThrow(
        DatabaseError
      );

      await db.open();
    });
  });

  describe("count", () => {
    it("should return 0 when no datarooms exist", async () => {
      const result = await DataroomRepo.count();

      expect(result).toBe(0);
    });

    it("should return correct count when datarooms exist", async () => {
      await db.datarooms.bulkAdd([mockDataroom, mockDataroom2]);

      const result = await DataroomRepo.count();

      expect(result).toBe(2);
    });

    it("should throw DatabaseError on database failure", async () => {
      await db.close();

      await expect(DataroomRepo.count()).rejects.toThrow(DatabaseError);

      await db.open();
    });
  });
});
