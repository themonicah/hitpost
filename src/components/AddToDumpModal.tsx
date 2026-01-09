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

type Step = "choose-dump" | "share";

export default function AddToDumpModal({
  isOpen,
  onClose,
  selectedMemes,
  onComplete,
}: AddToDumpModalProps) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("choose-dump");
  const [drafts, setDrafts] = useState<Dump[]>([]);
  const [selectedDumpId, setSelectedDumpId] = useState<string | null>(null);
  const [newDumpName, setNewDumpName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Share step state
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroupIds, setSelectedGroupIds] = useState<Set<string>>(new Set());
  const [manualEmails, setManualEmails] = useState("");
  const [showConfetti, setShowConfetti] = useState(false);

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
      setStep("choose-dump");
      setSelectedDumpId(null);
      setNewDumpName("");
      setSelectedGroupIds(new Set());
      setManualEmails("");
      setError("");
    }
  }, [isOpen]);

  function getUniqueRecipients(): string[] {
    const emails = new Set<string>();
    for (const groupId of selectedGroupIds) {
      const group = groups.find((g) => g.id === groupId);
      if (group) {
        for (const member of group.members) {
          emails.add(member.email.toLowerCase());
        }
      }
    }
    const manualList = manualEmails
      .split(/[,\n]/)
      .map((e) => e.trim().toLowerCase())
      .filter((e) => e && e.includes("@"));
    for (const email of manualList) {
      emails.add(email);
    }
    return Array.from(emails);
  }

  async function handleAddToDump(andShare: boolean) {
    setSaving(true);
    setError("");

    try {
      const recipients = andShare ? getUniqueRecipients() : [];

      if (andShare && recipients.length === 0) {
        setError("Pick someone to share with!");
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
          isDraft: !andShare,
          existingDumpId: selectedDumpId,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save");
      }

      const data = await res.json();

      if (andShare) {
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
      setError(err instanceof Error ? err.message : "something broke");
    } finally {
      setSaving(false);
    }
  }

  if (!isOpen) return null;

  const recipientCount = getUniqueRecipients().length;

  return (
    <>
      <Confetti active={showConfetti} />
      <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center animate-fadeIn">
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

        <div className="relative w-full max-w-lg bg-white dark:bg-gray-900 rounded-t-3xl sm:rounded-3xl max-h-[90vh] overflow-hidden flex flex-col animate-slideUp sm:animate-scaleIn">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800">
            <button
              onClick={() => step === "share" ? setStep("choose-dump") : onClose()}
              className="text-blue-500 font-medium"
              disabled={saving}
            >
              {step === "share" ? "Back" : "Cancel"}
            </button>
            <h2 className="font-semibold">
              {step === "choose-dump" ? "Add to Dump" : "Share Dump"}
            </h2>
            <div className="w-16" />
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 pb-safe space-y-4">
            {/* Loading state */}
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <FunLoader />
              </div>
            ) : (
            <>
            {/* Meme preview */}
            <div className="flex gap-1 justify-center">
              {selectedMemes.slice(0, 5).map((meme) => (
                <div key={meme.id} className="w-14 h-14 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
                  {meme.file_type === "video" ? (
                    <video src={meme.file_url} className="w-full h-full object-cover" muted />
                  ) : (
                    <img src={meme.file_url} alt="" className="w-full h-full object-cover" />
                  )}
                </div>
              ))}
              {selectedMemes.length > 5 && (
                <div className="w-14 h-14 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500 text-xs">
                  +{selectedMemes.length - 5}
                </div>
              )}
            </div>

            {step === "choose-dump" ? (
              <>
                {/* New dump option */}
                <div className="space-y-2">
                  <button
                    onClick={() => setSelectedDumpId(null)}
                    className={`w-full p-4 rounded-xl text-left transition-colors ${
                      selectedDumpId === null
                        ? "bg-blue-50 dark:bg-blue-900/30 border-2 border-blue-500"
                        : "bg-gray-50 dark:bg-gray-800 border-2 border-transparent"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-amber-600 rounded-xl flex items-center justify-center">
                        <span className="text-2xl">💩</span>
                      </div>
                      <div>
                        <p className="font-medium">New Dump</p>
                        <p className="text-sm text-gray-500">Start fresh</p>
                      </div>
                    </div>
                  </button>

                  {selectedDumpId === null && (
                    <input
                      type="text"
                      value={newDumpName}
                      onChange={(e) => setNewDumpName(e.target.value)}
                      placeholder="Name this dump (optional)"
                      className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  )}
                </div>

                {/* Existing drafts */}
                {drafts.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-500">Or add to existing:</p>
                    {drafts.map((draft) => (
                      <button
                        key={draft.id}
                        onClick={() => setSelectedDumpId(draft.id)}
                        className={`w-full p-4 rounded-xl text-left transition-colors ${
                          selectedDumpId === draft.id
                            ? "bg-blue-50 dark:bg-blue-900/30 border-2 border-blue-500"
                            : "bg-gray-50 dark:bg-gray-800 border-2 border-transparent"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-xl flex items-center justify-center">
                            <span className="text-lg">📦</span>
                          </div>
                          <div>
                            <p className="font-medium">{draft.note || "Untitled"}</p>
                            <p className="text-sm text-gray-500">{draft.meme_count} memes</p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* Action buttons */}
                <div className="space-y-2 pt-2">
                  <button
                    onClick={() => setStep("share")}
                    className="w-full py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-semibold"
                  >
                    Add & Share Now
                  </button>
                  <button
                    onClick={() => handleAddToDump(false)}
                    disabled={saving}
                    className="w-full py-3 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl font-medium text-gray-700 dark:text-gray-300"
                  >
                    {saving ? "Saving..." : "Save for Later"}
                  </button>
                </div>
              </>
            ) : (
              <>
                {/* Share step - groups */}
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-500">Share with:</p>
                  {groups.map((group) => (
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
                      className={`w-full flex items-center justify-between p-3 rounded-xl transition-colors ${
                        selectedGroupIds.has(group.id)
                          ? "bg-blue-50 dark:bg-blue-900/30 border-2 border-blue-500"
                          : "bg-gray-100 dark:bg-gray-800 border-2 border-transparent"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded flex items-center justify-center ${
                          selectedGroupIds.has(group.id) ? "bg-blue-500 text-white" : "bg-gray-300 dark:bg-gray-600"
                        }`}>
                          {selectedGroupIds.has(group.id) && (
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                        <span className="font-medium">{group.name}</span>
                      </div>
                      <span className="text-sm text-gray-500">{group.members.length} people</span>
                    </button>
                  ))}
                </div>

                {/* Manual emails */}
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-2">Or add emails:</p>
                  <textarea
                    value={manualEmails}
                    onChange={(e) => setManualEmails(e.target.value)}
                    placeholder="email@example.com"
                    className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-800 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    rows={2}
                  />
                </div>

                {recipientCount > 0 && (
                  <p className="text-center text-sm text-gray-500">
                    Sharing with {recipientCount} {recipientCount === 1 ? "person" : "people"}
                  </p>
                )}

                {/* Share button */}
                <button
                  onClick={() => handleAddToDump(true)}
                  disabled={saving || recipientCount === 0}
                  className="w-full py-3 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white rounded-xl font-semibold"
                >
                  {saving ? "Sending..." : "Share Dump 💩"}
                </button>
              </>
            )}

            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
            </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
