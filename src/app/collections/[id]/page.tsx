"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Nav from "@/components/Nav";
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
        router.push("/library");
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setCollection(data.collection);
        setMemes(data.memes);
        setEditName(data.collection.name);
      }
    } catch (error) {
      console.error("Failed to fetch collection:", error);
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
      console.error("Failed to update collection:", error);
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
    if (!confirm("Delete this collection? (Memes will not be deleted)")) return;

    try {
      const res = await fetch(`/api/collections/${collectionId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        router.push("/library");
      }
    } catch (error) {
      console.error("Failed to delete collection:", error);
    }
  }

  function sendCollection() {
    // Navigate to create dump page with this collection's memes pre-selected
    const memeIds = memes.map((m) => m.id).join(",");
    router.push(`/create-dump?memes=${memeIds}&from=collection&collectionId=${collectionId}`);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <Nav email={userEmail} />
        <main className="max-w-4xl mx-auto px-4 py-6">
          <p className="text-center text-gray-500">Loading...</p>
        </main>
      </div>
    );
  }

  if (!collection) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <Nav email={userEmail} />
        <main className="max-w-4xl mx-auto px-4 py-6">
          <p className="text-center text-gray-500">Collection not found</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Nav email={userEmail} />
      <main className="max-w-4xl mx-auto px-4 py-6">
        <Link
          href="/library"
          className="text-blue-500 hover:text-blue-600 text-sm mb-4 inline-block"
        >
          &larr; Back to Library
        </Link>

        <div className="flex items-start justify-between mb-6">
          <div className="flex-1">
            {isEditing ? (
              <div className="flex gap-2 items-center">
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="text-2xl font-bold bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1"
                  autoFocus
                />
                <button
                  onClick={updateName}
                  className="px-3 py-1 bg-blue-500 text-white rounded-lg text-sm"
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setEditName(collection.name);
                  }}
                  className="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded-lg text-sm"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold">{collection.name}</h1>
                <button
                  onClick={() => setIsEditing(true)}
                  className="text-gray-400 hover:text-blue-500 text-sm"
                >
                  Edit
                </button>
              </div>
            )}
            <p className="text-gray-500 mt-1">
              {memes.length} meme{memes.length !== 1 ? "s" : ""}
            </p>
          </div>

          <div className="flex gap-2">
            {memes.length > 0 && (
              <button
                onClick={sendCollection}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium"
              >
                Send This Collection
              </button>
            )}
            <button
              onClick={deleteCollection}
              className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium"
            >
              Delete
            </button>
          </div>
        </div>

        {memes.length === 0 ? (
          <div className="bg-white dark:bg-gray-900 rounded-xl p-8 text-center">
            <p className="text-gray-500 mb-4">This collection is empty</p>
            <Link
              href="/library"
              className="text-blue-500 hover:text-blue-600 font-medium"
            >
              Add memes from your library
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {memes.map((meme) => (
              <div
                key={meme.id}
                className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 group"
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
                  <div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-1.5 py-0.5 rounded">
                    Video
                  </div>
                )}

                <button
                  onClick={() => removeMeme(meme.id)}
                  className="absolute top-2 right-2 w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
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
