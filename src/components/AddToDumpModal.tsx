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

  // Tray navigation state
  const [activeView, setActiveView] = useState<"main" | "recipients" | "memes">("main");
  const [expandedMemeId, setExpandedMemeId] = useState<string | null>(null);

  const [uploading, setUploading] = useState(false);
  const [newRecipientName, setNewRecipientName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showLinkSharing, setShowLinkSharing] = useState(false);
  const [sentRecipients, setSentRecipients] = useState<RecipientResult[]>([]);
  const [sentDumpId, setSentDumpId] = useState<string | null>(null);
  const [expandedGroupId, setExpandedGroupId] = useState<string | null>(null);
  const [showAddRecipient, setShowAddRecipient] = useState(false);

  // Track if this is a new dump or existing
  const isNewDump = !preselectedDumpId;

  // Fetch data when modal opens
  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      setDumpMemes(selectedMemes);
      setHasUnsavedChanges(false);
      setActiveView("main");

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
            const existingMemes = dumpData.dump.memes || [];
            const mergedMemes = [...existingMemes];
            selectedMemes.forEach(m => {
              if (!mergedMemes.find((em: Meme) => em.id === m.id)) {
                mergedMemes.push(m);
              }
            });
            setDumpMemes(mergedMemes);
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
      setActiveView("main");
      setExpandedMemeId(null);
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
      setShowAddRecipient(false);
    }
  }, [isOpen]);

  function getSelectedRecipients(): { name: string; connectionId?: string; groupId?: string; isGroupMember?: boolean }[] {
    const recipients: { name: string; connectionId?: string; groupId?: string; isGroupMember?: boolean }[] = [];

    for (const groupId of selectedGroupIds) {
      const group = groups.find((g) => g.id === groupId);
      if (group) {
        recipients.push({
          name: group.name,
          groupId: group.id,
          isGroupMember: false
        });
      }
    }

    for (const connectionId of selectedConnectionIds) {
      const connection = connections.find((c) => c.id === connectionId);
      if (connection && !recipients.find(r => r.name === connection.name)) {
        recipients.push({ name: connection.name, connectionId: connection.id });
      }
    }

    return recipients;
  }

  function getRecipientsForSend(): { name: string; connectionId?: string }[] {
    const recipients: { name: string; connectionId?: string }[] = [];

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
  const canSaveDraft = hasMemes || hasName;
  const canSend = hasMemes && recipientCount > 0;

  const actionButtonText = canSend ? "Send Now" : "Save Draft";
  const isActionDisabled = saving || !canSaveDraft;

  async function handleAction() {
    if (canSend) {
      setShowSendConfirm(true);
    } else {
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
        const recipients = data.recipients || [];
        const needsLinks = recipients.some((r: RecipientResult) => !r.isConnected);

        setTimeout(() => {
          setShowConfetti(false);
          if (needsLinks) {
            setSentRecipients(recipients);
            setSentDumpId(data.dumpId);
            setShowLinkSharing(true);
          } else {
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
    if (activeView === "recipients") {
      setActiveView("main");
      return;
    }
    // X button just closes - the user can use Done to save
    onClose();
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
        const connectionsRes = await fetch("/api/connections");
        const connectionsData = await connectionsRes.json();
        setConnections(connectionsData.connections || []);

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

  const allowedImageTypes = ["image/jpeg", "image/png", "image/gif", "image/webp", "image/heic", "image/heif"];
  const allowedVideoTypes = ["video/mp4", "video/quicktime", "video/webm", "video/mov"];
  const allowedTypes = [...allowedImageTypes, ...allowedVideoTypes];

  async function handleFileUpload(files: FileList | null) {
    if (!files || files.length === 0) return;

    setUploading(true);
    setError("");

    // Validate all files first before uploading
    const validFiles: File[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];

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

      if (file.size > 10 * 1024 * 1024) {
        setError(`"${file.name}" is too large. Max 10MB.`);
        setUploading(false);
        return;
      }
      validFiles.push(file);
    }

    // Upload files one at a time to avoid body size limits
    const uploadedMemes: Meme[] = [];
    let failedCount = 0;

    for (let i = 0; i < validFiles.length; i++) {
      const file = validFiles[i];

      try {
        const formData = new FormData();
        formData.append("files", file);

        const res = await fetch("/api/memes", {
          method: "POST",
          body: formData,
        });

        if (res.ok) {
          const data = await res.json();
          if (data.memes?.length > 0) {
            uploadedMemes.push(...data.memes);
          }
        } else {
          failedCount++;
        }
      } catch (err) {
        console.error("Upload error for file:", file.name, err);
        failedCount++;
      }
    }

    // Update state with successfully uploaded memes
    if (uploadedMemes.length > 0) {
      setDumpMemes(prev => [...prev, ...uploadedMemes]);
      setHasUnsavedChanges(true);
    }

    if (failedCount > 0) {
      if (uploadedMemes.length > 0) {
        setError(`${failedCount} of ${validFiles.length} uploads failed. ${uploadedMemes.length} succeeded.`);
      } else {
        setError("Upload failed. Please try again.");
      }
    }

    setUploading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  if (!isOpen) return null;

  const connectedUsers = connections.filter(c => c.connected_user_id);
  const pendingConnections = connections.filter(c => !c.connected_user_id);

  return (
    <>
      <Confetti active={showConfetti} />

      {/* Backdrop */}
      <div className="fixed inset-0 z-[60] animate-fadeIn">
        <div
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={handleClose}
        />

        {/* Main Tray - Dump Overview */}
        <div
          className={`absolute inset-x-0 bottom-0 ${
            activeView !== "main"
              ? "animate-tray-push-back pointer-events-none"
              : "animate-tray-pull-forward"
          }`}
          style={{ zIndex: 61 }}
        >
          <div className="w-full max-w-lg mx-auto bg-white rounded-t-3xl max-h-[75vh] overflow-hidden flex flex-col shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              {/* Left button: Done (saves) or X (closes) */}
              {hasUnsavedChanges || hasMemes ? (
                <button
                  onClick={async () => {
                    if (canSaveDraft) {
                      await handleSave(true);
                    } else {
                      onClose();
                    }
                  }}
                  className="px-3 py-2 text-blue-500 font-semibold text-sm hover:text-blue-600"
                  disabled={saving}
                >
                  {saving ? "..." : "Done"}
                </button>
              ) : (
                <button
                  onClick={handleClose}
                  className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-gray-600"
                  disabled={saving}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}

              <input
                type="text"
                value={dumpName}
                onChange={(e) => {
                  setDumpName(e.target.value);
                  setHasUnsavedChanges(true);
                }}
                placeholder="Untitled Dump"
                className="font-semibold text-lg text-center bg-transparent focus:outline-none focus:bg-gray-50 rounded-lg px-2 py-1 w-40 truncate"
              />

              {/* Right button: Send Now (only when ready) */}
              {canSend ? (
                <button
                  onClick={handleAction}
                  disabled={saving}
                  className="px-4 py-2 rounded-full font-semibold text-sm bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-50"
                >
                  {saving ? "..." : "Send Now"}
                </button>
              ) : (
                <div className="w-20" />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <FunLoader />
                </div>
              ) : (
                <>
                  {/* Hidden file input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,video/*"
                    multiple
                    onChange={(e) => handleFileUpload(e.target.files)}
                    className="hidden"
                    disabled={uploading}
                  />

                  {/* Memes section - tappable to open meme grid tray */}
                  <button
                    onClick={() => hasMemes ? setActiveView("memes") : fileInputRef.current?.click()}
                    disabled={uploading}
                    className="w-full bg-gray-50 rounded-2xl p-4 hover:bg-gray-100 transition-colors text-left"
                  >
                    {hasMemes ? (
                      <div className="flex flex-col items-center py-4">
                        {/* Centered photo pile */}
                        <div className="relative" style={{ width: "120px", height: "100px" }}>
                          {dumpMemes.slice(0, 3).map((meme, i) => (
                            <div
                              key={meme.id}
                              className="absolute rounded-xl overflow-hidden bg-white shadow-lg border border-gray-100"
                              style={{
                                width: "72px",
                                height: "72px",
                                transform: `rotate(${(i - 1) * 12}deg)`,
                                top: `${8 + i * 4}px`,
                                left: `${12 + i * 8}px`,
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
                        <p className="text-sm text-gray-500 mt-2">
                          {`${dumpMemes.length} meme${dumpMemes.length !== 1 ? "s" : ""}`}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">Tap to manage</p>
                      </div>
                    ) : (
                      <div className="py-12 flex flex-col items-center justify-center gap-3">
                        {uploading ? (
                          <>
                            <span className="text-4xl animate-spin">⏳</span>
                            <span className="text-gray-500">Uploading...</span>
                          </>
                        ) : (
                          <>
                            <div className="w-16 h-16 bg-orange-500 rounded-2xl flex items-center justify-center">
                              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                              </svg>
                            </div>
                            <div className="text-center">
                              <p className="font-semibold text-gray-900">Add memes</p>
                              <p className="text-sm text-gray-500">From your camera roll</p>
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </button>

                  {/* Recipients section - tappable row */}
                  <button
                    onClick={() => setActiveView("recipients")}
                    className="w-full flex items-center gap-4 p-4 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors text-left"
                  >
                    <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      {recipientsForDisplay.length > 0 ? (
                        <>
                          <p className="font-semibold text-gray-900 truncate">
                            {recipientsForDisplay.map((r, i) => (
                              <span key={r.groupId || r.connectionId || r.name}>
                                {r.groupId ? `👥 ${r.name}` : formatName(r.name)}
                                {i < recipientsForDisplay.length - 1 ? ", " : ""}
                              </span>
                            ))}
                          </p>
                          <p className="text-sm text-gray-500">
                            {recipientCount} {recipientCount === 1 ? "person" : "people"}
                          </p>
                        </>
                      ) : (
                        <>
                          <p className="font-semibold text-gray-900">Send to...</p>
                          <p className="text-sm text-gray-500">Choose recipients</p>
                        </>
                      )}
                    </div>
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>

                  {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Recipients Tray - slides up on top with spring animation */}
        {activeView === "recipients" && (
        <div
          className="absolute inset-x-0 bottom-0 animate-tray-up"
          style={{ zIndex: 62 }}
        >
          <div className="w-full max-w-lg mx-auto bg-white rounded-t-3xl max-h-[85vh] overflow-hidden flex flex-col shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <button
                onClick={() => setActiveView("main")}
                className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              <h2 className="font-semibold text-lg">Recipients</h2>

              <button
                onClick={() => setActiveView("main")}
                className="px-4 py-2 text-blue-500 font-semibold"
              >
                Done
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              {/* Groups - shown first */}
              {groups.length > 0 && (
                <div className="p-4 border-b border-gray-100">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Groups</p>
                  <div className="space-y-1">
                    {groups.map((group) => (
                      <div key={group.id}>
                        <button
                          onClick={() => toggleGroup(group.id)}
                          className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                              <span className="text-lg">👥</span>
                            </div>
                            <div className="text-left">
                              <span className="font-medium block">{group.name}</span>
                              <span className="text-xs text-gray-400">{group.members.length} people</span>
                            </div>
                          </div>
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                            selectedGroupIds.has(group.id)
                              ? "bg-blue-500 scale-100"
                              : "bg-gray-200 scale-90"
                          }`}>
                            {selectedGroupIds.has(group.id) && (
                              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Connected users */}
              {connectedUsers.length > 0 && (
                <div className="p-4 border-b border-gray-100">
                  <div className="flex items-center gap-2 mb-3">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Connected</p>
                    <span className="text-[10px] text-green-600 bg-green-50 px-2 py-0.5 rounded-full">gets push</span>
                  </div>
                  <div className="space-y-1">
                    {connectedUsers.map((connection) => (
                      <button
                        key={connection.id}
                        onClick={() => toggleConnection(connection.id)}
                        className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center">
                            <span className="text-white font-semibold text-sm">
                              {connection.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <span className="font-medium">{formatName(connection.name)}</span>
                        </div>
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                          selectedConnectionIds.has(connection.id)
                            ? "bg-blue-500 scale-100"
                            : "bg-gray-200 scale-90"
                        }`}>
                          {selectedConnectionIds.has(connection.id) && (
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Pending connections */}
              {pendingConnections.length > 0 && (
                <div className="p-4 border-b border-gray-100">
                  <div className="flex items-center gap-2 mb-3">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Not Connected</p>
                    <span className="text-[10px] text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">needs link</span>
                  </div>
                  <div className="space-y-1">
                    {pendingConnections.map((connection) => (
                      <button
                        key={connection.id}
                        onClick={() => toggleConnection(connection.id)}
                        className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                            <span className="text-amber-600 font-semibold text-sm">
                              {connection.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <span className="font-medium">{formatName(connection.name)}</span>
                        </div>
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                          selectedConnectionIds.has(connection.id)
                            ? "bg-blue-500 scale-100"
                            : "bg-gray-200 scale-90"
                        }`}>
                          {selectedConnectionIds.has(connection.id) && (
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Add new recipient - collapsible */}
              <div className="p-4">
                {!showAddRecipient ? (
                  <button
                    onClick={() => setShowAddRecipient(true)}
                    className="text-blue-500 font-semibold text-sm hover:text-blue-600 transition-colors"
                  >
                    + Add someone new
                  </button>
                ) : (
                  <div className="animate-expandIn">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Add Someone New</p>
                      <button
                        onClick={() => {
                          setShowAddRecipient(false);
                          setNewRecipientName("");
                        }}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newRecipientName}
                        onChange={(e) => setNewRecipientName(e.target.value)}
                        placeholder="Enter name..."
                        autoFocus
                        className="flex-1 px-4 py-3 bg-gray-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && newRecipientName.trim()) {
                            handleAddNewRecipient();
                          }
                          if (e.key === "Escape") {
                            setShowAddRecipient(false);
                            setNewRecipientName("");
                          }
                        }}
                      />
                      <button
                        onClick={handleAddNewRecipient}
                        disabled={!newRecipientName.trim() || addingRecipient}
                        className="px-5 py-3 bg-blue-500 text-white rounded-xl font-semibold disabled:opacity-50"
                      >
                        {addingRecipient ? "..." : "Add"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        )}

        {/* Meme Grid Tray - for managing memes */}
        {activeView === "memes" && (
        <div
          className="absolute inset-x-0 bottom-0 animate-tray-up"
          style={{ zIndex: 62 }}
        >
          <div className="w-full max-w-lg mx-auto bg-white rounded-t-3xl max-h-[85vh] overflow-hidden flex flex-col shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <button
                onClick={() => {
                  setActiveView("main");
                  setExpandedMemeId(null);
                }}
                className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              <h2 className="font-semibold text-lg">
                {dumpMemes.length} Meme{dumpMemes.length !== 1 ? "s" : ""}
              </h2>

              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="px-4 py-2 text-orange-500 font-semibold hover:text-orange-600"
              >
                {uploading ? "..." : "+ Add"}
              </button>
            </div>

            {/* Content - Grid view only */}
            <div className="flex-1 overflow-y-auto p-4">
              {uploading && (
                <div className="flex items-center justify-center py-4 mb-4 bg-orange-50 rounded-xl">
                  <span className="text-orange-600">Uploading...</span>
                </div>
              )}
              <div className="grid grid-cols-3 gap-2">
                {dumpMemes.map((meme) => (
                  <div key={meme.id} className="relative aspect-square group">
                    <button
                      onClick={() => setExpandedMemeId(meme.id)}
                      className="w-full h-full rounded-xl overflow-hidden bg-gray-100"
                    >
                      {meme.file_type === "video" ? (
                        <video
                          src={meme.file_url}
                          className="w-full h-full object-cover"
                          muted
                        />
                      ) : (
                        <img
                          src={meme.file_url}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      )}
                    </button>
                    {/* Delete button - always visible on mobile */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDumpMemes(prev => prev.filter(m => m.id !== meme.id));
                        setHasUnsavedChanges(true);
                      }}
                      className="absolute top-1 right-1 w-7 h-7 bg-black/70 hover:bg-black/90 rounded-full flex items-center justify-center"
                    >
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                    {/* Video indicator */}
                    {meme.file_type === "video" && (
                      <div className="absolute bottom-1 left-1 w-5 h-5 bg-black/60 rounded-full flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              {dumpMemes.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-gray-500">No memes yet</p>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-4 px-6 py-3 bg-orange-500 text-white font-semibold rounded-xl"
                  >
                    Add Memes
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
        )}
      </div>

      {/* Full-screen Meme Lightbox */}
      {expandedMemeId && (() => {
        const meme = dumpMemes.find(m => m.id === expandedMemeId);
        if (!meme) return null;
        return (
          <div className="fixed inset-0 z-[80] animate-fadeIn">
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/95"
              onClick={() => setExpandedMemeId(null)}
            />

            {/* Content */}
            <div className="absolute inset-0 flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between px-4 pt-14 pb-4">
                <button
                  onClick={() => setExpandedMemeId(null)}
                  className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-white"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                <div className="w-10" />
              </div>

              {/* Meme */}
              <div className="flex-1 flex items-center justify-center px-4 min-h-0">
                <div className="w-full max-w-lg">
                  {meme.file_type === "video" ? (
                    <video
                      src={meme.file_url}
                      className="w-full max-h-[65vh] object-contain rounded-2xl"
                      controls
                      autoPlay
                      playsInline
                    />
                  ) : (
                    <img
                      src={meme.file_url}
                      alt=""
                      className="w-full max-h-[65vh] object-contain rounded-2xl"
                    />
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="px-6 pb-10 pb-safe">
                <button
                  onClick={() => {
                    setDumpMemes(prev => prev.filter(m => m.id !== expandedMemeId));
                    setExpandedMemeId(null);
                    setHasUnsavedChanges(true);
                  }}
                  className="w-full py-4 bg-red-500/20 text-red-400 font-semibold rounded-2xl border border-red-500/30"
                >
                  Remove from Dump
                </button>
              </div>
            </div>
          </div>
        );
      })()}

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
                className="flex-1 py-3 bg-orange-500 text-white font-semibold rounded-xl hover:bg-orange-600"
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
            <h3 className="text-lg font-bold text-center mb-2">Save changes?</h3>
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

      {/* Link Sharing Modal */}
      <LinkSharingModal
        isOpen={showLinkSharing}
        onClose={() => {
          setShowLinkSharing(false);
          onComplete?.();
          onClose();
          // Go back to home instead of dump detail
          router.push("/");
        }}
        recipients={sentRecipients}
        dumpId={sentDumpId || ""}
        dumpName={dumpName || undefined}
        previewUrls={dumpMemes.slice(0, 3).map(m => m.file_url)}
      />
    </>
  );
}
