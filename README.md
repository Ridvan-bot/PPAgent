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

---

## Changes

### 1.3.0 (2026-03-17)

### 1.2.0 (2026-03-16)

### 1.1.0 (2026-03-16)

### 1.0.2 (2026-02-24)

### Bug Fixes

* correct formatting in README for Miljövariabler section ([ae9a84f](https://github.com/Ridvan-bot/PPAgent/commit/ae9a84f9db594cd44c99c36a2dc97462055f7fe6))

### 1.0.1 (2026-02-24)

### Bug Fixes

* correct comment in release workflow to ensure proper branch check for semantic release ([1a6ed9c](https://github.com/Ridvan-bot/PPAgent/commit/1a6ed9ca1dfa515f2f723a9c8a6318c8cac16622))

### 1.0.0 (2026-02-23)

* fix: add contents write permission for semantic-release push ([a7f65a6](https://github.com/Ridvan-bot/PPAgent/commit/a7f65a6))
* fix: add conventional-changelog-conventionalcommits for semantic-release ([4a0b3b6](https://github.com/Ridvan-bot/PPAgent/commit/4a0b3b6))
* fix: do not pass releaserc_path to avoid cp same-file error ([f63cb3b](https://github.com/Ridvan-bot/PPAgent/commit/f63cb3b))
* fix: run semantic-release locally with fetch-depth 0 to fix Invalid time value ([648330b](https://github.com/Ridvan-bot/PPAgent/commit/648330b))
* fix: use .releaserc.cjs with safe committerDate to fix Invalid time value ([417f744](https://github.com/Ridvan-bot/PPAgent/commit/417f744))
* ci: add semantic-release via Ridvan-bot/workflows ([7e7a159](https://github.com/Ridvan-bot/PPAgent/commit/7e7a159))
* ci: use Trigger Semantic Release pattern, call Ridvan-bot/workflows ([c44d835](https://github.com/Ridvan-bot/PPAgent/commit/c44d835))
* Agent rules under .agents/rules, load skills from .agents/skills, ignore *-lock.json ([b9aac3d](https://github.com/Ridvan-bot/PPAgent/commit/b9aac3d))
* Describe agent as assistant, not fullstack; update README ([082c7e8](https://github.com/Ridvan-bot/PPAgent/commit/082c7e8))
* Initial commit: PPAgent - fullstack AI agent ([a48d825](https://github.com/Ridvan-bot/PPAgent/commit/a48d825))
* Refactor agent CLI to ppagent; update README with new commands. Removed old agent.js and added ppage ([b1c402c](https://github.com/Ridvan-bot/PPAgent/commit/b1c402c))
* Skills under .agents/skills: find-skills, web-design-guidelines, frontend-design, ui-ux-pro-max, nod ([c944e60](https://github.com/Ridvan-bot/PPAgent/commit/c944e60))
* Sessions: save conversations under .agents/sessions/, load history on start ([ed772a7](https://github.com/Ridvan-bot/PPAgent/commit/ed772a7))

# Changelog

All notable changes to this project will be documented in this file. The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## Unreleased


##
<p align="center">
  Crafted with care by <strong>Robin Pohlman</strong> at <strong>Pohlman Protean AB</strong>.
</p>