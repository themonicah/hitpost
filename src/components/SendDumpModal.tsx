"use client";

import { useEffect, useState } from "react";
import { Meme } from "@/lib/db";
import { useRouter } from "next/navigation";
import Confetti from "./Confetti";

const SENDING_MESSAGES = [
  "sending the vibes...",
  "delivering heat...",
  "dispatching chaos...",
  "launching memes into orbit...",
  "blessing inboxes...",
];

const NOTE_PLACEHOLDERS = [
  "say something unhinged (optional)",
  "add context or keep them guessing",
  "caption this moment",
  "explain yourself (or don't)",
  "drop some lore (optional)",
];

interface Group {
  id: string;
  name: string;
  members: { id: string; name: string; email: string }[];
}

interface SendDumpModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedMemes: Meme[];
  onSent?: () => void;
}

export default function SendDumpModal({
  isOpen,
  onClose,
  selectedMemes,
  onSent,
}: SendDumpModalProps) {
  const router = useRouter();
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroupIds, setSelectedGroupIds] = useState<Set<string>>(new Set());
  const [manualEmails, setManualEmails] = useState("");
  const [note, setNote] = useState("");
  const [sending, setSending] = useState(false);
  const [sendingMsg, setSendingMsg] = useState(SENDING_MESSAGES[0]);
  const [notePlaceholder] = useState(() => NOTE_PLACEHOLDERS[Math.floor(Math.random() * NOTE_PLACEHOLDERS.length)]);
  const [error, setError] = useState("");
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [showNewGroup, setShowNewGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupEmails, setNewGroupEmails] = useState("");
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  // Fetch groups when modal opens
  useEffect(() => {
    if (isOpen) {
      setLoadingGroups(true);
      fetch("/api/groups")
        .then((res) => res.json())
        .then((data) => {
          setGroups(data.groups || []);
        })
        .catch(console.error)
        .finally(() => setLoadingGroups(false));
    }
  }, [isOpen]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedGroupIds(new Set());
      setManualEmails("");
      setNote("");
      setError("");
      setShowNewGroup(false);
      setNewGroupName("");
      setNewGroupEmails("");
    }
  }, [isOpen]);

  async function handleCreateGroup() {
    if (!newGroupName.trim()) {
      setError("Group name is required");
      return;
    }

    const emails = newGroupEmails
      .split(/[,\n]/)
      .map((e) => e.trim().toLowerCase())
      .filter((e) => e && e.includes("@"));

    if (emails.length === 0) {
      setError("Add at least one email to the group");
      return;
    }

    setCreatingGroup(true);
    setError("");

    try {
      // Create the group
      const res = await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newGroupName.trim() }),
      });

      if (!res.ok) throw new Error("Failed to create group");

      const { group } = await res.json();

      // Add members
      for (const email of emails) {
        await fetch(`/api/groups/${group.id}/members`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: email.split("@")[0], email }),
        });
      }

      // Refresh groups and select the new one
      const groupsRes = await fetch("/api/groups");
      const groupsData = await groupsRes.json();
      setGroups(groupsData.groups || []);
      setSelectedGroupIds((prev) => new Set([...prev, group.id]));

      // Reset form
      setShowNewGroup(false);
      setNewGroupName("");
      setNewGroupEmails("");
    } catch (err) {
      setError("Failed to create group");
    } finally {
      setCreatingGroup(false);
    }
  }

  function toggleGroup(groupId: string) {
    setSelectedGroupIds((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  }

  function getUniqueRecipients(): string[] {
    const emails = new Set<string>();

    // Add emails from selected groups
    for (const groupId of selectedGroupIds) {
      const group = groups.find((g) => g.id === groupId);
      if (group) {
        for (const member of group.members) {
          emails.add(member.email.toLowerCase());
        }
      }
    }

    // Add manual emails
    const manualList = manualEmails
      .split(/[,\n]/)
      .map((e) => e.trim().toLowerCase())
      .filter((e) => e && e.includes("@"));

    for (const email of manualList) {
      emails.add(email);
    }

    return Array.from(emails);
  }

  async function handleSend() {
    const recipients = getUniqueRecipients();

    if (recipients.length === 0) {
      setError("who's getting blessed with this content? pick someone!");
      return;
    }

    setSending(true);
    setError("");

    // Rotate sending messages
    const msgInterval = setInterval(() => {
      setSendingMsg(SENDING_MESSAGES[Math.floor(Math.random() * SENDING_MESSAGES.length)]);
    }, 800);

    try {
      const res = await fetch("/api/dumps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memeIds: selectedMemes.map((m) => m.id),
          note: note || null,
          recipients,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to send");
      }

      const data = await res.json();
      clearInterval(msgInterval);
      setShowConfetti(true);
      setTimeout(() => {
        onSent?.();
        onClose();
        setShowConfetti(false);
        router.push(`/dumps/${data.dumpId}`);
      }, 1000);
    } catch (err) {
      clearInterval(msgInterval);
      setError(err instanceof Error ? err.message : "something broke. the memes are too powerful");
    } finally {
      setSending(false);
    }
  }

  if (!isOpen) return null;

  const recipientCount = getUniqueRecipients().length;

  return (
    <>
      <Confetti active={showConfetti} />
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center animate-fadeIn">
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-white dark:bg-gray-900 rounded-t-3xl sm:rounded-3xl max-h-[90vh] overflow-hidden flex flex-col animate-slideUp sm:animate-scaleIn">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800">
          <button
            onClick={onClose}
            className="text-blue-500 font-medium"
            disabled={sending}
          >
            Cancel
          </button>
          <h2 className="font-semibold">Send Dump</h2>
          <button
            onClick={handleSend}
            disabled={sending || recipientCount === 0}
            className="text-blue-500 font-semibold disabled:opacity-50"
          >
            {sending ? sendingMsg : "Send"}
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Meme preview */}
          <div className="text-center">
            <div className="flex justify-center gap-1 mb-2">
              {selectedMemes.slice(0, 4).map((meme) => (
                <div
                  key={meme.id}
                  className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800"
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
                </div>
              ))}
              {selectedMemes.length > 4 && (
                <div className="w-16 h-16 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500 text-sm">
                  +{selectedMemes.length - 4}
                </div>
              )}
            </div>
            <p className="text-sm text-gray-500">
              {selectedMemes.length} meme{selectedMemes.length !== 1 ? "s" : ""} selected
            </p>
          </div>

          {/* Note */}
          <div>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={notePlaceholder}
              className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-800 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={2}
            />
          </div>

          {/* Circles */}
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-2">Send to:</h3>
            {loadingGroups ? (
              <div className="flex justify-center py-4">
                <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <div className="space-y-2">
                {groups.map((group) => (
                  <button
                    key={group.id}
                    onClick={() => toggleGroup(group.id)}
                    className={`w-full flex items-center justify-between p-3 rounded-xl transition-colors ${
                      selectedGroupIds.has(group.id)
                        ? "bg-blue-50 dark:bg-blue-900/30 border-2 border-blue-500"
                        : "bg-gray-100 dark:bg-gray-800 border-2 border-transparent"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-5 h-5 rounded flex items-center justify-center ${
                          selectedGroupIds.has(group.id)
                            ? "bg-blue-500 text-white"
                            : "bg-gray-300 dark:bg-gray-600"
                        }`}
                      >
                        {selectedGroupIds.has(group.id) && (
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      <span className="font-medium">{group.name}</span>
                    </div>
                    <span className="text-sm text-gray-500">
                      {group.members.length} {group.members.length === 1 ? "person" : "people"}
                    </span>
                  </button>
                ))}
                {/* New Group - inline form or button */}
                {showNewGroup ? (
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl space-y-3">
                    <input
                      type="text"
                      value={newGroupName}
                      onChange={(e) => setNewGroupName(e.target.value)}
                      placeholder="Group name (e.g., Family)"
                      className="w-full px-3 py-2 bg-white dark:bg-gray-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <textarea
                      value={newGroupEmails}
                      onChange={(e) => setNewGroupEmails(e.target.value)}
                      placeholder="Emails (one per line or comma-separated)"
                      className="w-full px-3 py-2 bg-white dark:bg-gray-800 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={2}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setShowNewGroup(false);
                          setNewGroupName("");
                          setNewGroupEmails("");
                        }}
                        className="flex-1 py-2 text-gray-500 text-sm font-medium"
                        disabled={creatingGroup}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleCreateGroup}
                        disabled={creatingGroup}
                        className="flex-1 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium disabled:opacity-50"
                      >
                        {creatingGroup ? "Creating..." : "Create Group"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowNewGroup(true)}
                    className="w-full flex items-center gap-3 p-3 text-blue-500 font-medium"
                  >
                    <div className="w-5 h-5 rounded bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </div>
                    New Group
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Manual emails */}
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-2">Or add emails:</h3>
            <textarea
              value={manualEmails}
              onChange={(e) => setManualEmails(e.target.value)}
              placeholder="email@example.com, another@example.com"
              className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-800 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              rows={2}
            />
          </div>

          {/* Error */}
          {error && (
            <p className="text-red-500 text-sm text-center">{error}</p>
          )}

          {/* Recipient summary */}
          {recipientCount > 0 && (
            <p className="text-center text-sm text-gray-500">
              Sending to {recipientCount} {recipientCount === 1 ? "person" : "people"}
            </p>
          )}
        </div>
      </div>
      </div>
    </>
  );
}
