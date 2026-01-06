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

  // Handle pre-selected memes from URL
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
        router.push(`/dumps/${data.dumpId}`);
      } else {
        alert("Failed to send dump. Please try again.");
      }
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (memes.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          No memes yet
        </h3>
        <p className="text-gray-500 mb-4">
          Upload some memes first!
        </p>
        <Link
          href="/"
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
    <div className="space-y-4">
      {/* Progress indicator */}
      <div className="flex items-center justify-center gap-2 py-2">
        {(["memes", "recipients", "review"] as Step[]).map((s, i) => (
          <div key={s} className="flex items-center">
            <button
              onClick={() => {
                if (s === "memes") setStep("memes");
                else if (s === "recipients" && selectedMemeIds.size > 0) setStep("recipients");
                else if (s === "review" && selectedMemeIds.size > 0 && uniqueRecipients.length > 0) setStep("review");
              }}
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                step === s
                  ? "bg-blue-500 text-white scale-110"
                  : "bg-gray-200 dark:bg-gray-700 text-gray-500"
              }`}
            >
              {i + 1}
            </button>
            {i < 2 && (
              <div className={`w-8 h-0.5 mx-1 transition-colors ${
                (i === 0 && step !== "memes") || (i === 1 && step === "review")
                  ? "bg-blue-500"
                  : "bg-gray-200 dark:bg-gray-700"
              }`} />
            )}
          </div>
        ))}
      </div>

      {/* Step labels */}
      <div className="flex justify-between text-xs text-gray-500 px-4">
        <span className={step === "memes" ? "text-blue-500 font-medium" : ""}>Memes</span>
        <span className={step === "recipients" ? "text-blue-500 font-medium" : ""}>Recipients</span>
        <span className={step === "review" ? "text-blue-500 font-medium" : ""}>Review</span>
      </div>

      {/* Step 1: Select Memes */}
      {step === "memes" && (
        <div className="space-y-4">
          {/* Source selector */}
          {collections.length > 0 && (
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-sm">
              <div className="flex gap-2 mb-3">
                <button
                  onClick={() => {
                    setMemeSource("library");
                    setSelectedCollectionId(null);
                  }}
                  className={`flex-1 py-2 rounded-xl font-medium text-sm transition-colors ${
                    memeSource === "library"
                      ? "bg-blue-500 text-white"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                  }`}
                >
                  All Memes
                </button>
                <button
                  onClick={() => setMemeSource("collection")}
                  className={`flex-1 py-2 rounded-xl font-medium text-sm transition-colors ${
                    memeSource === "collection"
                      ? "bg-blue-500 text-white"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                  }`}
                >
                  Dump
                </button>
              </div>

              {memeSource === "collection" && (
                <div className="flex flex-wrap gap-2">
                  {collections.map((collection) => (
                    <button
                      key={collection.id}
                      onClick={() => selectCollection(collection.id)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                        selectedCollectionId === collection.id
                          ? "bg-green-500 text-white"
                          : "bg-gray-100 dark:bg-gray-800"
                      }`}
                    >
                      {collection.name} ({collection.memeCount})
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Selection count */}
          <div className="flex items-center justify-between px-1">
            <span className="text-sm text-gray-500">
              {selectedMemeIds.size} selected
            </span>
            {selectedMemeIds.size > 0 && (
              <button
                onClick={() => setSelectedMemeIds(new Set())}
                className="text-sm text-red-500"
              >
                Clear
              </button>
            )}
          </div>

          {/* Meme grid */}
          <MemeGrid
            memes={memeSource === "collection" && selectedCollectionId
              ? memes.filter((m) => selectedMemeIds.has(m.id))
              : memes}
            selectable
            selectedIds={selectedMemeIds}
            onSelectionChange={setSelectedMemeIds}
            maxSelections={50}
          />

          {/* Continue button */}
          <div className="sticky bottom-20 pt-4 bg-gradient-to-t from-gray-50 dark:from-gray-950">
            <button
              onClick={() => setStep("recipients")}
              disabled={selectedMemeIds.size === 0}
              className="w-full py-4 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-semibold rounded-2xl transition-colors"
            >
              Continue with {selectedMemeIds.size} meme{selectedMemeIds.size !== 1 ? "s" : ""}
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Select Recipients */}
      {step === "recipients" && (
        <div className="space-y-4">
          {/* Groups selection */}
          {groups.length > 0 && (
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-sm">
              <h2 className="font-semibold mb-3 text-sm text-gray-500 uppercase tracking-wide">Circles</h2>
              <div className="space-y-2">
                {groups.map((group) => (
                  <button
                    key={group.id}
                    onClick={() => toggleGroup(group.id)}
                    className={`w-full p-3 rounded-xl text-left transition-all ${
                      selectedGroupIds.has(group.id)
                        ? "bg-blue-50 dark:bg-blue-900/30 ring-2 ring-blue-500"
                        : "bg-gray-50 dark:bg-gray-800"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{group.name}</p>
                        <p className="text-sm text-gray-500">
                          {group.members.length} member{group.members.length !== 1 ? "s" : ""}
                        </p>
                      </div>
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                        selectedGroupIds.has(group.id)
                          ? "bg-blue-500 border-blue-500 text-white"
                          : "border-gray-300 dark:border-gray-600"
                      }`}>
                        {selectedGroupIds.has(group.id) && (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
              <Link
                href="/groups"
                className="text-blue-500 hover:text-blue-600 text-sm mt-3 inline-flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Manage circles
              </Link>
            </div>
          )}

          {/* Manual emails */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-sm">
            <h2 className="font-semibold mb-3 text-sm text-gray-500 uppercase tracking-wide">
              {groups.length > 0 ? "Add Emails" : "Recipients"}
            </h2>
            <textarea
              value={manualEmails}
              onChange={(e) => setManualEmails(e.target.value)}
              placeholder="friend@example.com, another@example.com"
              rows={3}
              className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm"
            />
          </div>

          {/* Note */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-sm">
            <h2 className="font-semibold mb-3 text-sm text-gray-500 uppercase tracking-wide">Note (optional)</h2>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="check these out..."
              maxLength={500}
              rows={2}
              className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm"
            />
          </div>

          {/* Recipient count */}
          {uniqueRecipients.length > 0 && (
            <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-3 text-center">
              <span className="text-green-700 dark:text-green-400 font-medium">
                {uniqueRecipients.length} recipient{uniqueRecipients.length !== 1 ? "s" : ""}
              </span>
            </div>
          )}

          {/* Navigation */}
          <div className="sticky bottom-20 pt-4 bg-gradient-to-t from-gray-50 dark:from-gray-950">
            <div className="flex gap-3">
              <button
                onClick={() => setStep("memes")}
                className="flex-1 py-4 bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold rounded-2xl"
              >
                Back
              </button>
              <button
                onClick={() => setStep("review")}
                disabled={uniqueRecipients.length === 0}
                className="flex-1 py-4 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-semibold rounded-2xl"
              >
                Review
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Review */}
      {step === "review" && (
        <div className="space-y-4">
          {/* Memes preview */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold">{selectedMemes.length} memes</h2>
              <button onClick={() => setStep("memes")} className="text-blue-500 text-sm font-medium">
                Edit
              </button>
            </div>
            <div className="grid grid-cols-6 gap-1 rounded-xl overflow-hidden">
              {selectedMemes.slice(0, 12).map((meme) => (
                <div key={meme.id} className="aspect-square bg-gray-100 dark:bg-gray-800">
                  {meme.file_type === "video" ? (
                    <video src={meme.file_url} className="w-full h-full object-cover" muted />
                  ) : (
                    <img src={meme.file_url} alt="" className="w-full h-full object-cover" />
                  )}
                </div>
              ))}
              {selectedMemes.length > 12 && (
                <div className="aspect-square bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-500 text-xs font-medium">
                  +{selectedMemes.length - 12}
                </div>
              )}
            </div>
          </div>

          {/* Note */}
          {note && (
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-sm">
              <h2 className="font-semibold mb-2 text-sm text-gray-500">Note</h2>
              <p className="text-gray-700 dark:text-gray-300">"{note}"</p>
            </div>
          )}

          {/* Recipients */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold">{uniqueRecipients.length} recipients</h2>
              <button onClick={() => setStep("recipients")} className="text-blue-500 text-sm font-medium">
                Edit
              </button>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {uniqueRecipients.map((r) => (
                <div key={r.email} className="flex items-center justify-between py-2 px-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm truncate">{r.name}</p>
                    <p className="text-xs text-gray-500 truncate">{r.email}</p>
                  </div>
                  <span className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full ml-2">
                    {r.source}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Send */}
          <div className="sticky bottom-20 pt-4 bg-gradient-to-t from-gray-50 dark:from-gray-950">
            <div className="flex gap-3">
              <button
                onClick={() => setStep("recipients")}
                className="flex-1 py-4 bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold rounded-2xl"
              >
                Back
              </button>
              <button
                onClick={handleSend}
                disabled={sending}
                className="flex-1 py-4 bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white font-semibold rounded-2xl flex items-center justify-center gap-2"
              >
                {sending ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                    Send Dump
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
