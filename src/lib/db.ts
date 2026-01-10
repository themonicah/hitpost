import { sql } from "@vercel/postgres";

// Claim code generator
const CLAIM_WORDS = ["VIBE", "MEME", "DUMP", "FIRE", "GOLD", "EPIC", "COOL", "HYPE", "MOOD", "FLEX", "YEET", "DANK", "SPICY", "CHEF", "GOAT", "KING", "QUEEN", "WILD", "PURE", "FRESH"];

export function generateClaimCode(): string {
  const word = CLAIM_WORDS[Math.floor(Math.random() * CLAIM_WORDS.length)];
  const num = Math.floor(Math.random() * 90) + 10;
  return `${word}${num}`;
}

// Types
export interface User {
  id: string;
  email: string | null;
  device_id: string | null;
  created_at: string;
}

export interface Meme {
  id: string;
  user_id: string;
  file_url: string;
  file_type: "image" | "video";
  created_at: string;
}

export interface Dump {
  id: string;
  sender_id: string;
  note: string | null;
  is_draft: boolean;
  share_token: string | null;
  created_at: string;
}

export interface DumpMeme {
  id: string;
  dump_id: string;
  meme_id: string;
  sort_order: number;
}

export interface DumpRecipient {
  id: string;
  dump_id: string;
  name: string;
  email: string | null;
  token: string;
  claim_code: string;
  user_id: string | null;
  claimed_at: string | null;
  viewed_at: string | null;
  view_count: number;
  recipient_note: string | null;
  created_at: string;
}

export interface Reaction {
  id: string;
  recipient_id: string;
  meme_id: string;
  emoji: string;
  created_at: string;
}

export interface SentEmail {
  id: string;
  to_email: string;
  subject: string;
  body: string;
  link: string;
  created_at: string;
}

export interface RecipientGroup {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
}

export interface GroupMember {
  id: string;
  group_id: string;
  name: string;
  email: string;
  created_at: string;
}

export interface Collection {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
}

export interface CollectionMeme {
  id: string;
  collection_id: string;
  meme_id: string;
  sort_order: number;
  added_at: string;
}

export interface PushToken {
  id: string;
  user_id: string;
  token: string;
  platform: "ios" | "android" | "web";
  created_at: string;
}

export interface ActivityItem {
  id: string;
  type: "view" | "reaction" | "note" | "sent" | "received";
  timestamp: string;
  recipientEmail: string;
  dumpId: string;
  dumpNote: string | null;
  firstMemeUrl: string;
  emoji?: string;
  memeUrl?: string;
  noteText?: string;
  memeCount?: number;
  recipientCount?: number;
  senderEmail?: string;  // For received dumps
}

export interface UserConnection {
  id: string;
  connector_id: string;
  name: string;
  connected_user_id: string | null;
  connected_at: string | null;
  created_at: string;
}

