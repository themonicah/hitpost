"use client";

import { useState, useRef, useEffect } from "react";

interface MemeUploaderProps {
  onUpload: () => void;
  compact?: boolean;
}

const UPLOAD_PROMPTS = [
  "drop that heat 🔥",
  "feed me memes",
  "add to the collection 📦",
  "upload the chaos",
  "bless us with content ✨",
];

const UPLOADING_MESSAGES = [
  "uploading fire...",
  "processing vibes...",
  "adding to the vault...",
  "almost there bestie...",
];

export default function MemeUploader({ onUpload, compact = false }: MemeUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [prompt, setPrompt] = useState(UPLOAD_PROMPTS[0]);
  const [uploadMsg, setUploadMsg] = useState(UPLOADING_MESSAGES[0]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setPrompt(UPLOAD_PROMPTS[Math.floor(Math.random() * UPLOAD_PROMPTS.length)]);
  }, []);

  useEffect(() => {
    if (uploading) {
      const interval = setInterval(() => {
        setUploadMsg(UPLOADING_MESSAGES[Math.floor(Math.random() * UPLOADING_MESSAGES.length)]);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [uploading]);

  async function uploadFiles(files: FileList | null) {
    if (!files || files.length === 0) return;

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        // Check file size (max 10MB per file for Vercel)
        if (file.size > 10 * 1024 * 1024) {
          setError(`File "${file.name}" is too large. Max 10MB per file.`);
          setUploading(false);
          return;
        }
        formData.append("files", file);
      }

      const res = await fetch("/api/memes", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        onUpload();
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Upload failed. Please try again.");
      }
    } catch (err) {
      console.error("Upload error:", err);
      setError("Network error. Check your connection and try again.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    uploadFiles(e.dataTransfer.files);
  }

  function handleClick() {
    // Programmatically click the file input for better mobile support
    fileInputRef.current?.click();
  }

  if (compact) {
    return (
      <div
        className={`flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-xl transition-colors ${
          dragOver ? "bg-blue-50 dark:bg-blue-900/20" : ""
        } ${uploading ? "opacity-50" : ""}`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          multiple
          onChange={(e) => uploadFiles(e.target.files)}
          className="hidden"
          disabled={uploading}
        />
        <button
          type="button"
          onClick={handleClick}
          disabled={uploading}
          className="flex items-center gap-3 flex-1"
        >
          <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-xl flex items-center justify-center shadow-md">
            {uploading ? (
              <span className="text-lg animate-spin">⏳</span>
            ) : (
              <span className="text-lg">➕</span>
            )}
          </div>
          <div className="text-left">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {uploading ? uploadMsg : "Add memes"}
            </p>
            <p className="text-xs text-gray-400">photos & videos</p>
          </div>
        </button>
        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>
    );
  }

  return (
    <div
      className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors ${
        dragOver
          ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
          : "border-gray-300 dark:border-gray-700"
      } ${uploading ? "opacity-50" : ""}`}
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
    >
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        multiple
        onChange={(e) => uploadFiles(e.target.files)}
        className="hidden"
        disabled={uploading}
      />

      {/* Clickable upload button - better for mobile */}
      <button
        type="button"
        onClick={handleClick}
        disabled={uploading}
        className="w-full"
      >
        <div className="w-14 h-14 mx-auto mb-3 bg-gradient-to-br from-blue-400 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg transform transition-transform hover:scale-110 active:scale-95">
          {uploading ? (
            <span className="text-2xl animate-bounce">⏳</span>
          ) : (
            <span className="text-2xl">➕</span>
          )}
        </div>
        <p className="text-gray-700 dark:text-gray-300 font-semibold">
          {uploading ? uploadMsg : prompt}
        </p>
        <p className="text-xs text-gray-400 mt-1">
          photos & videos • max 10MB 📸
        </p>
      </button>

      {/* Error message */}
      {error && (
        <p className="mt-3 text-sm text-red-500">{error}</p>
      )}
    </div>
  );
}
