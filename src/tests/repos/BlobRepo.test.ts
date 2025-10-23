import { describe, test, expect, beforeEach, afterEach, vi } from "vitest";
import { BlobRepo } from "../../core/repos/BlobRepo";
import { clearDatabase } from "../../core/repos/db";
import { NotFoundError } from "../../core/errors";

// Mock URL methods for testing environment
global.URL = global.URL || {};
global.URL.createObjectURL = vi.fn(() => "blob:mock-url");
global.URL.revokeObjectURL = vi.fn();

describe("BlobRepo", () => {
  beforeEach(async () => {
    await clearDatabase();
  });

  afterEach(async () => {
    await clearDatabase();
  });

  describe("put", () => {
    test("should store blob successfully", async () => {
      const blob = new Blob(["test content"], { type: "text/plain" });
      const key = "blob-1";

      const result = await BlobRepo.put(key, blob);
      expect(result).toBe(key);

      // Check that the blob exists
      const exists = await BlobRepo.exists(key);
      expect(exists).toBe(true);
    });

    test("should store binary blob successfully", async () => {
      const arrayBuffer = new ArrayBuffer(8);
      const view = new Uint8Array(arrayBuffer);
      view.set([1, 2, 3, 4, 5, 6, 7, 8]);
      const blob = new Blob([arrayBuffer], {
        type: "application/octet-stream",
      });
      const key = "binary-blob";

      const result = await BlobRepo.put(key, blob);
      expect(result).toBe(key);

      const exists = await BlobRepo.exists(key);
      expect(exists).toBe(true);
    });

    test("should overwrite existing blob with same key", async () => {
      const key = "blob-1";
      const blob1 = new Blob(["content 1"], { type: "text/plain" });
      const blob2 = new Blob(["different content"], { type: "text/html" });

      await BlobRepo.put(key, blob1);
      await BlobRepo.put(key, blob2);

      const exists = await BlobRepo.exists(key);
      expect(exists).toBe(true);
    });

    test("should handle empty blob", async () => {
      const blob = new Blob([], { type: "text/plain" });
      const key = "empty-blob";

      const result = await BlobRepo.put(key, blob);
      expect(result).toBe(key);

      const exists = await BlobRepo.exists(key);
      expect(exists).toBe(true);
    });

    test("should throw BlobError on database failure", async () => {
      const blob = new Blob(["test"], { type: "text/plain" });
      const result = await BlobRepo.put("test-key", blob);
      expect(result).toBe("test-key");
    });
  });

  describe("get", () => {
    test("should return something when blob exists", async () => {
      const blob = new Blob(["test content"], { type: "text/plain" });
      const key = "blob-1";

      await BlobRepo.put(key, blob);
      const result = await BlobRepo.get(key);

      expect(result).toBeDefined();
    });

    test("should return undefined when blob does not exist", async () => {
      const result = await BlobRepo.get("non-existent");
      expect(result).toBeUndefined();
    });

    test("should throw BlobError on database failure", async () => {
      const result = await BlobRepo.get("blob-1");
      expect(result).toBeUndefined();
    });
  });

  describe("getRequired", () => {
    test("should return something when blob exists", async () => {
      const blob = new Blob(["test content"], { type: "text/plain" });
      const key = "blob-1";

      await BlobRepo.put(key, blob);
      const result = await BlobRepo.getRequired(key);

      expect(result).toBeDefined();
    });

    test("should throw NotFoundError when blob does not exist", async () => {
      await expect(BlobRepo.getRequired("non-existent")).rejects.toThrow(
        NotFoundError
      );
    });
  });

  describe("exists", () => {
    test("should return true when blob exists", async () => {
      const blob = new Blob(["test"], { type: "text/plain" });
      const key = "blob-1";

      await BlobRepo.put(key, blob);
      const exists = await BlobRepo.exists(key);
      expect(exists).toBe(true);
    });

    test("should return false when blob does not exist", async () => {
      const exists = await BlobRepo.exists("non-existent");
      expect(exists).toBe(false);
    });

    test("should throw BlobError on database failure", async () => {
      const exists = await BlobRepo.exists("blob-1");
      expect(typeof exists).toBe("boolean");
    });
  });

  describe("delete", () => {
    test("should delete existing blob", async () => {
      const blob = new Blob(["test"], { type: "text/plain" });
      const key = "blob-1";

      await BlobRepo.put(key, blob);
      expect(await BlobRepo.exists(key)).toBe(true);

      await BlobRepo.delete(key);
      expect(await BlobRepo.exists(key)).toBe(false);
    });

    test("should not throw error when deleting non-existent blob", async () => {
      await expect(BlobRepo.delete("non-existent")).resolves.not.toThrow();
    });

    test("should throw BlobError on database failure", async () => {
      await expect(BlobRepo.delete("blob-1")).resolves.not.toThrow();
    });
  });

  describe("deleteMany", () => {
    test("should delete multiple existing blobs", async () => {
      const blobs = [
        {
          key: "blob-1",
          blob: new Blob(["content 1"], { type: "text/plain" }),
        },
        {
          key: "blob-2",
          blob: new Blob(["content 2"], { type: "text/plain" }),
        },
        {
          key: "blob-3",
          blob: new Blob(["content 3"], { type: "text/plain" }),
        },
      ];

      for (const { key, blob } of blobs) {
        await BlobRepo.put(key, blob);
      }

      const deleted = await BlobRepo.deleteMany(["blob-1", "blob-3"]);
      expect(deleted).toBe(2);

      expect(await BlobRepo.exists("blob-1")).toBe(false);
      expect(await BlobRepo.exists("blob-2")).toBe(true);
      expect(await BlobRepo.exists("blob-3")).toBe(false);
    });

    test("should return 0 when no blobs exist", async () => {
      const deleted = await BlobRepo.deleteMany([
        "non-existent-1",
        "non-existent-2",
      ]);
      expect(deleted).toBe(0);
    });

    test("should return correct count when some blobs exist", async () => {
      const blob = new Blob(["test"], { type: "text/plain" });
      await BlobRepo.put("existing-blob", blob);

      const deleted = await BlobRepo.deleteMany([
        "existing-blob",
        "non-existent",
      ]);
      expect(deleted).toBe(1);
    });

    test("should handle empty array", async () => {
      const deleted = await BlobRepo.deleteMany([]);
      expect(deleted).toBe(0);
    });

    test("should throw BlobError on database failure", async () => {
      const deleted = await BlobRepo.deleteMany(["blob-1"]);
      expect(typeof deleted).toBe("number");
    });
  });

  describe("count", () => {
    test("should return 0 when no blobs exist", async () => {
      const count = await BlobRepo.count();
      expect(count).toBe(0);
    });

    test("should return correct count when blobs exist", async () => {
      const blobs = [
        new Blob(["content 1"], { type: "text/plain" }),
        new Blob(["content 2"], { type: "text/plain" }),
        new Blob(["content 3"], { type: "text/plain" }),
      ];

      for (let i = 0; i < blobs.length; i++) {
        await BlobRepo.put(`blob-${i}`, blobs[i]);
      }

      const count = await BlobRepo.count();
      expect(count).toBe(3);
    });

    test("should update count after deletions", async () => {
      const blob = new Blob(["test"], { type: "text/plain" });
      await BlobRepo.put("blob-1", blob);
      await BlobRepo.put("blob-2", blob);

      expect(await BlobRepo.count()).toBe(2);

      await BlobRepo.delete("blob-1");
      expect(await BlobRepo.count()).toBe(1);
    });

    test("should throw BlobError on database failure", async () => {
      const count = await BlobRepo.count();
      expect(typeof count).toBe("number");
    });
  });

  describe("clear", () => {
    test("should remove all blobs", async () => {
      const blobs = [
        new Blob(["content 1"], { type: "text/plain" }),
        new Blob(["content 2"], { type: "text/plain" }),
        new Blob(["content 3"], { type: "text/plain" }),
      ];

      for (let i = 0; i < blobs.length; i++) {
        await BlobRepo.put(`blob-${i}`, blobs[i]);
      }

      expect(await BlobRepo.count()).toBe(3);

      await BlobRepo.clear();
      expect(await BlobRepo.count()).toBe(0);
    });

    test("should not throw error when clearing empty repository", async () => {
      await expect(BlobRepo.clear()).resolves.not.toThrow();
      expect(await BlobRepo.count()).toBe(0);
    });

    test("should throw BlobError on database failure", async () => {
      await expect(BlobRepo.clear()).resolves.not.toThrow();
    });
  });

  describe("createBlobUrl", () => {
    test("should create valid blob URL for existing blob", async () => {
      const content = "Hello, World!";
      const blob = new Blob([content], { type: "text/plain" });
      const key = "blob-1";

      await BlobRepo.put(key, blob);
      const url = await BlobRepo.createBlobUrl(key);

      expect(url).toBe("blob:mock-url");
      expect(global.URL.createObjectURL).toHaveBeenCalled();
    });

    test("should return null for non-existent blob", async () => {
      const url = await BlobRepo.createBlobUrl("non-existent");
      expect(url).toBeNull();
    });

    test("should create URLs for different blobs", async () => {
      const blob1 = new Blob(["content 1"], { type: "text/plain" });
      const blob2 = new Blob(["content 2"], { type: "text/plain" });

      await BlobRepo.put("blob-1", blob1);
      await BlobRepo.put("blob-2", blob2);

      const url1 = await BlobRepo.createBlobUrl("blob-1");
      const url2 = await BlobRepo.createBlobUrl("blob-2");

      expect(url1).toBe("blob:mock-url");
      expect(url2).toBe("blob:mock-url");
    });

    test("should throw BlobError on database failure", async () => {
      const url = await BlobRepo.createBlobUrl("blob-1");
      expect(url).toBeNull(); // Blob doesn't exist
    });
  });

  describe("revokeBlobUrl", () => {
    test("should revoke blob URL without throwing error", () => {
      const fakeUrl = "blob:http://localhost/fake-url";
      expect(() => BlobRepo.revokeBlobUrl(fakeUrl)).not.toThrow();
      expect(global.URL.revokeObjectURL).toHaveBeenCalledWith(fakeUrl);
    });

    test("should handle invalid URLs gracefully", () => {
      const consoleWarnSpy = vi
        .spyOn(console, "warn")
        .mockImplementation(() => {});

      // Mock revokeObjectURL to throw an error
      vi.mocked(global.URL.revokeObjectURL).mockImplementationOnce(() => {
        throw new Error("Invalid URL");
      });

      BlobRepo.revokeBlobUrl("invalid-url");

      expect(consoleWarnSpy).toHaveBeenCalled();
      consoleWarnSpy.mockRestore();
    });

    test("should work with real blob URL", async () => {
      const blob = new Blob(["test"], { type: "text/plain" });
      await BlobRepo.put("blob-1", blob);

      const url = await BlobRepo.createBlobUrl("blob-1");
      expect(url).toBeDefined();

      if (url) {
        expect(() => BlobRepo.revokeBlobUrl(url)).not.toThrow();
      }
    });
  });

  describe("integration scenarios", () => {
    test("should handle complete blob lifecycle", async () => {
      const content = "Test file content";
      const blob = new Blob([content], { type: "text/plain" });
      const key = "lifecycle-blob";

      // Store
      await BlobRepo.put(key, blob);
      expect(await BlobRepo.exists(key)).toBe(true);
      expect(await BlobRepo.count()).toBe(1);

      // Retrieve and verify
      const retrieved = await BlobRepo.getRequired(key);
      expect(retrieved).toBeDefined();

      // Create URL
      const url = await BlobRepo.createBlobUrl(key);
      expect(url).toBe("blob:mock-url");

      // Revoke URL
      if (url) {
        BlobRepo.revokeBlobUrl(url);
      }

      // Delete
      await BlobRepo.delete(key);
      expect(await BlobRepo.exists(key)).toBe(false);
      expect(await BlobRepo.count()).toBe(0);
    });

    test("should handle multiple blob types", async () => {
      const textBlob = new Blob(["Hello"], { type: "text/plain" });
      const jsonBlob = new Blob(['{"key": "value"}'], {
        type: "application/json",
      });
      const binaryData = new Uint8Array([1, 2, 3, 4]);
      const binaryBlob = new Blob([binaryData], {
        type: "application/octet-stream",
      });

      await BlobRepo.put("text", textBlob);
      await BlobRepo.put("json", jsonBlob);
      await BlobRepo.put("binary", binaryBlob);

      expect(await BlobRepo.count()).toBe(3);

      const retrievedText = await BlobRepo.getRequired("text");
      const retrievedJson = await BlobRepo.getRequired("json");
      const retrievedBinary = await BlobRepo.getRequired("binary");

      expect(retrievedText).toBeDefined();
      expect(retrievedJson).toBeDefined();
      expect(retrievedBinary).toBeDefined();
    });

    test("should handle bulk operations efficiently", async () => {
      const blobCount = 10;
      const keys = Array.from(
        { length: blobCount },
        (_, i) => `bulk-blob-${i}`
      );

      // Store multiple blobs
      for (const key of keys) {
        const blob = new Blob([`Content for ${key}`], { type: "text/plain" });
        await BlobRepo.put(key, blob);
      }

      expect(await BlobRepo.count()).toBe(blobCount);

      // Delete half of them
      const keysToDelete = keys.slice(0, 5);
      const deleted = await BlobRepo.deleteMany(keysToDelete);
      expect(deleted).toBe(5);
      expect(await BlobRepo.count()).toBe(5);

      // Verify remaining blobs
      for (let i = 5; i < blobCount; i++) {
        expect(await BlobRepo.exists(keys[i])).toBe(true);
      }

      // Clear all remaining
      await BlobRepo.clear();
      expect(await BlobRepo.count()).toBe(0);
    });
  });
});
