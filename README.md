# PPAgent

AI-agent för fullstack-utveckling: TypeScript, Node.js, DevOps m.m.

## Krav

- Node.js 20+
- npm (eller pnpm/yarn)

## Snabbstart

```bash
npm install
npm run dev
```

## Skript

| Kommando     | Beskrivning              |
|-------------|---------------------------|
| `npm run dev` | Kör med hot-reload (tsx) |
| `npm run build` | Kompilera TypeScript → `dist/` |
| `npm start` | Kör `dist/index.js`        |
| `ppagent start` | Starta agenten (interaktiv chat) |
| `ppagent start "fråga"` | En fråga till agenten |
| `npm run agent:skills` | Lista installerade skills |
| `npm run agent:install -- <mapp>` | Installera en skill från mapp |
| `npm run typecheck` | Typkontroll utan build |
| `npm run lint` | ESLint mot `src/`         |

## Agenten

Agenten pratar med en LLM (OpenAI eller kompatibel API) och har tillgång till **tools**: `read_file`, `write_file`, `list_dir`, `run_command`. Sätt `OPENAI_API_KEY` i `.env` (se `.env.example`).

- **Kort kommando**: Kör `npm link` i projektmappen – då kan du starta agenten med `ppagent start` var som helst.
- **Interaktiv**: `ppagent start` → skriv meddelanden direkt, avsluta med `exit`.
- **En fråga**: `ppagent start "list filer i src"`.

## Skills

Skills utökar agenten med extra system-prompt och (om de har `index.js`) egna tools. De ligger i **`skills/`**.

- **Lista**: `npm run agent:skills`
- **Installera**: `npm run agent:install -- <sökväg-till-skill-mapp>`

Varje skill är en mapp med antingen:

- **skill.json** – `name`, `description`, valfritt `systemPrompt`
- **SKILL.md** (Cursor-format) – frontmatter med `name`/`description`, brödtexten används som system-prompt

Exempelskillen `skills/fullstack-helper` är inkluderad. Du kan kopiera en Cursor-skill (t.ex. från ett annat projekt) och installera med `agent:install`.

## Logg

All aktivitet loggas till **`logs/ppagent.log`** (skapas automatiskt). Varje rad: tidsstämpel, kategori (`cli`, `agent`, `tool`, `skills`, `command`, `error`) och meddelande. Mappen `logs/` är i `.gitignore`.

## Projektstruktur

```
PPAgent/
├── logs/          # ppagent.log (skapas vid körning)
├── src/           # Källkod och agent-logik
│   ├── index.ts   # Entry point
│   ├── cli.ts     # Agent-CLI
│   ├── agent.ts   # LLM + tools-loop
│   ├── config.ts  # Env-config
│   ├── tools/     # read_file, write_file, list_dir, run_command
│   ├── skills/    # Skill-loader
│   └── commands/  # agent:install, agent:skills
├── skills/        # Installerade skills (fullstack-helper m.fl.)
├── scripts/
├── .cursor/rules/
├── package.json
├── tsconfig.json
└── README.md
```

## Cursor-regler

I `.cursor/rules/` finns regler som styr hur AI:n beter sig i projektet:

- **fullstack-agent.mdc** – Allmän fullstack-kontext (alltid aktiv).
- **typescript-node.mdc** – TypeScript- och Node-mönster för `*.ts`.
- **devops.mdc** – DevOps/CI/Docker för YAML och Dockerfile.

## Nästa steg

- [ ] Lägg till tester (t.ex. Vitest eller Node test runner).
- [ ] Fler inbyggda tools (t.ex. grep, sök i kodbas).
- [ ] Skills med `index.js` som exporterar egna tools.

## Licens

MIT
