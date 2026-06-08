import { prisma } from "@/lib/prisma";

export type KycDocumentRow = {
  id: string;
  docType: string;
  fileName: string | null;
  filePath: string;
  mimeType: string | null;
  status: string;
  rejectionReason: string | null;
  version: number;
  createdAt: Date;
};

export type KycProfileRow = {
  id: string;
  status: string;
  tierRequested: number;
  rejectionReason: string | null;
  submittedAt: Date;
  reviewedAt: Date | null;
};

export type KycPageData = {
  profile: KycProfileRow | null;
  documents: KycDocumentRow[];
};

export async function getKycPageData(userId: string): Promise<KycPageData> {
  const profile = await prisma.kycProfile.findUnique({
    where: { userId },
    select: {
      id: true,
      status: true,
      tierRequested: true,
      rejectionReason: true,
      submittedAt: true,
      reviewedAt: true,
    },
  });

  if (!profile) return { profile: null, documents: [] };

  const allDocs = await prisma.kycDocument.findMany({
    where: { kycProfileId: profile.id },
    orderBy: [{ docType: "asc" }, { version: "desc" }],
    select: {
      id: true,
      docType: true,
      fileName: true,
      filePath: true,
      mimeType: true,
      status: true,
      rejectionReason: true,
      version: true,
      createdAt: true,
    },
  });

  // Keep only the latest version per doc type
  const latest = new Map<string, KycDocumentRow>();
  for (const doc of allDocs) {
    if (!latest.has(doc.docType)) latest.set(doc.docType, doc);
  }

  return { profile, documents: Array.from(latest.values()) };
}
