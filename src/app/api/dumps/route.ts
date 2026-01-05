import { getSession } from "@/lib/auth";
import db from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { v4 as uuid } from "uuid";

export async function POST(req: NextRequest) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { memeIds, note, recipients } = await req.json();

    if (!Array.isArray(memeIds) || memeIds.length === 0 || memeIds.length > 50) {
      return NextResponse.json(
        { error: "Select 1-50 memes" },
        { status: 400 }
      );
    }

    if (!Array.isArray(recipients) || recipients.length === 0) {
      return NextResponse.json(
        { error: "At least 1 recipient required" },
        { status: 400 }
      );
    }

    // Verify all memes belong to user
    const userMemes = await db.getMemesByUser(user.id);
    const userMemeIds = new Set(userMemes.map((m) => m.id));
    const allValid = memeIds.every((id: string) => userMemeIds.has(id));

    if (!allValid) {
      return NextResponse.json({ error: "Invalid memes" }, { status: 400 });
    }

    // Create dump
    const dumpId = uuid();
    await db.createDump({
      id: dumpId,
      sender_id: user.id,
      note: note || null,
    });

    // Add memes to dump
    const dumpMemes = memeIds.map((memeId: string, index: number) => ({
      id: uuid(),
      dump_id: dumpId,
      meme_id: memeId,
      sort_order: index,
    }));
    await db.addMemesToDump(dumpMemes);

    // Create recipients and "send" emails
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

    for (const email of recipients) {
      const recipientId = uuid();
      const token = uuid();

      await db.createRecipient({
        id: recipientId,
        dump_id: dumpId,
        email,
        token,
      });

      // Mock email
      const link = `${baseUrl}/view/${token}`;
      const subject = `${user.email} sent you a HitPost`;
      const body = `You received a meme dump!\n\nClick here to view: ${link}`;

      await db.createEmail({
        id: uuid(),
        to_email: email,
        subject,
        body,
        link,
      });

      console.log("\n=== EMAIL SENT ===");
      console.log(`To: ${email}`);
      console.log(`Subject: ${subject}`);
      console.log(`Link: ${link}`);
      console.log("==================\n");
    }

    return NextResponse.json({ dumpId, success: true });
  } catch (error) {
    console.error("Create dump error:", error);
    return NextResponse.json({ error: "Failed to create dump" }, { status: 500 });
  }
}

export async function GET() {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dumps = await db.getDumpsByUser(user.id);
  const dumpsWithStats = await Promise.all(
    dumps.map(async (dump) => {
      const stats = await db.getDumpStats(dump.id);
      return {
        ...dump,
        meme_count: stats.memeCount,
        recipient_count: stats.recipientCount,
        viewed_count: stats.viewedCount,
      };
    })
  );

  return NextResponse.json({ dumps: dumpsWithStats });
}
