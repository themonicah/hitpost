import db from "@/lib/db";
import { notFound } from "next/navigation";
import { getSession } from "@/lib/auth";
import DumpLandingClient from "./DumpLandingClient";

export const dynamic = "force-dynamic";

interface DumpLandingPageProps {
  params: Promise<{ token: string }>;
}

export default async function DumpLandingPage({ params }: DumpLandingPageProps) {
  const { token } = await params;

  // Get dump by share token
  const dump = await db.getDumpByShareToken(token);

  if (!dump) {
    notFound();
  }

  // Get sender info
  const sender = await db.getUserById(dump.sender_id);
  const senderEmail = sender?.email || "Someone";

  // Get memes
  const memes = await db.getMemesByDump(dump.id);

  if (memes.length === 0) {
    notFound();
  }

  // Check if user is logged in
  const user = await getSession();

  return (
    <DumpLandingClient
      dump={{
        id: dump.id,
        note: dump.note,
        share_token: dump.share_token!,
        meme_count: memes.length,
      }}
      senderEmail={senderEmail}
      previewMemes={memes.slice(0, 4).map((m) => ({
        id: m.id,
        file_url: m.file_url,
        file_type: m.file_type,
      }))}
      isLoggedIn={!!user}
      userId={user?.id}
    />
  );
}
