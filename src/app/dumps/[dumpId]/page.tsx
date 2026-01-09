import { getSession } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import Header from "@/components/Header";
import db, { Reaction } from "@/lib/db";
import CopyLinkButton from "./CopyLinkButton";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

interface DumpDetailPageProps {
  params: Promise<{ dumpId: string }>;
}

export default async function DumpDetailPage({ params }: DumpDetailPageProps) {
  const user = await getSession();

  if (!user) {
    redirect("/");
  }

  const { dumpId } = await params;
  const dump = await db.getDumpById(dumpId);

  if (!dump || dump.sender_id !== user.id) {
    notFound();
  }

  const memes = await db.getMemesByDump(dumpId);
  const recipients = await db.getRecipientsByDump(dumpId);
  const recipientIds = recipients.map((r) => r.id);

  const reactions: Reaction[] = recipientIds.length > 0
    ? await db.getReactionsByRecipients(recipientIds)
    : [];

  const recipientsWithReactions = recipients.map((r) => ({
    ...r,
    reactions: reactions.filter((rx) => rx.recipient_id === r.id),
  }));

  const viewedCount = recipients.filter((r) => r.viewed_at).length;
  const totalViews = recipients.reduce((sum, r) => sum + (r.view_count || 0), 0);

  // Get base URL from request headers
  const headersList = await headers();
  const host = headersList.get("host") || headersList.get("x-forwarded-host") || "localhost:3000";
  const protocol = headersList.get("x-forwarded-proto") || "https";
  const baseUrl = `${protocol}://${host}`;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-8">
      <Header email={user.email} title={dump.note || "Dump"} showBack />

      <main className="max-w-lg mx-auto px-4 py-4 space-y-4">
        {/* Cute meme stack + stats */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-4">
            {/* Askew stack preview */}
            <div className="relative w-20 h-20 flex-shrink-0">
              {memes.slice(0, 3).map((meme, i) => (
                <div
                  key={meme.id}
                  className="absolute w-16 h-16 rounded-xl overflow-hidden bg-gray-100 shadow-md"
                  style={{
                    transform: `rotate(${(i - 1) * 8}deg)`,
                    top: `${i * 3}px`,
                    left: `${i * 3}px`,
                    zIndex: 3 - i,
                  }}
                >
                  {meme.file_type === "video" ? (
                    <video src={meme.file_url} className="w-full h-full object-cover" muted playsInline />
                  ) : (
                    <img src={meme.file_url} alt="" className="w-full h-full object-cover" />
                  )}
                </div>
              ))}
            </div>

            {/* Stats */}
            <div className="flex-1">
              <p className="text-2xl font-bold">{viewedCount}/{recipients.length}</p>
              <p className="text-sm text-gray-500">opened</p>
              <p className="text-xs text-gray-400 mt-1">{memes.length} memes · {totalViews} views</p>
            </div>
          </div>
        </div>

        {/* Recipients - the main focus */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-3 border-b border-gray-100 dark:border-gray-800">
            <h2 className="font-semibold text-sm">Recipients</h2>
          </div>

          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {recipientsWithReactions.map((recipient) => {
              const link = `${baseUrl}/view/${recipient.token}`;
              const hasViewed = !!recipient.viewed_at;

              return (
                <div key={recipient.id} className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {/* Avatar with status indicator */}
                      <div className="relative">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
                          <span className="text-white font-semibold text-sm">
                            {(recipient.name || "?").charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white ${hasViewed ? "bg-green-500" : "bg-gray-300"}`} />
                      </div>

                      {/* Name and status */}
                      <div>
                        <p className="font-medium text-gray-900">{recipient.name || "Unknown"}</p>
                        <p className="text-xs text-gray-500">
                          {hasViewed
                            ? `Opened · ${recipient.view_count} view${recipient.view_count !== 1 ? "s" : ""}`
                            : "Not opened yet"}
                        </p>
                      </div>
                    </div>

                    {/* Reactions or copy button */}
                    <div className="flex items-center gap-2">
                      {recipient.reactions.length > 0 && (
                        <div className="flex gap-0.5">
                          {recipient.reactions.map((r) => (
                            <span key={r.id} className="text-lg">{r.emoji}</span>
                          ))}
                        </div>
                      )}
                      <CopyLinkButton link={link} />
                    </div>
                  </div>

                  {/* Recipient note */}
                  {recipient.recipient_note && (
                    <div className="mt-2 ml-13 bg-blue-50 dark:bg-blue-900/20 rounded-lg px-3 py-2">
                      <p className="text-xs text-blue-600 dark:text-blue-400">
                        "{recipient.recipient_note}"
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Timestamp */}
        <p className="text-center text-xs text-gray-400">
          Sent {new Date(dump.created_at).toLocaleString()}
        </p>
      </main>
    </div>
  );
}
