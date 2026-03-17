#!/usr/bin/env node
/**
 * ppagent config
 *
 * Enkel konfigurationsdialog för LLM-modell och valfria skills.
 * Just nu stöds bara OpenAI-kompatibla modeller via OPENAI_API_KEY + OPENAI_MODEL i .env.
 */

import "dotenv/config";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import inquirer from "inquirer";

async function ensureEnvFile(): Promise<string> {
  const envPath = path.join(process.cwd(), ".env");
  try {
    await fs.access(envPath);
  } catch {
    await fs.writeFile(envPath, "", "utf-8");
  }
  return envPath;
}

async function readEnv(envPath: string): Promise<string[]> {
  try {
    const content = await fs.readFile(envPath, "utf-8");
    return content.split(/\r?\n/);
  } catch {
    return [];
  }
}

function updateEnvLines(lines: string[], key: string, value: string): string[] {
  const newLine = `${key}=${value}`;
  let found = false;
  const updated = lines.map((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return line;
    const [k] = trimmed.split("=", 1);
    if (k === key) {
      found = true;
      return newLine;
    }
    return line;
  });
  if (!found) {
    updated.push(newLine);
  }
  // Trim tomma rader i slutet
  while (updated.length > 0 && updated[updated.length - 1].trim() === "") {
    updated.pop();
  }
  return updated;
}

async function copyDir(srcDir: string, destDir: string): Promise<void> {
  await fs.mkdir(destDir, { recursive: true });
  const entries = await fs.readdir(srcDir, { withFileTypes: true });
  for (const e of entries) {
    const srcPath = path.join(srcDir, e.name);
    const destPath = path.join(destDir, e.name);
    if (e.isDirectory()) {
      await copyDir(srcPath, destPath);
    } else {
      await fs.copyFile(srcPath, destPath);
    }
  }
}

