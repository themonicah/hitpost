import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

// POST - Create a new connection (when someone scans QR code and enters name)
export async function POST(req: NextRequest) {
  try {
    const { connectorId, name } = await req.json();

    if (!name?.trim()) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }

    // Use session user if no connectorId provided
    let actualConnectorId = connectorId;
    if (!actualConnectorId) {
      const user = await getSession();
      if (!user) {
        return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
      }
      actualConnectorId = user.id;
    }

    // Verify the connector user exists
    const connector = await db.getUserById(actualConnectorId);
    if (!connector) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if connection already exists
    const existing = await db.getConnectionByConnectorAndName(actualConnectorId, name.trim());
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
      connector_id: actualConnectorId,
      name: name.trim(),
    });

    return NextResponse.json({
      success: true,
      connectionId: connection.id
    });
  } catch (error) {
    console.error("Failed to create connection:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to create connection: ${message}` },
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
