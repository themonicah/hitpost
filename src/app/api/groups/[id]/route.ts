import { getSession } from "@/lib/auth";
import db from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PUT(req: NextRequest, { params }: RouteParams) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const group = await db.getGroupById(id);
  if (!group || group.user_id !== user.id) {
    return NextResponse.json({ error: "Group not found" }, { status: 404 });
  }

  try {
    const { name } = await req.json();

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json({ error: "Group name is required" }, { status: 400 });
    }

    await db.updateGroup(id, name.trim());

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update group error:", error);
    return NextResponse.json({ error: "Failed to update group" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const group = await db.getGroupById(id);
  if (!group || group.user_id !== user.id) {
    return NextResponse.json({ error: "Group not found" }, { status: 404 });
  }

  await db.deleteGroup(id);

  return NextResponse.json({ success: true });
}
