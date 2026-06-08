import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/guards";
import { getKycPageData } from "@/lib/kyc/queries";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await requireAuth();
  const data = await getKycPageData(session.userId);
  return NextResponse.json(data);
}
