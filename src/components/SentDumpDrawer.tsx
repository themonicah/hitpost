"use client";

import { useEffect, useState } from "react";
import FunLoader from "./FunLoader";

interface Recipient {
  id: string;
  name: string;
  email: string | null;
  token: string;
  viewed_at: string | null;
  view_count: number;
  recipient_note: string | null;
  reactions: { emoji: string }[];
}

interface Meme {
  id: string;
  file_url: string;
  file_type: string;
}

interface DumpDetail {
  id: string;
  note: string | null;
  created_at: string;
  memes: Meme[];
  recipients: Recipient[];
}

interface SentDumpDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  dumpId: string | null;
}

// Format name as "First L." or just "Name" if single word
function formatName(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0];
  const firstName = parts[0];
  const lastName = parts[parts.length - 1];
  return `${firstName} ${lastName.charAt(0).toUpperCase()}.`;
}

function CopyButton({ token }: { token: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    const link = `${window.location.origin}/view/${token}`;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement("textarea");
      textarea.value = link;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <button
      onClick={handleCopy}
      className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
        copied
          ? "bg-green-100 text-green-700"
          : "bg-blue-100 text-blue-700 hover:bg-blue-200"
      }`}
    >
      {copied ? "Copied!" : "Copy Link"}
    </button>
  );
}

export default function SentDumpDrawer({ isOpen, onClose, dumpId }: SentDumpDrawerProps) {
  const [dump, setDump] = useState<DumpDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedPreview, setCopiedPreview] = useState(false);

  useEffect(() => {
    if (isOpen && dumpId) {
      setLoading(true);
      setError(null);
      fetch(`/api/dumps/${dumpId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.dump) {
            setDump(data.dump);
          } else {
            setError("Failed to load dump");
          }
        })
        .catch(() => setError("Network error"))
        .finally(() => setLoading(false));
    }
  }, [isOpen, dumpId]);

  useEffect(() => {
    if (!isOpen) {
      setDump(null);
      setLoading(true);
      setError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const viewedCount = dump?.recipients.filter((r) => r.viewed_at).length || 0;

  async function copyPreviewLink() {
    if (!dumpId) return;
    const previewUrl = `${window.location.origin}/dumps/${dumpId}`;
    try {
      await navigator.clipboard.writeText(previewUrl);
      setCopiedPreview(true);
      setTimeout(() => setCopiedPreview(false), 2000);
    } catch (err) {
      console.error("Failed to copy preview:", err);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] animate-fadeIn">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className="absolute inset-x-0 bottom-0 animate-tray-up"
        style={{ zIndex: 61 }}
      >
        <div className="w-full max-w-lg mx-auto bg-white rounded-t-3xl max-h-[85vh] overflow-hidden flex flex-col shadow-2xl">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <FunLoader />
            </div>
          ) : error ? (
            <div className="text-center py-20">
              <p className="text-red-500">{error}</p>
              <button
                onClick={onClose}
                className="mt-4 px-6 py-2 bg-gray-100 rounded-xl font-medium"
              >
                Close
              </button>
            </div>
          ) : dump ? (
            <>
              {/* Header with splayed photos - matches LinkSharingModal style */}
              <div className="bg-gradient-to-br from-amber-400 to-orange-500 px-6 pt-6 pb-8 text-center relative">
                {/* Close button */}
                <button
                  onClick={onClose}
                  className="absolute top-4 left-4 w-8 h-8 flex items-center justify-center text-white/80 hover:text-white bg-white/20 rounded-full"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>

                {/* Splayed photo stack */}
                {dump.memes.length > 0 && (
                  <div className="relative w-24 h-20 mx-auto mb-4">
                    {dump.memes.slice(0, 3).map((meme, i) => (
                      <div
                        key={meme.id}
                        className="absolute w-14 h-14 rounded-lg overflow-hidden bg-white shadow-lg border-2 border-white"
                        style={{
                          transform: `rotate(${(i - 1) * 12}deg)`,
                          left: `${20 + i * 12}px`,
                          top: `${i * 4}px`,
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
                )}

                <h2 className="text-2xl font-bold text-white">
                  {dump.note || "Sent Dump"}
                </h2>
                <p className="text-white/80 text-sm mt-2">
                  {viewedCount}/{dump.recipients.length} opened · {dump.memes.length} memes
                </p>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto px-6 py-4">
                {/* Recipients section */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-gray-600 mb-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="font-medium">Recipients</span>
                  </div>

                  {dump.recipients.map((recipient) => {
                    const hasViewed = !!recipient.viewed_at;

                    return (
                      <div
                        key={recipient.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-xl"
                      >
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              hasViewed
                                ? "bg-green-100"
                                : "bg-gray-200"
                            }`}>
                              <span className={`font-semibold text-sm ${
                                hasViewed ? "text-green-600" : "text-gray-500"
                              }`}>
                                {(recipient.name || "?").charAt(0).toUpperCase()}
                              </span>
                            </div>
                            {/* Status indicator */}
                            <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white ${
                              hasViewed ? "bg-green-500" : "bg-gray-300"
                            }`} />
                          </div>
                          <div>
                            <span className="font-medium block">{formatName(recipient.name || "Unknown")}</span>
                            <span className="text-xs text-gray-500">
                              {hasViewed
                                ? `Opened · ${recipient.view_count} view${recipient.view_count !== 1 ? "s" : ""}`
                                : "Not opened yet"}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {recipient.reactions.length > 0 && (
                            <div className="flex gap-0.5">
                              {recipient.reactions.map((r, i) => (
                                <span key={i} className="text-lg">{r.emoji}</span>
                              ))}
                            </div>
                          )}
                          <CopyButton token={recipient.token} />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Preview link */}
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <button
                    onClick={copyPreviewLink}
                    className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${
                      copiedPreview
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
                      copiedPreview ? "text-green-600" : "text-blue-500"
                    }`}>
                      {copiedPreview ? "Copied!" : "Copy"}
                    </span>
                  </button>
                </div>

                {/* Timestamp */}
                <p className="text-center text-xs text-gray-400 mt-4">
                  Sent {new Date(dump.created_at).toLocaleString()}
                </p>
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
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
