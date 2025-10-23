export type ID = string;

export interface Dataroom {
  id: ID;
  name: string;
  createdAt: number;
  updatedAt: number;
}

export interface Folder {
  id: ID;
  dataroomId: ID;
  parentId: ID | null; // null = room root
  name: string;
  createdAt: number;
  updatedAt: number;
}

export interface FileObject {
  id: ID;
  dataroomId: ID;
  parentId: ID | null; // folder id or null for root level
  name: string; // display name
  mimeType: string; // application/pdf
  size: number; // bytes
  blobKey: ID; // key in blob table
  createdAt: number;
  updatedAt: number;
}

export type DataroomEntry = Folder | FileObject;

export function isFolder(entry: DataroomEntry): entry is Folder {
  return "parentId" in entry && !("blobKey" in entry);
}

export function isFile(entry: DataroomEntry): entry is FileObject {
  return "blobKey" in entry;
}

export interface BreadcrumbItem {
  id: ID;
  name: string;
  type: "dataroom" | "folder";
}

export type ViewMode = "list" | "grid";

export type SortBy = "name" | "modified" | "size" | "type";
export type SortOrder = "asc" | "desc";

export type NameCollisionAction = "replace" | "keep-both" | "cancel";

export interface NameCollisionContext {
  type: "file" | "folder";
  name: string;
  parentId: string | null;
  dataroomId: string;
  existingItem?: DataroomEntry;
}
