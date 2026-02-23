# PPAgent

AI-assistent som körs i terminalen med interaktiv chat eller enskilda frågor.

## Krav

- Node.js 20+
- npm (eller pnpm/yarn)

## Snabbstart

```bash
npm install
```

Skapa `.env` i projektroten:

```env
OPENAI_API_KEY=sk-...
# Valfritt: OPENAI_BASE_URL=https://...  OPENAI_MODEL=gpt-4o-mini
```

Starta agenten:

```bash
npm run agent
# eller, efter npm link:  ppagent start
```

Skriv meddelanden i terminalen och avsluta med `exit` eller `quit`. En enskild fråga: `npm run agent "list filer i src"` eller `ppagent start "list filer i src"`.

## Skript

| Kommando | Beskrivning |
|----------|--------------|
| `npm run dev` | Kör med hot-reload (tsx) |
| `npm run build` | Kompilera TypeScript → `dist/` |
| `npm start` | Kör `dist/index.js` (startar samma interaktiva chat) |
| `npm run agent` | Starta agenten (interaktiv chat eller ett argument = en fråga) |
| `ppagent start` | Som ovan (kräver `npm link` i projektmappen) |
| `ppagent start "fråga"` | En fråga till agenten |
| `npm run agent:skills` | Lista installerade skills |
| `npm run agent:install -- <mapp>` | Installera en skill från mapp till `skills/` |
| `npm run typecheck` | Typkontroll utan build |
| `npm run lint` | ESLint mot `src/` |

## Agenten

Agenten använder en LLM (OpenAI eller kompatibel API) och har **tools**: `read_file`, `write_file`, `list_dir`, `run_command`. Den laddar **regler** och **skills** vid start och injicerar dem i system-prompten.

- **Regler** – styr hur agenten svarar (t.ex. ton, förbud). Läs mer under [Regler](#regler).
- **Skills** – utökar med extra system-prompt och (vid behov) egna tools. Läs mer under [Skills](#skills).

## Regler

Regler läses från **`.agents/rules/`** (fallback: **`rules/`**). Alla `.md`-filer används; innehållet läggs in i system-prompten under "Regler du måste följa".

- Lägg t.ex. `rules.md` i `.agents/rules/` med dina riktlinjer.
- Uppdatera filerna när som helst; de laddas vid varje agent-start.

## Skills

Skills laddas från två platser (i ordning, första vinner vid samma namn):

1. **`skills/`** – projektets egna eller manuellt installerade skills
2. **`.agents/skills/`** – t.ex. skills installerade via skills-lock / externa agent-paket

Varje skill är en mapp med antingen:

- **skill.json** – `name`, `description`, valfritt `systemPrompt`
- **SKILL.md** (Cursor-format) – frontmatter med `name`/`description`, brödtexten används som system-prompt

Valfritt: **index.js** i skill-mappen som exporterar `tools` och/eller `systemPrompt`.

- **Lista**: `npm run agent:skills`
- **Installera** (kopiera till `skills/`): `npm run agent:install -- <sökväg-till-skill-mapp>`

## Logg

Aktivitet loggas till **`logs/ppagent.log`** (skapas automatiskt). Kategorier: `cli`, `agent`, `tool`, `skills`, `command`, `error`. Mappen `logs/` är i `.gitignore`.

## Projektstruktur

```
PPAgent/
├── .agents/
│   ├── rules/       # Regler (rules.md m.fl.) – används i system-prompt
│   └── skills/      # Skills (t.ex. agent-slack) – laddas automatiskt
├── bin/
│   └── ppagent.js   # CLI-binär (ppagent start)
├── logs/            # ppagent.log (skapas vid körning)
├── src/
│   ├── index.ts     # Entry point → startar CLI/chat
│   ├── cli.ts       # Interaktiv chat, laddar regler + skills
│   ├── agent.ts     # LLM-loop + tool-anrop
│   ├── config.ts    # Env (OPENAI_API_KEY m.m.)
│   ├── rules.ts     # Laddning av regler från .agents/rules / rules/
│   ├── tools/       # read_file, write_file, list_dir, run_command
│   ├── skills/      # Skill-loader (skills/ + .agents/skills/)
│   └── commands/    # agent:install, agent:skills
├── skills/          # Installerade skills (agent:install kopierar hit)
├── scripts/
├── package.json
├── tsconfig.json
└── README.md
```

## Miljövariabler

| Variabel | Beskrivning |
|----------|--------------|
| `OPENAI_API_KEY` | API-nyckel (obligatorisk, eller `ANTHROPIC_API_KEY`) |
| `OPENAI_BASE_URL` | Valfri bas-URL för kompatibel API |
| `OPENAI_MODEL` | Modell (standard: `gpt-4o-mini`) |

## Licens

MIT
