import { nanoid } from "nanoid";

export function generateId(): string {
  return nanoid();
}

export function generateIdWithLength(length: number): string {
  return nanoid(length);
}

export function isValidId(id: string): boolean {
  return typeof id === "string" && id.length > 0 && /^[a-zA-Z0-9_-]+$/.test(id);
}
