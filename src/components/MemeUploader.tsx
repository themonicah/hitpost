"use client";

import { useState, useRef } from "react";

interface MemeUploaderProps {
  onUpload: () => void;
}

export default function MemeUploader({ onUpload }: MemeUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function uploadFiles(files: FileList | null) {
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const formData = new FormData();
      for (let i = 0; i < files.length; i++) {
        formData.append("files", files[i]);
      }

      const res = await fetch("/api/memes", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        onUpload();
      } else {
        alert("Upload failed. Please try again.");
      }
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

  return (
    <div
      className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
        dragOver
          ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
          : "border-gray-300 dark:border-gray-700"
      } ${uploading ? "opacity-50 pointer-events-none" : ""}`}
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
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
        id="file-upload"
        disabled={uploading}
      />

      <label
        htmlFor="file-upload"
        className="cursor-pointer block"
      >
        <div className="text-4xl mb-2">
          {uploading ? "..." : "+"}
        </div>
        <p className="text-gray-600 dark:text-gray-400">
          {uploading
            ? "Uploading..."
            : "Tap to upload or drag & drop"}
        </p>
        <p className="text-sm text-gray-400 mt-1">
          Images & videos supported
        </p>
      </label>
    </div>
  );
}
