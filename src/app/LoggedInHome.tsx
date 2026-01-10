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
  const [showNewDump, setShowNewDump] = useState(false);
  const userName = userEmail?.split("@")[0] || "User";

  return (
    <div className="min-h-screen bg-[#faf8f5]">
      <Header
        email={userEmail}
        userId={userId}
        title="HitPost"
        onShowQRCode={() => setShowQRCode(true)}
        onNewDump={() => setShowNewDump(true)}
      />
      <main className="max-w-4xl mx-auto">
        <HomeContent
          userId={userId}
          showNewDumpTrigger={showNewDump}
          onNewDumpOpened={() => setShowNewDump(false)}
        />
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
