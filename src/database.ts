import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'database.sqlite');
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Create guilds table
db.exec(`
  CREATE TABLE IF NOT EXISTS guilds (
    guild_id TEXT PRIMARY KEY,
    intro_channel_id TEXT,
    intro_role_id TEXT,
    welcome_message TEXT
  )
`);

// Create introductions table
db.exec(`
  CREATE TABLE IF NOT EXISTS introductions (
    user_id TEXT NOT NULL,
    guild_id TEXT NOT NULL,
    agent TEXT,
    rank TEXT,
    role TEXT,
    about TEXT,
    message_id TEXT,
    PRIMARY KEY (user_id, guild_id)
  )
`);

// Create change_requests table
db.exec(`
  CREATE TABLE IF NOT EXISTS change_requests (
    user_id TEXT NOT NULL,
    guild_id TEXT NOT NULL,
    request_count INTEGER DEFAULT 0,
    last_reset_month TEXT,
    PRIMARY KEY (user_id, guild_id)
  )
`);

export default db;
