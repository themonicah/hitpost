import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

// POST - Create a new connection (when someone scans QR code and enters name)
export async function POST(req: NextRequest) {
  try {
    const { connectorId, name } = await req.json();

    if (!connectorId || !name?.trim()) {
      return NextResponse.json(
        { error: "Connector ID and name are required" },
        { status: 400 }
      );
    }

    // Verify the connector user exists
    const connector = await db.getUserById(connectorId);
    if (!connector) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if connection already exists
    const existing = await db.getConnectionByConnectorAndName(connectorId, name.trim());
    if (existing) {
      // Connection already exists, that's fine
      return NextResponse.json({
        success: true,
        connectionId: existing.id,
        message: "Already connected"
      });
    }

    // Create new connection
    const connection = await db.createConnection({
      connector_id: connectorId,
      name: name.trim(),
    });

    return NextResponse.json({
      success: true,
      connectionId: connection.id
    });
  } catch (error) {
    console.error("Failed to create connection:", error);
    return NextResponse.json(
      { error: "Failed to create connection" },
      { status: 500 }
    );
  }
}

// GET - Get connections for the current user (who they can send dumps to)
export async function GET() {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const connections = await db.getConnectionsByConnector(user.id);
    return NextResponse.json({ connections });
  } catch (error) {
    console.error("Failed to get connections:", error);
    return NextResponse.json(
      { error: "Failed to get connections" },
      { status: 500 }
    );
  }
}
