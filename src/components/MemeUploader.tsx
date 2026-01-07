"use client";

import { useState, useRef } from "react";

interface MemeUploaderProps {
  onUpload: () => void;
}

export default function MemeUploader({ onUpload }: MemeUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
        <div className="w-12 h-12 mx-auto mb-3 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
          {uploading ? (
            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          ) : (
            <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          )}
        </div>
        <p className="text-gray-600 dark:text-gray-400 font-medium">
          {uploading ? "Uploading..." : "Tap to add memes"}
        </p>
        <p className="text-sm text-gray-400 mt-1">
          Photos & videos up to 10MB
        </p>
      </button>

      {/* Error message */}
      {error && (
        <p className="mt-3 text-sm text-red-500">{error}</p>
      )}
    </div>
  );
}
