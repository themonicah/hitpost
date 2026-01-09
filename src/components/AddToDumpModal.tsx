"use client";

import { useEffect, useState, useRef } from "react";
import { Meme, UserConnection } from "@/lib/db";
import { useRouter } from "next/navigation";
import Confetti from "./Confetti";
import FunLoader from "./FunLoader";
import MemePicker from "./MemePicker";

interface Dump {
  id: string;
  note: string | null;
  created_at: string;
  meme_count: number;
  is_draft: boolean;
  preview_url?: string;
  preview_urls?: string[];
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
  preselectedDumpId?: string | null;
  onComplete?: () => void;
}

// Format name as "First L." or just "Name" if single word
function formatName(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0];
  const firstName = parts[0];
  const lastName = parts[parts.length - 1];
  return `${firstName} ${lastName.charAt(0).toUpperCase()}.`;
}

export default function AddToDumpModal({
  isOpen,
  onClose,
  selectedMemes,
  preselectedDumpId,
  onComplete,
}: AddToDumpModalProps) {
  const router = useRouter();
  const [existingDump, setExistingDump] = useState<Dump | null>(null);
  const [dumpName, setDumpName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showConfetti, setShowConfetti] = useState(false);
  const [showSendConfirm, setShowSendConfirm] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

  // Memes in the dump (selected memes + existing dump memes)
  const [dumpMemes, setDumpMemes] = useState<Meme[]>([]);

  // Recipients state
  const [groups, setGroups] = useState<Group[]>([]);
  const [connections, setConnections] = useState<UserConnection[]>([]);
  const [selectedGroupIds, setSelectedGroupIds] = useState<Set<string>>(new Set());
  const [selectedConnectionIds, setSelectedConnectionIds] = useState<Set<string>>(new Set());
  const [showRecipientPicker, setShowRecipientPicker] = useState(false);
  const [showMemePicker, setShowMemePicker] = useState(false);
  const [newRecipientName, setNewRecipientName] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  // Track if this is a new dump or existing
  const isNewDump = !preselectedDumpId;

  // Fetch data when modal opens
  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      setDumpMemes(selectedMemes);
      setHasUnsavedChanges(false);

      Promise.all([
        preselectedDumpId
          ? fetch(`/api/dumps/${preselectedDumpId}`).then(r => r.json())
          : Promise.resolve(null),
        fetch("/api/groups").then(r => r.json()),
        fetch("/api/connections").then(r => r.json()),
      ])
        .then(([dumpData, groupsData, connectionsData]) => {
          setGroups(groupsData.groups || []);
          setConnections(connectionsData.connections || []);

          if (dumpData?.dump) {
            setExistingDump(dumpData.dump);
            setDumpName(dumpData.dump.note || "");
            // Merge existing dump memes with selected memes
            const existingMemes = dumpData.memes || [];
            const mergedMemes = [...existingMemes];
            selectedMemes.forEach(m => {
              if (!mergedMemes.find((em: Meme) => em.id === m.id)) {
                mergedMemes.push(m);
              }
            });
            setDumpMemes(mergedMemes);

            // Pre-select existing recipients
            // This would require loading recipient data too
          } else {
            setExistingDump(null);
            setDumpName("");
          }
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [isOpen, preselectedDumpId, selectedMemes]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setExistingDump(null);
      setDumpName("");
      setDumpMemes([]);
      setSelectedGroupIds(new Set());
      setSelectedConnectionIds(new Set());
      setShowRecipientPicker(false);
      setShowMemePicker(false);
      setNewRecipientName("");
      setError("");
      setHasUnsavedChanges(false);
      setShowDiscardConfirm(false);
      setShowSendConfirm(false);
    }
  }, [isOpen]);

  function getSelectedRecipients(): { name: string; connectionId?: string }[] {
    const recipients: { name: string; connectionId?: string }[] = [];

    // Add from selected groups
    for (const groupId of selectedGroupIds) {
      const group = groups.find((g) => g.id === groupId);
      if (group) {
        for (const member of group.members) {
          if (!recipients.find(r => r.name === member.name)) {
            recipients.push({ name: member.name });
          }
        }
      }
    }

    // Add from selected connections
    for (const connectionId of selectedConnectionIds) {
      const connection = connections.find((c) => c.id === connectionId);
      if (connection && !recipients.find(r => r.name === connection.name)) {
        recipients.push({ name: connection.name, connectionId: connection.id });
      }
    }

    return recipients;
  }

  const recipientCount = getSelectedRecipients().length;
  const hasMemes = dumpMemes.length > 0;
  const canSaveDraft = hasMemes;
  const canSend = hasMemes && recipientCount > 0;

  // Action button text
  const actionButtonText = canSend ? "Send Now" : "Save Draft";
  const isActionDisabled = saving || !hasMemes;

  async function handleAction() {
    if (canSend) {
      // Show confirmation before sending
      setShowSendConfirm(true);
    } else {
      // Save as draft
      await handleSave(true);
    }
  }

  async function handleSave(isDraft: boolean) {
    setSaving(true);
    setError("");

    try {
      const res = await fetch("/api/dumps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memeIds: dumpMemes.map((m) => m.id),
          note: dumpName || null,
          recipients: isDraft ? [] : getSelectedRecipients(),
          isDraft,
          existingDumpId: existingDump?.id || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save");
      }

      const data = await res.json();

      if (!isDraft) {
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
      setShowSendConfirm(false);
    }
  }

  function handleClose() {
    if (hasUnsavedChanges) {
      setShowDiscardConfirm(true);
    } else {
      onClose();
    }
  }

  function toggleConnection(connectionId: string) {
    setSelectedConnectionIds(prev => {
      const next = new Set(prev);
      if (next.has(connectionId)) next.delete(connectionId);
      else next.add(connectionId);
      return next;
    });
    setHasUnsavedChanges(true);
  }

  function toggleGroup(groupId: string) {
    setSelectedGroupIds(prev => {
      const next = new Set(prev);
      if (next.has(groupId)) next.delete(groupId);
      else next.add(groupId);
      return next;
    });
    setHasUnsavedChanges(true);
  }

  if (!isOpen) return null;

  // Connected users (with user_id linked)
  const connectedUsers = connections.filter(c => c.connected_user_id);
  // Pending connections (without user_id)
  const pendingConnections = connections.filter(c => !c.connected_user_id);

  return (
    <>
      <Confetti active={showConfetti} />
      <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center animate-fadeIn">
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />

        <div
          ref={containerRef}
          className="relative w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl max-h-[90vh] overflow-hidden flex flex-col animate-slideUp sm:animate-scaleIn"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
            <button
              onClick={handleClose}
              className="text-blue-500 font-medium min-w-[70px]"
              disabled={saving}
            >
              {isNewDump ? "Cancel" : "✕"}
            </button>

            {/* Editable title */}
            {isNewDump ? (
              <h2 className="font-semibold">New Dump</h2>
            ) : (
              <input
                type="text"
                value={dumpName}
                onChange={(e) => {
                  setDumpName(e.target.value);
                  setHasUnsavedChanges(true);
                }}
                placeholder="Untitled"
                className="font-semibold text-center bg-transparent border-none outline-none w-32"
              />
            )}

            <button
              onClick={handleAction}
              disabled={isActionDisabled}
              className="text-blue-500 font-semibold min-w-[70px] text-right disabled:text-gray-300"
            >
              {saving ? "..." : actionButtonText}
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
                {/* Name field for new dumps */}
                {isNewDump && (
                  <div className="bg-gray-50 rounded-2xl">
                    <input
                      type="text"
                      value={dumpName}
                      onChange={(e) => {
                        setDumpName(e.target.value);
                        setHasUnsavedChanges(true);
                      }}
                      placeholder="Name your dump..."
                      className="w-full px-4 py-3 bg-transparent focus:outline-none"
                    />
                  </div>
                )}

                {/* Meme preview - stacked/askew style */}
                {hasMemes ? (
                  <div className="flex flex-col items-center">
                    <div className="relative w-32 h-32">
                      {dumpMemes.slice(0, 3).map((meme, i) => (
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
                    {dumpMemes.length > 3 && (
                      <p className="text-sm text-gray-500 mt-4">+{dumpMemes.length - 3} more</p>
                    )}
                    <button
                      onClick={() => setShowMemePicker(true)}
                      className="text-blue-500 text-sm font-medium mt-2"
                    >
                      + Add more memes
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowMemePicker(true)}
                    className="w-full py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 hover:border-blue-400 transition-colors flex flex-col items-center justify-center gap-2"
                  >
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </div>
                    <span className="text-gray-500 font-medium">Add memes to dump</span>
                  </button>
                )}

                {/* Recipients section */}
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-gray-500">Send to</h3>

                  {/* Selected recipients as chips */}
                  <div className="flex flex-wrap gap-2">
                    {getSelectedRecipients().map((recipient) => (
                      <span
                        key={recipient.name}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full text-sm font-medium"
                      >
                        {formatName(recipient.name)}
                        <button
                          onClick={() => {
                            if (recipient.connectionId) {
                              toggleConnection(recipient.connectionId);
                            }
                          }}
                          className="text-blue-400 hover:text-blue-600"
                        >
                          ×
                        </button>
                      </span>
                    ))}

                    {/* Add recipient chip */}
                    <button
                      onClick={() => setShowRecipientPicker(!showRecipientPicker)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-600 rounded-full text-sm font-medium hover:bg-gray-200 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Add
                    </button>
                  </div>

                  {/* Recipient picker (expandable) */}
                  {showRecipientPicker && (
                    <div className="bg-gray-50 rounded-2xl overflow-hidden mt-2">
                      {/* Connected users */}
                      {connectedUsers.length > 0 && (
                        <div className="p-3 border-b border-gray-200">
                          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                            Connected
                          </p>
                          {connectedUsers.map((connection) => (
                            <button
                              key={connection.id}
                              onClick={() => toggleConnection(connection.id)}
                              className="w-full flex items-center justify-between py-2"
                            >
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
                                  <span className="text-white font-semibold text-xs">
                                    {connection.name.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                                <span className="font-medium text-sm">{formatName(connection.name)}</span>
                                <span className="text-green-500 text-xs">✓</span>
                              </div>
                              <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                                selectedConnectionIds.has(connection.id) ? "bg-blue-500" : "bg-gray-200"
                              }`}>
                                {selectedConnectionIds.has(connection.id) && (
                                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                )}
                              </div>
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Pending connections */}
                      {pendingConnections.length > 0 && (
                        <div className="p-3 border-b border-gray-200">
                          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                            Pending
                          </p>
                          {pendingConnections.map((connection) => (
                            <button
                              key={connection.id}
                              onClick={() => toggleConnection(connection.id)}
                              className="w-full flex items-center justify-between py-2"
                            >
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                                  <span className="text-gray-500 font-semibold text-xs">
                                    {connection.name.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                                <span className="font-medium text-sm">{formatName(connection.name)}</span>
                              </div>
                              <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                                selectedConnectionIds.has(connection.id) ? "bg-blue-500" : "bg-gray-200"
                              }`}>
                                {selectedConnectionIds.has(connection.id) && (
                                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                )}
                              </div>
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Groups */}
                      {groups.length > 0 && (
                        <div className="p-3 border-b border-gray-200">
                          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                            Groups
                          </p>
                          {groups.map((group) => (
                            <button
                              key={group.id}
                              onClick={() => toggleGroup(group.id)}
                              className="w-full flex items-center justify-between py-2"
                            >
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
                                  <span className="text-sm">👥</span>
                                </div>
                                <div className="text-left">
                                  <span className="font-medium text-sm block">{group.name}</span>
                                  <span className="text-xs text-gray-400">{group.members.length} people</span>
                                </div>
                              </div>
                              <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                                selectedGroupIds.has(group.id) ? "bg-blue-500" : "bg-gray-200"
                              }`}>
                                {selectedGroupIds.has(group.id) && (
                                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                )}
                              </div>
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Add new recipient */}
                      <div className="p-3">
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                          Add someone new
                        </p>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={newRecipientName}
                            onChange={(e) => setNewRecipientName(e.target.value)}
                            placeholder="Name..."
                            className="flex-1 px-3 py-2 bg-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <button
                            onClick={() => {
                              // TODO: Add new recipient
                              setNewRecipientName("");
                            }}
                            disabled={!newRecipientName.trim()}
                            className="px-4 py-2 bg-blue-500 text-white rounded-xl text-sm font-medium disabled:opacity-50"
                          >
                            Add
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {error && <p className="text-red-500 text-sm text-center">{error}</p>}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Send confirmation dialog */}
      {showSendConfirm && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-6 animate-fadeIn">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowSendConfirm(false)} />
          <div className="relative bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="text-lg font-bold text-center mb-2">
              Send dump to {recipientCount} {recipientCount === 1 ? "person" : "people"}?
            </h3>
            <p className="text-gray-500 text-center text-sm mb-6">
              They&apos;ll get a link to view your memes
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowSendConfirm(false)}
                className="flex-1 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl"
                disabled={saving}
              >
                Cancel
              </button>
              <button
                onClick={() => handleSave(false)}
                disabled={saving}
                className="flex-1 py-3 bg-blue-500 text-white font-semibold rounded-xl"
              >
                {saving ? "Sending..." : "Send"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Discard changes confirmation */}
      {showDiscardConfirm && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-6 animate-fadeIn">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowDiscardConfirm(false)} />
          <div className="relative bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="text-lg font-bold text-center mb-2">
              Save changes?
            </h3>
            <p className="text-gray-500 text-center text-sm mb-6">
              You have unsaved changes to this dump
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDiscardConfirm(false);
                  onClose();
                }}
                className="flex-1 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl"
              >
                Discard
              </button>
              <button
                onClick={async () => {
                  setShowDiscardConfirm(false);
                  await handleSave(true);
                }}
                className="flex-1 py-3 bg-blue-500 text-white font-semibold rounded-xl"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Meme Picker */}
      <MemePicker
        isOpen={showMemePicker}
        onClose={() => setShowMemePicker(false)}
        selectedMemeIds={new Set(dumpMemes.map((m) => m.id))}
        onSelectionChange={() => {}}
        onDone={(selectedMemes) => {
          setDumpMemes(selectedMemes);
          setHasUnsavedChanges(true);
        }}
      />
    </>
  );
}
