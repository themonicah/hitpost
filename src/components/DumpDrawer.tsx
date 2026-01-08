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
  const [saving, setSaving] = useState(false);
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroupIds, setSelectedGroupIds] = useState<Set<string>>(new Set());
  const [manualEmails, setManualEmails] = useState("");
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [note, setNote] = useState("");
  const [showMemePicker, setShowMemePicker] = useState(false);
  const [libraryMemes, setLibraryMemes] = useState<LibraryMeme[]>([]);

  useEffect(() => {
    if (dumpId) {
      setLoading(true);
      setSelectedGroupIds(new Set());
      setManualEmails("");
      setError("");
      setShowMemePicker(false);

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
          setNote("");
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

  async function handleSaveDraft() {
    if (!dumpId) return;
    setSaving(true);
    try {
      await fetch(`/api/dumps/${dumpId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: name || null }),
      });
      onUpdate?.();
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  async function handleSendDump() {
    const recipients = getUniqueRecipients();
    if (recipients.length === 0) { setError("Add at least one person"); return; }
    if (!dump || dump.memes.length === 0) { setError("Add at least one meme"); return; }

    setSending(true);
    setError("");
    try {
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

  return (
    <div className="fixed inset-0 z-[60] bg-black">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-14 pb-4">
        <button onClick={onClose} className="text-white/70 text-lg">Cancel</button>
        <h1 className="text-white font-bold text-xl">Edit Dump</h1>
        <div className="w-16" />
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-white/50 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : dump ? (
        <>
          <div className="h-[calc(100vh-180px)] overflow-y-auto px-4 space-y-4">
            {/* Name input */}
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Name this dump..."
              className="w-full bg-white/10 text-white placeholder-white/40 text-xl font-medium px-5 py-4 rounded-2xl border-0 focus:outline-none focus:ring-2 focus:ring-white/30"
            />

            {/* Recipients section */}
            <div className="bg-white/10 rounded-2xl p-4 space-y-3">
              <p className="text-white/50 text-sm font-medium uppercase tracking-wider">Send to</p>

              {groups.map(group => (
                <button
                  key={group.id}
                  onClick={() => setSelectedGroupIds(prev => {
                    const next = new Set(prev);
                    next.has(group.id) ? next.delete(group.id) : next.add(group.id);
                    return next;
                  })}
                  className={`w-full flex items-center justify-between p-4 rounded-xl transition-all ${
                    selectedGroupIds.has(group.id) ? "bg-blue-500 text-white" : "bg-white/10 text-white"
                  }`}
                >
                  <span className="font-semibold">{group.name}</span>
                  <span className="text-sm opacity-70">{group.members.length}</span>
                </button>
              ))}

              <textarea
                value={manualEmails}
                onChange={e => setManualEmails(e.target.value)}
                placeholder="Or type emails..."
                className="w-full bg-white/10 text-white placeholder-white/40 px-4 py-3 rounded-xl border-0 focus:outline-none resize-none text-base"
                rows={2}
              />

              {recipientCount > 0 && (
                <p className="text-blue-400 text-sm font-medium">{recipientCount} people selected</p>
              )}
            </div>

            {/* Note input */}
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Add a note..."
              className="w-full bg-white/10 text-white placeholder-white/40 text-lg px-5 py-4 rounded-2xl border-0 focus:outline-none focus:ring-2 focus:ring-white/30 resize-none"
              rows={2}
            />

            {/* Memes section */}
            <div className="bg-white/10 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-4">
                <p className="text-white/50 text-sm font-medium uppercase tracking-wider">
                  Memes {dump.memes.length > 0 && `(${dump.memes.length})`}
                </p>
                <button onClick={() => setShowMemePicker(true)} className="text-blue-400 font-semibold">
                  + Add
                </button>
              </div>

              {dump.memes.length > 0 ? (
                <div className="grid grid-cols-3 gap-2">
                  {dump.memes.map(meme => (
                    <div key={meme.id} className="aspect-square relative rounded-xl overflow-hidden">
                      {meme.file_type === "video" ? (
                        <video src={meme.file_url} className="w-full h-full object-cover" muted />
                      ) : (
                        <img src={meme.file_url} alt="" className="w-full h-full object-cover" />
                      )}
                      <button
                        onClick={() => handleRemoveMeme(meme.id)}
                        className="absolute top-1 right-1 w-7 h-7 bg-black/70 rounded-full flex items-center justify-center"
                      >
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <button
                  onClick={() => setShowMemePicker(true)}
                  className="w-full py-12 border-2 border-dashed border-white/20 rounded-xl text-center"
                >
                  <p className="text-3xl mb-2">📸</p>
                  <p className="text-white/50">Tap to add memes</p>
                </button>
              )}
            </div>

            {error && <p className="text-red-400 text-center font-medium">{error}</p>}
          </div>

          {/* Bottom buttons */}
          <div className="absolute bottom-0 left-0 right-0 p-4 pb-8 space-y-3 bg-gradient-to-t from-black via-black to-transparent pt-8">
            <button
              onClick={handleSendDump}
              disabled={sending || dump.memes.length === 0}
              className="w-full py-4 bg-gradient-to-r from-amber-400 to-orange-500 disabled:opacity-40 text-black font-bold text-lg rounded-2xl"
            >
              {sending ? "Sending..." : `Send Dump${dump.memes.length > 0 ? ` (${dump.memes.length})` : ""}`}
            </button>
            <button
              onClick={handleSaveDraft}
              disabled={saving}
              className="w-full py-3 bg-white/10 text-white font-semibold rounded-2xl"
            >
              {saving ? "Saving..." : "Save Draft"}
            </button>
          </div>

          {/* Meme Picker */}
          {showMemePicker && (
            <div className="fixed inset-0 z-[80] bg-black/95 flex flex-col">
              <div className="flex items-center justify-between px-4 pt-14 pb-4">
                <button onClick={() => setShowMemePicker(false)} className="text-white/70">Cancel</button>
                <span className="text-white font-bold text-lg">Select Memes</span>
                <button onClick={() => setShowMemePicker(false)} className="text-blue-400 font-semibold">
                  Done
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-2">
                <div className="grid grid-cols-3 gap-1">
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
        </>
      ) : (
        <div className="text-center py-20 text-white/50">Could not load dump</div>
      )}
    </div>
  );
}
