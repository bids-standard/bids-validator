export interface SchemaFile {
  blobUrl: string;
}

export function computeEffectiveSchema(
  text: string,
  file: SchemaFile | null,
): string | undefined {
  if (file) return file.blobUrl;
  const trimmed = text.trim();
  return trimmed === "" ? undefined : trimmed;
}

export function isSchemaLoadError(err: unknown): boolean {
  return err instanceof Error &&
    err.message.startsWith("Failed to load schema");
}
