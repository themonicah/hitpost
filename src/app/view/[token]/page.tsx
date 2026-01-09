import db from "@/lib/db";
import { notFound } from "next/navigation";
import ViewDumpContent from "./ViewDumpContent";

interface ViewPageProps {
  params: Promise<{ token: string }>;
}

export default async function ViewPage({ params }: ViewPageProps) {
  const { token } = await params;

  // Get recipient by token
  const recipient = await db.getRecipientByToken(token);

  if (!recipient) {
    notFound();
  }

  // Mark as viewed
  if (!recipient.viewed_at) {
    await db.markRecipientViewed(recipient.id);
  }

  // Get dump
  const dump = await db.getDumpById(recipient.dump_id);

  if (!dump) {
    notFound();
  }

  // Get sender info
  const sender = await db.getUserById(dump.sender_id);
  const senderEmail = sender?.email || "Unknown";

  // Get memes in order
  const memes = await db.getMemesByDump(dump.id);

  // Get existing reactions
  const reactions = await db.getReactionsByRecipient(recipient.id);
  const reactionsMap: Record<string, string> = {};
  reactions.forEach((r) => {
    reactionsMap[r.meme_id] = r.emoji;
  });

  return (
    <ViewDumpContent
      dump={{ ...dump, sender_email: senderEmail }}
      memes={memes}
      recipientId={recipient.id}
      recipientName={recipient.name}
      recipientNote={recipient.recipient_note}
      existingReactions={reactionsMap}
      claimCode={recipient.claim_code}
      isClaimed={!!recipient.claimed_at}
    />
  );
}
