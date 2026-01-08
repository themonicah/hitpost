import { getSession } from "@/lib/auth";
import db from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ dumpId: string }> }
) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { dumpId } = await params;

  try {
    const dump = await db.getDumpById(dumpId);

    if (!dump || dump.sender_id !== user.id) {
      return NextResponse.json({ error: "Dump not found" }, { status: 404 });
    }

    // If already has share token, return it
    if (dump.share_token) {
      return NextResponse.json({ shareToken: dump.share_token });
    }

    // Generate new share token (short, URL-friendly)
    const shareToken = nanoid(10);

    // Update dump with share token and mark as not draft
    await db.updateDump(dumpId, {
      share_token: shareToken,
      is_draft: false,
    });

    return NextResponse.json({ shareToken });
  } catch (error) {
    console.error("Share link error:", error);
    return NextResponse.json({ error: "Failed to generate link" }, { status: 500 });
  }
}
