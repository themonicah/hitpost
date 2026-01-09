import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import ConnectContent from "./ConnectContent";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ userId: string }>;
}

export default async function ConnectPage({ params }: Props) {
  const { userId } = await params;

  // Get the user we're connecting to
  const user = await db.getUserById(userId);
  if (!user) {
    notFound();
  }

  const userName = user.email?.split("@")[0] || "User";

  return <ConnectContent userId={userId} userName={userName} />;
}
