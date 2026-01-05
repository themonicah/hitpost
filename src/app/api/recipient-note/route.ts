import db from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { recipientId, note } = await req.json();

    if (!recipientId) {
      return NextResponse.json({ error: "Missing recipient ID" }, { status: 400 });
    }

    // Verify recipient exists
    const recipient = await db.getRecipientById(recipientId);

    if (!recipient) {
      return NextResponse.json({ error: "Invalid recipient" }, { status: 400 });
    }

    await db.updateRecipientNote(recipientId, note || null);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Save note error:", error);
    return NextResponse.json({ error: "Failed to save note" }, { status: 500 });
  }
}
