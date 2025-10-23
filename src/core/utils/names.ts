import { NameValidationError } from "../errors";

export function splitName(name: string): { base: string; ext: string } {
  const lastDotIndex = name.lastIndexOf(".");

  if (lastDotIndex === -1 || lastDotIndex === 0) {
    return { base: name, ext: "" };
  }

  return {
    base: name.substring(0, lastDotIndex),
    ext: name.substring(lastDotIndex),
  };
}

export function generateUniqueName(
  baseName: string,
  existingNames: Set<string>
): string {
  if (!existingNames.has(baseName)) {
    return baseName;
  }

  const { base, ext } = splitName(baseName);
  let counter = 1;
  let candidate = `${base} (${counter})${ext}`;

  while (existingNames.has(candidate)) {
    counter++;
    candidate = `${base} (${counter})${ext}`;
  }

  return candidate;
}

export function validateName(name: string, type: "file" | "folder"): void {
  if (!name || typeof name !== "string") {
    throw new NameValidationError("Name cannot be empty");
  }

  const trimmed = name.trim();
  if (trimmed.length === 0) {
    throw new NameValidationError("Name cannot be only whitespace");
  }

  if (trimmed.length > 255) {
    throw new NameValidationError("Name cannot exceed 255 characters");
  }

  // Check for invalid characters (common across OS)
  const invalidChars = /[<>:"/\\|?*]/;
  if (invalidChars.test(trimmed)) {
    throw new NameValidationError("Name contains invalid characters");
  }

  // Check for reserved names
  const reservedNames = [
    "CON",
    "PRN",
    "AUX",
    "NUL",
    "COM1",
    "COM2",
    "COM3",
    "COM4",
    "COM5",
    "COM6",
    "COM7",
    "COM8",
    "COM9",
    "LPT1",
    "LPT2",
    "LPT3",
    "LPT4",
    "LPT5",
    "LPT6",
    "LPT7",
    "LPT8",
    "LPT9",
  ];

  const nameToCheck = type === "file" ? splitName(trimmed).base : trimmed;
  if (reservedNames.includes(nameToCheck.toUpperCase())) {
    throw new NameValidationError(`"${nameToCheck}" is a reserved name`);
  }

  // Additional validation for files
  if (type === "file") {
    const { base, ext } = splitName(trimmed);
    if (base.length === 0) {
      throw new NameValidationError(
        "File must have a name before the extension"
      );
    }
    if (ext && ext !== ".pdf") {
      throw new NameValidationError("Only PDF files are supported");
    }
  }
}

export function normalizeName(name: string): string {
  return name.trim().replace(/\s+/g, " ");
}
