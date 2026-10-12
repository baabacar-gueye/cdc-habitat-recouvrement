CREATE TABLE IF NOT EXISTS app_users (
  email TEXT PRIMARY KEY COLLATE NOCASE,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin','superviseur','agent')),
  active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0,1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT OR IGNORE INTO app_users (email,name,role) VALUES ('mndiaye@cdc-habitat.sn','Malick Ndiaye','admin');
