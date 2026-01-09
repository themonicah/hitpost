"use client";

import { useState } from "react";
import Header from "@/components/Header";
import HomeContent from "./HomeContent";
import QRCodeModal from "@/components/QRCodeModal";

interface LoggedInHomeProps {
  userId: string;
  userEmail: string | null;
}

export default function LoggedInHome({ userId, userEmail }: LoggedInHomeProps) {
  const [showQRCode, setShowQRCode] = useState(false);
  const userName = userEmail?.split("@")[0] || "User";

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        email={userEmail}
        userId={userId}
        title="HitPost"
        onShowQRCode={() => setShowQRCode(true)}
        showNewDump
      />
      <main className="max-w-4xl mx-auto px-4 py-4">
        <HomeContent userId={userId} />
      </main>

      <QRCodeModal
        isOpen={showQRCode}
        onClose={() => setShowQRCode(false)}
        userId={userId}
        userName={userName}
      />
    </div>
  );
}
