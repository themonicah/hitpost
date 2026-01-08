-- Add share_token to dumps table
ALTER TABLE dumps ADD COLUMN IF NOT EXISTS share_token TEXT UNIQUE;

-- Add user_id to dump_recipients table (links recipient to user account)
ALTER TABLE dump_recipients ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_dumps_share_token ON dumps(share_token);
CREATE INDEX IF NOT EXISTS idx_dump_recipients_user_id ON dump_recipients(user_id);

-- Add push_tokens table if not exists
CREATE TABLE IF NOT EXISTS push_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  token TEXT NOT NULL UNIQUE,
  platform TEXT NOT NULL CHECK (platform IN ('ios', 'android', 'web')),
  created_at TIMESTAMP DEFAULT NOW()
);
