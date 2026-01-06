import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import db from "@/lib/db";

export async function POST(req: NextRequest) {
  const user = await getSession();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { token, platform } = await req.json();

    if (!token || !platform) {
      return NextResponse.json(
        { error: "Token and platform are required" },
        { status: 400 }
      );
    }

    if (!["ios", "android", "web"].includes(platform)) {
      return NextResponse.json(
        { error: "Invalid platform" },
        { status: 400 }
      );
    }

    await db.savePushToken(user.id, token, platform);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to save push token:", error);
    return NextResponse.json(
      { error: "Failed to save push token" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { token } = await req.json();

    if (!token) {
      return NextResponse.json(
        { error: "Token is required" },
        { status: 400 }
      );
    }

    await db.deletePushToken(token);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete push token:", error);
    return NextResponse.json(
      { error: "Failed to delete push token" },
      { status: 500 }
    );
  }
}
