"use client";

import { useEffect, useState, useCallback } from "react";
import { Meme } from "@/lib/db";
import MemeGrid from "@/components/MemeGrid";
import MemeUploader from "@/components/MemeUploader";
import Link from "next/link";

interface Collection {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
  memes: Meme[];
  memeCount: number;
}

interface LibraryContentProps {
  userId: string;
}

export default function LibraryContent({ userId }: LibraryContentProps) {
  const [memes, setMemes] = useState<Meme[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showNewCollection, setShowNewCollection] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState("");
  const [showAddToCollection, setShowAddToCollection] = useState(false);

  const fetchMemes = useCallback(async () => {
    try {
      const res = await fetch("/api/memes");
      if (res.ok) {
        const data = await res.json();
        setMemes(data.memes);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCollections = useCallback(async () => {
    try {
      const res = await fetch("/api/collections");
      if (res.ok) {
        const data = await res.json();
        setCollections(data.collections || []);
      }
    } catch (error) {
      console.error("Failed to fetch collections:", error);
    }
  }, []);

  useEffect(() => {
    fetchMemes();
    fetchCollections();
  }, [fetchMemes, fetchCollections]);

  function handleDelete(id: string) {
    setMemes((prev) => prev.filter((m) => m.id !== id));
  }

  function toggleSelectMode() {
    setSelectMode(!selectMode);
    setSelectedIds(new Set());
    setShowNewCollection(false);
    setShowAddToCollection(false);
  }

  async function createCollection() {
    if (!newCollectionName.trim() || selectedIds.size === 0) return;

    try {
      const res = await fetch("/api/collections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newCollectionName,
          memeIds: Array.from(selectedIds),
        }),
      });

      if (res.ok) {
        setNewCollectionName("");
        setShowNewCollection(false);
        setSelectMode(false);
        setSelectedIds(new Set());
        fetchCollections();
      }
    } catch (error) {
      console.error("Failed to create collection:", error);
    }
  }

  async function addToCollection(collectionId: string) {
    if (selectedIds.size === 0) return;

    try {
      const res = await fetch(`/api/collections/${collectionId}/memes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memeIds: Array.from(selectedIds) }),
      });

      if (res.ok) {
        setShowAddToCollection(false);
        setSelectMode(false);
        setSelectedIds(new Set());
        fetchCollections();
      }
    } catch (error) {
      console.error("Failed to add to collection:", error);
    }
  }

  async function deleteCollection(id: string) {
    if (!confirm("Delete this collection? (Memes will not be deleted)")) return;

    try {
      const res = await fetch(`/api/collections/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        fetchCollections();
      }
    } catch (error) {
      console.error("Failed to delete collection:", error);
    }
  }

  if (loading) {
    return (
      <div className="text-center py-12 text-gray-500">
        Loading...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <MemeUploader onUpload={fetchMemes} />

      {/* Collections Section */}
      <div className="bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Collections</h2>
          {collections.length > 0 && (
            <span className="text-sm text-gray-500">
              {collections.length} collection{collections.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        {collections.length === 0 ? (
          <p className="text-gray-500 text-sm">
            No collections yet. Select memes below to create one.
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {collections.map((collection) => (
              <div
                key={collection.id}
                className="bg-gray-50 dark:bg-gray-800 rounded-lg overflow-hidden group"
              >
                <Link href={`/collections/${collection.id}`}>
                  <div className="aspect-video relative overflow-hidden bg-gray-200 dark:bg-gray-700">
                    {collection.memes.length > 0 ? (
                      <div className="grid grid-cols-2 gap-0.5 h-full">
                        {collection.memes.slice(0, 4).map((meme) => (
                          <div key={meme.id} className="relative overflow-hidden">
                            {meme.file_type === "video" ? (
                              <video
                                src={meme.file_path}
                                className="w-full h-full object-cover"
                                muted
                              />
                            ) : (
                              <img
                                src={meme.file_path}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-400">
                        Empty
                      </div>
                    )}
                  </div>
                </Link>
                <div className="p-2 flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <Link href={`/collections/${collection.id}`}>
                      <p className="font-medium text-sm truncate hover:text-blue-500">
                        {collection.name}
                      </p>
                    </Link>
                    <p className="text-xs text-gray-500">
                      {collection.memeCount} meme{collection.memeCount !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <button
                    onClick={() => deleteCollection(collection.id)}
                    className="p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    &times;
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* All Memes Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">
            {memes.length} meme{memes.length !== 1 ? "s" : ""}
          </h2>
          <button
            onClick={toggleSelectMode}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              selectMode
                ? "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                : "bg-blue-500 hover:bg-blue-600 text-white"
            }`}
          >
            {selectMode ? "Cancel" : "Select"}
          </button>
        </div>

        {/* Selection Actions */}
        {selectMode && selectedIds.size > 0 && (
          <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-4 mb-4">
            <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
              {selectedIds.size} meme{selectedIds.size !== 1 ? "s" : ""} selected
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setShowNewCollection(true)}
                className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium"
              >
                Create Collection
              </button>
              {collections.length > 0 && (
                <button
                  onClick={() => setShowAddToCollection(true)}
                  className="px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium"
                >
                  Add to Collection
                </button>
              )}
            </div>

            {/* New Collection Form */}
            {showNewCollection && (
              <div className="mt-3 flex gap-2">
                <input
                  type="text"
                  value={newCollectionName}
                  onChange={(e) => setNewCollectionName(e.target.value)}
                  placeholder="Collection name"
                  className="flex-1 px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-sm"
                  autoFocus
                />
                <button
                  onClick={createCollection}
                  disabled={!newCollectionName.trim()}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white rounded-lg text-sm font-medium"
                >
                  Create
                </button>
                <button
                  onClick={() => {
                    setShowNewCollection(false);
                    setNewCollectionName("");
                  }}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg text-sm font-medium"
                >
                  Cancel
                </button>
              </div>
            )}

            {/* Add to Collection Dropdown */}
            {showAddToCollection && (
              <div className="mt-3 flex flex-wrap gap-2">
                {collections.map((collection) => (
                  <button
                    key={collection.id}
                    onClick={() => addToCollection(collection.id)}
                    className="px-3 py-1.5 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 rounded-lg text-sm"
                  >
                    {collection.name}
                  </button>
                ))}
                <button
                  onClick={() => setShowAddToCollection(false)}
                  className="px-3 py-1.5 text-gray-500 hover:text-gray-700 text-sm"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        )}

        <MemeGrid
          memes={memes}
          selectable={selectMode}
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
          onDelete={selectMode ? undefined : handleDelete}
        />
      </div>
    </div>
  );
}
