import { getSession } from "@/lib/auth";
import db from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { del } from "@vercel/blob";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  // Verify ownership
  const meme = await db.getMemeById(id);

  if (!meme || meme.user_id !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Delete from Vercel Blob
  try {
    await del(meme.file_url);
  } catch {
    // File might not exist, continue anyway
  }

  // Delete from database
  await db.deleteMeme(id);

  return NextResponse.json({ success: true });
}
