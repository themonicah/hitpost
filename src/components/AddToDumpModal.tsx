"use client";

import { useEffect, useState, useRef } from "react";
import { Meme, UserConnection } from "@/lib/db";
import { useRouter } from "next/navigation";
import Confetti from "./Confetti";
import FunLoader from "./FunLoader";
import LinkSharingModal from "./LinkSharingModal";

interface RecipientResult {
  name: string;
  link: string;
  claimCode: string | null;
  isConnected: boolean;
  pushSent: boolean;
}

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
  const [uploading, setUploading] = useState(false);
  const [newRecipientName, setNewRecipientName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showLinkSharing, setShowLinkSharing] = useState(false);
  const [sentRecipients, setSentRecipients] = useState<RecipientResult[]>([]);
  const [sentDumpId, setSentDumpId] = useState<string | null>(null);
  const [expandedGroupId, setExpandedGroupId] = useState<string | null>(null);
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
            // API returns memes inside dump.memes
            const existingMemes = dumpData.dump.memes || [];
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
      setUploading(false);
      setNewRecipientName("");
      setError("");
      setHasUnsavedChanges(false);
      setShowDiscardConfirm(false);
      setShowSendConfirm(false);
      setShowLinkSharing(false);
      setSentRecipients([]);
      setSentDumpId(null);
      setExpandedGroupId(null);
    }
  }, [isOpen]);

  function getSelectedRecipients(): { name: string; connectionId?: string; groupId?: string; isGroupMember?: boolean }[] {
    const recipients: { name: string; connectionId?: string; groupId?: string; isGroupMember?: boolean }[] = [];

    // Add from selected groups (track the group they came from)
    for (const groupId of selectedGroupIds) {
      const group = groups.find((g) => g.id === groupId);
      if (group) {
        // Add the group as a single recipient entry
        recipients.push({
          name: group.name,
          groupId: group.id,
          isGroupMember: false
        });
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

  // Get actual recipients for sending (expand groups to members)
  function getRecipientsForSend(): { name: string; connectionId?: string }[] {
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

  const recipientsForDisplay = getSelectedRecipients();
  const recipientsForSend = getRecipientsForSend();
  const recipientCount = recipientsForSend.length;
  const hasMemes = dumpMemes.length > 0;
  const hasName = dumpName.trim().length > 0;
  const canSaveDraft = hasMemes || hasName; // Can save with just a name
  const canSend = hasMemes && recipientCount > 0;

  // Action button text
  const actionButtonText = canSend ? "Send Now" : "Save Draft";
  const isActionDisabled = saving || !canSaveDraft;

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
          recipients: isDraft ? [] : getRecipientsForSend(),
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

        // Check if any recipients need manual link sharing
        const recipients = data.recipients || [];
        const needsLinks = recipients.some((r: RecipientResult) => !r.isConnected);

        setTimeout(() => {
          setShowConfetti(false);

          if (needsLinks) {
            // Show link sharing modal instead of immediately redirecting
            setSentRecipients(recipients);
            setSentDumpId(data.dumpId);
            setShowLinkSharing(true);
          } else {
            // All connected - just close and navigate
            onComplete?.();
            onClose();
            router.push(`/dumps/${data.dumpId}`);
          }
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

  const [addingRecipient, setAddingRecipient] = useState(false);

  async function handleAddNewRecipient() {
    if (!newRecipientName.trim() || addingRecipient) return;

    setAddingRecipient(true);
    setError("");

    try {
      const res = await fetch("/api/connections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newRecipientName.trim() }),
      });

      const data = await res.json();

      if (res.ok) {
        // Refresh connections and auto-select the new one
        const connectionsRes = await fetch("/api/connections");
        const connectionsData = await connectionsRes.json();
        setConnections(connectionsData.connections || []);

        // Auto-select the new connection
        if (data.connectionId) {
          setSelectedConnectionIds(prev => new Set([...prev, data.connectionId]));
        }
        setNewRecipientName("");
        setHasUnsavedChanges(true);
      } else {
        setError(data.error || "Failed to add recipient");
      }
    } catch (err) {
      console.error("Failed to add recipient:", err);
      setError("Failed to add recipient. Please try again.");
    } finally {
      setAddingRecipient(false);
    }
  }

  // Allowed file types for upload
  const allowedImageTypes = ["image/jpeg", "image/png", "image/gif", "image/webp", "image/heic", "image/heif"];
  const allowedVideoTypes = ["video/mp4", "video/quicktime", "video/webm", "video/mov"];
  const allowedTypes = [...allowedImageTypes, ...allowedVideoTypes];

  async function handleFileUpload(files: FileList | null) {
    if (!files || files.length === 0) return;

    setUploading(true);
    setError("");

    try {
      const formData = new FormData();
      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        // Validate file type
        if (!allowedTypes.includes(file.type)) {
          const fileExt = file.name.split('.').pop()?.toLowerCase() || '';
          if (['mp3', 'wav', 'aac', 'm4a', 'ogg', 'flac'].includes(fileExt)) {
            setError(`Audio files aren't supported. Only photos and videos.`);
          } else {
            setError(`"${file.name}" isn't supported. Only photos and videos.`);
          }
          setUploading(false);
          return;
        }

        // Check file size
        if (file.size > 10 * 1024 * 1024) {
          setError(`"${file.name}" is too large. Max 10MB.`);
          setUploading(false);
          return;
        }
        formData.append("files", file);
      }

      const res = await fetch("/api/memes", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        // Add uploaded memes to the dump
        setDumpMemes(prev => [...prev, ...(data.memes || [])]);
        setHasUnsavedChanges(true);
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Upload failed. Please try again.");
      }
    } catch (err) {
      console.error("Upload error:", err);
      setError("Network error. Check connection and try again.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
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

                {/* Hidden file input for camera roll */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  onChange={(e) => handleFileUpload(e.target.files)}
                  className="hidden"
                  disabled={uploading}
                />

                {/* Meme preview - compact horizontal layout */}
                {hasMemes ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-2xl">
                      {/* Photo pile */}
                      <div className="relative w-20 h-20 flex-shrink-0">
                        {dumpMemes.slice(0, 3).map((meme, i) => (
                          <div
                            key={meme.id}
                            className="absolute w-16 h-16 rounded-xl overflow-hidden bg-gray-200 shadow-md"
                            style={{
                              transform: `rotate(${(i - 1) * 8}deg)`,
                              top: `${i * 2}px`,
                              left: `${i * 2}px`,
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
                      {/* Count */}
                      <div className="flex-1 text-left">
                        <p className="font-semibold text-gray-900">{dumpMemes.length} meme{dumpMemes.length !== 1 ? "s" : ""}</p>
                      </div>
                    </div>
                    {/* Add more button */}
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="w-full py-3 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors flex items-center justify-center gap-2 text-blue-500 font-medium"
                    >
                      {uploading ? (
                        <>
                          <span className="animate-spin">⏳</span>
                          <span>Uploading...</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                          <span>Add more from camera roll</span>
                        </>
                      )}
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="w-full py-8 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 hover:border-blue-400 transition-colors flex items-center justify-center gap-3"
                  >
                    {uploading ? (
                      <>
                        <span className="text-2xl animate-spin">⏳</span>
                        <span className="text-gray-500 font-medium">Uploading...</span>
                      </>
                    ) : (
                      <>
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                        </div>
                        <span className="text-gray-500 font-medium">Add from camera roll</span>
                      </>
                    )}
                  </button>
                )}

                {/* Recipients section - compact row */}
                <button
                  onClick={() => setShowRecipientPicker(true)}
                  className="w-full flex items-center gap-3 p-3 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors"
                >
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    {recipientsForDisplay.length > 0 ? (
                      <p className="font-medium text-gray-900 truncate">
                        {recipientsForDisplay.map((r, i) => (
                          <span key={r.groupId || r.connectionId || r.name}>
                            {r.groupId ? `👥 ${r.name}` : formatName(r.name)}
                            {i < recipientsForDisplay.length - 1 ? ", " : ""}
                          </span>
                        ))}
                      </p>
                    ) : (
                      <p className="text-gray-500">No recipients selected</p>
                    )}
                    <p className="text-sm text-blue-500">
                      {recipientsForDisplay.length > 0 ? "Tap to edit" : "Tap to add"}
                    </p>
                  </div>
                  <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>

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

      {/* Link Sharing Modal - shows after sending to non-connected recipients */}
      <LinkSharingModal
        isOpen={showLinkSharing}
        onClose={() => {
          setShowLinkSharing(false);
          onComplete?.();
          onClose();
          if (sentDumpId) {
            router.push(`/dumps/${sentDumpId}`);
          }
        }}
        recipients={sentRecipients}
        dumpId={sentDumpId || ""}
      />
    </>
  );
}
