import { sql } from "@vercel/postgres";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    // Add share_token to dumps
    await sql`ALTER TABLE dumps ADD COLUMN IF NOT EXISTS share_token TEXT UNIQUE`;

    // Add user_id to dump_recipients
    await sql`ALTER TABLE dump_recipients ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id)`;

    // Create indexes
    await sql`CREATE INDEX IF NOT EXISTS idx_dumps_share_token ON dumps(share_token)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_dump_recipients_user_id ON dump_recipients(user_id)`;

    // Create push_tokens table
    await sql`
      CREATE TABLE IF NOT EXISTS push_tokens (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id),
        token TEXT NOT NULL UNIQUE,
        platform TEXT NOT NULL CHECK (platform IN ('ios', 'android', 'web')),
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;

    // Device-based auth: add device_id to users
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS device_id TEXT UNIQUE`;
    await sql`CREATE INDEX IF NOT EXISTS idx_users_device_id ON users(device_id)`;

    // Make users.email nullable (for device-based users without email)
    await sql`ALTER TABLE users ALTER COLUMN email DROP NOT NULL`;

    // Recipient name and claim code for dump_recipients
    await sql`ALTER TABLE dump_recipients ADD COLUMN IF NOT EXISTS name TEXT`;
    await sql`ALTER TABLE dump_recipients ADD COLUMN IF NOT EXISTS claim_code TEXT UNIQUE`;
    await sql`ALTER TABLE dump_recipients ADD COLUMN IF NOT EXISTS claimed_at TIMESTAMP`;
    await sql`CREATE INDEX IF NOT EXISTS idx_dump_recipients_claim_code ON dump_recipients(claim_code)`;

    // User connections table (QR code connections)
    await sql`
      CREATE TABLE IF NOT EXISTS user_connections (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        connector_id UUID NOT NULL REFERENCES users(id),
        name TEXT NOT NULL,
        connected_user_id UUID REFERENCES users(id),
        connected_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_user_connections_connector_id ON user_connections(connector_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_user_connections_connected_user_id ON user_connections(connected_user_id)`;

    return NextResponse.json({ success: true, message: "Migration complete" });
  } catch (error) {
    console.error("Migration error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
