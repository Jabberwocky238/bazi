-- 用户表 —— 手机号注册
-- 本地建表: wrangler d1 execute bazi-users --local --file=worker/migrations/0001_init.sql
-- 远程建表: wrangler d1 execute bazi-users --file=worker/migrations/0001_init.sql

CREATE TABLE IF NOT EXISTS users (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  phone      TEXT UNIQUE NOT NULL,
  nickname   TEXT,
  created_at INTEGER NOT NULL,   -- epoch ms
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
