import { getSession } from "@/lib/auth";
import db from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const user = await getSession();

  if (!user) {
    return NextResponse.json({ error: "Please log in first" }, { status: 401 });
  }

  try {
    const { claimCode } = await req.json();

    if (!claimCode) {
      return NextResponse.json({ error: "Missing claim code" }, { status: 400 });
    }

    // Find recipient by claim code
    const recipient = await db.getRecipientByClaimCode(claimCode);

    if (!recipient) {
      return NextResponse.json({ error: "Invalid code" }, { status: 404 });
    }

    if (recipient.claimed_at) {
      return NextResponse.json({ error: "Code already used" }, { status: 400 });
    }

    // Get the dump
    const dump = await db.getDumpById(recipient.dump_id);
    if (!dump) {
      return NextResponse.json({ error: "Dump not found" }, { status: 404 });
    }

    // Don't let sender claim their own dump
    if (dump.sender_id === user.id) {
      return NextResponse.json({ error: "You can't claim your own dump" }, { status: 400 });
    }

    // Claim the recipient record
    const claimedRecipient = await db.claimRecipientByCode(claimCode, user.id);

    if (!claimedRecipient) {
      return NextResponse.json({ error: "Failed to claim" }, { status: 500 });
    }

    // Also link the user_connection if one exists for this sender+name
    // This enables "claim once, push forever" via the connection system
    try {
      await db.linkConnectionByName(dump.sender_id, claimedRecipient.name, user.id);
    } catch (e) {
      // Non-fatal - connection linking is supplementary
      console.log("Could not link connection (may not exist):", e);
    }

    // Get meme count for success message
    const memes = await db.getMemesByDump(dump.id);

    return NextResponse.json({
      success: true,
      recipient: {
        name: claimedRecipient.name,
      },
      dump: {
        id: dump.id,
        memeCount: memes.length,
      },
    });
  } catch (error) {
    console.error("Claim error:", error);
    return NextResponse.json({ error: "Failed to claim" }, { status: 500 });
  }
}
