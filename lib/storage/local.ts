import path from "path";
import fs from "fs/promises";
import type { StorageProvider } from "./index";

export class LocalStorageProvider implements StorageProvider {
  private root: string;

  constructor() {
    this.root = process.env.UPLOAD_DIR ?? path.join(process.cwd(), "storage", "uploads");
  }

  async upload(file: Blob, relativePath: string): Promise<string> {
    const fullPath = path.join(this.root, relativePath);
    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(fullPath, buffer);
    return relativePath;
  }

  getUrl(relativePath: string): string {
    return `/api/kyc/files/${relativePath}`;
  }

  async delete(relativePath: string): Promise<void> {
    const fullPath = path.join(this.root, relativePath);
    await fs.unlink(fullPath).catch(() => {});
  }
}
