"use client";

import { QRCodeSVG } from "qrcode.react";
import { useState } from "react";

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userName: string;
}

export default function QRCodeModal({ isOpen, onClose, userId, userName }: QRCodeModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const connectUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/connect/${userId}`;

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(connectUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = connectUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  async function handleShare() {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Connect with ${userName} on HitPost`,
          text: `Scan this to get meme dumps from ${userName}`,
          url: connectUrl,
        });
      } catch {
        // User cancelled or share failed
      }
    } else {
      handleCopyLink();
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 animate-fadeIn">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl p-6 animate-scaleIn">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-1">
            Your Connection Code
          </h2>
          <p className="text-gray-500 text-sm">
            Friends can scan this to connect with you
          </p>
        </div>

        {/* QR Code */}
        <div className="flex justify-center mb-6">
          <div className="p-4 bg-white rounded-2xl shadow-lg border border-gray-100">
            <QRCodeSVG
              value={connectUrl}
              size={200}
              level="M"
              includeMargin={false}
              bgColor="#FFFFFF"
              fgColor="#000000"
            />
          </div>
        </div>

        {/* Username display */}
        <div className="text-center mb-6">
          <p className="text-sm text-gray-500 mb-1">Connecting as</p>
          <p className="font-semibold text-gray-900 text-lg">{userName}</p>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={handleShare}
            className="w-full py-3.5 bg-gray-900 hover:bg-gray-800 text-white font-semibold rounded-2xl transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            Share Link
          </button>

          <button
            onClick={handleCopyLink}
            className="w-full py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-900 font-semibold rounded-2xl transition-colors"
          >
            {copied ? "Copied!" : "Copy Link"}
          </button>
        </div>

        {/* Hint */}
        <p className="text-xs text-gray-400 text-center mt-4">
          When someone connects, they&apos;ll appear in your recipients
        </p>
      </div>
    </div>
  );
}
