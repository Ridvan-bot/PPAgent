# PPAgent

AI assistant that runs in the terminal with interactive chat or one-off questions.

## Requirements

- Node.js 20+
- npm (or pnpm/yarn)

## Quick start

```bash
npm install
```

Create `.env` in the project root:

```env
OPENAI_API_KEY=sk-...
# Optional: OPENAI_BASE_URL=https://...  OPENAI_MODEL=gpt-4o-mini
```

Start the agent:

```bash
npm run agent
# or, after npm link:  ppagent start
```

Type messages in the terminal and exit with `exit` or `quit`. For a single question: `npm run agent "list files in src"` or `ppagent start "list files in src"`.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Run with hot-reload (tsx) |
| `npm run build` | Compile TypeScript → `dist/` |
| `npm start` | Run `dist/index.js` (starts the same interactive chat) |
| `npm run agent` | Start the agent (interactive chat or one argument = one question) |
| `ppagent start` | Same as above (requires `npm link` in project folder) |
| `ppagent start "question"` | One question to the agent |
| `npm run agent:skills` | List installed skills |
| `npm run agent:install -- <path>` | Install a skill from folder into `skills/` |
| `npm run typecheck` | Type-check without building |
| `npm run lint` | ESLint on `src/` |

## The agent

The agent uses an LLM (OpenAI or compatible API) and has **tools**: `read_file`, `write_file`, `list_dir`, `run_command`. It loads **rules** and **skills** at startup and injects them into the system prompt.

- **Rules** – control how the agent responds (e.g. tone, restrictions). See [Rules](#rules).
- **Skills** – extend with extra system prompt and (optionally) custom tools. See [Skills](#skills).

## Rules

Rules are loaded from **`.agents/rules/`** (fallback: **`rules/`**). All `.md` files are used; their content is added to the system prompt under "Rules you must follow".

- Add e.g. `rules.md` in `.agents/rules/` with your guidelines.
- Update the files anytime; they are loaded on every agent start.

## Skills

Skills are loaded from two locations (in order; first wins for the same name):

1. **`skills/`** – project-owned or manually installed skills
2. **`.agents/skills/`** – recommended: put all agent skills (e.g. from [skills.sh](https://skills.sh)) here

Each skill is a folder with either:

- **skill.json** – `name`, `description`, optional `systemPrompt`
- **SKILL.md** (Cursor format) – frontmatter with `name`/`description`; body used as system prompt

Optional: **index.js** in the skill folder exporting `tools` and/or `systemPrompt`.

- **List**: `npm run agent:skills`
- **Install** (into `skills/`): `npm run agent:install -- <path-to-skill-folder>`. To use `.agents/skills/`, copy the folder there manually.

## Sessions (conversations)

Conversations are stored under **`.agents/sessions/`**, one session per context:

- **Terminal** – a single session (`terminal`) is used for the terminal. All conversation is saved there so history persists across restarts.
- **Slack** (planned) – when connected to Slack, each channel/group will be its own session.

Each session is a folder (e.g. `terminal/` for the terminal) containing:

- **session.json** – id, type, createdAt, updatedAt, optional meta (e.g. channelId for Slack)
- **messages.json** – list of `{ role, content, at }` for each user and assistant message

The `.agents/sessions/` folder is in `.gitignore` so conversations are not committed.

## Logging

Activity is logged to **`logs/ppagent.log`** (created automatically). Categories: `cli`, `agent`, `tool`, `skills`, `command`, `error`. The `logs/` folder is in `.gitignore`.

## Project structure

```
PPAgent/
├── .agents/
│   ├── rules/       # Rules (rules.md etc.) – used in system prompt
│   ├── skills/      # Skills (e.g. agent-slack) – loaded automatically
│   └── sessions/    # Conversations per session (terminal, Slack, etc.)
├── bin/
│   └── ppagent.js   # CLI binary (ppagent start)
├── logs/            # ppagent.log (created at runtime)
├── src/
│   ├── index.ts     # Entry point → starts CLI/chat
│   ├── cli.ts       # Interactive chat, loads rules + skills
│   ├── agent.ts     # LLM loop + tool calls
│   ├── config.ts    # Env (OPENAI_API_KEY etc.)
│   ├── rules.ts     # Load rules from .agents/rules / rules/
│   ├── sessions.ts  # Sessions: save conversations under .agents/sessions/
│   ├── tools/       # read_file, write_file, list_dir, run_command
│   ├── skills/      # Skill loader (skills/ + .agents/skills/)
│   └── commands/    # agent:install, agent:skills
├── skills/          # Installed skills (agent:install copies here)
├── scripts/
├── package.json
├── tsconfig.json
└── README.md
```

## Environment variables

| Variable | Description |
|----------|-------------|
| `OPENAI_API_KEY` | API key (required, or `ANTHROPIC_API_KEY`) |
| `OPENAI_BASE_URL` | Optional base URL for compatible API |
| `OPENAI_MODEL` | Model (default: `gpt-4o-mini`) |

## Releases (Semantic Release)

Version, CHANGELOG, and GitHub releases are updated automatically on push to `main` via [Ridvan-bot/workflows](https://github.com/Ridvan-bot/workflows) (semantic-release). Use [Conventional Commits](https://www.conventionalcommits.org/) on main:

- `feat:` → new minor version (e.g. 0.1.0 → 0.2.0)
- `fix:` / `perf:` → new patch version (e.g. 0.1.0 → 0.1.1)
- `chore:`, `docs:`, `ci:` → no release (but commits are kept)

Workflow: `.github/workflows/deploy.yml` calls `.github/workflows/release.yml` (which uses Ridvan-bot/workflows semantic-release). Config: `.releaserc.json`.

### Slack notifications

When a release is created, the workflow can send a notification to Slack. You need:

1. **Slack Incoming Webhook** – create a webhook in Slack (e.g. for a channel like #releases) and copy the webhook URL.
2. **Repository secret** – add the secret `SLACK_WEBHOOK` in the repo (Settings → Secrets and variables → Actions) with the webhook URL as the value.

In this repo Slack is enabled in the deploy workflow (`slack_enabled: true`). If `SLACK_WEBHOOK` is set, messages are sent on successful release; if the secret is missing, the release runs as usual but without a Slack notification.

## License

MIT
