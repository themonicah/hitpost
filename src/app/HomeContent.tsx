"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Meme } from "@/lib/db";
import MemeGrid from "@/components/MemeGrid";
import MemeViewer from "@/components/MemeViewer";
import FunLoader from "@/components/FunLoader";
import EmptyState from "@/components/EmptyState";
import AddToDumpModal from "@/components/AddToDumpModal";

interface HomeContentProps {
  userId: string;
}

export default function HomeContent({ userId }: HomeContentProps) {
  const [memes, setMemes] = useState<Meme[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const [showAddToDump, setShowAddToDump] = useState(false);
  const [memeToAdd, setMemeToAdd] = useState<Meme | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchMemes = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/memes");
      if (res.ok) {
        const data = await res.json();
        setMemes(data.memes);
      } else {
        setError("Failed to load memes");
      }
    } catch {
      setError("Network error. Check your connection.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMemes();
  }, [fetchMemes]);

  function handleDelete(id: string) {
    setMemes((prev) => prev.filter((m) => m.id !== id));
  }

  async function handleUpload(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const formData = new FormData();
      for (let i = 0; i < files.length; i++) {
        formData.append("files", files[i]);
      }
      const res = await fetch("/api/memes", { method: "POST", body: formData });
      if (res.ok) fetchMemes();
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <FunLoader />
      </div>
    );
  }

  // Error state with retry
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="text-5xl mb-4">😵</div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Oops, something went wrong
        </h3>
        <p className="text-gray-500 mb-6">{error}</p>
        <button
          onClick={() => {
            setLoading(true);
            fetchMemes();
          }}
          className="px-6 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-full font-medium min-h-[44px]"
        >
          Try Again
        </button>
      </div>
    );
  }


  // Empty state when no memes
  if (memes.length === 0) {
    return (
      <div className="space-y-3">
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          multiple
          onChange={(e) => handleUpload(e.target.files)}
          className="hidden"
        />

        <div className="bg-white rounded-2xl">
          <EmptyState
            type="memes"
            title="No memes yet"
            description="Upload some memes to get started. Then you can create dumps and share them with friends!"
            action={{
              label: "Upload Memes",
              onClick: () => fileInputRef.current?.click(),
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        multiple
        onChange={(e) => handleUpload(e.target.files)}
        className="hidden"
      />

      {/* Header with count and upload */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {memes.length} meme{memes.length !== 1 ? "s" : ""}
          {uploading && <span className="ml-2 text-blue-500">uploading...</span>}
        </p>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center text-gray-600 transition-colors"
          aria-label="Upload memes"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>

      {/* Meme Grid */}
      <MemeGrid
        memes={memes}
        onMemeClick={(index) => setViewerIndex(index)}
      />

      {/* Meme Viewer */}
      {viewerIndex !== null && (
        <MemeViewer
          memes={memes}
          initialIndex={viewerIndex}
          onClose={() => setViewerIndex(null)}
          onAddToDump={(meme) => {
            setMemeToAdd(meme);
            setViewerIndex(null);
            setShowAddToDump(true);
          }}
          onDelete={handleDelete}
        />
      )}

      {/* Add to Dump Modal */}
      <AddToDumpModal
        isOpen={showAddToDump}
        onClose={() => {
          setShowAddToDump(false);
          setMemeToAdd(null);
        }}
        selectedMemes={memeToAdd ? [memeToAdd] : []}
        onComplete={() => {
          setMemeToAdd(null);
        }}
      />
    </div>
  );
}
