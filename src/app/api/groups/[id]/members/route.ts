import { getSession } from "@/lib/auth";
import db from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { v4 as uuid } from "uuid";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const group = await db.getGroupById(id);
  if (!group || group.user_id !== user.id) {
    return NextResponse.json({ error: "Group not found" }, { status: 404 });
  }

  const members = await db.getMembersByGroup(id);
  return NextResponse.json({ members });
}

export async function POST(req: NextRequest, { params }: RouteParams) {
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
    const { name, email } = await req.json();

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
    }

    const memberId = uuid();
    await db.addMember({
      id: memberId,
      group_id: id,
      name: name.trim(),
      email: email.trim().toLowerCase(),
    });

    return NextResponse.json({ member: { id: memberId, group_id: id, name: name.trim(), email: email.trim().toLowerCase() } });
  } catch (error) {
    console.error("Add member error:", error);
    return NextResponse.json({ error: "Failed to add member" }, { status: 500 });
  }
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
    const { memberId, name, email } = await req.json();

    if (!memberId) {
      return NextResponse.json({ error: "Member ID is required" }, { status: 400 });
    }

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
    }

    await db.updateMember(memberId, name.trim(), email.trim().toLowerCase());

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update member error:", error);
    return NextResponse.json({ error: "Failed to update member" }, { status: 500 });
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

  try {
    const { memberId } = await req.json();

    if (!memberId) {
      return NextResponse.json({ error: "Member ID is required" }, { status: 400 });
    }

    await db.deleteMember(memberId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete member error:", error);
    return NextResponse.json({ error: "Failed to delete member" }, { status: 500 });
  }
}
