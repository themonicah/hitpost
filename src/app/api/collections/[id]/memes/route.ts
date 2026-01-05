import { getSession } from "@/lib/auth";
import db from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const collection = db.getCollectionById(id);
  if (!collection || collection.user_id !== user.id) {
    return NextResponse.json({ error: "Collection not found" }, { status: 404 });
  }

  try {
    const { memeIds } = await req.json();

    if (!Array.isArray(memeIds) || memeIds.length === 0) {
      return NextResponse.json({ error: "At least one meme ID is required" }, { status: 400 });
    }

    // Verify memes belong to user
    const userMemes = db.getMemesByUser(user.id);
    const userMemeIds = new Set(userMemes.map((m) => m.id));
    const allValid = memeIds.every((memeId: string) => userMemeIds.has(memeId));

    if (!allValid) {
      return NextResponse.json({ error: "Invalid memes" }, { status: 400 });
    }

    db.addMemesToCollection(id, memeIds);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Add memes to collection error:", error);
    return NextResponse.json({ error: "Failed to add memes" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const collection = db.getCollectionById(id);
  if (!collection || collection.user_id !== user.id) {
    return NextResponse.json({ error: "Collection not found" }, { status: 404 });
  }

  try {
    const { memeId } = await req.json();

    if (!memeId) {
      return NextResponse.json({ error: "Meme ID is required" }, { status: 400 });
    }

    db.removeMemeFromCollection(id, memeId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Remove meme from collection error:", error);
    return NextResponse.json({ error: "Failed to remove meme" }, { status: 500 });
  }
}
