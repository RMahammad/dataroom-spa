export abstract class DataroomError extends Error {
  abstract readonly code: string;

  constructor(message: string, cause?: Error) {
    super(message);
    this.name = this.constructor.name;
    this.cause = cause;
  }
}

export class NotFoundError extends DataroomError {
  readonly code = "NOT_FOUND";

  constructor(resource: string, id: string) {
    super(`${resource} with id '${id}' not found`);
  }
}

export class AlreadyExistsError extends DataroomError {
  readonly code = "ALREADY_EXISTS";

  constructor(resource: string, identifier: string) {
    super(`${resource} '${identifier}' already exists`);
  }
}

export class FileValidationError extends DataroomError {
  readonly code = "FILE_VALIDATION_ERROR";

  constructor(reason: string) {
    super(`File validation failed: ${reason}`);
  }
}

export class NameValidationError extends DataroomError {
  readonly code = "NAME_VALIDATION_ERROR";

  constructor(reason: string) {
    super(`Name validation failed: ${reason}`);
  }
}

export class DatabaseError extends DataroomError {
  readonly code = "DATABASE_ERROR";

  constructor(operation: string, cause?: Error) {
    super(`Database operation failed: ${operation}`, cause);
  }
}

export class InvalidOperationError extends DataroomError {
  readonly code = "INVALID_OPERATION";

  constructor(operation: string, reason: string) {
    super(`Invalid operation '${operation}': ${reason}`);
  }
}

export class BlobError extends DataroomError {
  readonly code = "BLOB_ERROR";

  constructor(operation: string, cause?: Error) {
    super(`Blob operation failed: ${operation}`, cause);
  }
}

export function isDataroomError(error: unknown): error is DataroomError {
  return error instanceof DataroomError;
}

export function getErrorMessage(error: unknown): string {
  if (isDataroomError(error)) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "An unknown error occurred";
}
