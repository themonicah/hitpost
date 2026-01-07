import { getSession } from "@/lib/auth";
import db from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const activity = await db.getActivityFeed(user.id, 50);
    return NextResponse.json({ activity });
  } catch (error) {
    console.error("Get activity error:", error);
    return NextResponse.json({ error: "Failed to get activity" }, { status: 500 });
  }
}
