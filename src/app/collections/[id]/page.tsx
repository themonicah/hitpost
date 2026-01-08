"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Header from "@/components/Header";
import Link from "next/link";
import { Meme } from "@/lib/db";

interface Collection {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
}

export default function CollectionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const collectionId = params.id as string;

  const [collection, setCollection] = useState<Collection | null>(null);
  const [memes, setMemes] = useState<Meme[]>([]);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");

  useEffect(() => {
    fetchCollection();
    fetchSession();
  }, [collectionId]);

  async function fetchSession() {
    try {
      const res = await fetch("/api/auth/session");
      if (res.ok) {
        const data = await res.json();
        if (!data.user) {
          router.push("/");
        } else {
          setUserEmail(data.user.email);
        }
      }
    } catch {
      router.push("/");
    }
  }

  async function fetchCollection() {
    try {
      const res = await fetch(`/api/collections/${collectionId}`);
      if (res.status === 401) {
        router.push("/");
        return;
      }
      if (res.status === 404) {
        router.push("/");
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setCollection(data.collection);
        setMemes(data.memes);
        setEditName(data.collection.name);
      }
    } catch (error) {
      console.error("Failed to fetch dump:", error);
    } finally {
      setLoading(false);
    }
  }

  async function updateName() {
    if (!editName.trim()) return;

    try {
      const res = await fetch(`/api/collections/${collectionId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName }),
      });

      if (res.ok) {
        setCollection((prev) => (prev ? { ...prev, name: editName } : null));
        setIsEditing(false);
      }
    } catch (error) {
      console.error("Failed to update dump:", error);
    }
  }

  async function removeMeme(memeId: string) {
    try {
      const res = await fetch(`/api/collections/${collectionId}/memes`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memeId }),
      });

      if (res.ok) {
        setMemes((prev) => prev.filter((m) => m.id !== memeId));
      }
    } catch (error) {
      console.error("Failed to remove meme:", error);
    }
  }

  async function deleteCollection() {
    if (!confirm("Delete this dump? (Memes will not be deleted)")) return;

    try {
      const res = await fetch(`/api/collections/${collectionId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        router.push("/");
      }
    } catch (error) {
      console.error("Failed to delete dump:", error);
    }
  }

  function sendCollection() {
    const memeIds = memes.map((m) => m.id).join(",");
    router.push(`/dumps/create?memes=${memeIds}&from=collection&collectionId=${collectionId}`);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-8">
        <Header email={userEmail || "Loading..."} title="Dump" showBack />
        <main className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        </main>
      </div>
    );
  }

  if (!collection) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-8">
        <Header email={userEmail} title="Dump" showBack />
        <main className="max-w-4xl mx-auto px-4 py-6">
          <p className="text-center text-gray-500">Dump not found</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-8">
      <Header email={userEmail} title={collection.name} showBack />

      <main className="max-w-4xl mx-auto px-4 py-4">
        {/* Header with edit */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-sm mb-4">
          {isEditing ? (
            <div className="flex gap-2 items-center">
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="flex-1 text-lg font-bold bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2"
                autoFocus
              />
              <button
                onClick={updateName}
                className="px-4 py-2 bg-blue-500 text-white rounded-xl text-sm font-medium"
              >
                Save
              </button>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setEditName(collection.name);
                }}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-xl text-sm font-medium"
              >
                Cancel
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">{collection.name}</h2>
                <p className="text-sm text-gray-500">
                  {memes.length} meme{memes.length !== 1 ? "s" : ""}
                </p>
              </div>
              <button
                onClick={() => setIsEditing(true)}
                className="text-blue-500 text-sm font-medium"
              >
                Edit
              </button>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 mb-4">
          {memes.length > 0 && (
            <button
              onClick={sendCollection}
              className="flex-1 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-2xl font-medium flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
              Send This Dump
            </button>
          )}
          <button
            onClick={deleteCollection}
            className="px-4 py-3 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-2xl font-medium"
          >
            Delete
          </button>
        </div>

        {/* Memes grid */}
        {memes.length === 0 ? (
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 text-center">
            <p className="text-gray-500 mb-4">This dump is empty</p>
            <Link
              href="/"
              className="text-blue-500 hover:text-blue-600 font-medium"
            >
              Add memes from your library
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-1 rounded-2xl overflow-hidden">
            {memes.map((meme) => (
              <div
                key={meme.id}
                className="relative aspect-square bg-gray-100 dark:bg-gray-800 group"
              >
                {meme.file_type === "video" ? (
                  <video
                    src={meme.file_url}
                    className="w-full h-full object-cover"
                    muted
                    playsInline
                    preload="metadata"
                  />
                ) : (
                  <img
                    src={meme.file_url}
                    alt=""
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                )}

                {meme.file_type === "video" && (
                  <div className="absolute bottom-1 left-1 bg-black/50 text-white text-xs px-1.5 py-0.5 rounded">
                    Video
                  </div>
                )}

                <button
                  onClick={() => removeMeme(meme.id)}
                  className="absolute top-1 right-1 w-7 h-7 bg-black/50 hover:bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-sm"
                >
                  &times;
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
