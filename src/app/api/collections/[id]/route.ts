import { getSession } from "@/lib/auth";
import db from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const collection = await db.getCollectionById(id);
  if (!collection || collection.user_id !== user.id) {
    return NextResponse.json({ error: "Collection not found" }, { status: 404 });
  }

  const memes = await db.getMemesByCollection(id);

  return NextResponse.json({ collection, memes });
}

export async function PUT(req: NextRequest, { params }: RouteParams) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const collection = await db.getCollectionById(id);
  if (!collection || collection.user_id !== user.id) {
    return NextResponse.json({ error: "Collection not found" }, { status: 404 });
  }

  try {
    const { name } = await req.json();

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json({ error: "Collection name is required" }, { status: 400 });
    }

    await db.updateCollection(id, name.trim());

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update collection error:", error);
    return NextResponse.json({ error: "Failed to update collection" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const collection = await db.getCollectionById(id);
  if (!collection || collection.user_id !== user.id) {
    return NextResponse.json({ error: "Collection not found" }, { status: 404 });
  }

  await db.deleteCollection(id);

  return NextResponse.json({ success: true });
}
