#!/usr/bin/env node
import "dotenv/config";
import React, { useState } from "react";
import { render, Box, Text, useInput, useApp } from "ink";
import Spinner from "ink-spinner";
import TextInput from "ink-text-input";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import { loadConfig } from "./config.js";
import { builtinTools } from "./tools/index.js";
import { loadAllSkills, buildSystemPrompt, collectTools } from "./skills/loader.js";
import { loadRules, formatRulesForPrompt } from "./rules.js";
import { getOrCreateSession, appendToSession, getSessionMessages } from "./sessions.js";
import { runAgent } from "./agent.js";
import { logCli, logError } from "./logger.js";
import { loadSystemPrompt } from "./prompts.js";

type ChatMessage = {
  role: "user" | "assistant" | "system";
  content: string;
};

type ChatProps = {
  initialHistory: ChatMessage[];
  sessionId: string;
};

const Chat: React.FC<ChatProps> = ({ initialHistory, sessionId }) => {
  const { exit } = useApp();
  const [messages, setMessages] = useState<ChatMessage[]>(initialHistory);
  const [input, setInput] = useState("");
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useInput((inputKey, key) => {
    if (key.escape) {
      exit();
    }
    if (key.ctrl && inputKey === "c") {
      exit();
    }
  });

  const handleSubmit = async (value: string) => {
    const trimmed = value.trim();
    if (!trimmed || isBusy) return;

    setError(null);
    setIsBusy(true);
    setMessages((prev) => [...prev, { role: "user", content: trimmed }]);
    setInput("");

    try {
      const { config, tools, systemPrompt, conversationHistory, sessionId } = await getRuntime();
      const history: ChatMessage[] = [...conversationHistory, ...messages, { role: "user", content: trimmed }];

      logCli("User message (tui)", { message: trimmed });
      const { content } = await runAgent(
        { config, tools, systemPrompt },
        trimmed,
        history.map((m) => ({ role: m.role, content: m.content }))
      );

      await appendToSession(sessionId, [
        { role: "user", content: trimmed },
        { role: "assistant", content },
      ]);

      setMessages((prev) => [...prev, { role: "assistant", content }]);
      logCli("Agent response (tui)", { length: content.length, sessionId });
    } catch (e) {
      setError((e as Error).message ?? String(e));
      logError("tui", e);
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <Box flexDirection="column">
      <Box borderStyle="round" borderColor="cyan" flexDirection="column" padding={1} height={20}>
        <Text color="cyanBright">PPAgent – TUI chat</Text>
        <Text dimColor>
          Esc eller Ctrl+C för att avsluta. | Session: {sessionId} | Meddelanden i sessionen:{" "}
          {messages.length}
        </Text>
        <Box flexDirection="column" marginTop={1}>
          {messages.map((m, idx) => (
            <Text key={idx}>
              <Text color={m.role === "user" ? "green" : m.role === "assistant" ? "yellow" : "magenta"}>
                {m.role === "user" ? "Du" : m.role === "assistant" ? "Agent" : "System"}
                {": "}
              </Text>
              {m.content}
            </Text>
          ))}
          {isBusy && (
            <Box marginTop={1}>
              <Text color="gray">
                <Spinner type="dots" /> Agenten tänker…
              </Text>
            </Box>
          )}
        </Box>
      </Box>

      {error && (
        <Box marginTop={1}>
          <Text color="red">Fel: {error}</Text>
        </Box>
      )}

      <Box marginTop={1}>
        <Text color="cyanBright">› </Text>
        <TextInput
          value={input}
          onChange={setInput}
          onSubmit={handleSubmit}
          placeholder="Skriv ett meddelande…"
        />
      </Box>
    </Box>
  );
};

let runtimePromise:
  | Promise<{
      config: ReturnType<typeof loadConfig>;
      tools: ReturnType<typeof collectTools>;
      systemPrompt: string;
      conversationHistory: ChatMessage[];
      sessionId: string;
    }>
  | null = null;

async function getRuntime() {
  if (!runtimePromise) {
    runtimePromise = (async () => {
      let config;
      try {
        config = loadConfig();
      } catch (e) {
        logError("config", e);
        const msg = (e as Error).message ?? String(e);
        if (
          msg.includes("Missing OPENAI_API_KEY") ||
          msg.includes("Missing ANTHROPIC_API_KEY")
        ) {
          throw new Error(
            "Saknar API-nyckel. Kör 'ppagent config' för att konfigurera modell och OPENAI_API_KEY."
          );
        }
        throw new Error(
          msg +
            "\nSkapa en .env med OPENAI_API_KEY=... (eller sätt OPENAI_BASE_URL för kompatibel API)."
        );
      }

      const rulesContent = await loadRules();
      const rulesBlock = formatRulesForPrompt(rulesContent);
      if (rulesContent) logCli("Rules loaded (tui)", { length: rulesContent.length });

      const skills = await loadAllSkills();
      logCli("Skills loaded (tui)", { count: skills.length, names: skills.map((s) => s.meta.name) });
      const baseSystemPrompt = await loadSystemPrompt();

      let longtermText = "";
      try {
        const longtermPath = path.join(process.cwd(), ".agents", "longterm.md");
        longtermText = await fs.readFile(longtermPath, "utf-8");
      } catch {
        // ignore
      }

      const baseWithRules =
        baseSystemPrompt +
        rulesBlock +
        (longtermText.trim().length > 0
          ? `\n\n---\n\n# Longterm memory (inläst fil)\n\n${longtermText}`
          : "");

      const systemPrompt = buildSystemPrompt(skills, baseWithRules);
      const tools = collectTools(skills, builtinTools);

      const session = await getOrCreateSession("terminal-tui");
      const stored = await getSessionMessages(session.id, 100);
      const conversationHistory: ChatMessage[] = stored.map((m) => ({
        role: m.role as ChatMessage["role"],
        content: m.content,
      }));

      logCli("Interactive TUI session started", {
        sessionId: session.id,
        historyMessages: conversationHistory.length,
      });

      return { config, tools, systemPrompt, conversationHistory, sessionId: session.id };
    })();
  }
  return runtimePromise;
}

async function main() {
  try {
    const { conversationHistory, sessionId } = await getRuntime();
    render(<Chat initialHistory={conversationHistory} sessionId={sessionId} />);
  } catch (e) {
    logError("tui main", e);
    if (e instanceof Error) {
      console.error(e.message);
    } else {
      console.error(e);
    }
    process.exit(1);
  }
}

main();

