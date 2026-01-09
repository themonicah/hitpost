"use client";

import { useEffect, useState } from "react";
import FunLoader from "@/components/FunLoader";

interface DumpDetail {
  id: string;
  note: string | null;
  created_at: string;
  memes: { id: string; file_url: string; file_type: string }[];
  recipients: {
    email: string;
    viewed_at: string | null;
    view_count: number;
    reactions: { emoji: string }[];
  }[];
}

interface ActivityDetailDrawerProps {
  dumpId: string | null;
  onClose: () => void;
}

export default function ActivityDetailDrawer({ dumpId, onClose }: ActivityDetailDrawerProps) {
  const [dump, setDump] = useState<DumpDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  async function fetchDumpDetails() {
    if (!dumpId) return;
    setLoading(true);
    setError(false);
    try {
      const res = await fetch(`/api/dumps/${dumpId}`);
      if (res.ok) {
        const data = await res.json();
        setDump(data.dump);
      } else {
        setError(true);
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (dumpId) {
      fetchDumpDetails();
    } else {
      setDump(null);
      setError(false);
    }
  }, [dumpId]);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (dumpId) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [dumpId]);

  if (!dumpId) return null;

  const viewedCount = dump?.recipients.filter((r) => r.viewed_at).length || 0;
  const totalRecipients = dump?.recipients.length || 0;

  return (
    <div className="fixed inset-0 z-[60] animate-fadeIn">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer on mobile, Modal on desktop */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="dump-detail-title"
        className="absolute bottom-0 left-0 right-0 sm:bottom-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:max-w-lg sm:w-full sm:mx-4 bg-white dark:bg-gray-900 rounded-t-3xl sm:rounded-3xl max-h-[85vh] overflow-hidden animate-slideUp sm:animate-scaleIn"
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 bg-gray-300 dark:bg-gray-700 rounded-full" aria-hidden="true" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 pb-3 border-b border-gray-100 dark:border-gray-800">
          <h2 id="dump-detail-title" className="font-semibold text-lg">Dump Details</h2>
          <button
            onClick={onClose}
            aria-label="Close dump details"
            className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-4 pb-safe space-y-4 max-h-[calc(85vh-80px)]">
          {loading ? (
            <div className="flex justify-center py-12">
              <FunLoader />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="text-4xl mb-3">😵</div>
              <p className="text-gray-500 mb-4">Failed to load dump details</p>
              <button
                onClick={fetchDumpDetails}
                className="px-5 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-full font-medium min-h-[44px] transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : dump ? (
            <>
              {/* Stats */}
              <div className="flex items-center justify-around bg-gray-50 dark:bg-gray-800 rounded-2xl p-4">
                <div className="text-center">
                  <p className="text-2xl font-bold">{dump.memes.length}</p>
                  <p className="text-xs text-gray-500">memes</p>
                </div>
                <div className="w-px h-10 bg-gray-200 dark:bg-gray-700" />
                <div className="text-center">
                  <p className="text-2xl font-bold">{viewedCount}/{totalRecipients}</p>
                  <p className="text-xs text-gray-500">opened</p>
                </div>
                <div className="w-px h-10 bg-gray-200 dark:bg-gray-700" />
                <div className="text-center">
                  <p className="text-2xl font-bold">
                    {dump.recipients.reduce((sum, r) => sum + (r.reactions?.length || 0), 0)}
                  </p>
                  <p className="text-xs text-gray-500">reactions</p>
                </div>
              </div>

              {/* Note */}
              {dump.note && (
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3">
                  <p className="text-sm text-gray-600 dark:text-gray-400">"{dump.note}"</p>
                </div>
              )}

              {/* Memes preview */}
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Memes</h3>
                <div className="grid grid-cols-4 gap-1 rounded-xl overflow-hidden">
                  {dump.memes.slice(0, 8).map((meme) => (
                    <div key={meme.id} className="aspect-square bg-gray-100 dark:bg-gray-800">
                      {meme.file_type === "video" ? (
                        <video src={meme.file_url} className="w-full h-full object-cover" muted playsInline aria-label="Video meme" />
                      ) : (
                        <img src={meme.file_url} alt="Meme preview" className="w-full h-full object-cover" />
                      )}
                    </div>
                  ))}
                  {dump.memes.length > 8 && (
                    <div className="aspect-square bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-500 text-sm font-medium">
                      +{dump.memes.length - 8}
                    </div>
                  )}
                </div>
              </div>

              {/* Recipients */}
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Recipients</h3>
                <div className="space-y-2">
                  {dump.recipients.map((recipient, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-xl"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${recipient.viewed_at ? "bg-green-500" : "bg-gray-300"}`} />
                        <div>
                          <p className="font-medium text-sm">{recipient.email.split("@")[0]}</p>
                          <p className="text-xs text-gray-500">
                            {recipient.viewed_at
                              ? `Viewed · ${recipient.view_count} time${recipient.view_count !== 1 ? "s" : ""}`
                              : "Not opened"}
                          </p>
                        </div>
                      </div>
                      {recipient.reactions && recipient.reactions.length > 0 && (
                        <div className="flex gap-0.5">
                          {recipient.reactions.map((r, j) => (
                            <span key={j} className="text-lg">{r.emoji}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Timestamp */}
              <p className="text-center text-xs text-gray-400">
                Sent {new Date(dump.created_at).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </p>
            </>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <p>Could not load dump details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
