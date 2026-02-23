/**
 * Session-based conversation storage under .agents/sessions/.
 * One session per context: terminal run, Slack channel/group, etc.
 */

import * as fs from "node:fs/promises";
import * as path from "node:path";
import { randomBytes } from "node:crypto";

const SESSIONS_DIR = ".agents/sessions";

export type SessionType = "terminal" | "slack" | "slack-channel" | "slack-group";

export interface SessionMeta {
  /** Slack channel/group id when type is slack-* */
  channelId?: string;
  /** Human-readable label (e.g. channel name) */
  label?: string;
  [key: string]: unknown;
}

export interface Session {
  id: string;
  type: SessionType;
  createdAt: string;
  updatedAt: string;
  meta?: SessionMeta;
}

export interface SessionMessage {
  role: "user" | "assistant";
  content: string;
  at?: string;
}

function getSessionsBase(): string {
  return path.join(process.cwd(), SESSIONS_DIR);
}

function sessionDir(sessionId: string): string {
  return path.join(getSessionsBase(), sessionId);
}

function safeSessionId(type: string, suffix: string): string {
  const safe = suffix.replace(/[^a-zA-Z0-9-_]/g, "-").slice(0, 64);
  return `${type}-${safe}`;
}

/** Fixed session id for terminal – all terminal runs share this session. */
const TERMINAL_SESSION_ID = "terminal";

/**
 * Get or create a session. Terminal always uses the same session id so
 * conversation continues across restarts; other types get their own id per context.
 */
export async function getOrCreateSession(
  type: SessionType,
  meta?: SessionMeta
): Promise<Session> {
  const id =
    type === "terminal"
      ? TERMINAL_SESSION_ID
      : type.startsWith("slack") && meta?.channelId
        ? safeSessionId(type, meta.channelId)
        : safeSessionId(type, `${Date.now()}-${randomBytes(2).toString("hex")}`);

  const dir = sessionDir(id);
  const sessionPath = path.join(dir, "session.json");
  const messagesPath = path.join(dir, "messages.json");

  try {
    const raw = await fs.readFile(sessionPath, "utf-8");
    return JSON.parse(raw) as Session;
  } catch {
    // Session does not exist – create it
  }

  const now = new Date().toISOString();
  const session: Session = {
    id,
    type,
    createdAt: now,
    updatedAt: now,
    ...(meta && Object.keys(meta).length > 0 ? { meta } : {}),
  };
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(sessionPath, JSON.stringify(session, null, 2), "utf-8");
  await fs.writeFile(messagesPath, "[]", "utf-8");
  return session;
}

/**
 * Append messages to a session and update updatedAt.
 */
export async function appendToSession(
  sessionId: string,
  messages: SessionMessage[]
): Promise<void> {
  if (messages.length === 0) return;
  const dir = sessionDir(sessionId);
  const sessionPath = path.join(dir, "session.json");
  const messagesPath = path.join(dir, "messages.json");
  const at = new Date().toISOString();
  const withTimestamps: SessionMessage[] = messages.map((m) =>
    m.at ? m : { ...m, at }
  );

  let existing: SessionMessage[] = [];
  try {
    const raw = await fs.readFile(messagesPath, "utf-8");
    existing = JSON.parse(raw) as SessionMessage[];
  } catch {
    await fs.mkdir(dir, { recursive: true });
  }

  existing.push(...withTimestamps);
  await fs.writeFile(
    messagesPath,
    JSON.stringify(existing, null, 2),
    "utf-8"
  );

  try {
    const sessionRaw = await fs.readFile(sessionPath, "utf-8");
    const session = JSON.parse(sessionRaw) as Session;
    session.updatedAt = at;
    await fs.writeFile(
      sessionPath,
      JSON.stringify(session, null, 2),
      "utf-8"
    );
  } catch {
    // session.json missing; append still succeeded
  }
}

/**
 * Load messages for a session. Returns at most last maxMessages (default: all).
 * Use a limit to avoid overflowing the LLM context (e.g. last 50 exchanges = 100).
 */
export async function getSessionMessages(
  sessionId: string,
  maxMessages?: number
): Promise<SessionMessage[]> {
  const dir = sessionDir(sessionId);
  const messagesPath = path.join(dir, "messages.json");
  try {
    const raw = await fs.readFile(messagesPath, "utf-8");
    const all = JSON.parse(raw) as SessionMessage[];
    if (maxMessages === undefined || all.length <= maxMessages) return all;
    return all.slice(-maxMessages);
  } catch {
    return [];
  }
}

/**
 * List session ids (folder names) under .agents/sessions/.
 */
export async function listSessionIds(): Promise<string[]> {
  const base = getSessionsBase();
  try {
    const entries = await fs.readdir(base, { withFileTypes: true });
    return entries.filter((e) => e.isDirectory()).map((e) => e.name);
  } catch {
    return [];
  }
}