async function main(): Promise<void> {
  const envPath = await ensureEnvFile();
  const lines = await readEnv(envPath);

  const currentModel =
    process.env.OPENAI_MODEL ||
    (lines
      .map((line) => line.trim())
      .find((line) => line.startsWith("OPENAI_MODEL="))
      ?.split("=", 2)[1] ?? "");

  const currentApiKey =
    process.env.OPENAI_API_KEY ||
    (lines
      .map((line) => line.trim())
      .find((line) => line.startsWith("OPENAI_API_KEY="))
      ?.split("=", 2)[1] ?? "");

  const presetModels = [
    "gpt-4o-mini",
    "gpt-4o",
    "gpt-4.1",
    "gpt-4.1-mini",
    "o3-mini",
  ];

  console.log("PPAgent – konfiguration");
  console.log("");
  console.log(
    `  LLM: ${currentModel || "(ingen modell)"} | API-nyckel: ${
      currentApiKey ? "satt" : "saknas"
    }`
  );

  const { configureLLM } = await inquirer.prompt<{ configureLLM: boolean }>([
    {
      type: "confirm",
      name: "configureLLM",
      message: "Vill du konfigurera LLM (modell + OpenAI API-nyckel) nu?",
      default: true,
    },
  ]);

  if (!configureLLM) {
    console.log("LLM-konfigurationen lämnades oförändrad.");
  } else {
    console.log("Endast OpenAI-kompatibla modeller stöds just nu.");
    console.log("Välj en modell genom att markera med [space] och bekräfta med [enter].");
    console.log("");
    console.log(`Nuvarande OPENAI_MODEL: ${currentModel || "(inte satt)"}`);
    console.log(`OPENAI_API_KEY: ${currentApiKey ? "(redan satt)" : "(inte satt)"}`);
    console.log("");

    const choices = [
      ...presetModels.map((m) => ({
        name: m,
        value: m,
        short: m,
      })),
      { name: "Ange egen modellsträng…", value: "__custom__", short: "custom" },
    ];

    const { model } = await inquirer.prompt<{
      model: string;
    }>([
      {
        type: "list",
        name: "model",
        message: "Välj modell (piltangenter = välj, enter = bekräfta):",
        choices,
        default:
          currentModel && presetModels.includes(currentModel)
            ? presetModels.indexOf(currentModel)
            : 0,
      },
    ]);

    const picked = model;

    let selectedModel = "";

    if (picked === "__custom__") {
      const { custom } = await inquirer.prompt<{ custom: string }>([
        {
          type: "input",
          name: "custom",
          message: "Ange modellnamn exakt som din provider förväntar sig:",
          validate: (value: string) =>
            value.trim() === "" ? "Modellnamn får inte vara tomt." : true,
        },
      ]);
      selectedModel = custom.trim();
    } else {
      selectedModel = picked;
    }

    if (!selectedModel) {
      console.log("Ingen modell vald. Avbryter utan ändring av LLM.");
    } else {
      const { apiKeyInput } = await inquirer.prompt<{ apiKeyInput: string }>([
        {
          type: "password",
          name: "apiKeyInput",
          message: currentApiKey
            ? "Ny OpenAI API-nyckel (lämna tomt för att behålla befintlig):"
            : "Ange din OpenAI API-nyckel (OPENAI_API_KEY):",
          mask: "*",
          validate: (value: string) => {
            if (!currentApiKey && value.trim() === "") {
              return "API-nyckeln får inte vara tom när ingen nyckel finns sedan tidigare.";
            }
            return true;
          },
        },
      ]);

      const finalApiKey = apiKeyInput.trim() !== "" ? apiKeyInput.trim() : currentApiKey;

      let newLines = updateEnvLines(lines, "OPENAI_MODEL", selectedModel);
      if (finalApiKey) {
        newLines = updateEnvLines(newLines, "OPENAI_API_KEY", finalApiKey);
      }

      await fs.writeFile(envPath, newLines.join("\n") + "\n", "utf-8");

      console.log("");
      console.log(`Uppdaterade ${path.relative(process.cwd(), envPath)} med:`);
      console.log(`OPENAI_MODEL=${selectedModel}`);
      if (finalApiKey) {
        console.log("OPENAI_API_KEY=(satt)");
      }
    }
  }

  // Rensa skärmen inför nästa steg så att LLM-steget inte "ligger kvar" i vyn.
  console.clear();
  console.log("PPAgent – konfiguration");
  console.log("");
  console.log(
    `  LLM: ${process.env.OPENAI_MODEL || currentModel || "(ingen modell)"} | API-nyckel: ${
      process.env.OPENAI_API_KEY || currentApiKey ? "satt" : "saknas"
    }`
  );
  console.log("");

  const projectSkillsDir = path.join(process.cwd(), "skills");
  const summeraSkillPath = path.join(projectSkillsDir, "summera-support-api");
  const summeraInstalled =
    (await fs
      .stat(summeraSkillPath)
      .then((s) => s.isDirectory())
      .catch(() => false)) ?? false;

  const { configureSkills } = await inquirer.prompt<{ configureSkills: boolean }>([
    {
      type: "confirm",
      name: "configureSkills",
      message: "Vill du lägga till/hantera skills nu?",
      default: false,
    },
  ]);

  if (!configureSkills) {
    return;
  }

  const { selectedSkill } = await inquirer.prompt<{ selectedSkill: string }>([
    {
      type: "list",
      name: "selectedSkill",
      message: "Välj ett skill att installera (piltangenter = välj, enter = bekräfta):",
      choices: [
        {
          name: "Ingen – avsluta",
          value: "__none__",
        },
        {
          name: `Summera Support API${summeraInstalled ? " (installerad)" : ""}`,
          value: "summera-support-api",
        },
      ],
    },
  ]);

  if (selectedSkill === "__none__") {
    return;
  }

  if (selectedSkill === "summera-support-api") {
    const projectSkillPath = path.join(projectSkillsDir, "summera-support-api");
    const candidates = [
      projectSkillPath,
      path.join(process.cwd(), ".agents", "skills", "summera-support-api"),
      path.join(process.env.HOME || "", ".cursor", "skills", "summera-support-api"),
    ];

    let sourceDir: string | null = null;
    for (const candidate of candidates) {
      try {
        const stat = await fs.stat(candidate);
        if (stat.isDirectory()) {
          sourceDir = candidate;
          break;
        }
      } catch {
        // ignore
      }
    }

    if (!sourceDir) {
      console.log(
        "Kunde inte hitta källan för skillen 'Summera Support API'. Installera den först (t.ex. via skills.sh) och kör sedan ppagent config igen."
      );
    } else if (sourceDir === projectSkillPath) {
      console.log("Skillen 'Summera Support API' är redan installerad i projektet.");
    } else {
      await copyDir(sourceDir, projectSkillPath);
      console.log(
        `Installerade skillen 'Summera Support API' till ${path.relative(
          process.cwd(),
          projectSkillPath
        )}`
      );
    }
  }
}

main().catch((err) => {
  console.error("Kunde inte uppdatera konfigurationen:", err);
  process.exit(1);
});

