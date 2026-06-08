import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { getStorage, ALLOWED_MIME_TYPES, MAX_FILE_SIZE_BYTES } from "@/lib/storage";
import { audit, ipFromRequest } from "@/lib/audit";
import { KycDocType } from "@/lib/generated/prisma/enums";

export const dynamic = "force-dynamic";

const REQUIRED_DOC_TYPES: KycDocType[] = ["id_front", "selfie", "address_proof"];
const ALL_DOC_TYPES: KycDocType[] = ["id_front", "id_back", "selfie", "address_proof"];

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 128);
}

export async function POST(req: NextRequest) {
  const session = await requireAuth();
  const userId = session.userId;

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  // Collect submitted files
  const files: Partial<Record<KycDocType, File>> = {};
  for (const docType of ALL_DOC_TYPES) {
    const entry = formData.get(docType);
    if (entry instanceof File && entry.size > 0) {
      files[docType] = entry;
    }
  }

  // Validate required documents
  const missing = REQUIRED_DOC_TYPES.filter((t) => !files[t]);
  if (missing.length > 0) {
    return NextResponse.json(
      { error: `Missing required documents: ${missing.join(", ")}` },
      { status: 422 },
    );
  }

  // Validate each file
  for (const [docType, file] of Object.entries(files) as [KycDocType, File][]) {
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { error: `${docType}: file exceeds 10 MB limit` },
        { status: 422 },
      );
    }
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: `${docType}: unsupported file type ${file.type}` },
        { status: 422 },
      );
    }
  }

  // Guard: block re-submission while pending/under_review/approved
  const existing = await prisma.kycProfile.findUnique({ where: { userId } });
  if (
    existing &&
    existing.status !== "rejected" &&
    existing.status !== "update_requested"
  ) {
    return NextResponse.json(
      { error: "KYC submission already under review or approved" },
      { status: 409 },
    );
  }

  const storage = getStorage();

  // Upload files and collect paths
  const uploads: { docType: KycDocType; filePath: string; file: File }[] = [];
  for (const [docType, file] of Object.entries(files) as [KycDocType, File][]) {
    const ts = Date.now();
    const safeName = sanitizeFileName(file.name || `${docType}.bin`);
    const ext = safeName.includes(".") ? "" : ".bin";
    const relativePath = `kyc/${userId}/${docType}/${ts}-${safeName}${ext}`;
    await storage.upload(file, relativePath);
    uploads.push({ docType, filePath: relativePath, file });
  }

  // Create or update profile + documents in a transaction
  await prisma.$transaction(async (tx) => {
    let profileId: string;

    if (!existing) {
      const profile = await tx.kycProfile.create({
        data: {
          userId,
          tierRequested: 2,
          status: "pending",
          submittedAt: new Date(),
        },
      });
      profileId = profile.id;
    } else {
      await tx.kycProfile.update({
        where: { userId },
        data: {
          status: "pending",
          rejectionReason: null,
          submittedAt: new Date(),
        },
      });
      profileId = existing.id;
    }

    for (const { docType, filePath, file } of uploads) {
      // Find latest existing doc of this type to get current version
      const prev = await tx.kycDocument.findFirst({
        where: { kycProfileId: profileId, docType },
        orderBy: { version: "desc" },
        select: { version: true },
      });
      const nextVersion = prev ? prev.version + 1 : 1;

      await tx.kycDocument.create({
        data: {
          kycProfileId: profileId,
          docType,
          filePath,
          fileName: file.name || null,
          fileSizeBytes: file.size,
          mimeType: file.type || null,
          status: "pending",
          version: nextVersion,
        },
      });
    }
  });

  await audit({
    actorId: userId,
    targetId: userId,
    targetType: "user",
    action: existing ? "kyc.resubmitted" : "kyc.submitted",
    meta: { docTypes: uploads.map((u) => u.docType) },
    ipAddress: ipFromRequest(req),
    userAgent: req.headers.get("user-agent") ?? undefined,
  });

  return NextResponse.json({ success: true });
}
