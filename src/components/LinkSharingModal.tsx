"use client";

import { useState } from "react";

interface RecipientLink {
  name: string;
  link: string;
  claimCode: string | null;
  isConnected: boolean;
  pushSent: boolean;
}

interface LinkSharingModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipients: RecipientLink[];
  dumpId: string;
}

// Format name as "First L." or just "Name" if single word
function formatName(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0];
  const firstName = parts[0];
  const lastName = parts[parts.length - 1];
  return `${firstName} ${lastName.charAt(0).toUpperCase()}.`;
}

export default function LinkSharingModal({
  isOpen,
  onClose,
  recipients,
}: LinkSharingModalProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!isOpen) return null;

  // Filter to only non-connected recipients (need manual link sharing)
  const needsLinks = recipients.filter((r) => !r.isConnected);
  const connectedRecipients = recipients.filter((r) => r.isConnected);

  async function copyLink(recipient: RecipientLink) {
    try {
      await navigator.clipboard.writeText(recipient.link);
      setCopiedId(recipient.name);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  }

  async function shareAll() {
    const shareText = needsLinks
      .map((r) => `${r.name}: ${r.link}`)
      .join("\n\n");

    if (navigator.share) {
      try {
        await navigator.share({
          title: "Meme Dump Links",
          text: shareText,
        });
      } catch {
        // User cancelled or share failed
      }
    } else {
      // Fallback: copy all to clipboard
      try {
        await navigator.clipboard.writeText(shareText);
        setCopiedId("all");
        setTimeout(() => setCopiedId(null), 2000);
      } catch {
        // Clipboard failed
      }
    }
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 animate-fadeIn">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      <div className="relative w-full max-w-md bg-white rounded-3xl overflow-hidden shadow-2xl animate-scaleIn">
        {/* Header with celebration */}
        <div className="bg-gradient-to-br from-amber-400 to-orange-500 px-6 py-8 text-center">
          <div className="text-5xl mb-3">🎉</div>
          <h2 className="text-2xl font-bold text-white">Dump Sent!</h2>
          {connectedRecipients.length > 0 && (
            <p className="text-white/80 text-sm mt-2">
              {connectedRecipients.length} {connectedRecipients.length === 1 ? "person" : "people"} will get a push notification
            </p>
          )}
        </div>

        <div className="px-6 py-4 max-h-[50vh] overflow-y-auto">
          {/* Non-connected recipients need manual links */}
          {needsLinks.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-gray-600 mb-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                <span className="font-medium">Send these links manually:</span>
              </div>

              {needsLinks.map((recipient) => (
                <div
                  key={recipient.name}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                      <span className="text-gray-500 font-semibold">
                        {recipient.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span className="font-medium">{formatName(recipient.name)}</span>
                  </div>
                  <button
                    onClick={() => copyLink(recipient)}
                    className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                      copiedId === recipient.name
                        ? "bg-green-100 text-green-700"
                        : "bg-blue-100 text-blue-700 hover:bg-blue-200"
                    }`}
                  >
                    {copiedId === recipient.name ? "Copied!" : "Copy Link"}
                  </button>
                </div>
              ))}

              {/* Share all button */}
              {needsLinks.length > 1 && (
                <button
                  onClick={shareAll}
                  className="w-full py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                  {copiedId === "all" ? "Copied All!" : "Share All Links"}
                </button>
              )}
            </div>
          )}

          {/* Tip about QR codes */}
          {needsLinks.length > 0 && (
            <div className="mt-4 p-4 bg-amber-50 rounded-xl border border-amber-200">
              <div className="flex gap-3">
                <span className="text-2xl">💡</span>
                <div>
                  <p className="text-amber-800 font-medium text-sm">
                    Want easier sharing next time?
                  </p>
                  <p className="text-amber-600 text-sm mt-1">
                    Have friends scan your QR code so they connect to you. Future dumps will go straight to their app!
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* All connected - simple success */}
          {needsLinks.length === 0 && (
            <div className="text-center py-4">
              <div className="text-4xl mb-3">✨</div>
              <p className="text-gray-600">
                All recipients are connected and will receive a push notification!
              </p>
            </div>
          )}
        </div>

        {/* Done button */}
        <div className="px-6 py-4 border-t border-gray-100">
          <button
            onClick={onClose}
            className="w-full py-4 bg-gradient-to-r from-amber-400 to-orange-500 text-white font-bold text-lg rounded-2xl shadow-lg shadow-orange-500/30 active:scale-95 transition-transform"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
