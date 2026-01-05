import { getSession } from "@/lib/auth";
import db from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { unlink } from "fs/promises";
import path from "path";

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
  const meme = db.getMemeById(id);

  if (!meme || meme.user_id !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Delete file
  try {
    const filepath = path.join(process.cwd(), "public", meme.file_path);
    await unlink(filepath);
  } catch {
    // File might not exist, continue anyway
  }

  // Delete from database
  db.deleteMeme(id);

  return NextResponse.json({ success: true });
}
