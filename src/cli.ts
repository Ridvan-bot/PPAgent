#!/usr/bin/env node
/**
 * CLI: npm run agent "question" for single shot, or npm run agent for interactive chat.
 */

import "dotenv/config";
import * as readline from "node:readline/promises";
import { loadConfig } from "./config.js";
import { builtinTools } from "./tools/index.js";
import { loadAllSkills, buildSystemPrompt, collectTools } from "./skills/loader.js";
import { loadRules, formatRulesForPrompt } from "./rules.js";
import { getOrCreateSession, appendToSession, getSessionMessages } from "./sessions.js";
import { runAgent } from "./agent.js";
import { logCli, logError } from "./logger.js";

const BASE_SYSTEM_PROMPT = `You are PPAgent, an AI assistant.
You have access to tools: read_file, write_file, list_dir, run_command. Use them when you need to read/write files, list directories, or run shell commands.
Answer concisely. When suggesting code, use the project's existing style and dependencies.`;

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const singleQuestion = args.join(" ").trim();

  logCli("CLI started", { singleQuestion: singleQuestion.length > 0 });

  let config;
  try {
    config = loadConfig();
  } catch (e) {
    logError("config", e);
    console.error((e as Error).message);
    console.error("Create a .env with OPENAI_API_KEY=... (or set OPENAI_BASE_URL for a compatible API).");
    process.exit(1);
  }

  const rulesContent = await loadRules();
  const rulesBlock = formatRulesForPrompt(rulesContent);
  if (rulesContent) logCli("Rules loaded", { length: rulesContent.length });

  const skills = await loadAllSkills();
  logCli("Skills loaded", { count: skills.length, names: skills.map((s) => s.meta.name) });
  const baseWithRules = BASE_SYSTEM_PROMPT + rulesBlock;
  const systemPrompt = buildSystemPrompt(skills, baseWithRules);
  const tools = collectTools(skills, builtinTools);

  if (singleQuestion) {
    logCli("User message (single)", { message: singleQuestion });
    const session = await getOrCreateSession("terminal");
    const stored = await getSessionMessages(session.id, 100);
    const conversationHistory = stored.map((m) => ({ role: m.role, content: m.content }));
    const { content } = await runAgent(
      { config, tools, systemPrompt },
      singleQuestion,
      conversationHistory
    );
    await appendToSession(session.id, [
      { role: "user", content: singleQuestion },
      { role: "assistant", content },
    ]);
    logCli("Agent response (single)", { length: content.length, sessionId: session.id });
    console.log(content);
    logCli("CLI finished (single)");
    return;
  }

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const session = await getOrCreateSession("terminal");
  const stored = await getSessionMessages(session.id, 100);
  const conversationHistory: import("./agent.js").Message[] = stored.map((m) => ({
    role: m.role,
    content: m.content,
  }));
  logCli("Interactive session started", { sessionId: session.id, historyMessages: conversationHistory.length });
  console.log("PPAgent – interaktiv chat. Skriv meddelanden här, avsluta med 'exit'.");
  console.log("Session:", session.id, "| Historik:", conversationHistory.length, "meddelanden | Skills:", skills.map((s) => s.meta.name).join(", ") || "inga");
  console.log("");

  while (true) {
    const line = await rl.question("> ");
    const input = line.trim();
    if (!input) continue;
    if (input.toLowerCase() === "exit" || input.toLowerCase() === "quit") {
      logCli("User exited");
      break;
    }

    logCli("User message", { message: input });
    process.stdout.write("… ");
    const { content, messages } = await runAgent(
      { config, tools, systemPrompt },
      input,
      conversationHistory
    );
    conversationHistory.length = 0;
    conversationHistory.push(...messages);
    await appendToSession(session.id, [
      { role: "user", content: input },
      { role: "assistant", content },
    ]);
    logCli("Agent response", { length: content.length });
    console.log("\n" + content);
  }

  rl.close();
  logCli("CLI finished");
}

main().catch((err) => {
  logError("cli main", err);
  console.error(err);
  process.exit(1);
});
