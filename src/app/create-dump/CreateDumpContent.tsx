"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Meme } from "@/lib/db";
import MemeGrid from "@/components/MemeGrid";
import Link from "next/link";

interface Collection {
  id: string;
  name: string;
  memeCount: number;
  memes: Meme[];
}

interface GroupMember {
  id: string;
  group_id: string;
  name: string;
  email: string;
}

interface Group {
  id: string;
  name: string;
  members: GroupMember[];
}

interface CreateDumpContentProps {
  userId: string;
}

type Step = "memes" | "recipients" | "review";

export default function CreateDumpContent({ userId }: CreateDumpContentProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Data
  const [memes, setMemes] = useState<Meme[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);

  // Selection state
  const [step, setStep] = useState<Step>("memes");
  const [selectedMemeIds, setSelectedMemeIds] = useState<Set<string>>(new Set());
  const [selectedGroupIds, setSelectedGroupIds] = useState<Set<string>>(new Set());
  const [manualEmails, setManualEmails] = useState("");
  const [note, setNote] = useState("");
  const [sending, setSending] = useState(false);

  // Source selection
  const [memeSource, setMemeSource] = useState<"library" | "collection">("library");
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [memesRes, collectionsRes, groupsRes] = await Promise.all([
        fetch("/api/memes"),
        fetch("/api/collections"),
        fetch("/api/groups"),
      ]);

      if (memesRes.ok) {
        const data = await memesRes.json();
        setMemes(data.memes);
      }
      if (collectionsRes.ok) {
        const data = await collectionsRes.json();
        setCollections(data.collections || []);
      }
      if (groupsRes.ok) {
        const data = await groupsRes.json();
        setGroups(data.groups || []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle pre-selected memes from URL (e.g., from collection page)
  useEffect(() => {
    const memesParam = searchParams.get("memes");
    const fromParam = searchParams.get("from");
    const collectionIdParam = searchParams.get("collectionId");

    if (memesParam) {
      const ids = memesParam.split(",").filter(Boolean);
      setSelectedMemeIds(new Set(ids));
    }
    if (fromParam === "collection" && collectionIdParam) {
      setMemeSource("collection");
      setSelectedCollectionId(collectionIdParam);
    }
  }, [searchParams]);

  // Get deduplicated list of recipients
  function getUniqueRecipients(): { email: string; name: string; source: string }[] {
    const recipients = new Map<string, { email: string; name: string; source: string }>();

    // Add group members
    for (const group of groups) {
      if (selectedGroupIds.has(group.id)) {
        for (const member of group.members) {
          const email = member.email.toLowerCase();
          if (!recipients.has(email)) {
            recipients.set(email, {
              email,
              name: member.name,
              source: group.name,
            });
          }
        }
      }
    }

    // Add manual emails
    const manualList = manualEmails
      .split(/[,\n]/)
      .map((e) => e.trim().toLowerCase())
      .filter((e) => e && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e));

    for (const email of manualList) {
      if (!recipients.has(email)) {
        recipients.set(email, {
          email,
          name: email.split("@")[0],
          source: "Manual",
        });
      }
    }

    return Array.from(recipients.values());
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

  function selectCollection(collectionId: string) {
    setSelectedCollectionId(collectionId);
    const collection = collections.find((c) => c.id === collectionId);
    if (collection) {
      const memeIds = collection.memes.map((m) => m.id);
      setSelectedMemeIds(new Set(memeIds));
    }
  }

  function getSelectedMemes(): Meme[] {
    return memes.filter((m) => selectedMemeIds.has(m.id));
  }

  async function handleSend() {
    const recipients = getUniqueRecipients();

    if (selectedMemeIds.size === 0) {
      alert("Please select at least 1 meme");
      return;
    }

    if (recipients.length === 0) {
      alert("Please select at least 1 recipient");
      return;
    }

    setSending(true);
    try {
      const res = await fetch("/api/dumps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memeIds: Array.from(selectedMemeIds),
          note: note.trim() || null,
          recipients: recipients.map((r) => r.email),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        router.push(`/history/${data.dumpId}`);
      } else {
        alert("Failed to send dump. Please try again.");
      }
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return (
      <div className="text-center py-12 text-gray-500">
        Loading...
      </div>
    );
  }

  if (memes.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 mb-4">
          You need to upload some memes first!
        </p>
        <Link
          href="/library"
          className="text-blue-500 hover:text-blue-600 font-medium"
        >
          Go to Library
        </Link>
      </div>
    );
  }

  const selectedMemes = getSelectedMemes();
  const uniqueRecipients = getUniqueRecipients();

  return (
    <div className="space-y-6">
      {/* Progress indicator */}
      <div className="flex items-center justify-center gap-2 mb-6">
        {["memes", "recipients", "review"].map((s, i) => (
          <div key={s} className="flex items-center">
            <button
              onClick={() => {
                if (s === "memes") setStep("memes");
                else if (s === "recipients" && selectedMemeIds.size > 0) setStep("recipients");
                else if (s === "review" && selectedMemeIds.size > 0 && uniqueRecipients.length > 0) setStep("review");
              }}
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                step === s
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200 dark:bg-gray-700 text-gray-500"
              }`}
            >
              {i + 1}
            </button>
            {i < 2 && (
              <div className="w-12 h-0.5 bg-gray-200 dark:bg-gray-700 mx-1" />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Select Memes */}
      {step === "memes" && (
        <div className="space-y-6">
          {/* Source selector */}
          {collections.length > 0 && (
            <div className="bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm">
              <h2 className="font-semibold mb-3">Select from:</h2>
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => {
                    setMemeSource("library");
                    setSelectedCollectionId(null);
                  }}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    memeSource === "library"
                      ? "bg-blue-500 text-white"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                  }`}
                >
                  Library
                </button>
                <button
                  onClick={() => setMemeSource("collection")}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    memeSource === "collection"
                      ? "bg-blue-500 text-white"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                  }`}
                >
                  Collection
                </button>
              </div>

              {memeSource === "collection" && (
                <div className="flex flex-wrap gap-2">
                  {collections.map((collection) => (
                    <button
                      key={collection.id}
                      onClick={() => selectCollection(collection.id)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        selectedCollectionId === collection.id
                          ? "bg-green-500 text-white"
                          : "bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700"
                      }`}
                    >
                      {collection.name} ({collection.memeCount})
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Meme selection */}
          <div className="bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm">
            <h2 className="font-semibold mb-3">
              {memeSource === "collection" && selectedCollectionId
                ? "Collection memes selected"
                : "Select memes"}{" "}
              ({selectedMemeIds.size}/50)
            </h2>
            <MemeGrid
              memes={memeSource === "collection" && selectedCollectionId
                ? memes.filter((m) => selectedMemeIds.has(m.id))
                : memes}
              selectable
              selectedIds={selectedMemeIds}
              onSelectionChange={setSelectedMemeIds}
              maxSelections={50}
            />
          </div>

          {/* Continue button */}
          <button
            onClick={() => setStep("recipients")}
            disabled={selectedMemeIds.size === 0}
            className="w-full py-4 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-colors text-lg"
          >
            Continue with {selectedMemeIds.size} meme{selectedMemeIds.size !== 1 ? "s" : ""}
          </button>
        </div>
      )}

      {/* Step 2: Select Recipients */}
      {step === "recipients" && (
        <div className="space-y-6">
          {/* Groups selection */}
          {groups.length > 0 && (
            <div className="bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm">
              <h2 className="font-semibold mb-3">Select recipient groups</h2>
              <div className="space-y-2">
                {groups.map((group) => (
                  <button
                    key={group.id}
                    onClick={() => toggleGroup(group.id)}
                    className={`w-full p-3 rounded-lg text-left transition-colors ${
                      selectedGroupIds.has(group.id)
                        ? "bg-blue-100 dark:bg-blue-900/50 border-2 border-blue-500"
                        : "bg-gray-50 dark:bg-gray-800 border-2 border-transparent hover:border-gray-200 dark:hover:border-gray-700"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{group.name}</p>
                        <p className="text-sm text-gray-500">
                          {group.members.length} member{group.members.length !== 1 ? "s" : ""}
                        </p>
                      </div>
                      {selectedGroupIds.has(group.id) && (
                        <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm">
                          ✓
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
              <Link
                href="/groups"
                className="text-blue-500 hover:text-blue-600 text-sm mt-3 inline-block"
              >
                + Manage groups
              </Link>
            </div>
          )}

          {/* Manual emails */}
          <div className="bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm">
            <h2 className="font-semibold mb-3">
              {groups.length > 0 ? "Or add emails manually" : "Enter recipient emails"}
            </h2>
            <textarea
              value={manualEmails}
              onChange={(e) => setManualEmails(e.target.value)}
              placeholder="friend@example.com, another@example.com"
              rows={3}
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
            <p className="text-sm text-gray-400 mt-1">
              Separate multiple emails with commas or new lines
            </p>
          </div>

          {/* Note */}
          <div className="bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm">
            <h2 className="font-semibold mb-3">Add a note (optional)</h2>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="good batch today..."
              maxLength={500}
              rows={2}
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* Deduplication notice */}
          {uniqueRecipients.length > 0 && (
            <div className="bg-green-50 dark:bg-green-900/30 rounded-lg p-4">
              <p className="text-sm text-green-700 dark:text-green-300">
                <strong>{uniqueRecipients.length}</strong> unique recipient{uniqueRecipients.length !== 1 ? "s" : ""}{" "}
                {selectedGroupIds.size > 0 && "(duplicates removed)"}
              </p>
            </div>
          )}

          {/* Navigation buttons */}
          <div className="flex gap-3">
            <button
              onClick={() => setStep("memes")}
              className="flex-1 py-4 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-bold rounded-xl transition-colors"
            >
              Back
            </button>
            <button
              onClick={() => setStep("review")}
              disabled={uniqueRecipients.length === 0}
              className="flex-1 py-4 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-colors"
            >
              Review
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Review */}
      {step === "review" && (
        <div className="space-y-6">
          {/* Memes preview */}
          <div className="bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold">{selectedMemes.length} memes</h2>
              <button
                onClick={() => setStep("memes")}
                className="text-blue-500 hover:text-blue-600 text-sm"
              >
                Edit
              </button>
            </div>
            <div className="grid grid-cols-6 gap-1">
              {selectedMemes.slice(0, 12).map((meme) => (
                <div
                  key={meme.id}
                  className="aspect-square rounded overflow-hidden bg-gray-100 dark:bg-gray-800"
                >
                  {meme.file_type === "video" ? (
                    <video src={meme.file_url} className="w-full h-full object-cover" muted />
                  ) : (
                    <img src={meme.file_url} alt="" className="w-full h-full object-cover" />
                  )}
                </div>
              ))}
              {selectedMemes.length > 12 && (
                <div className="aspect-square rounded bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500 text-xs">
                  +{selectedMemes.length - 12}
                </div>
              )}
            </div>
          </div>

          {/* Note preview */}
          {note && (
            <div className="bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm">
              <h2 className="font-semibold mb-2">Note</h2>
              <p className="text-gray-600 dark:text-gray-400">"{note}"</p>
            </div>
          )}

          {/* Recipients preview */}
          <div className="bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold">{uniqueRecipients.length} recipients</h2>
              <button
                onClick={() => setStep("recipients")}
                className="text-blue-500 hover:text-blue-600 text-sm"
              >
                Edit
              </button>
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {uniqueRecipients.map((recipient) => (
                <div
                  key={recipient.email}
                  className="flex items-center justify-between py-2 px-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-sm">{recipient.name}</p>
                    <p className="text-xs text-gray-500">{recipient.email}</p>
                  </div>
                  <span className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                    {recipient.source}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Send button */}
          <div className="flex gap-3">
            <button
              onClick={() => setStep("recipients")}
              className="flex-1 py-4 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-bold rounded-xl transition-colors"
            >
              Back
            </button>
            <button
              onClick={handleSend}
              disabled={sending}
              className="flex-1 py-4 bg-green-500 hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-colors text-lg"
            >
              {sending ? "Sending..." : `Send to ${uniqueRecipients.length} people`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
