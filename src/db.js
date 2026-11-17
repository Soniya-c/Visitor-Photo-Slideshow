import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

export function openDatabase(filename) {
  fs.mkdirSync(path.dirname(path.resolve(filename)), { recursive: true });
  const db = new Database(filename);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  db.exec(`
    CREATE TABLE IF NOT EXISTS visitors (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      code_hash TEXT NOT NULL UNIQUE,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS photos (
      id TEXT PRIMARY KEY,
      visitor_id TEXT NOT NULL REFERENCES visitors(id) ON DELETE CASCADE,
      filename TEXT NOT NULL UNIQUE,
      original_name TEXT NOT NULL,
      mime_type TEXT NOT NULL,
      width INTEGER NOT NULL,
      height INTEGER NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      approved INTEGER NOT NULL DEFAULT 1
    );
    CREATE INDEX IF NOT EXISTS photos_queue ON photos(approved, created_at, id);
    CREATE INDEX IF NOT EXISTS photos_visitor ON photos(visitor_id);
  `);
  return db;
}
