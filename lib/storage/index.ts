export interface StorageProvider {
  upload(file: Blob, relativePath: string): Promise<string>;
  getUrl(relativePath: string): string;
  delete(relativePath: string): Promise<void>;
}

export function getStorage(): StorageProvider {
  // Future: if (process.env.STORAGE_PROVIDER === 's3') return new S3StorageProvider();
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { LocalStorageProvider } = require("./local") as typeof import("./local");
  return new LocalStorageProvider();
}

export const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
];

export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
