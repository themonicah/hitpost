"use client";

import { useEffect, useState } from "react";
import { Meme } from "@/lib/db";
import { useRouter } from "next/navigation";
import Confetti from "./Confetti";
import FunLoader from "./FunLoader";

interface Dump {
  id: string;
  note: string | null;
  created_at: string;
  meme_count: number;
  is_draft: boolean;
  preview_url?: string;
}

interface Group {
  id: string;
  name: string;
  members: { id: string; name: string; email: string }[];
}

interface AddToDumpModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedMemes: Meme[];
  onComplete?: () => void;
}

type View = "main" | "pick-dump" | "pick-recipients";

export default function AddToDumpModal({
  isOpen,
  onClose,
  selectedMemes,
  onComplete,
}: AddToDumpModalProps) {
  const router = useRouter();
  const [view, setView] = useState<View>("main");
  const [drafts, setDrafts] = useState<Dump[]>([]);
  const [selectedDump, setSelectedDump] = useState<Dump | null>(null);
  const [newDumpName, setNewDumpName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showConfetti, setShowConfetti] = useState(false);

  // Recipients state
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroupIds, setSelectedGroupIds] = useState<Set<string>>(new Set());
  const [manualNames, setManualNames] = useState("");

  // Fetch drafts and groups when modal opens
  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      Promise.all([
        fetch("/api/dumps?drafts=true").then(r => r.json()),
        fetch("/api/groups").then(r => r.json()),
      ])
        .then(([dumpsData, groupsData]) => {
          setDrafts(dumpsData.dumps?.filter((d: Dump) => d.is_draft) || []);
          setGroups(groupsData.groups || []);
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [isOpen]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setView("main");
      setSelectedDump(null);
      setNewDumpName("");
      setSelectedGroupIds(new Set());
      setManualNames("");
      setError("");
    }
  }, [isOpen]);

  function getUniqueRecipients(): { name: string }[] {
    const names = new Set<string>();
    for (const groupId of selectedGroupIds) {
      const group = groups.find((g) => g.id === groupId);
      if (group) {
        for (const member of group.members) {
          names.add(member.name);
        }
      }
    }
    const manualList = manualNames
      .split(/[,\n]/)
      .map((n) => n.trim())
      .filter((n) => n.length > 0);
    for (const name of manualList) {
      names.add(name);
    }
    return Array.from(names).map(name => ({ name }));
  }

  async function handleAdd(andSend: boolean = false) {
    setSaving(true);
    setError("");

    try {
      const recipients = andSend ? getUniqueRecipients() : [];

      if (andSend && recipients.length === 0) {
        setError("Pick someone to send to");
        setSaving(false);
        return;
      }

      const res = await fetch("/api/dumps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memeIds: selectedMemes.map((m) => m.id),
          note: newDumpName || null,
          recipients,
          isDraft: !andSend,
          existingDumpId: selectedDump?.id || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save");
      }

      const data = await res.json();

      if (andSend) {
        setShowConfetti(true);
        setTimeout(() => {
          onComplete?.();
          onClose();
          setShowConfetti(false);
          router.push(`/dumps/${data.dumpId}`);
        }, 1000);
      } else {
        onComplete?.();
        onClose();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  if (!isOpen) return null;

  const recipientCount = getUniqueRecipients().length;
  const dumpLabel = selectedDump ? (selectedDump.note || "Untitled") : "New Dump";

  // DUMP PICKER VIEW
  if (view === "pick-dump") {
    return (
      <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center animate-fadeIn">
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setView("main")} />

        <div className="relative w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl max-h-[90vh] overflow-hidden flex flex-col animate-slideUp sm:animate-scaleIn">
          {/* Header */}
          <div className="flex items-center px-4 py-3 border-b border-gray-200">
            <button
              onClick={() => setView("main")}
              className="w-10 h-10 -ml-2 flex items-center justify-center text-blue-500"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h2 className="flex-1 text-center font-semibold">Choose Dump</h2>
            <div className="w-10" />
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {/* New Dump option */}
            <button
              onClick={() => {
                setSelectedDump(null);
                setView("main");
              }}
              className="w-full flex items-center gap-3 px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors"
            >
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-500">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <span className="font-medium">New Dump</span>
              {!selectedDump && (
                <svg className="w-5 h-5 text-blue-500 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>

            {/* Existing drafts */}
            {drafts.map((draft) => (
              <button
                key={draft.id}
                onClick={() => {
                  setSelectedDump(draft);
                  setView("main");
                }}
                className="w-full flex items-center gap-3 px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors"
              >
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                  {draft.preview_url ? (
                    <img src={draft.preview_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-lg">📦</span>
                  )}
                </div>
                <div className="flex-1 text-left">
                  <p className="font-medium">{draft.note || "Untitled"}</p>
                  <p className="text-sm text-gray-500">{draft.meme_count} memes</p>
                </div>
                {selectedDump?.id === draft.id && (
                  <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            ))}

            {drafts.length === 0 && (
              <div className="px-4 py-8 text-center text-gray-500">
                No draft dumps yet
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // RECIPIENT PICKER VIEW
  if (view === "pick-recipients") {
    return (
      <>
        <Confetti active={showConfetti} />
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center animate-fadeIn">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setView("main")} />

          <div className="relative w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl max-h-[90vh] overflow-hidden flex flex-col animate-slideUp sm:animate-scaleIn">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
              <button
                onClick={() => setView("main")}
                className="text-blue-500 font-medium min-w-[60px]"
                disabled={saving}
              >
                Back
              </button>
              <h2 className="font-semibold">Send To</h2>
              <button
                onClick={() => handleAdd(true)}
                disabled={saving || recipientCount === 0}
                className="text-blue-500 font-semibold min-w-[60px] text-right disabled:text-gray-300"
              >
                {saving ? "..." : "Send"}
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 pb-safe space-y-4">
              {/* Groups */}
              {groups.length > 0 && (
                <div className="bg-gray-50 rounded-2xl overflow-hidden">
                  {groups.map((group, index) => (
                    <button
                      key={group.id}
                      onClick={() => {
                        setSelectedGroupIds(prev => {
                          const next = new Set(prev);
                          if (next.has(group.id)) next.delete(group.id);
                          else next.add(group.id);
                          return next;
                        });
                      }}
                      className={`w-full flex items-center justify-between px-4 py-3 ${
                        index < groups.length - 1 ? "border-b border-gray-200" : ""
                      }`}
                    >
                      <span className="font-medium">{group.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">{group.members.length}</span>
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                          selectedGroupIds.has(group.id) ? "bg-blue-500" : "bg-gray-200"
                        }`}>
                          {selectedGroupIds.has(group.id) && (
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Manual names */}
              <div className="bg-gray-50 rounded-2xl p-4">
                <label className="text-sm font-medium text-gray-500 mb-2 block">
                  Or add people:
                </label>
                <textarea
                  value={manualNames}
                  onChange={(e) => setManualNames(e.target.value)}
                  placeholder="Mom, Dad, Best Friend"
                  className="w-full px-3 py-2 bg-white rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  rows={2}
                />
              </div>

              {recipientCount > 0 && (
                <p className="text-center text-sm text-gray-500">
                  Sending to {recipientCount} {recipientCount === 1 ? "person" : "people"}
                </p>
              )}

              {error && <p className="text-red-500 text-sm text-center">{error}</p>}
            </div>
          </div>
        </div>
      </>
    );
  }

  // MAIN VIEW
  return (
    <>
      <Confetti active={showConfetti} />
      <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center animate-fadeIn">
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

        <div className="relative w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl max-h-[90vh] overflow-hidden flex flex-col animate-slideUp sm:animate-scaleIn">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
            <button
              onClick={onClose}
              className="text-blue-500 font-medium min-w-[60px]"
              disabled={saving}
            >
              Cancel
            </button>
            <h2 className="font-semibold">Add to Dump</h2>
            <button
              onClick={() => handleAdd(false)}
              disabled={saving}
              className="text-blue-500 font-semibold min-w-[60px] text-right disabled:text-gray-300"
            >
              {saving ? "..." : "Add"}
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 pb-safe space-y-4">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <FunLoader />
              </div>
            ) : (
              <>
                {/* Photo preview - stacked style */}
                <div className="flex flex-col items-center">
                  <div className="relative w-32 h-32 mb-2">
                    {selectedMemes.slice(0, 3).map((meme, i) => (
                      <div
                        key={meme.id}
                        className="absolute w-28 h-28 rounded-2xl overflow-hidden bg-gray-100 shadow-lg"
                        style={{
                          transform: `rotate(${(i - 1) * 6}deg)`,
                          top: `${i * 4}px`,
                          left: `${i * 4}px`,
                          zIndex: 3 - i,
                        }}
                      >
                        {meme.file_type === "video" ? (
                          <video src={meme.file_url} className="w-full h-full object-cover" muted />
                        ) : (
                          <img src={meme.file_url} alt="" className="w-full h-full object-cover" />
                        )}
                      </div>
                    ))}
                  </div>
                  <p className="text-sm font-medium text-gray-900">
                    {selectedMemes.length} {selectedMemes.length === 1 ? "Meme" : "Memes"}
                  </p>
                </div>

                {/* Comment field */}
                <div className="bg-gray-50 rounded-2xl">
                  <textarea
                    value={newDumpName}
                    onChange={(e) => setNewDumpName(e.target.value)}
                    placeholder="Comment (optional)"
                    className="w-full px-4 py-3 bg-transparent resize-none focus:outline-none min-h-[80px]"
                    rows={2}
                  />
                </div>

                {/* Dump selector row */}
                <button
                  onClick={() => setView("pick-dump")}
                  className="w-full flex items-center justify-between bg-gray-50 rounded-2xl p-4"
                >
                  <span className="text-gray-500">Dump</span>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gray-200 rounded-lg flex items-center justify-center overflow-hidden">
                      {selectedDump?.preview_url ? (
                        <img src={selectedDump.preview_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-sm">💩</span>
                      )}
                    </div>
                    <span className="font-medium">{dumpLabel}</span>
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </button>

                {/* Action buttons */}
                <div className="space-y-2 pt-2">
                  <button
                    onClick={() => setView("pick-recipients")}
                    className="w-full py-3.5 bg-blue-500 hover:bg-blue-600 text-white rounded-2xl font-semibold transition-colors"
                  >
                    Add & Send Now
                  </button>
                  <button
                    onClick={() => handleAdd(false)}
                    disabled={saving}
                    className="w-full py-3.5 text-gray-500 font-medium"
                  >
                    {saving ? "Saving..." : "Save for Later"}
                  </button>
                </div>

                {error && <p className="text-red-500 text-sm text-center">{error}</p>}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
