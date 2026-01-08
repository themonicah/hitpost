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
    const { memeIds, note, recipients, isDraft, existingDumpId } = await req.json();

    // For drafts, we can have empty memes initially
    const memeIdList = Array.isArray(memeIds) ? memeIds : [];

    if (!isDraft && memeIdList.length === 0) {
      return NextResponse.json(
        { error: "Select at least 1 meme" },
        { status: 400 }
      );
    }

    if (!isDraft && (!Array.isArray(recipients) || recipients.length === 0)) {
      return NextResponse.json(
        { error: "At least 1 recipient required" },
        { status: 400 }
      );
    }

    // Verify all memes belong to user (if memes provided)
    if (memeIdList.length > 0) {
      const userMemes = await db.getMemesByUser(user.id);
      const userMemeIds = new Set(userMemes.map((m) => m.id));
      const allValid = memeIdList.every((id: string) => userMemeIds.has(id));

      if (!allValid) {
        return NextResponse.json({ error: "Invalid memes" }, { status: 400 });
      }
    }

    let dumpId: string;

    // Add to existing dump or create new one
    if (existingDumpId) {
      const existingDump = await db.getDumpById(existingDumpId);
      if (!existingDump || existingDump.sender_id !== user.id) {
        return NextResponse.json({ error: "Dump not found" }, { status: 404 });
      }
      dumpId = existingDumpId;
    } else {
      dumpId = uuid();
      await db.createDump({
        id: dumpId,
        sender_id: user.id,
        note: note || null,
        is_draft: isDraft || false,
      });
    }

    // Add memes to dump (if any)
    if (memeIdList.length > 0) {
      const existingMemes = await db.getMemesByDump(dumpId);
      const startOrder = existingMemes.length;

      const dumpMemes = memeIdList.map((memeId: string, index: number) => ({
        id: uuid(),
        dump_id: dumpId,
        meme_id: memeId,
        sort_order: startOrder + index,
      }));
      await db.addMemesToDump(dumpMemes);
    }

    // If draft, return early
    if (isDraft) {
      return NextResponse.json({ dumpId, success: true });
    }

    // Create recipients and send emails
    const requestUrl = new URL(req.url);
    const baseUrl = `${requestUrl.protocol}//${requestUrl.host}`;

    for (const email of recipients) {
      const recipientId = uuid();
      const token = uuid();

      await db.createRecipient({
        id: recipientId,
        dump_id: dumpId,
        email,
        token,
      });

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

      console.log(`EMAIL SENT to ${email}: ${link}`);
    }

    return NextResponse.json({ dumpId, success: true });
  } catch (error) {
    console.error("Create dump error:", error);
    return NextResponse.json({ error: "Failed to create dump" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const draftsOnly = searchParams.get("drafts") === "true";

  const dumps = await db.getDumpsByUser(user.id);
  const dumpsWithStats = await Promise.all(
    dumps
      .filter((dump) => !draftsOnly || dump.is_draft)
      .map(async (dump) => {
        const stats = await db.getDumpStats(dump.id);
        const memes = await db.getMemesByDump(dump.id);
        return {
          ...dump,
          meme_count: stats.memeCount,
          recipient_count: stats.recipientCount,
          viewed_count: stats.viewedCount,
          preview_url: memes[0]?.file_url || null,
          preview_urls: memes.slice(0, 9).map(m => m.file_url),
        };
      })
  );

  return NextResponse.json({ dumps: dumpsWithStats });
}
