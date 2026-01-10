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
  dumpName?: string;
  previewUrls?: string[];
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
  dumpId,
  dumpName,
  previewUrls = [],
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

  async function copyPreviewLink() {
    const previewUrl = `${window.location.origin}/dumps/${dumpId}`;
    try {
      await navigator.clipboard.writeText(previewUrl);
      setCopiedId("preview");
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error("Failed to copy preview:", err);
    }
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 animate-fadeIn">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      <div className="relative w-full max-w-md bg-white rounded-3xl overflow-hidden shadow-2xl animate-scaleIn">
        {/* Header with splayed photos */}
        <div className="bg-gradient-to-br from-amber-400 to-orange-500 px-6 pt-6 pb-8 text-center">
          {/* Splayed photo stack */}
          {previewUrls.length > 0 && (
            <div className="relative w-24 h-20 mx-auto mb-4">
              {previewUrls.slice(0, 3).map((url, i) => (
                <div
                  key={i}
                  className="absolute w-14 h-14 rounded-lg overflow-hidden bg-white shadow-lg border-2 border-white"
                  style={{
                    transform: `rotate(${(i - 1) * 12}deg)`,
                    left: `${20 + i * 12}px`,
                    top: `${i * 4}px`,
                    zIndex: 3 - i,
                  }}
                >
                  <img src={url} alt="" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          )}

          <div className="text-4xl mb-2">🎉</div>
          <h2 className="text-2xl font-bold text-white">Dump Sent!</h2>
          {dumpName && (
            <p className="text-white/90 font-medium mt-1">{dumpName}</p>
          )}
          {connectedRecipients.length > 0 && (
            <p className="text-white/70 text-sm mt-2">
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

          {/* Preview link */}
          <div className="mt-4 pt-4 border-t border-gray-100">
            <button
              onClick={copyPreviewLink}
              className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${
                copiedId === "preview"
                  ? "bg-green-50 border border-green-200"
                  : "bg-gray-50 hover:bg-gray-100"
              }`}
            >
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                <span className="text-gray-700 font-medium text-sm">Preview link</span>
              </div>
              <span className={`text-sm font-semibold ${
                copiedId === "preview" ? "text-green-600" : "text-blue-500"
              }`}>
                {copiedId === "preview" ? "Copied!" : "Copy"}
              </span>
            </button>
          </div>
        </div>

        {/* Done button */}
        <div className="px-6 py-4 border-t border-gray-100">
          <button
            onClick={onClose}
            className="w-full py-4 bg-orange-500 text-white font-bold text-lg rounded-2xl hover:bg-orange-600 active:scale-95 transition-all"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
