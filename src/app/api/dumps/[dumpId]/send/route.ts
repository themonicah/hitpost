import { getSession } from "@/lib/auth";
import db, { generateClaimCode } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { v4 as uuid } from "uuid";

interface RecipientInput {
  name: string;
  email?: string;
}

interface CreatedRecipient {
  name: string;
  link: string;
  claimCode: string | null;  // null if already connected
  isConnected: boolean;      // true if push was sent
  pushSent: boolean;         // true if push notification succeeded
}

// Send push notification to a user
async function sendPushNotification(
  userId: string,
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<boolean> {
  try {
    const pushTokens = await db.getPushTokensByUser(userId);
    if (pushTokens.length === 0) {
      console.log(`No push tokens for user ${userId}`);
      return false;
    }

    // For now, just log that we would send a push
    // TODO: Integrate with actual push service (APNs, FCM)
    for (const pushToken of pushTokens) {
      console.log(`PUSH NOTIFICATION [${pushToken.platform}]:`, {
        token: pushToken.token.substring(0, 20) + "...",
        title,
        body,
        data,
      });
    }

    return true;
  } catch (error) {
    console.error("Push notification error:", error);
    return false;
  }
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

    const createdRecipients: CreatedRecipient[] = [];

    for (const recipient of recipients as RecipientInput[]) {
      const name = typeof recipient === "string" ? recipient : recipient.name;

      const recipientId = uuid();
      const token = uuid();

      // Check if this sender has sent to this name before and they claimed
      const existingConnection = await db.findClaimedRecipientByName(user.id, name);

      if (existingConnection) {
        // "Claim once, push forever" - recipient is already connected!
        await db.createLinkedRecipient({
          id: recipientId,
          dump_id: dumpId,
          name,
          user_id: existingConnection.user_id,
          token,
        });

        // Send push notification
        const senderName = user.email || "Someone";
        const pushSent = await sendPushNotification(
          existingConnection.user_id,
          "New meme dump!",
          `${senderName} sent you ${memes.length} meme${memes.length > 1 ? "s" : ""}`,
          { dumpId, type: "new_dump" }
        );

        const link = `${baseUrl}/view/${token}`;
        createdRecipients.push({
          name,
          link,
          claimCode: null,  // No claim code needed - already connected
          isConnected: true,
          pushSent,
        });

        console.log(`CONNECTED RECIPIENT: ${name} - push ${pushSent ? "sent" : "failed"}`);
      } else {
        // New recipient - needs claim code
        const claimCode = generateClaimCode();

        await db.createRecipient({
          id: recipientId,
          dump_id: dumpId,
          name,
          token,
          claim_code: claimCode,
        });

        const link = `${baseUrl}/view/${token}`;
        createdRecipients.push({
          name,
          link,
          claimCode,
          isConnected: false,
          pushSent: false,
        });

        console.log(`NEW RECIPIENT: ${name} - ${link} - Code: ${claimCode}`);
      }
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
