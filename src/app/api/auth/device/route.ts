import { createSessionFromDeviceId } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { deviceId } = await request.json();

    if (!deviceId) {
      return NextResponse.json({ error: "Device ID required" }, { status: 400 });
    }

    const user = await createSessionFromDeviceId(deviceId);

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        device_id: user.device_id,
      },
    });
  } catch (error) {
    console.error("Device auth error:", error);
    return NextResponse.json({ error: "Authentication failed" }, { status: 500 });
  }
}
