import { getSession } from "@/lib/auth";
import db from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { v4 as uuid } from "uuid";

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
    const { recipients } = await req.json();

    if (!Array.isArray(recipients) || recipients.length === 0) {
      return NextResponse.json(
        { error: "At least 1 recipient required" },
        { status: 400 }
      );
    }

    const dump = await db.getDumpById(dumpId);
    if (!dump || dump.sender_id !== user.id) {
      return NextResponse.json({ error: "Dump not found" }, { status: 404 });
    }

    const memes = await db.getMemesByDump(dumpId);
    if (memes.length === 0) {
      return NextResponse.json(
        { error: "Add some memes first!" },
        { status: 400 }
      );
    }

    await db.updateDump(dumpId, { is_draft: false });

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

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Send dump error:", error);
    return NextResponse.json({ error: "Failed to send dump" }, { status: 500 });
  }
}
