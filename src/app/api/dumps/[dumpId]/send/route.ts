import { getSession } from "@/lib/auth";
import db, { generateClaimCode } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { v4 as uuid } from "uuid";

interface RecipientInput {
  name: string;
  email?: string;
}

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

    const createdRecipients: { name: string; link: string; claimCode: string }[] = [];

    for (const recipient of recipients as RecipientInput[]) {
      const name = typeof recipient === "string" ? recipient : recipient.name;
      const email = typeof recipient === "string" ? undefined : recipient.email;

      const recipientId = uuid();
      const token = uuid();
      const claimCode = generateClaimCode();

      await db.createRecipient({
        id: recipientId,
        dump_id: dumpId,
        name,
        email,
        token,
        claim_code: claimCode,
      });

      const link = `${baseUrl}/view/${token}`;
      createdRecipients.push({ name, link, claimCode });

      console.log(`RECIPIENT CREATED: ${name} - ${link} - Code: ${claimCode}`);
    }

    return NextResponse.json({
      success: true,
      recipients: createdRecipients,
    });
  } catch (error) {
    console.error("Send dump error:", error);
    return NextResponse.json({ error: "Failed to send dump" }, { status: 500 });
  }
}
