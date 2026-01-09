"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { UserConnection } from "@/lib/db";
import Confetti from "@/components/Confetti";
import FunLoader from "@/components/FunLoader";

interface SelectedFile {
  file: File;
  preview: string;
  type: "image" | "video";
}

interface Group {
  id: string;
  name: string;
  members: { id: string; name: string; email: string }[];
}

// Format name as "First L." or just "Name" if single word
function formatName(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0];
  const firstName = parts[0];
  const lastName = parts[parts.length - 1];
  return `${firstName} ${lastName.charAt(0).toUpperCase()}.`;
}

export default function NewDumpPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([]);
  const [dumpName, setDumpName] = useState("");
  const [step, setStep] = useState<"pick" | "details">("pick");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showConfetti, setShowConfetti] = useState(false);

  // Recipients
  const [groups, setGroups] = useState<Group[]>([]);
  const [connections, setConnections] = useState<UserConnection[]>([]);
  const [selectedGroupIds, setSelectedGroupIds] = useState<Set<string>>(new Set());
  const [selectedConnectionIds, setSelectedConnectionIds] = useState<Set<string>>(new Set());
  const [showRecipientPicker, setShowRecipientPicker] = useState(false);
  const [newRecipientName, setNewRecipientName] = useState("");
  const [addingRecipient, setAddingRecipient] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [expandedGroupId, setExpandedGroupId] = useState<string | null>(null);

  // Auto-open file picker on mount
  useEffect(() => {
    fileInputRef.current?.click();
    // Fetch groups and connections
    Promise.all([
      fetch("/api/groups").then(r => r.json()),
      fetch("/api/connections").then(r => r.json()),
    ])
      .then(([groupsData, connectionsData]) => {
        setGroups(groupsData.groups || []);
        setConnections(connectionsData.connections || []);
      })
      .catch(console.error)
      .finally(() => setLoadingData(false));
  }, []);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) {
      // User cancelled - go back if no files selected
      if (selectedFiles.length === 0) {
        router.back();
      }
      return;
    }

    const newFiles: SelectedFile[] = Array.from(files).map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      type: file.type.startsWith("video/") ? "video" : "image",
    }));

    setSelectedFiles((prev) => [...prev, ...newFiles]);
    setStep("details");
  }

  function removeFile(index: number) {
    setSelectedFiles((prev) => {
      const updated = [...prev];
      URL.revokeObjectURL(updated[index].preview);
      updated.splice(index, 1);
      return updated;
    });
  }

  function getRecipientsForSend(): { name: string; connectionId?: string }[] {
    const recipients: { name: string; connectionId?: string }[] = [];

    for (const groupId of selectedGroupIds) {
      const group = groups.find((g) => g.id === groupId);
      if (group) {
        for (const member of group.members) {
          if (!recipients.find((r) => r.name === member.name)) {
            recipients.push({ name: member.name });
          }
        }
      }
    }

    for (const connectionId of selectedConnectionIds) {
      const connection = connections.find((c) => c.id === connectionId);
      if (connection && !recipients.find((r) => r.name === connection.name)) {
        recipients.push({ name: connection.name, connectionId: connection.id });
      }
    }

    return recipients;
  }

  const recipientsForSend = getRecipientsForSend();
  const recipientCount = recipientsForSend.length;
  const canSend = selectedFiles.length > 0 && recipientCount > 0;
  const canSaveDraft = selectedFiles.length > 0 || dumpName.trim().length > 0;

  async function handleSave(isDraft: boolean) {
    if (selectedFiles.length === 0 && !isDraft) return;

    setSaving(true);
    setError("");

    try {
      // First upload all files to get meme IDs
      const memeIds: string[] = [];

      for (const selectedFile of selectedFiles) {
        const formData = new FormData();
        formData.append("files", selectedFile.file);

        const uploadRes = await fetch("/api/memes", {
          method: "POST",
          body: formData,
        });

        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          if (uploadData.memes?.[0]?.id) {
            memeIds.push(uploadData.memes[0].id);
          }
        }
      }

      // Now create the dump
      const res = await fetch("/api/dumps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memeIds,
          note: dumpName || null,
          recipients: isDraft ? [] : recipientsForSend,
          isDraft,
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
          router.push(`/dumps/${data.dumpId}`);
        }, 1000);
      } else {
        router.push("/");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  function toggleConnection(connectionId: string) {
    setSelectedConnectionIds((prev) => {
      const next = new Set(prev);
      if (next.has(connectionId)) next.delete(connectionId);
      else next.add(connectionId);
      return next;
    });
  }

  function toggleGroup(groupId: string) {
    setSelectedGroupIds((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) next.delete(groupId);
      else next.add(groupId);
      return next;
    });
  }

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
          setSelectedConnectionIds((prev) => new Set([...prev, data.connectionId]));
        }
        setNewRecipientName("");
      } else {
        setError(data.error || "Failed to add recipient");
      }
    } catch {
      setError("Failed to add recipient");
    } finally {
      setAddingRecipient(false);
    }
  }

  const connectedUsers = connections.filter((c) => c.connected_user_id);
  const pendingConnections = connections.filter((c) => !c.connected_user_id);

  // Get display recipients (show groups as single items)
  function getDisplayRecipients() {
    const recipients: { name: string; groupId?: string; connectionId?: string }[] = [];

    for (const groupId of selectedGroupIds) {
      const group = groups.find((g) => g.id === groupId);
      if (group) {
        recipients.push({ name: group.name, groupId });
      }
    }

    for (const connectionId of selectedConnectionIds) {
      const connection = connections.find((c) => c.id === connectionId);
      if (connection) {
        recipients.push({ name: connection.name, connectionId });
      }
    }

    return recipients;
  }

  const displayRecipients = getDisplayRecipients();

  return (
    <>
      <Confetti active={showConfetti} />

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="sticky top-0 z-40 bg-white border-b border-gray-100">
          <div className="flex items-center justify-between px-4 h-14">
            <button
              onClick={() => router.back()}
              className="text-blue-500 font-medium"
            >
              Cancel
            </button>
            <h1 className="font-semibold">New Dump</h1>
            <button
              onClick={() => handleSave(canSend ? false : true)}
              disabled={saving || !canSaveDraft}
              className="text-blue-500 font-semibold disabled:text-gray-300"
            >
              {saving ? "..." : canSend ? "Send" : "Save"}
            </button>
          </div>
        </header>

        {loadingData ? (
          <div className="flex items-center justify-center py-20">
            <FunLoader />
          </div>
        ) : (
          <main className="max-w-lg mx-auto p-4 space-y-6">
            {/* Selected media preview */}
            {selectedFiles.length > 0 ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold text-gray-900">
                    {selectedFiles.length} meme{selectedFiles.length !== 1 ? "s" : ""}
                  </h2>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="text-blue-500 text-sm font-medium"
                  >
                    + Add more
                  </button>
                </div>

                {/* Scattered preview */}
                <div className="relative h-48 bg-gradient-to-br from-amber-50 to-orange-100 rounded-3xl overflow-hidden">
                  {selectedFiles.slice(0, 5).map((sf, i) => {
                    const rotations = [-8, 5, -3, 10, -6];
                    const positions = [
                      { top: "15%", left: "10%" },
                      { top: "10%", right: "15%" },
                      { bottom: "20%", left: "25%" },
                      { bottom: "15%", right: "10%" },
                      { top: "35%", left: "40%" },
                    ];
                    return (
                      <div
                        key={i}
                        className="absolute w-24 h-24 bg-white p-1 rounded-xl shadow-lg"
                        style={{
                          transform: `rotate(${rotations[i]}deg)`,
                          ...positions[i],
                          zIndex: i,
                        }}
                      >
                        {sf.type === "video" ? (
                          <video
                            src={sf.preview}
                            className="w-full h-full object-cover rounded-lg"
                            muted
                          />
                        ) : (
                          <img
                            src={sf.preview}
                            alt=""
                            className="w-full h-full object-cover rounded-lg"
                          />
                        )}
                        <button
                          onClick={() => removeFile(i)}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-sm shadow"
                        >
                          ×
                        </button>
                      </div>
                    );
                  })}
                  {selectedFiles.length > 5 && (
                    <div className="absolute bottom-4 right-4 bg-black/60 text-white px-3 py-1 rounded-full text-sm font-medium">
                      +{selectedFiles.length - 5} more
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-48 bg-gradient-to-br from-amber-50 to-orange-100 rounded-3xl border-2 border-dashed border-amber-300 flex flex-col items-center justify-center gap-3 hover:bg-amber-100 transition-colors"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
                  <span className="text-3xl">📷</span>
                </div>
                <div className="text-center">
                  <p className="font-semibold text-amber-900">Pick some memes</p>
                  <p className="text-sm text-amber-700">From your camera roll</p>
                </div>
              </button>
            )}

            {/* Dump name */}
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <input
                type="text"
                value={dumpName}
                onChange={(e) => setDumpName(e.target.value)}
                placeholder="Name your dump..."
                className="w-full text-lg focus:outline-none"
              />
            </div>

            {/* Recipients */}
            <div className="bg-white rounded-2xl p-4 shadow-sm space-y-3">
              <h3 className="font-semibold text-gray-900">Send to</h3>

              {/* Selected recipients as chips */}
              <div className="flex flex-wrap gap-2">
                {displayRecipients.map((recipient) => (
                  <span
                    key={recipient.groupId || recipient.connectionId}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${
                      recipient.groupId
                        ? "bg-amber-100 text-amber-700"
                        : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    {recipient.groupId ? "👥 " : ""}
                    {formatName(recipient.name)}
                    <button
                      onClick={() => {
                        if (recipient.groupId) toggleGroup(recipient.groupId);
                        else if (recipient.connectionId) toggleConnection(recipient.connectionId);
                      }}
                      className={
                        recipient.groupId
                          ? "text-amber-400 hover:text-amber-600"
                          : "text-blue-400 hover:text-blue-600"
                      }
                    >
                      ×
                    </button>
                  </span>
                ))}

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

              {/* Recipient picker */}
              {showRecipientPicker && (
                <div className="bg-gray-50 rounded-2xl overflow-hidden mt-3">
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
                          <div
                            className={`w-5 h-5 rounded-full flex items-center justify-center ${
                              selectedConnectionIds.has(connection.id) ? "bg-blue-500" : "bg-gray-200"
                            }`}
                          >
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
                          <div
                            className={`w-5 h-5 rounded-full flex items-center justify-center ${
                              selectedConnectionIds.has(connection.id) ? "bg-blue-500" : "bg-gray-200"
                            }`}
                          >
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

                  {groups.length > 0 && (
                    <div className="p-3 border-b border-gray-200">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                        Groups
                      </p>
                      {groups.map((group) => (
                        <div key={group.id} className="mb-2">
                          <div className="flex items-center justify-between py-2">
                            <button
                              onClick={() => setExpandedGroupId(expandedGroupId === group.id ? null : group.id)}
                              className="flex items-center gap-2 flex-1"
                            >
                              <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
                                <span className="text-sm">👥</span>
                              </div>
                              <div className="text-left">
                                <span className="font-medium text-sm block">{group.name}</span>
                                <span className="text-xs text-gray-400">{group.members.length} people</span>
                              </div>
                              <svg
                                className={`w-4 h-4 text-gray-400 transition-transform ${expandedGroupId === group.id ? 'rotate-180' : ''}`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </button>
                            <button
                              onClick={() => toggleGroup(group.id)}
                              className={`w-6 h-6 rounded-full flex items-center justify-center ${
                                selectedGroupIds.has(group.id) ? "bg-blue-500" : "bg-gray-200"
                              }`}
                            >
                              {selectedGroupIds.has(group.id) && (
                                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </button>
                          </div>

                          {/* Expanded member list */}
                          {expandedGroupId === group.id && (
                            <div className="ml-10 mt-1 space-y-1 pb-2">
                              {group.members.map((member) => (
                                <div key={member.id} className="flex items-center gap-2 py-1 text-sm text-gray-600">
                                  <div className="w-5 h-5 bg-gray-200 rounded-full flex items-center justify-center">
                                    <span className="text-[10px] font-medium">{member.name.charAt(0).toUpperCase()}</span>
                                  </div>
                                  <span>{member.name}</span>
                                </div>
                              ))}
                              {group.members.length === 0 && (
                                <p className="text-xs text-gray-400 italic">No members yet</p>
                              )}
                            </div>
                          )}
                        </div>
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
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && newRecipientName.trim()) {
                            handleAddNewRecipient();
                          }
                        }}
                      />
                      <button
                        onClick={handleAddNewRecipient}
                        disabled={!newRecipientName.trim() || addingRecipient}
                        className="px-4 py-2 bg-blue-500 text-white rounded-xl text-sm font-medium disabled:opacity-50"
                      >
                        {addingRecipient ? "..." : "Add"}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {error && (
              <p className="text-red-500 text-sm text-center">{error}</p>
            )}

            {/* Action hint */}
            <p className="text-center text-sm text-gray-400">
              {canSend
                ? `Ready to send to ${recipientCount} ${recipientCount === 1 ? "person" : "people"}`
                : selectedFiles.length > 0
                ? "Add recipients to send, or save as draft"
                : "Pick some memes to get started"}
            </p>
          </main>
        )}
      </div>
    </>
  );
}
