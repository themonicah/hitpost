import { getSession } from "@/lib/auth";
import db from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ dumpId: string; memeId: string }> }
) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { dumpId, memeId } = await params;

  try {
    const dump = await db.getDumpById(dumpId);
    if (!dump || dump.sender_id !== user.id) {
      return NextResponse.json({ error: "Dump not found" }, { status: 404 });
    }

    await db.removeMemeFromDump(dumpId, memeId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Remove meme from dump error:", error);
    return NextResponse.json({ error: "Failed to remove meme" }, { status: 500 });
  }
}
