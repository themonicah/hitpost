-- Users
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Memes
CREATE TABLE IF NOT EXISTS memes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_type VARCHAR(10) NOT NULL CHECK (file_type IN ('image', 'video')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Dumps
CREATE TABLE IF NOT EXISTS dumps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Dump Memes (junction table)
CREATE TABLE IF NOT EXISTS dump_memes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dump_id UUID NOT NULL REFERENCES dumps(id) ON DELETE CASCADE,
  meme_id UUID NOT NULL REFERENCES memes(id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL
);

-- Dump Recipients
CREATE TABLE IF NOT EXISTS dump_recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dump_id UUID NOT NULL REFERENCES dumps(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  token UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
  viewed_at TIMESTAMP WITH TIME ZONE,
  view_count INTEGER DEFAULT 0,
  recipient_note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reactions
CREATE TABLE IF NOT EXISTS reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id UUID NOT NULL REFERENCES dump_recipients(id) ON DELETE CASCADE,
  meme_id UUID NOT NULL REFERENCES memes(id) ON DELETE CASCADE,
  emoji VARCHAR(10) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(recipient_id, meme_id)
);

-- Sent Emails (for logging)
CREATE TABLE IF NOT EXISTS sent_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  to_email VARCHAR(255) NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  link TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Recipient Groups
CREATE TABLE IF NOT EXISTS recipient_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Group Members
CREATE TABLE IF NOT EXISTS group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES recipient_groups(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Collections
CREATE TABLE IF NOT EXISTS collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Collection Memes (junction table)
CREATE TABLE IF NOT EXISTS collection_memes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id UUID NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
  meme_id UUID NOT NULL REFERENCES memes(id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(collection_id, meme_id)
);

-- Push Notification Tokens
CREATE TABLE IF NOT EXISTS push_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  platform VARCHAR(10) NOT NULL CHECK (platform IN ('ios', 'android', 'web')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_memes_user_id ON memes(user_id);
CREATE INDEX IF NOT EXISTS idx_dumps_sender_id ON dumps(sender_id);
CREATE INDEX IF NOT EXISTS idx_dump_memes_dump_id ON dump_memes(dump_id);
CREATE INDEX IF NOT EXISTS idx_dump_recipients_dump_id ON dump_recipients(dump_id);
CREATE INDEX IF NOT EXISTS idx_dump_recipients_token ON dump_recipients(token);
CREATE INDEX IF NOT EXISTS idx_reactions_recipient_id ON reactions(recipient_id);
CREATE INDEX IF NOT EXISTS idx_recipient_groups_user_id ON recipient_groups(user_id);
CREATE INDEX IF NOT EXISTS idx_group_members_group_id ON group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_collections_user_id ON collections(user_id);
CREATE INDEX IF NOT EXISTS idx_collection_memes_collection_id ON collection_memes(collection_id);
CREATE INDEX IF NOT EXISTS idx_push_tokens_user_id ON push_tokens(user_id);
