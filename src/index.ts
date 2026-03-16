/**
 * PPAgent – AI assistant
 * Entry point. Simple CLI loop with:
 * - sessions (per terminal)
 * - longterm memory
 * - system prompt från Markdown-fil + inläst longterm-fil
 */

import readline from "node:readline";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import { loadConfig } from "./config.js";
import { runAgent, type Message } from "./agent.js";
import { builtinTools } from "./tools/index.js";
import { loadSystemPrompt } from "./prompts.js";
import {
  appendToSession,
  getOrCreateSession,
  getSessionMessages,
  type SessionMessage,
} from "./sessions.js";
import { logCli } from "./logger.js";

async function main(): Promise<void> {
  const config = loadConfig();
  const baseSystemPrompt = await loadSystemPrompt();

  // Läs in longterm-fil direkt så att modellen garanterat får innehållet.
  let longtermText = "";
  try {
    const longtermPath = path.join(process.cwd(), ".agents", "longterm.md");
    longtermText = await fs.readFile(longtermPath, "utf-8");
  } catch {
    // Ingen longterm-fil ännu – ignoreras bara.
  }

  const systemPrompt =
    longtermText.trim().length > 0
      ? `${baseSystemPrompt}\n\n---\n\n# Longterm memory (inläst fil)\n\n${longtermText}`
      : baseSystemPrompt;

  // En gemensam "terminal"-session så att historiken bevaras mellan körningar.
  const session = await getOrCreateSession("terminal");
  const previous = await getSessionMessages(session.id, 100);

  const conversationHistory: Message[] = previous.map((m) => ({
    role: m.role,
    content: m.content,
  }));

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  console.log("PPAgent ready. Skriv din fråga (eller 'exit' för att avsluta):");

  async function ask(): Promise<void> {
    rl.question("> ", async (input) => {
      const trimmed = input.trim();
      if (!trimmed) {
        return ask();
      }
      if (trimmed.toLowerCase() === "exit" || trimmed.toLowerCase() === "quit") {
        rl.close();
        return;
      }

      logCli("user_input", { length: trimmed.length });

      const { content, messages } = await runAgent(
        {
          config,
          tools: builtinTools,
          systemPrompt,
          maxTurns: 10,
        },
        trimmed,
        conversationHistory
      );

      console.log(content);

      // Uppdatera historik med nya meddelanden (user + assistant)
      const newMessages = messages.slice(conversationHistory.length);
      const toStore: SessionMessage[] = newMessages
        .filter((m) => m.role === "user" || m.role === "assistant")
        .map((m) => ({
          role: m.role as "user" | "assistant",
          content: typeof m.content === "string" ? m.content : JSON.stringify(m.content),
        }));

      conversationHistory.push(...newMessages);
      await appendToSession(session.id, toStore);

      await ask();
    });
  }

  await ask();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
