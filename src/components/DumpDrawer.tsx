"use client";

import { useEffect, useState } from "react";

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
  memes: DumpMeme[];
}

interface Group {
  id: string;
  name: string;
  members: { id: string; name: string; email: string }[];
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
  const [sending, setSending] = useState(false);
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroupIds, setSelectedGroupIds] = useState<Set<string>>(new Set());
  const [manualEmails, setManualEmails] = useState("");
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [editingName, setEditingName] = useState(false);
  const [showMemePicker, setShowMemePicker] = useState(false);
  const [libraryMemes, setLibraryMemes] = useState<LibraryMeme[]>([]);

  useEffect(() => {
    if (dumpId) {
      setLoading(true);
      setSelectedGroupIds(new Set());
      setManualEmails("");
      setError("");
      setShowMemePicker(false);
      setEditingName(false);

      Promise.all([
        fetch(`/api/dumps/${dumpId}`).then(r => r.json()),
        fetch("/api/groups").then(r => r.json()),
        fetch("/api/memes").then(r => r.json()),
      ])
        .then(([dumpData, groupsData, memesData]) => {
          setDump(dumpData.dump);
          setGroups(groupsData.groups || []);
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

  function getUniqueRecipients(): string[] {
    const emails = new Set<string>();
    for (const groupId of selectedGroupIds) {
      const group = groups.find(g => g.id === groupId);
      if (group) group.members.forEach(m => emails.add(m.email.toLowerCase()));
    }
    manualEmails.split(/[,\n]/).map(e => e.trim().toLowerCase()).filter(e => e.includes("@")).forEach(e => emails.add(e));
    return Array.from(emails);
  }

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

  async function handleSendDump() {
    const recipients = getUniqueRecipients();
    if (recipients.length === 0) { setError("Add at least one person"); return; }
    if (!dump || dump.memes.length === 0) { setError("Add at least one meme"); return; }

    setSending(true);
    setError("");
    try {
      // Save name if changed
      if (name !== dump.note) {
        await fetch(`/api/dumps/${dumpId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ note: name || null }),
        });
      }
      const res = await fetch(`/api/dumps/${dumpId}/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipients }),
      });
      if (!res.ok) throw new Error("Failed to send");
      onUpdate?.();
      onClose();
    } catch (err) {
      setError("Something went wrong");
    } finally {
      setSending(false);
    }
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

  if (!dumpId) return null;

  const recipientCount = getUniqueRecipients().length;
  const dumpMemeIds = new Set(dump?.memes.map(m => m.id) || []);
  const availableMemes = libraryMemes.filter(m => !dumpMemeIds.has(m.id));

  // 3x3 grid slots
  const gridSlots = Array(9).fill(null).map((_, i) => dump?.memes[i] || null);

  return (
    <div className="fixed inset-0 z-[60] bg-black">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-14 pb-2">
        <button onClick={onClose} className="text-white/70 text-base font-medium">Cancel</button>
        <div className="flex-1" />
        <button
          onClick={handleSendDump}
          disabled={sending || !dump || dump.memes.length === 0 || recipientCount === 0}
          className="px-4 py-1.5 bg-gradient-to-r from-amber-400 to-orange-500 disabled:opacity-40 text-black font-bold text-sm rounded-full"
        >
          {sending ? "..." : "Send"}
        </button>
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
          <div className="mb-3">
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

          {/* Send to - compact */}
          <div className="bg-white/5 rounded-xl p-3 mb-3">
            <p className="text-white/40 text-xs font-medium uppercase tracking-wider mb-2">Send to</p>

            <div className="flex flex-wrap gap-2 mb-2">
              {groups.map(group => (
                <button
                  key={group.id}
                  onClick={() => setSelectedGroupIds(prev => {
                    const next = new Set(prev);
                    next.has(group.id) ? next.delete(group.id) : next.add(group.id);
                    return next;
                  })}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                    selectedGroupIds.has(group.id)
                      ? "bg-blue-500 text-white"
                      : "bg-white/10 text-white/70"
                  }`}
                >
                  {group.name} ({group.members.length})
                </button>
              ))}
            </div>

            <input
              type="text"
              value={manualEmails}
              onChange={e => setManualEmails(e.target.value)}
              placeholder="or type emails..."
              className="w-full bg-white/5 text-white placeholder-white/30 px-3 py-2 rounded-lg border-0 focus:outline-none text-sm"
            />

            {recipientCount > 0 && (
              <p className="text-blue-400 text-xs mt-2">{recipientCount} people</p>
            )}
          </div>

          {error && <p className="text-red-400 text-center text-sm mb-3">{error}</p>}

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
    </div>
  );
}