// Database operations
export const db = {
  // Users
  async getUserById(id: string): Promise<User | undefined> {
    const { rows } = await sql<User>`SELECT * FROM users WHERE id = ${id}`;
    return rows[0];
  },

  async getUserByEmail(email: string): Promise<User | undefined> {
    const { rows } = await sql<User>`SELECT * FROM users WHERE email = ${email}`;
    return rows[0];
  },

  async getUserByDeviceId(deviceId: string): Promise<User | undefined> {
    const { rows } = await sql<User>`SELECT * FROM users WHERE device_id = ${deviceId}`;
    return rows[0];
  },

  async createUser(user: { id: string; email?: string | null; device_id?: string | null }): Promise<void> {
    await sql`INSERT INTO users (id, email, device_id) VALUES (${user.id}, ${user.email || null}, ${user.device_id || null})`;
  },

  async getOrCreateUserByDeviceId(deviceId: string): Promise<User> {
    let user = await this.getUserByDeviceId(deviceId);
    if (!user) {
      const id = crypto.randomUUID();
      await this.createUser({ id, device_id: deviceId });
      user = { id, email: null, device_id: deviceId, created_at: new Date().toISOString() };
    }
    return user;
  },

  async addEmailToUser(userId: string, email: string): Promise<void> {
    await sql`UPDATE users SET email = ${email} WHERE id = ${userId}`;
  },

  // Memes
  async getMemesByUser(userId: string): Promise<Meme[]> {
    const { rows } = await sql<Meme>`
      SELECT id, user_id, file_url, file_type, created_at::text
      FROM memes
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
    `;
    return rows;
  },

  async getMemeById(id: string): Promise<Meme | undefined> {
    const { rows } = await sql<Meme>`
      SELECT id, user_id, file_url, file_type, created_at::text
      FROM memes
      WHERE id = ${id}
    `;
    return rows[0];
  },

  async getMemesByIds(ids: string[]): Promise<Meme[]> {
    if (ids.length === 0) return [];
    const results: Meme[] = [];
    for (const id of ids) {
      const { rows } = await sql<Meme>`
        SELECT id, user_id, file_url, file_type, created_at::text
        FROM memes
        WHERE id = ${id}::uuid
      `;
      if (rows[0]) results.push(rows[0]);
    }
    return results;
  },

  async createMeme(meme: { id: string; user_id: string; file_url: string; file_type: string }): Promise<void> {
    await sql`
      INSERT INTO memes (id, user_id, file_url, file_type)
      VALUES (${meme.id}, ${meme.user_id}, ${meme.file_url}, ${meme.file_type})
    `;
  },

  async deleteMeme(id: string): Promise<void> {
    // Remove from dumps and collections first (clean up references)
    await sql`DELETE FROM dump_memes WHERE meme_id = ${id}`;
    await sql`DELETE FROM collection_memes WHERE meme_id = ${id}`;
    // Then delete the meme itself
    await sql`DELETE FROM memes WHERE id = ${id}`;
  },

  // Dumps
  async getDumpById(id: string): Promise<Dump | undefined> {
    const { rows } = await sql<Dump>`
      SELECT id, sender_id, note, COALESCE(is_draft, false) as is_draft, share_token, created_at::text
      FROM dumps
      WHERE id = ${id}
    `;
    return rows[0];
  },

  async getDumpByShareToken(shareToken: string): Promise<Dump | undefined> {
    const { rows } = await sql<Dump>`
      SELECT id, sender_id, note, COALESCE(is_draft, false) as is_draft, share_token, created_at::text
      FROM dumps
      WHERE share_token = ${shareToken}
    `;
    return rows[0];
  },

  async getDumpsByUser(userId: string): Promise<Dump[]> {
    const { rows } = await sql<Dump>`
      SELECT id, sender_id, note, COALESCE(is_draft, false) as is_draft, share_token, created_at::text
      FROM dumps
      WHERE sender_id = ${userId}
      ORDER BY created_at DESC
    `;
    return rows;
  },

  async getReceivedDumps(userId: string): Promise<(Dump & { sender_email: string; viewed_at: string | null; recipient_id: string })[]> {
    const user = await this.getUserById(userId);
    if (!user) return [];

    const { rows } = await sql<Dump & { sender_email: string; viewed_at: string; recipient_id: string }>`
      SELECT d.id, d.sender_id, d.note, COALESCE(d.is_draft, false) as is_draft, d.share_token, d.created_at::text,
             u.email as sender_email, dr.viewed_at::text, dr.id as recipient_id
      FROM dumps d
      JOIN dump_recipients dr ON d.id = dr.dump_id
      JOIN users u ON d.sender_id = u.id
      WHERE dr.user_id = ${userId}
      ORDER BY d.created_at DESC
    `;
    return rows;
  },

  async createDump(dump: { id: string; sender_id: string; note: string | null; is_draft?: boolean; share_token?: string }): Promise<void> {
    await sql`
      INSERT INTO dumps (id, sender_id, note, is_draft, share_token)
      VALUES (${dump.id}, ${dump.sender_id}, ${dump.note}, ${dump.is_draft || false}, ${dump.share_token || null})
    `;
  },

  async updateDump(id: string, updates: { is_draft?: boolean; note?: string | null; share_token?: string }): Promise<void> {
    if (updates.is_draft !== undefined) {
      await sql`UPDATE dumps SET is_draft = ${updates.is_draft} WHERE id = ${id}`;
    }
    if (updates.note !== undefined) {
      await sql`UPDATE dumps SET note = ${updates.note} WHERE id = ${id}`;
    }
    if (updates.share_token !== undefined) {
      await sql`UPDATE dumps SET share_token = ${updates.share_token} WHERE id = ${id}`;
    }
  },

  async claimDump(dumpId: string, userId: string): Promise<{ success: boolean; alreadyClaimed?: boolean }> {
    // Check if user already claimed this dump
    const { rows: existing } = await sql`
      SELECT id FROM dump_recipients WHERE dump_id = ${dumpId} AND user_id = ${userId}
    `;
    if (existing.length > 0) {
      return { success: true, alreadyClaimed: true };
    }

    // Get user email
    const user = await this.getUserById(userId);
    if (!user) return { success: false };

    // Create recipient record for this user
    const { v4: uuid } = await import("uuid");
    await sql`
      INSERT INTO dump_recipients (id, dump_id, email, token, user_id)
      VALUES (${uuid()}, ${dumpId}, ${user.email}, ${uuid()}::uuid, ${userId})
    `;

    return { success: true };
  },

  // Dump Memes
  async addMemesToDump(dumpMemes: { id: string; dump_id: string; meme_id: string; sort_order: number }[]): Promise<void> {
    for (const dm of dumpMemes) {
      await sql`
        INSERT INTO dump_memes (id, dump_id, meme_id, sort_order)
        VALUES (${dm.id}, ${dm.dump_id}, ${dm.meme_id}, ${dm.sort_order})
      `;
    }
  },

  async getMemesByDump(dumpId: string): Promise<Meme[]> {
    const { rows } = await sql<Meme>`
      SELECT m.id, m.user_id, m.file_url, m.file_type, m.created_at::text
      FROM memes m
      JOIN dump_memes dm ON m.id = dm.meme_id
      WHERE dm.dump_id = ${dumpId}
      ORDER BY dm.sort_order
    `;
    return rows;
  },

  async removeMemeFromDump(dumpId: string, memeId: string): Promise<void> {
    await sql`DELETE FROM dump_memes WHERE dump_id = ${dumpId} AND meme_id = ${memeId}`;
  },

  async clearDumpMemes(dumpId: string): Promise<void> {
    await sql`DELETE FROM dump_memes WHERE dump_id = ${dumpId}`;
  },

  async getDumpMemeCount(dumpId: string): Promise<number> {
    const { rows } = await sql<{ count: string }>`
      SELECT COUNT(*) as count FROM dump_memes WHERE dump_id = ${dumpId}
    `;
    return parseInt(rows[0]?.count || "0");
  },

  // Dump Recipients
  async getRecipientByToken(token: string): Promise<DumpRecipient | undefined> {
    const { rows } = await sql<DumpRecipient>`
      SELECT id, dump_id, name, email, token::text, claim_code, user_id, claimed_at::text, viewed_at::text, view_count, recipient_note, created_at::text
      FROM dump_recipients
      WHERE token = ${token}::uuid
    `;
    return rows[0];
  },

  async getRecipientByClaimCode(claimCode: string): Promise<DumpRecipient | undefined> {
    const { rows } = await sql<DumpRecipient>`
      SELECT id, dump_id, name, email, token::text, claim_code, user_id, claimed_at::text, viewed_at::text, view_count, recipient_note, created_at::text
      FROM dump_recipients
      WHERE UPPER(claim_code) = UPPER(${claimCode})
    `;
    return rows[0];
  },

  async getRecipientsByDump(dumpId: string): Promise<DumpRecipient[]> {
    const { rows } = await sql<DumpRecipient>`
      SELECT id, dump_id, name, email, token::text, claim_code, user_id, claimed_at::text, viewed_at::text, view_count, recipient_note, created_at::text
      FROM dump_recipients
      WHERE dump_id = ${dumpId}
    `;
    return rows;
  },

  async getRecipientById(id: string): Promise<DumpRecipient | undefined> {
    const { rows } = await sql<DumpRecipient>`
      SELECT id, dump_id, name, email, token::text, claim_code, user_id, claimed_at::text, viewed_at::text, view_count, recipient_note, created_at::text
      FROM dump_recipients
      WHERE id = ${id}
    `;
    return rows[0];
  },

  async createRecipient(recipient: { id: string; dump_id: string; name: string; email?: string; token: string; claim_code: string }): Promise<void> {
    await sql`
      INSERT INTO dump_recipients (id, dump_id, name, email, token, claim_code)
      VALUES (${recipient.id}, ${recipient.dump_id}, ${recipient.name}, ${recipient.email || null}, ${recipient.token}::uuid, ${recipient.claim_code})
    `;
  },

  async claimRecipientByCode(claimCode: string, userId: string): Promise<DumpRecipient | null> {
    const recipient = await this.getRecipientByClaimCode(claimCode);
    if (!recipient) return null;
    if (recipient.claimed_at) return null; // Already claimed

    await sql`
      UPDATE dump_recipients
      SET user_id = ${userId}, claimed_at = NOW()
      WHERE id = ${recipient.id}
    `;

    const updated = await this.getRecipientById(recipient.id);
    return updated ?? null;
  },

  // Find a previously claimed recipient by sender and name
  // Used for "claim once, push forever" - if sender sent to "Mom" before and she claimed,
  // we can find her user_id and push directly instead of generating a new claim code
  async findClaimedRecipientByName(senderId: string, name: string): Promise<{ user_id: string; name: string } | null> {
    const { rows } = await sql<{ user_id: string; name: string }>`
      SELECT DISTINCT dr.user_id, dr.name
      FROM dump_recipients dr
      JOIN dumps d ON dr.dump_id = d.id
      WHERE d.sender_id = ${senderId}
        AND LOWER(dr.name) = LOWER(${name})
        AND dr.user_id IS NOT NULL
        AND dr.claimed_at IS NOT NULL
      LIMIT 1
    `;
    return rows[0] || null;
  },

  // Create a recipient that's already linked to a known user (for returning recipients)
  async createLinkedRecipient(recipient: {
    id: string;
    dump_id: string;
    name: string;
    user_id: string;
    token: string;
  }): Promise<void> {
    await sql`
      INSERT INTO dump_recipients (id, dump_id, name, user_id, token, claimed_at)
      VALUES (${recipient.id}, ${recipient.dump_id}, ${recipient.name}, ${recipient.user_id}, ${recipient.token}::uuid, NOW())
    `;
  },

  async markRecipientViewed(id: string): Promise<void> {
    await sql`
      UPDATE dump_recipients
      SET viewed_at = COALESCE(viewed_at, NOW()), view_count = view_count + 1
      WHERE id = ${id}
    `;
  },

  async updateRecipientNote(id: string, note: string | null): Promise<void> {
    await sql`UPDATE dump_recipients SET recipient_note = ${note} WHERE id = ${id}`;
  },

  // Reactions
  async getReactionsByRecipient(recipientId: string): Promise<Reaction[]> {
    const { rows } = await sql<Reaction>`
      SELECT id, recipient_id, meme_id, emoji, created_at::text
      FROM reactions
      WHERE recipient_id = ${recipientId}
    `;
    return rows;
  },

  async getReactionsByRecipients(recipientIds: string[]): Promise<Reaction[]> {
    if (recipientIds.length === 0) return [];
    const results: Reaction[] = [];
    for (const recipientId of recipientIds) {
      const { rows } = await sql<Reaction>`
        SELECT id, recipient_id, meme_id, emoji, created_at::text
        FROM reactions
        WHERE recipient_id = ${recipientId}::uuid
      `;
      results.push(...rows);
    }
    return results;
  },

  async upsertReaction(recipientId: string, memeId: string, emoji: string | null): Promise<void> {
    if (emoji) {
      await sql`
        INSERT INTO reactions (recipient_id, meme_id, emoji)
        VALUES (${recipientId}, ${memeId}, ${emoji})
        ON CONFLICT (recipient_id, meme_id) DO UPDATE SET emoji = ${emoji}
      `;
    } else {
      await sql`DELETE FROM reactions WHERE recipient_id = ${recipientId} AND meme_id = ${memeId}`;
    }
  },

  // Sent Emails
  async createEmail(email: { id: string; to_email: string; subject: string; body: string; link: string }): Promise<void> {
    await sql`
      INSERT INTO sent_emails (id, to_email, subject, body, link)
      VALUES (${email.id}, ${email.to_email}, ${email.subject}, ${email.body}, ${email.link})
    `;
  },

  async getEmails(): Promise<SentEmail[]> {
    const { rows } = await sql<SentEmail>`
      SELECT id, to_email, subject, body, link, created_at::text
      FROM sent_emails
      ORDER BY created_at DESC
      LIMIT 50
    `;
    return rows;
  },

  // Stats
  async getDumpStats(dumpId: string): Promise<{ memeCount: number; recipientCount: number; viewedCount: number }> {
    const memeResult = await sql<{ count: string }>`SELECT COUNT(*) as count FROM dump_memes WHERE dump_id = ${dumpId}`;
    const recipientResult = await sql<{ total: string; viewed: string }>`
      SELECT COUNT(*) as total, COUNT(viewed_at) as viewed
      FROM dump_recipients
      WHERE dump_id = ${dumpId}
    `;
    return {
      memeCount: parseInt(memeResult.rows[0]?.count || "0"),
      recipientCount: parseInt(recipientResult.rows[0]?.total || "0"),
      viewedCount: parseInt(recipientResult.rows[0]?.viewed || "0"),
    };
  },

  // Recipient Groups
  async getGroupsByUser(userId: string): Promise<RecipientGroup[]> {
    const { rows } = await sql<RecipientGroup>`
      SELECT id, user_id, name, created_at::text
      FROM recipient_groups
      WHERE user_id = ${userId}
      ORDER BY name
    `;
    return rows;
  },

  async getGroupById(id: string): Promise<RecipientGroup | undefined> {
    const { rows } = await sql<RecipientGroup>`
      SELECT id, user_id, name, created_at::text
      FROM recipient_groups
      WHERE id = ${id}
    `;
    return rows[0];
  },

  async createGroup(group: { id: string; user_id: string; name: string }): Promise<void> {
    await sql`INSERT INTO recipient_groups (id, user_id, name) VALUES (${group.id}, ${group.user_id}, ${group.name})`;
  },

  async updateGroup(id: string, name: string): Promise<void> {
    await sql`UPDATE recipient_groups SET name = ${name} WHERE id = ${id}`;
  },

  async deleteGroup(id: string): Promise<void> {
    await sql`DELETE FROM recipient_groups WHERE id = ${id}`;
  },

  // Group Members
  async getMembersByGroup(groupId: string): Promise<GroupMember[]> {
    const { rows } = await sql<GroupMember>`
      SELECT id, group_id, name, email, created_at::text
      FROM group_members
      WHERE group_id = ${groupId}
      ORDER BY name
    `;
    return rows;
  },

  async getMembersByGroups(groupIds: string[]): Promise<GroupMember[]> {
    if (groupIds.length === 0) return [];
    const results: GroupMember[] = [];
    for (const groupId of groupIds) {
      const { rows } = await sql<GroupMember>`
        SELECT id, group_id, name, email, created_at::text
        FROM group_members
        WHERE group_id = ${groupId}::uuid
      `;
      results.push(...rows);
    }
    return results;
  },

  async addMember(member: { id: string; group_id: string; name: string; email: string }): Promise<void> {
    await sql`
      INSERT INTO group_members (id, group_id, name, email)
      VALUES (${member.id}, ${member.group_id}, ${member.name}, ${member.email})
    `;
  },

  async updateMember(id: string, name: string, email: string): Promise<void> {
    await sql`UPDATE group_members SET name = ${name}, email = ${email} WHERE id = ${id}`;
  },

  async deleteMember(id: string): Promise<void> {
    await sql`DELETE FROM group_members WHERE id = ${id}`;
  },

  async getGroupsWithMembers(userId: string): Promise<(RecipientGroup & { members: GroupMember[] })[]> {
    const groups = await this.getGroupsByUser(userId);
    const result: (RecipientGroup & { members: GroupMember[] })[] = [];
    for (const group of groups) {
      const members = await this.getMembersByGroup(group.id);
      result.push({ ...group, members });
    }
    return result;
  },

  // Collections
  async getCollectionsByUser(userId: string): Promise<Collection[]> {
    const { rows } = await sql<Collection>`
      SELECT id, user_id, name, created_at::text
      FROM collections
      WHERE user_id = ${userId}
      ORDER BY name
    `;
    return rows;
  },

  async getCollectionById(id: string): Promise<Collection | undefined> {
    const { rows } = await sql<Collection>`
      SELECT id, user_id, name, created_at::text
      FROM collections
      WHERE id = ${id}
    `;
    return rows[0];
  },

  async createCollection(collection: { id: string; user_id: string; name: string }): Promise<void> {
    await sql`INSERT INTO collections (id, user_id, name) VALUES (${collection.id}, ${collection.user_id}, ${collection.name})`;
  },

  async updateCollection(id: string, name: string): Promise<void> {
    await sql`UPDATE collections SET name = ${name} WHERE id = ${id}`;
  },

  async deleteCollection(id: string): Promise<void> {
    await sql`DELETE FROM collections WHERE id = ${id}`;
  },

  // Collection Memes
  async getMemesByCollection(collectionId: string): Promise<Meme[]> {
    const { rows } = await sql<Meme>`
      SELECT m.id, m.user_id, m.file_url, m.file_type, m.created_at::text
      FROM memes m
      JOIN collection_memes cm ON m.id = cm.meme_id
      WHERE cm.collection_id = ${collectionId}
      ORDER BY cm.sort_order
    `;
    return rows;
  },

  async getCollectionMemeIds(collectionId: string): Promise<string[]> {
    const { rows } = await sql<{ meme_id: string }>`
      SELECT meme_id FROM collection_memes WHERE collection_id = ${collectionId}
    `;
    return rows.map((r) => r.meme_id);
  },

  async addMemeToCollection(collectionMeme: { id: string; collection_id: string; meme_id: string; sort_order: number }): Promise<void> {
    await sql`
      INSERT INTO collection_memes (id, collection_id, meme_id, sort_order)
      VALUES (${collectionMeme.id}, ${collectionMeme.collection_id}, ${collectionMeme.meme_id}, ${collectionMeme.sort_order})
      ON CONFLICT (collection_id, meme_id) DO NOTHING
    `;
  },

  async addMemesToCollection(collectionId: string, memeIds: string[]): Promise<void> {
    const { rows } = await sql<{ max_order: string }>`
      SELECT COALESCE(MAX(sort_order), 0) as max_order FROM collection_memes WHERE collection_id = ${collectionId}
    `;
    let order = parseInt(rows[0]?.max_order || "0") + 1;
    for (const memeId of memeIds) {
      await sql`
        INSERT INTO collection_memes (collection_id, meme_id, sort_order)
        VALUES (${collectionId}, ${memeId}, ${order++})
        ON CONFLICT (collection_id, meme_id) DO NOTHING
      `;
    }
  },

  async removeMemeFromCollection(collectionId: string, memeId: string): Promise<void> {
    await sql`DELETE FROM collection_memes WHERE collection_id = ${collectionId} AND meme_id = ${memeId}`;
  },

  async getCollectionsWithMemes(userId: string): Promise<(Collection & { memes: Meme[]; memeCount: number })[]> {
    const collections = await this.getCollectionsByUser(userId);
    const result: (Collection & { memes: Meme[]; memeCount: number })[] = [];
    for (const collection of collections) {
      const memes = await this.getMemesByCollection(collection.id);
      result.push({
        ...collection,
        memes: memes.slice(0, 4), // Preview only first 4
        memeCount: memes.length,
      });
    }
    return result;
  },

  // Push Tokens
  async savePushToken(userId: string, token: string, platform: "ios" | "android" | "web"): Promise<void> {
    await sql`
      INSERT INTO push_tokens (user_id, token, platform)
      VALUES (${userId}, ${token}, ${platform})
      ON CONFLICT (token) DO UPDATE SET user_id = ${userId}, platform = ${platform}
    `;
  },

  async deletePushToken(token: string): Promise<void> {
    await sql`DELETE FROM push_tokens WHERE token = ${token}`;
  },

  async getPushTokensByUser(userId: string): Promise<PushToken[]> {
    const { rows } = await sql<PushToken>`
      SELECT id, user_id, token, platform, created_at::text
      FROM push_tokens
      WHERE user_id = ${userId}
    `;
    return rows;
  },

  async getPushTokensByEmail(email: string): Promise<PushToken[]> {
    const { rows } = await sql<PushToken>`
      SELECT pt.id, pt.user_id, pt.token, pt.platform, pt.created_at::text
      FROM push_tokens pt
      JOIN users u ON pt.user_id = u.id
      WHERE u.email = ${email}
    `;
    return rows;
  },

  // Activity Feed
  async getActivityFeed(userId: string, limit: number = 50): Promise<ActivityItem[]> {
    // Get all activity in one query using UNION ALL
    const { rows } = await sql<{
      id: string;
      type: string;
      timestamp: string;
      recipient_email: string;
      dump_id: string;
      dump_note: string | null;
      first_meme_url: string;
      emoji: string | null;
      meme_url: string | null;
      note_text: string | null;
      meme_count: string | null;
      recipient_count: string | null;
    }>`
      WITH user_dumps AS (
        SELECT d.id, d.note, d.created_at, (
          SELECT m.file_url FROM dump_memes dm
          JOIN memes m ON m.id = dm.meme_id
          WHERE dm.dump_id = d.id
          ORDER BY dm.sort_order LIMIT 1
        ) as first_meme_url,
        (SELECT COUNT(*) FROM dump_memes WHERE dump_id = d.id) as meme_count,
        (SELECT COUNT(*) FROM dump_recipients WHERE dump_id = d.id) as recipient_count
        FROM dumps d
        WHERE d.sender_id = ${userId}
      )
      -- Sent (dump created)
      SELECT
        ud.id::text || '-sent' as id,
        'sent' as type,
        ud.created_at::text as timestamp,
        '' as recipient_email,
        ud.id::text as dump_id,
        ud.note as dump_note,
        ud.first_meme_url,
        NULL as emoji,
        NULL as meme_url,
        NULL as note_text,
        ud.meme_count::text as meme_count,
        ud.recipient_count::text as recipient_count
      FROM user_dumps ud

      UNION ALL

      -- Views
      SELECT
        dr.id::text as id,
        'view' as type,
        dr.viewed_at::text as timestamp,
        dr.email as recipient_email,
        ud.id::text as dump_id,
        ud.note as dump_note,
        ud.first_meme_url,
        NULL as emoji,
        NULL as meme_url,
        NULL as note_text,
        NULL as meme_count,
        NULL as recipient_count
      FROM dump_recipients dr
      JOIN user_dumps ud ON dr.dump_id = ud.id
      WHERE dr.viewed_at IS NOT NULL

      UNION ALL

      -- Reactions
      SELECT
        r.id::text as id,
        'reaction' as type,
        r.created_at::text as timestamp,
        dr.email as recipient_email,
        ud.id::text as dump_id,
        ud.note as dump_note,
        ud.first_meme_url,
        r.emoji,
        m.file_url as meme_url,
        NULL as note_text,
        NULL as meme_count,
        NULL as recipient_count
      FROM reactions r
      JOIN dump_recipients dr ON r.recipient_id = dr.id
      JOIN user_dumps ud ON dr.dump_id = ud.id
      JOIN memes m ON r.meme_id = m.id

      UNION ALL

      -- Notes
      SELECT
        dr.id::text || '-note' as id,
        'note' as type,
        dr.viewed_at::text as timestamp,
        dr.email as recipient_email,
        ud.id::text as dump_id,
        ud.note as dump_note,
        ud.first_meme_url,
        NULL as emoji,
        NULL as meme_url,
        dr.recipient_note as note_text,
        NULL as meme_count,
        NULL as recipient_count
      FROM dump_recipients dr
      JOIN user_dumps ud ON dr.dump_id = ud.id
      WHERE dr.recipient_note IS NOT NULL AND dr.recipient_note != ''

      ORDER BY timestamp DESC NULLS LAST
      LIMIT ${limit}
    `;

    const sentActivity = rows.map((row) => ({
      id: row.id,
      type: row.type as "view" | "reaction" | "note" | "sent",
      timestamp: row.timestamp,
      recipientEmail: row.recipient_email,
      dumpId: row.dump_id,
      dumpNote: row.dump_note,
      firstMemeUrl: row.first_meme_url,
      emoji: row.emoji || undefined,
      memeUrl: row.meme_url || undefined,
      noteText: row.note_text || undefined,
      memeCount: row.meme_count ? parseInt(row.meme_count) : undefined,
      recipientCount: row.recipient_count ? parseInt(row.recipient_count) : undefined,
    }));

    // Get received dumps (where user is a recipient)
    const { rows: receivedRows } = await sql<{
      id: string;
      dump_id: string;
      dump_note: string | null;
      sender_email: string;
      first_meme_url: string;
      meme_count: string;
      created_at: string;
    }>`
      SELECT
        dr.id::text || '-received' as id,
        d.id::text as dump_id,
        d.note as dump_note,
        u.email as sender_email,
        (
          SELECT m.file_url FROM dump_memes dm
          JOIN memes m ON m.id = dm.meme_id
          WHERE dm.dump_id = d.id
          ORDER BY dm.sort_order LIMIT 1
        ) as first_meme_url,
        (SELECT COUNT(*) FROM dump_memes WHERE dump_id = d.id)::text as meme_count,
        dr.created_at::text
      FROM dump_recipients dr
      JOIN dumps d ON dr.dump_id = d.id
      JOIN users u ON d.sender_id = u.id
      WHERE dr.user_id = ${userId}
      ORDER BY dr.created_at DESC
      LIMIT ${limit}
    `;

    const receivedActivity: ActivityItem[] = receivedRows.map((row) => ({
      id: row.id,
      type: "received" as const,
      timestamp: row.created_at,
      recipientEmail: "",
      dumpId: row.dump_id,
      dumpNote: row.dump_note,
      firstMemeUrl: row.first_meme_url,
      memeCount: parseInt(row.meme_count),
      senderEmail: row.sender_email,
    }));

    // Merge and sort by timestamp
    const allActivity = [...sentActivity, ...receivedActivity];
    allActivity.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return allActivity.slice(0, limit);
  },

  // User Connections (QR code connections)
  async createConnection(connection: { connector_id: string; name: string }): Promise<UserConnection> {
    const { rows } = await sql<UserConnection>`
      INSERT INTO user_connections (connector_id, name)
      VALUES (${connection.connector_id}, ${connection.name})
      RETURNING id, connector_id, name, connected_user_id, connected_at::text, created_at::text
    `;
    return rows[0];
  },

  async getConnectionsByConnector(connectorId: string): Promise<UserConnection[]> {
    const { rows } = await sql<UserConnection>`
      SELECT id, connector_id, name, connected_user_id, connected_at::text, created_at::text
      FROM user_connections
      WHERE connector_id = ${connectorId}
      ORDER BY created_at DESC
    `;
    return rows;
  },

  async getConnectionByConnectorAndName(connectorId: string, name: string): Promise<UserConnection | undefined> {
    const { rows } = await sql<UserConnection>`
      SELECT id, connector_id, name, connected_user_id, connected_at::text, created_at::text
      FROM user_connections
      WHERE connector_id = ${connectorId} AND LOWER(name) = LOWER(${name})
    `;
    return rows[0];
  },

  async linkConnectionToUser(connectionId: string, userId: string): Promise<void> {
    await sql`
      UPDATE user_connections
      SET connected_user_id = ${userId}, connected_at = NOW()
      WHERE id = ${connectionId}
    `;
  },

  async linkConnectionByName(connectorId: string, name: string, userId: string): Promise<boolean> {
    // Find connection by connector and name, then link to user
    const { rowCount } = await sql`
      UPDATE user_connections
      SET connected_user_id = ${userId}, connected_at = NOW()
      WHERE connector_id = ${connectorId}
        AND LOWER(name) = LOWER(${name})
        AND connected_user_id IS NULL
    `;
    return (rowCount ?? 0) > 0;
  },

  async getPendingConnectionsForUser(name: string): Promise<UserConnection[]> {
    // Find connections by name that aren't yet linked to a user
    const { rows } = await sql<UserConnection>`
      SELECT id, connector_id, name, connected_user_id, connected_at::text, created_at::text
      FROM user_connections
      WHERE LOWER(name) = LOWER(${name}) AND connected_user_id IS NULL
    `;
    return rows;
  },
};

export default db;
