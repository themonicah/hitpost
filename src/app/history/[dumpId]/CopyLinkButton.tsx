"use client";

import { useState } from "react";

interface CopyLinkButtonProps {
  link: string;
}

export default function CopyLinkButton({ link }: CopyLinkButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const input = document.createElement("input");
      input.value = link;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <button
      onClick={handleCopy}
      className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors whitespace-nowrap ${
        copied
          ? "bg-green-500 text-white"
          : "bg-blue-500 hover:bg-blue-600 text-white"
      }`}
    >
      {copied ? "Copied!" : "Copy Link"}
    </button>
  );
}
