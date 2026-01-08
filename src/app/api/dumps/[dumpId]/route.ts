import { getSession } from "@/lib/auth";
import db from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
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
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const memes = await db.getMemesByDump(dumpId);
    const recipients = await db.getRecipientsByDump(dumpId);
    const recipientIds = recipients.map((r) => r.id);

    const reactions = recipientIds.length > 0
      ? await db.getReactionsByRecipients(recipientIds)
      : [];

    const recipientsWithReactions = recipients.map((r) => ({
      email: r.email,
      viewed_at: r.viewed_at,
      view_count: r.view_count || 0,
      reactions: reactions.filter((rx) => rx.recipient_id === r.id).map((rx) => ({ emoji: rx.emoji })),
    }));

    return NextResponse.json({
      dump: {
        id: dump.id,
        note: dump.note,
        created_at: dump.created_at,
        is_draft: dump.is_draft || false,
        share_token: dump.share_token || null,
        memes: memes.map((m) => ({
          id: m.id,
          file_url: m.file_url,
          file_type: m.file_type,
        })),
        recipients: recipientsWithReactions,
      },
    });
  } catch (error) {
    console.error("Get dump error:", error);
    return NextResponse.json({ error: "Failed to get dump" }, { status: 500 });
  }
}

export async function PATCH(
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
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const { note } = await req.json();

    await db.updateDump(dumpId, { note });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update dump error:", error);
    return NextResponse.json({ error: "Failed to update dump" }, { status: 500 });
  }
}
