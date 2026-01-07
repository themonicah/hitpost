import { sql } from "@vercel/postgres";

// Types
export interface User {
  id: string;
  email: string;
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
  email: string;
  token: string;
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
  type: "view" | "reaction" | "note" | "sent";
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

  async createUser(user: { id: string; email: string }): Promise<void> {
    await sql`INSERT INTO users (id, email) VALUES (${user.id}, ${user.email})`;
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
    await sql`DELETE FROM memes WHERE id = ${id}`;
  },

  // Dumps
  async getDumpById(id: string): Promise<Dump | undefined> {
    const { rows } = await sql<Dump>`
      SELECT id, sender_id, note, created_at::text
      FROM dumps
      WHERE id = ${id}
    `;
    return rows[0];
  },

  async getDumpsByUser(userId: string): Promise<Dump[]> {
    const { rows } = await sql<Dump>`
      SELECT id, sender_id, note, created_at::text
      FROM dumps
      WHERE sender_id = ${userId}
      ORDER BY created_at DESC
    `;
    return rows;
  },

  async createDump(dump: { id: string; sender_id: string; note: string | null }): Promise<void> {
    await sql`
      INSERT INTO dumps (id, sender_id, note)
      VALUES (${dump.id}, ${dump.sender_id}, ${dump.note})
    `;
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

  async getDumpMemeCount(dumpId: string): Promise<number> {
    const { rows } = await sql<{ count: string }>`
      SELECT COUNT(*) as count FROM dump_memes WHERE dump_id = ${dumpId}
    `;
    return parseInt(rows[0]?.count || "0");
  },

  // Dump Recipients
  async getRecipientByToken(token: string): Promise<DumpRecipient | undefined> {
    const { rows } = await sql<DumpRecipient>`
      SELECT id, dump_id, email, token::text, viewed_at::text, view_count, recipient_note, created_at::text
      FROM dump_recipients
      WHERE token = ${token}::uuid
    `;
    return rows[0];
  },

  async getRecipientsByDump(dumpId: string): Promise<DumpRecipient[]> {
    const { rows } = await sql<DumpRecipient>`
      SELECT id, dump_id, email, token::text, viewed_at::text, view_count, recipient_note, created_at::text
      FROM dump_recipients
      WHERE dump_id = ${dumpId}
    `;
    return rows;
  },

  async getRecipientById(id: string): Promise<DumpRecipient | undefined> {
    const { rows } = await sql<DumpRecipient>`
      SELECT id, dump_id, email, token::text, viewed_at::text, view_count, recipient_note, created_at::text
      FROM dump_recipients
      WHERE id = ${id}
    `;
    return rows[0];
  },

  async createRecipient(recipient: { id: string; dump_id: string; email: string; token: string }): Promise<void> {
    await sql`
      INSERT INTO dump_recipients (id, dump_id, email, token)
      VALUES (${recipient.id}, ${recipient.dump_id}, ${recipient.email}, ${recipient.token}::uuid)
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

    return rows.map((row) => ({
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
  },
};

export default db;
