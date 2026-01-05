import { getSession } from "@/lib/auth";
import db, { Collection } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { v4 as uuid } from "uuid";

export async function GET() {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const collections = db.getCollectionsWithMemes(user.id);
  return NextResponse.json({ collections });
}

export async function POST(req: NextRequest) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { name, memeIds } = await req.json();

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json({ error: "Collection name is required" }, { status: 400 });
    }

    const collection: Collection = {
      id: uuid(),
      user_id: user.id,
      name: name.trim(),
      created_at: new Date().toISOString(),
    };

    db.createCollection(collection);

    // Add memes if provided
    if (Array.isArray(memeIds) && memeIds.length > 0) {
      db.addMemesToCollection(collection.id, memeIds);
    }

    return NextResponse.json({ collection });
  } catch (error) {
    console.error("Create collection error:", error);
    return NextResponse.json({ error: "Failed to create collection" }, { status: 500 });
  }
}
