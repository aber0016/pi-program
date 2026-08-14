# pi-program

Personal Pi package for the `/program` automatic development workflow: a mode-aware (quick/elaborate) gauntlet pipeline prompt, the `context-builder` agent, and the user guides.

Private repo — this is personal workflow configuration, not a published package.

## Contents

| Path | Installed as | Purpose |
|---|---|---|
| `prompts/program.md` | `/program` prompt (via the `pi.prompts` field) | The full workflow: modes, preflight, planning artifacts, staleness rules, gates. |
| `agents/context-builder.md` | `~/.pi/agent/agents/context-builder.md` (symlinked by postinstall) | Fetches external references as untrusted data with per-reference provenance. |
| `docs/program.md` | not installed | Full reference documentation for the workflow. |
| `docs/program-guide-ste.md` | not installed | User guide in ASD-STE100 Simplified Technical English. |

## Install on a new machine

Prerequisites: Pi installed, GitHub SSH auth configured (the repo is private), and the companion packages:

- `npm:pi-gauntlet` — gauntlet skill chain and reviewer/implementer agents
- `npm:pi-subagents` — subagent runtime and the `scout` agent
- Per target repository, elaborate mode only: the Python `gauntlet` CLI from `code_review_gate` (pin a commit SHA)

Then:

```text
pi install git:github.com/aber0016/pi-program@<commit-sha>
/reload
```

Pin a commit SHA, not a branch or tag, so every machine runs a known version.

## Update flow

1. Edit files here (this repo is the source of truth, not `~/.pi/agent/`).
2. Commit and push.
3. On each machine: reinstall with the new SHA, then `/reload`.

The postinstall script symlinks `agents/*.md` into `~/.pi/agent/agents/`. It never overwrites a plain file — if one exists from a pre-package setup, delete it and run `npm run link-agents` from the package directory.

## Usage

See `docs/program-guide-ste.md` for the simple guide, `docs/program.md` for the full reference. Short version:

```text
/program quick: <your request>     # MVP / demo, one approval, ungated
/program elaborate: <your request> # production, full gates
```
