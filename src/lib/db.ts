import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import path from "path";

// Types
export interface User {
  id: string;
  email: string;
  created_at: string;
}

export interface Meme {
  id: string;
  user_id: string;
  file_path: string;
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

interface Database {
  users: User[];
  memes: Meme[];
  dumps: Dump[];
  dump_memes: DumpMeme[];
  dump_recipients: DumpRecipient[];
  reactions: Reaction[];
  sent_emails: SentEmail[];
  recipient_groups: RecipientGroup[];
  group_members: GroupMember[];
  collections: Collection[];
  collection_memes: CollectionMeme[];
}

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "db.json");

function ensureDataDir() {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }
}

function loadDb(): Database {
  ensureDataDir();
  if (!existsSync(DB_PATH)) {
    const emptyDb: Database = {
      users: [],
      memes: [],
      dumps: [],
      dump_memes: [],
      dump_recipients: [],
      reactions: [],
      sent_emails: [],
      recipient_groups: [],
      group_members: [],
      collections: [],
      collection_memes: [],
    };
    writeFileSync(DB_PATH, JSON.stringify(emptyDb, null, 2));
    return emptyDb;
  }
  const data = JSON.parse(readFileSync(DB_PATH, "utf-8"));
  // Ensure new fields exist for backwards compatibility
  if (!data.recipient_groups) data.recipient_groups = [];
  if (!data.group_members) data.group_members = [];
  if (!data.collections) data.collections = [];
  if (!data.collection_memes) data.collection_memes = [];
  return data;
}

