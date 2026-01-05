import db from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { recipientId, memeId, emoji } = await req.json();

    if (!recipientId || !memeId) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // Verify recipient exists
    const recipient = await db.getRecipientById(recipientId);

    if (!recipient) {
      return NextResponse.json({ error: "Invalid recipient" }, { status: 400 });
    }

    await db.upsertReaction(recipientId, memeId, emoji || null);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Reaction error:", error);
    return NextResponse.json({ error: "Failed to save reaction" }, { status: 500 });
  }
}
