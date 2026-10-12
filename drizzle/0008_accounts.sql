ALTER TABLE app_users ADD COLUMN password_hash TEXT;
ALTER TABLE app_users ADD COLUMN password_set_at TEXT;
CREATE TABLE invitations (
 token_hash TEXT PRIMARY KEY,
 email TEXT NOT NULL REFERENCES app_users(email),
 expires_at TEXT NOT NULL,
 used_at TEXT,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 sent_at TEXT
);
CREATE INDEX invitations_email_idx ON invitations(email);
CREATE TABLE sessions (
 token_hash TEXT PRIMARY KEY,
 email TEXT NOT NULL REFERENCES app_users(email),
 expires_at TEXT NOT NULL,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX sessions_email_idx ON sessions(email);
CREATE TABLE login_attempts (
 email TEXT PRIMARY KEY,
 attempts INTEGER NOT NULL DEFAULT 0,
 window_start TEXT NOT NULL,
 blocked_until TEXT
);
CREATE TABLE user_audit (
 id TEXT PRIMARY KEY,
 actor TEXT NOT NULL,
 target_email TEXT NOT NULL,
 operation TEXT NOT NULL,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
