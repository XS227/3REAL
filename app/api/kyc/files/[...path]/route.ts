import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";
import { requireAuth } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const session = await requireAuth();
  const { path: segments } = await params;

  // Prevent path traversal
  const relativePath = segments.join("/");
  if (relativePath.includes("..") || !relativePath.startsWith("kyc/")) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Regular users may only access their own documents
  const isAdmin = session.role === "super_admin" || session.role === "operator";
  if (!isAdmin && !relativePath.startsWith(`kyc/${session.userId}/`)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const fullPath = path.join(process.cwd(), "storage", "uploads", relativePath);

  try {
    const buffer = await fs.readFile(fullPath);
    const ext = path.extname(fullPath).toLowerCase();
    const contentType =
      ext === ".pdf"
        ? "application/pdf"
        : ext === ".png"
          ? "image/png"
          : ext === ".webp"
            ? "image/webp"
            : "image/jpeg";

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "private, no-store",
        "Content-Disposition": `inline; filename="${path.basename(fullPath)}"`,
      },
    });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
