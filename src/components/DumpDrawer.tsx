"use client";

import { useEffect, useState } from "react";
import SendDumpModal from "./SendDumpModal";
import { Meme } from "@/lib/db";

interface DumpMeme {
  id: string;
  file_url: string;
  file_type: string;
}

interface DumpDetail {
  id: string;
  note: string | null;
  created_at: string;
  is_draft: boolean;
  share_token: string | null;
  memes: DumpMeme[];
}

interface LibraryMeme {
  id: string;
  file_url: string;
  file_type: string;
}

interface DumpDrawerProps {
  dumpId: string | null;
  onClose: () => void;
  onUpdate?: () => void;
}

export default function DumpDrawer({ dumpId, onClose, onUpdate }: DumpDrawerProps) {
  const [dump, setDump] = useState<DumpDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [editingName, setEditingName] = useState(false);
  const [showMemePicker, setShowMemePicker] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  const [libraryMemes, setLibraryMemes] = useState<LibraryMeme[]>([]);
  const [copied, setCopied] = useState(false);
  const [generatingLink, setGeneratingLink] = useState(false);

  useEffect(() => {
    if (dumpId) {
      setLoading(true);
      setShowMemePicker(false);
      setEditingName(false);
      setCopied(false);

      Promise.all([
        fetch(`/api/dumps/${dumpId}`).then(r => r.json()),
        fetch("/api/memes").then(r => r.json()),
      ])
        .then(([dumpData, memesData]) => {
          setDump(dumpData.dump);
          setLibraryMemes(memesData.memes || []);
          setName(dumpData.dump?.note || "");
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    } else {
      setDump(null);
    }
  }, [dumpId]);

  useEffect(() => {
    if (dumpId) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [dumpId]);

  async function handleSaveName() {
    if (!dumpId || name === dump?.note) {
      setEditingName(false);
      return;
    }
    try {
      await fetch(`/api/dumps/${dumpId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: name || null }),
      });
      setDump(prev => prev ? { ...prev, note: name || null } : null);
      onUpdate?.();
    } catch (err) {
      console.error(err);
    }
    setEditingName(false);
  }

  async function handleRemoveMeme(memeId: string) {
    if (!dumpId) return;
    try {
      await fetch(`/api/dumps/${dumpId}/memes/${memeId}`, { method: "DELETE" });
      setDump(prev => prev ? { ...prev, memes: prev.memes.filter(m => m.id !== memeId) } : null);
      onUpdate?.();
    } catch (err) {
      console.error(err);
    }
  }

  async function handleAddMeme(meme: LibraryMeme) {
    if (!dumpId) return;
    try {
      await fetch("/api/dumps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memeIds: [meme.id], existingDumpId: dumpId, isDraft: true }),
      });
      setDump(prev => prev ? { ...prev, memes: [...prev.memes, meme] } : null);
      onUpdate?.();
    } catch (err) {
      console.error(err);
    }
  }

  async function generateShareLink() {
    if (!dumpId || !dump) return;

    setGeneratingLink(true);
    try {
      // Save name first if changed
      if (name !== dump.note) {
        await fetch(`/api/dumps/${dumpId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ note: name || null }),
        });
      }

      const res = await fetch(`/api/dumps/${dumpId}/share`, {
        method: "POST",
      });
      const data = await res.json();

      if (data.shareToken) {
        setDump(prev => prev ? { ...prev, share_token: data.shareToken, is_draft: false } : null);
        onUpdate?.();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setGeneratingLink(false);
    }
  }

  async function copyLink() {
    if (!dump?.share_token) return;

    const link = `${window.location.origin}/d/${dump.share_token}`;

    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = link;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  async function handleShare() {
    if (!dump?.share_token) return;

    const link = `${window.location.origin}/d/${dump.share_token}`;
    const title = dump.note || "Meme Dump";

    if (navigator.share) {
      try {
        await navigator.share({
          title: `${title} - HitPost`,
          text: "Check out this meme dump!",
          url: link,
        });
      } catch (err) {
        // User cancelled or share failed, copy instead
        copyLink();
      }
    } else {
      copyLink();
    }
  }

  if (!dumpId) return null;

  const dumpMemeIds = new Set(dump?.memes.map(m => m.id) || []);
  const availableMemes = libraryMemes.filter(m => !dumpMemeIds.has(m.id));
  const shareLink = dump?.share_token ? `${typeof window !== 'undefined' ? window.location.origin : ''}/d/${dump.share_token}` : null;

  // 3x3 grid slots
  const gridSlots = Array(9).fill(null).map((_, i) => dump?.memes[i] || null);

  return (
    <div className="fixed inset-0 z-[60] bg-black">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-14 pb-2">
        <button onClick={onClose} className="text-white/70 text-base font-medium">Done</button>
        <div className="flex-1" />
        {dump && dump.memes.length > 0 && (
          dump.share_token ? (
            <button
              onClick={handleShare}
              className="px-4 py-1.5 bg-gradient-to-r from-amber-400 to-orange-500 text-black font-bold text-sm rounded-full flex items-center gap-1.5"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              Share
            </button>
          ) : (
            <button
              onClick={generateShareLink}
              disabled={generatingLink}
              className="px-4 py-1.5 bg-gradient-to-r from-amber-400 to-orange-500 disabled:opacity-50 text-black font-bold text-sm rounded-full"
            >
              {generatingLink ? "..." : "Get Link"}
            </button>
          )
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-white/50 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : dump ? (
        <div className="h-[calc(100vh-80px)] overflow-y-auto px-4 pb-8">
          {/* 3x3 Meme Grid */}
          <div className="mb-4">
            <div className="grid grid-cols-3 gap-1 rounded-xl overflow-hidden bg-white/5">
              {gridSlots.map((meme, i) => (
                <div key={i} className="aspect-square relative bg-white/5">
                  {meme ? (
                    <>
                      {meme.file_type === "video" ? (
                        <video src={meme.file_url} className="w-full h-full object-cover" muted />
                      ) : (
                        <img src={meme.file_url} alt="" className="w-full h-full object-cover" />
                      )}
                      <button
                        onClick={() => handleRemoveMeme(meme.id)}
                        className="absolute top-1 right-1 w-5 h-5 bg-black/70 rounded-full flex items-center justify-center text-white text-xs"
                      >
                        ×
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setShowMemePicker(true)}
                      className="w-full h-full flex items-center justify-center text-white/20 text-2xl"
                    >
                      +
                    </button>
                  )}
                </div>
              ))}
            </div>
            {dump.memes.length > 9 && (
              <p className="text-center text-white/40 text-xs mt-1">+{dump.memes.length - 9} more</p>
            )}
          </div>

          {/* Title - inline editable */}
          <div className="mb-4">
            {editingName ? (
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                onBlur={handleSaveName}
                onKeyDown={e => e.key === "Enter" && handleSaveName()}
                autoFocus
                className="w-full bg-transparent text-white text-lg font-semibold border-b border-white/30 focus:outline-none focus:border-white/60 pb-1"
                placeholder="Untitled dump"
              />
            ) : (
              <button
                onClick={() => setEditingName(true)}
                className="text-white text-lg font-semibold flex items-center gap-2"
              >
                {name || "Untitled dump"}
                <span className="text-white/30 text-sm">✎</span>
              </button>
            )}
          </div>

          {/* Share Link Section */}
          {shareLink ? (
            <div className="bg-white/5 rounded-xl p-4 mb-4">
              <p className="text-white/40 text-xs font-medium uppercase tracking-wider mb-2">Share Link</p>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={shareLink}
                  readOnly
                  className="flex-1 bg-white/10 text-white/70 px-3 py-2 rounded-lg text-sm font-mono truncate"
                />
                <button
                  onClick={copyLink}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    copied
                      ? "bg-green-500 text-white"
                      : "bg-white/10 text-white hover:bg-white/20"
                  }`}
                >
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>

              <p className="text-white/40 text-xs mt-3">
                Anyone with this link can view your memes
              </p>
            </div>
          ) : (
            <div className="bg-white/5 rounded-xl p-4 mb-4">
              <p className="text-white/40 text-xs font-medium uppercase tracking-wider mb-2">Share</p>
              <p className="text-white/60 text-sm">
                Tap "Get Link" to create a shareable link for this dump
              </p>
            </div>
          )}

          {/* Send to People - Primary action */}
          {dump.memes.length > 0 && (
            <button
              onClick={() => setShowSendModal(true)}
              className="w-full py-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold rounded-2xl mb-4 flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
              Send to People
            </button>
          )}

          {/* Add more memes link */}
          <button
            onClick={() => setShowMemePicker(true)}
            className="w-full text-center text-blue-400 text-sm font-medium py-2"
          >
            + Add more memes
          </button>
        </div>
      ) : (
        <div className="text-center py-20 text-white/50">Could not load dump</div>
      )}

      {/* Meme Picker */}
      {showMemePicker && (
        <div className="fixed inset-0 z-[80] bg-black flex flex-col">
          <div className="flex items-center justify-between px-4 pt-14 pb-4">
            <button onClick={() => setShowMemePicker(false)} className="text-white/70">Cancel</button>
            <span className="text-white font-bold">Add Memes</span>
            <button onClick={() => setShowMemePicker(false)} className="text-blue-400 font-semibold">
              Done
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-1">
            <div className="grid grid-cols-4 gap-0.5">
              {availableMemes.map(meme => (
                <button
                  key={meme.id}
                  onClick={() => handleAddMeme(meme)}
                  className="aspect-square relative"
                >
                  {meme.file_type === "video" ? (
                    <video src={meme.file_url} className="w-full h-full object-cover" muted />
                  ) : (
                    <img src={meme.file_url} alt="" className="w-full h-full object-cover" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Send Modal */}
      {dump && (
        <SendDumpModal
          isOpen={showSendModal}
          onClose={() => setShowSendModal(false)}
          selectedMemes={dump.memes.map(m => ({
            id: m.id,
            file_url: m.file_url,
            file_type: m.file_type,
            user_id: "",
            created_at: "",
          } as Meme))}
          onSent={() => {
            setShowSendModal(false);
            onUpdate?.();
            onClose();
          }}
        />
      )}
    </div>
  );
}
