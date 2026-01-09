"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Meme } from "@/lib/db";
import MemeGrid from "@/components/MemeGrid";
import MemeViewer from "@/components/MemeViewer";
import FunLoader from "@/components/FunLoader";
import EmptyState from "@/components/EmptyState";
import AddToDumpModal from "@/components/AddToDumpModal";
import DraftDumps from "@/components/DraftDumps";

interface HomeContentProps {
  userId: string;
}

interface DraftDump {
  id: string;
  name: string;
  memes: Meme[];
  memeCount: number;
  recipientCount: number;
  createdAt: string;
}

export default function HomeContent({ userId }: HomeContentProps) {
  const [memes, setMemes] = useState<Meme[]>([]);
  const [draftDumps, setDraftDumps] = useState<DraftDump[]>([]);
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
      const [memesRes, dumpsRes] = await Promise.all([
        fetch("/api/memes"),
        fetch("/api/dumps?drafts=true"),
      ]);

      if (memesRes.ok) {
        const data = await memesRes.json();
        setMemes(data.memes);
      } else {
        setError("Failed to load memes");
      }

      if (dumpsRes.ok) {
        const dumpsData = await dumpsRes.json();
        // Transform API response to DraftDump format
        const drafts: DraftDump[] = (dumpsData.dumps || []).map((dump: {
          id: string;
          note: string | null;
          meme_count: number;
          recipient_count: number;
          created_at: string;
          preview_urls?: string[];
        }) => ({
          id: dump.id,
          name: dump.note || "Untitled",
          memes: (dump.preview_urls || []).map((url: string, i: number) => ({
            id: `preview-${i}`,
            user_id: "",
            file_url: url,
            file_type: "image" as const,
            created_at: "",
          })),
          memeCount: dump.meme_count,
          recipientCount: dump.recipient_count,
          createdAt: dump.created_at,
        }));
        setDraftDumps(drafts);
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
    <div className="space-y-3 pb-24">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        multiple
        onChange={(e) => handleUpload(e.target.files)}
        className="hidden"
      />

      {/* Draft Dumps Section */}
      {draftDumps.length > 0 && (
        <DraftDumps drafts={draftDumps} />
      )}

      {/* Meme Grid */}
      <MemeGrid
        memes={memes}
        onMemeClick={(index) => setViewerIndex(index)}
      />

      {/* Floating upload button */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30">
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="w-16 h-16 bg-gradient-to-br from-amber-600 to-amber-800 hover:from-amber-500 hover:to-amber-700 rounded-full flex items-center justify-center shadow-lg shadow-amber-900/30 transition-all active:scale-95 disabled:opacity-50"
          aria-label="Upload memes"
        >
          {uploading ? (
            <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <span className="text-3xl">💩</span>
          )}
        </button>
      </div>

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
