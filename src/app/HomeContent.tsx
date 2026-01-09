"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Meme } from "@/lib/db";
import MemeGrid from "@/components/MemeGrid";
import MemeViewer from "@/components/MemeViewer";
import FunLoader from "@/components/FunLoader";
import EmptyState from "@/components/EmptyState";
import DumpsBar, { DumpsBarRef } from "@/components/DumpsBar";
import DumpCreator from "@/components/DumpCreator";
import AddToDumpModal from "@/components/AddToDumpModal";
import SendDumpModal from "@/components/SendDumpModal";

interface HomeContentProps {
  userId: string;
}

export default function HomeContent({ userId }: HomeContentProps) {
  const [memes, setMemes] = useState<Meme[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const [showDumpCreator, setShowDumpCreator] = useState(false);
  const [showAddToDump, setShowAddToDump] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  const [dumpMemesToSend, setDumpMemesToSend] = useState<Meme[]>([]);
  const [uploading, setUploading] = useState(false);
  const dumpsBarRef = useRef<DumpsBarRef>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // When a dump is selected from the bar, fetch its memes and open send modal
  async function handleDumpSelect(dumpId: string) {
    try {
      const res = await fetch(`/api/dumps/${dumpId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.dump?.memes) {
          // Convert to Meme type
          const dumpMemes: Meme[] = data.dump.memes.map((m: { id: string; file_url: string; file_type: string }) => ({
            id: m.id,
            file_url: m.file_url,
            file_type: m.file_type,
            user_id: userId,
            created_at: "",
          }));
          setDumpMemesToSend(dumpMemes);
          setShowSendModal(true);
        }
      }
    } catch (err) {
      console.error("Failed to load dump:", err);
    }
  }

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
    // Refresh dumps bar since the meme might have been in a dump
    dumpsBarRef.current?.refresh();
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

  function toggleSelectMode() {
    setSelectMode(!selectMode);
    setSelectedIds(new Set());
  }

  function handleAddToDump() {
    // Open modal to choose new or existing dump
    setShowAddToDump(true);
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
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
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

  const selectedMemes = memes.filter((m) => selectedIds.has(m.id));

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

        <div className="bg-white dark:bg-gray-900 rounded-2xl">
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

        {/* Still show DumpsBar for drafts */}
        <DumpsBar
          ref={dumpsBarRef}
          onDumpSelect={handleDumpSelect}
          onCreateNew={() => setShowDumpCreator(true)}
        />
        <div className="h-28" />
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

      {/* Header with count and actions */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {memes.length} meme{memes.length !== 1 ? "s" : ""}
          {uploading && <span className="ml-2 text-blue-500">uploading...</span>}
        </p>
        <div className="flex items-center gap-2">
          {selectMode && selectedIds.size > 0 && (
            <button
              onClick={handleAddToDump}
              className="px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-full text-sm font-medium min-h-[44px]"
            >
              Add to Dump ({selectedIds.size})
            </button>
          )}
          <button
            onClick={toggleSelectMode}
            className={`px-4 py-2.5 rounded-full text-sm font-medium transition-colors min-h-[44px] ${
              selectMode
                ? "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
            }`}
          >
            {selectMode ? "Cancel" : "Select"}
          </button>
        </div>
      </div>

      {/* Meme Grid with integrated add button */}
      <MemeGrid
        memes={memes}
        selectable={selectMode}
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        onDelete={selectMode ? undefined : handleDelete}
        onMemeClick={selectMode ? undefined : (index) => setViewerIndex(index)}
        onAddClick={() => fileInputRef.current?.click()}
      />

      {/* Meme Viewer */}
      {viewerIndex !== null && (
        <MemeViewer
          memes={memes}
          initialIndex={viewerIndex}
          onClose={() => setViewerIndex(null)}
          selectable={true}
          selectedIds={selectedIds}
          onSelectionChange={(ids) => {
            setSelectedIds(ids);
            if (ids.size > 0) setSelectMode(true);
          }}
          onDelete={handleDelete}
        />
      )}

      {/* Add to Dump Modal - choose new or existing */}
      <AddToDumpModal
        isOpen={showAddToDump}
        onClose={() => {
          setShowAddToDump(false);
          setSelectMode(false);
          setSelectedIds(new Set());
        }}
        selectedMemes={selectedMemes}
        onComplete={() => {
          dumpsBarRef.current?.refresh();
          setSelectMode(false);
          setSelectedIds(new Set());
        }}
      />

      {/* Dump Creator - full screen flow (for creating from DumpsBar) */}
      <DumpCreator
        isOpen={showDumpCreator}
        onClose={() => {
          setShowDumpCreator(false);
        }}
        onCreated={(dumpId) => {
          dumpsBarRef.current?.refresh();
        }}
        initialMemes={[]}
      />

      {/* Dumps Bar - floating at bottom */}
      <DumpsBar
        ref={dumpsBarRef}
        onDumpSelect={handleDumpSelect}
        onCreateNew={() => setShowDumpCreator(true)}
      />

      {/* Send Modal - opens when clicking a dump */}
      <SendDumpModal
        isOpen={showSendModal}
        onClose={() => {
          setShowSendModal(false);
          setDumpMemesToSend([]);
        }}
        selectedMemes={dumpMemesToSend}
        onSent={() => {
          setShowSendModal(false);
          setDumpMemesToSend([]);
          dumpsBarRef.current?.refresh();
        }}
      />

      {/* Spacer for dumps bar */}
      <div className="h-28" />
    </div>
  );
}
