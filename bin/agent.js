#!/usr/bin/env node
/**
 * Start the agent. Run: agent (or npx agent from project)
 */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const cliPath = path.join(projectRoot, "src", "cli.ts");

const result = spawnSync(
  process.execPath,
  ["--import", "tsx", cliPath, ...process.argv.slice(2)],
  { stdio: "inherit", cwd: projectRoot, env: process.env }
);

process.exit(result.status ?? (result.signal ? 1 : 0));
