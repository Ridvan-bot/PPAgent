#!/usr/bin/env node
import "dotenv/config";
import { getOrCreateSession } from "../sessions.js";
import { logCli, logError } from "../logger.js";

async function main(): Promise<void> {
  // Expected usage: ppagent new session [label]
  const [, , , maybeSession, maybeLabel] = process.argv;
  const label = (maybeSession === "session" ? maybeLabel : maybeSession) || "message";

  try {
    const session = await getOrCreateSession("terminal-tui", { label });
    logCli("new-session created", { id: session.id, label: session.meta?.label });
    console.log("Skapade en ny TUI-session:");
    console.log(`  id: ${session.id}`);
    if (session.meta?.label) {
      console.log(`  label: ${session.meta.label}`);
    }
    console.log("");
    console.log("Kör sedan:");
    console.log("  ppagent tui");
  } catch (e) {
    logError("new-session", e);
    console.error("Kunde inte skapa ny session:", e);
    process.exit(1);
  }
}

main().catch((err) => {
  logError("new-session main", err);
  console.error(err);
  process.exit(1);
});