function saveDb(db: Database) {
  ensureDataDir();
  writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

// Database operations
export const db = {
  // Users
  getUserById(id: string): User | undefined {
    return loadDb().users.find((u) => u.id === id);
  },

  getUserByEmail(email: string): User | undefined {
    return loadDb().users.find((u) => u.email === email);
  },

  createUser(user: User): void {
    const data = loadDb();
    data.users.push(user);
    saveDb(data);
  },

  // Memes
  getMemesByUser(userId: string): Meme[] {
    return loadDb()
      .memes.filter((m) => m.user_id === userId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  getMemeById(id: string): Meme | undefined {
    return loadDb().memes.find((m) => m.id === id);
  },

  getMemesByIds(ids: string[]): Meme[] {
    const data = loadDb();
    return ids.map((id) => data.memes.find((m) => m.id === id)).filter(Boolean) as Meme[];
  },

  createMeme(meme: Meme): void {
    const data = loadDb();
    data.memes.push(meme);
    saveDb(data);
  },

  deleteMeme(id: string): void {
    const data = loadDb();
    data.memes = data.memes.filter((m) => m.id !== id);
    saveDb(data);
  },

  // Dumps
  getDumpById(id: string): Dump | undefined {
    return loadDb().dumps.find((d) => d.id === id);
  },

  getDumpsByUser(userId: string): Dump[] {
    return loadDb()
      .dumps.filter((d) => d.sender_id === userId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  createDump(dump: Dump): void {
    const data = loadDb();
    data.dumps.push(dump);
    saveDb(data);
  },

  // Dump Memes
  addMemesToDump(dumpMemes: DumpMeme[]): void {
    const data = loadDb();
    data.dump_memes.push(...dumpMemes);
    saveDb(data);
  },

  getMemesByDump(dumpId: string): Meme[] {
    const data = loadDb();
    const dumpMemes = data.dump_memes
      .filter((dm) => dm.dump_id === dumpId)
      .sort((a, b) => a.sort_order - b.sort_order);
    return dumpMemes
      .map((dm) => data.memes.find((m) => m.id === dm.meme_id))
      .filter(Boolean) as Meme[];
  },

  getDumpMemeCount(dumpId: string): number {
    return loadDb().dump_memes.filter((dm) => dm.dump_id === dumpId).length;
  },

  // Dump Recipients
  getRecipientByToken(token: string): DumpRecipient | undefined {
    return loadDb().dump_recipients.find((r) => r.token === token);
  },

  getRecipientsByDump(dumpId: string): DumpRecipient[] {
    return loadDb().dump_recipients.filter((r) => r.dump_id === dumpId);
  },

  getRecipientById(id: string): DumpRecipient | undefined {
    return loadDb().dump_recipients.find((r) => r.id === id);
  },

  createRecipient(recipient: DumpRecipient): void {
    const data = loadDb();
    data.dump_recipients.push(recipient);
    saveDb(data);
  },

  markRecipientViewed(id: string): void {
    const data = loadDb();
    const recipient = data.dump_recipients.find((r) => r.id === id);
    if (recipient) {
      if (!recipient.viewed_at) {
        recipient.viewed_at = new Date().toISOString();
      }
      recipient.view_count = (recipient.view_count || 0) + 1;
      saveDb(data);
    }
  },

  updateRecipientNote(id: string, note: string | null): void {
    const data = loadDb();
    const recipient = data.dump_recipients.find((r) => r.id === id);
    if (recipient) {
      recipient.recipient_note = note;
      saveDb(data);
    }
  },

  // Reactions
  getReactionsByRecipient(recipientId: string): Reaction[] {
    return loadDb().reactions.filter((r) => r.recipient_id === recipientId);
  },

  getReactionsByRecipients(recipientIds: string[]): Reaction[] {
    return loadDb().reactions.filter((r) => recipientIds.includes(r.recipient_id));
  },

  upsertReaction(recipientId: string, memeId: string, emoji: string | null): void {
    const data = loadDb();
    const existingIndex = data.reactions.findIndex(
      (r) => r.recipient_id === recipientId && r.meme_id === memeId
    );

    if (emoji) {
      if (existingIndex >= 0) {
        data.reactions[existingIndex].emoji = emoji;
      } else {
        data.reactions.push({
          id: crypto.randomUUID(),
          recipient_id: recipientId,
          meme_id: memeId,
          emoji,
          created_at: new Date().toISOString(),
        });
      }
    } else {
      if (existingIndex >= 0) {
        data.reactions.splice(existingIndex, 1);
      }
    }
    saveDb(data);
  },

  // Sent Emails
  createEmail(email: SentEmail): void {
    const data = loadDb();
    data.sent_emails.push(email);
    saveDb(data);
  },

  getEmails(): SentEmail[] {
    return loadDb()
      .sent_emails.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 50);
  },

  // Stats
  getDumpStats(dumpId: string): { memeCount: number; recipientCount: number; viewedCount: number } {
    const data = loadDb();
    const memeCount = data.dump_memes.filter((dm) => dm.dump_id === dumpId).length;
    const recipients = data.dump_recipients.filter((r) => r.dump_id === dumpId);
    const recipientCount = recipients.length;
    const viewedCount = recipients.filter((r) => r.viewed_at).length;
    return { memeCount, recipientCount, viewedCount };
  },

  // Recipient Groups
  getGroupsByUser(userId: string): RecipientGroup[] {
    return loadDb()
      .recipient_groups.filter((g) => g.user_id === userId)
      .sort((a, b) => a.name.localeCompare(b.name));
  },

  getGroupById(id: string): RecipientGroup | undefined {
    return loadDb().recipient_groups.find((g) => g.id === id);
  },

  createGroup(group: RecipientGroup): void {
    const data = loadDb();
    data.recipient_groups.push(group);
    saveDb(data);
  },

  updateGroup(id: string, name: string): void {
    const data = loadDb();
    const group = data.recipient_groups.find((g) => g.id === id);
    if (group) {
      group.name = name;
      saveDb(data);
    }
  },

  deleteGroup(id: string): void {
    const data = loadDb();
    data.recipient_groups = data.recipient_groups.filter((g) => g.id !== id);
    data.group_members = data.group_members.filter((m) => m.group_id !== id);
    saveDb(data);
  },

  // Group Members
  getMembersByGroup(groupId: string): GroupMember[] {
    return loadDb()
      .group_members.filter((m) => m.group_id === groupId)
      .sort((a, b) => a.name.localeCompare(b.name));
  },

  getMembersByGroups(groupIds: string[]): GroupMember[] {
    return loadDb().group_members.filter((m) => groupIds.includes(m.group_id));
  },

  addMember(member: GroupMember): void {
    const data = loadDb();
    data.group_members.push(member);
    saveDb(data);
  },

  updateMember(id: string, name: string, email: string): void {
    const data = loadDb();
    const member = data.group_members.find((m) => m.id === id);
    if (member) {
      member.name = name;
      member.email = email;
      saveDb(data);
    }
  },

  deleteMember(id: string): void {
    const data = loadDb();
    data.group_members = data.group_members.filter((m) => m.id !== id);
    saveDb(data);
  },

  getGroupsWithMembers(userId: string): (RecipientGroup & { members: GroupMember[] })[] {
    const data = loadDb();
    const groups = data.recipient_groups.filter((g) => g.user_id === userId);
    return groups
      .map((group) => ({
        ...group,
        members: data.group_members.filter((m) => m.group_id === group.id),
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  },

  // Collections
  getCollectionsByUser(userId: string): Collection[] {
    return loadDb()
      .collections.filter((c) => c.user_id === userId)
      .sort((a, b) => a.name.localeCompare(b.name));
  },

  getCollectionById(id: string): Collection | undefined {
    return loadDb().collections.find((c) => c.id === id);
  },

  createCollection(collection: Collection): void {
    const data = loadDb();
    data.collections.push(collection);
    saveDb(data);
  },

  updateCollection(id: string, name: string): void {
    const data = loadDb();
    const collection = data.collections.find((c) => c.id === id);
    if (collection) {
      collection.name = name;
      saveDb(data);
    }
  },

  deleteCollection(id: string): void {
    const data = loadDb();
    data.collections = data.collections.filter((c) => c.id !== id);
    data.collection_memes = data.collection_memes.filter((cm) => cm.collection_id !== id);
    saveDb(data);
  },

  // Collection Memes
  getMemesByCollection(collectionId: string): Meme[] {
    const data = loadDb();
    const collectionMemes = data.collection_memes
      .filter((cm) => cm.collection_id === collectionId)
      .sort((a, b) => a.sort_order - b.sort_order);
    return collectionMemes
      .map((cm) => data.memes.find((m) => m.id === cm.meme_id))
      .filter(Boolean) as Meme[];
  },

  getCollectionMemeIds(collectionId: string): string[] {
    return loadDb()
      .collection_memes.filter((cm) => cm.collection_id === collectionId)
      .map((cm) => cm.meme_id);
  },

  addMemeToCollection(collectionMeme: CollectionMeme): void {
    const data = loadDb();
    // Check if already exists
    const exists = data.collection_memes.some(
      (cm) => cm.collection_id === collectionMeme.collection_id && cm.meme_id === collectionMeme.meme_id
    );
    if (!exists) {
      data.collection_memes.push(collectionMeme);
      saveDb(data);
    }
  },

  addMemesToCollection(collectionId: string, memeIds: string[]): void {
    const data = loadDb();
    const existingMemeIds = new Set(
      data.collection_memes.filter((cm) => cm.collection_id === collectionId).map((cm) => cm.meme_id)
    );
    const maxOrder = Math.max(
      0,
      ...data.collection_memes.filter((cm) => cm.collection_id === collectionId).map((cm) => cm.sort_order)
    );
    let order = maxOrder + 1;
    for (const memeId of memeIds) {
      if (!existingMemeIds.has(memeId)) {
        data.collection_memes.push({
          id: crypto.randomUUID(),
          collection_id: collectionId,
          meme_id: memeId,
          sort_order: order++,
          added_at: new Date().toISOString(),
        });
      }
    }
    saveDb(data);
  },

  removeMemeFromCollection(collectionId: string, memeId: string): void {
    const data = loadDb();
    data.collection_memes = data.collection_memes.filter(
      (cm) => !(cm.collection_id === collectionId && cm.meme_id === memeId)
    );
    saveDb(data);
  },

  getCollectionsWithMemes(userId: string): (Collection & { memes: Meme[]; memeCount: number })[] {
    const data = loadDb();
    const collections = data.collections.filter((c) => c.user_id === userId);
    return collections
      .map((collection) => {
        const collectionMemes = data.collection_memes
          .filter((cm) => cm.collection_id === collection.id)
          .sort((a, b) => a.sort_order - b.sort_order);
        const memes = collectionMemes
          .map((cm) => data.memes.find((m) => m.id === cm.meme_id))
          .filter(Boolean) as Meme[];
        return {
          ...collection,
          memes: memes.slice(0, 4), // Preview only first 4
          memeCount: memes.length,
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  },
};

export default db;
