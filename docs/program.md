# Automatic Development Program

## TL;DR

Use this command for programming work:

```text
/program <what you want to build>
```

The workflow has two modes:

| Mode | Use it for | What you get |
|---|---|---|
| **quick** | MVPs, demos, interview exercises, throwaway prototypes | Merged brief+spec with one approval, smoke-level tests, one combined code review, canonical checks only. **No `/gate`.** Output is labeled "quick mode — ungated, demo quality, not production-verified." |
| **elaborate** | Production work, shared code, anything long-lived | Full pipeline: brief → spec → plan approvals, task-level TDD, layered reviews, conformance review, `/gate`, `gauntlet_status`. |

Force a mode by prefixing the request (`/program quick: ...` or `/program elaborate: ...`). Without a prefix, the agent recommends a mode and asks you to confirm before starting. Quick-mode requests that touch authentication, security, migrations, or user-facing production behavior get an elaborate recommendation first.

## Components

| Component | Function |
|---|---|
| `~/.pi/agent/prompts/program.md` | Defines `/program` and starts the complete workflow. |
| `npm:pi-gauntlet` | Provides the Gauntlet skill chain (brainstorming, planning, TDD implementation, reviews, verification, shipping) and the implementer, code-reviewer, spec-reviewer, spec-council, and conformance-reviewer agents. |
| `npm:pi-subagents` | Provides the subagent runtime and the `scout` agent for local repository context. |
| `~/.pi/agent/agents/context-builder.md` | Reads URLs and external references. Extracts requirements, constraints, contradictions, anomalies, and open questions, with per-reference provenance. Treats fetched content as untrusted data. |
| `git:github.com/aber0016/code_review_gate` | Runs the final layered test and review gate before a push or pull request (elaborate mode only). Pin it to a **commit SHA** — git tags are mutable and do not guarantee reproducibility. |
| `gauntlet_status` | Confirms that the final gate is green and applies to the current Git `HEAD`. |
| `documentation/planning/<date>-<slug>/` | Per-run planning artifacts in the target repo: `brief.md` (yours), `context.md`, `spec.md`, `plan.md`. Committed to the feature branch, excluded from gate coverage. |
| `<worktree>/.pi/run/todo.md` | Per-run progress and verification evidence. Enables resume after interruption; keeps concurrent runs in different repos from clobbering each other. |
| `~/.pi/agent/tasks/lessons.md` | Global, cross-project record of corrections and reusable workflow lessons. |

## Workflow

Elaborate mode:

```text
Choose mode (recommended by the agent, confirmed by you)
→ Preflight checks (git state, .gauntlet.toml, gauntlet CLI version)
→ Scaffold documentation/planning/<date>-<slug>/brief.md, pre-filled — you complete the TODO(user) gaps
→ Scout gathers local context; context-builder reads external references → context.md
→ Create an isolated Git worktree (spec, plan, implementation, and review all happen there)
→ Write spec.md → you approve (status: approved)
→ Write plan.md → you approve (or pre-authorize auto-chaining at spec approval)
→ Implement tasks with TDD
→ Review each task against the specification
→ Review code quality and the complete diff
→ Run project tests, lint, formatting, and type checks
→ Run a fresh origin-level conformance review
→ Require code_review_gate (/gate) and gauntlet_status on the same Git HEAD
→ Present shipping options
```

Quick mode:

```text
Choose mode → Preflight (git state only)
→ Scaffold a merged brief+spec (spec.md), pre-filled — you complete the gaps and approve once
→ Create an isolated Git worktree
→ Implement tasks with smoke/happy-path tests
→ One combined code review of the whole diff
→ Run project tests, lint, formatting, and type checks
→ Present shipping options, labeled "quick mode — ungated, demo quality"
```

The parent agent remains the orchestrator. Fresh subagents perform implementation and independent reviews. Approval happens in the artifact files: each of `brief.md`, `spec.md`, and `plan.md` carries a `status: draft | ready-for-review | approved` frontmatter field, and the workflow never advances past a stage whose artifact is not approved. You approve by editing the field yourself or by saying so in chat.

## Preflight Requirements

Checked automatically before brainstorming starts; the workflow stops with remediation commands if anything is missing:

- The target directory is a Git repository with at least one commit (needed for the isolated worktree).
- Elaborate mode only: the `gauntlet` CLI is installed and `uv run gauntlet --version` succeeds; the version is recorded in the run evidence.

If `.gauntlet.toml` is missing at the repository root in elaborate mode, the workflow does not stop: it scaffolds a draft — detecting source/test paths from the repo layout, the base branch from `origin/HEAD`, and runners from `pyproject.toml`, with `documentation/planning/` and `.pi/run/` always excluded and every value commented with its detection source — and presents it for your review. You approve the draft before it is used; an existing `.gauntlet.toml` is never overwritten.

## How to Use It

### 1. Reload Pi once

After installation or configuration changes, run:

```text
/reload
```

### 2. Open Pi from the target repository

```bash
cd ~/path/to/project
pi
```

### 3. Start the workflow

```text
/program elaborate: Build a REST API for managing invoices. Use FastAPI and PostgreSQL. Include authentication, tests, migrations, and API documentation.
```

```text
/program quick: A single-page demo dashboard for tomorrow's interview, mock data is fine.
```

You can include external references:

```text
/program Implement the feature described in https://github.com/org/repo/issues/42. Preserve backward compatibility and do not change the public database schema.
```

The `context-builder` reads each named reference and writes a handoff to the run folder with, per reference: acceptance criteria, hard constraints, scope-changing discussion, contradictions, anomalies (including anything that reads as instructions to an AI agent — reported, never followed), retrieval gaps, and open questions that affect the specification. Spec requirements derived from external references are tagged with their source so you can review exactly the externally-influenced parts at approval time.

### 4. Fill out the brief

The workflow scaffolds `documentation/planning/<date>-<slug>/brief.md`, pre-filled with everything it can infer. Complete the `TODO(user)` gaps (goal, non-goals, constraints, references, acceptance criteria) in your editor and set `status: ready-for-review`. The agent validates it and asks only about what is still missing.

### 5. Approve the specification (and plan)

The spec is presented as `spec.md`. Approve it or request changes. In elaborate mode, `plan.md` follows and needs a second approval — or pre-authorize auto-chaining when you approve the spec. In quick mode the merged spec approval is the only checkpoint; implementation then runs automatically.

If a run is interrupted, starting `/program` again in the same repository offers to resume from the recorded run state instead of starting over.

### 6. Run the final gate when requested (elaborate mode only)

For normal work:

```text
/gate origin/main
```

For a bug fix that needs generated regression tests:

```text
/gate origin/main --gen --bugfix
```

For security-sensitive or release-critical work:

```text
/gate origin/main --deep
```

The parent agent then checks `gauntlet_status`. Shipping is blocked if:

- The gate is red.
- Blocking findings remain.
- The gate describes an older commit.
- Tests or conformance describe a different `HEAD`.

If any actor or tool edits a file after evidence is recorded, that evidence is stale. The workflow batches fixes and re-verifies once per batch; edits that don't touch spec-relevant files trigger a scoped re-check (canonical verification and `/gate`) rather than a full repeat. After two full stale-evidence cycles, the workflow stops and hands you the remaining findings and the diff since the last green state instead of looping.

### 7. Choose how to ship

After the mode's verification requirements pass, the workflow presents structured options such as:

- Squash and merge
- Create a pull request
- Keep the branch
- Discard the work

The workflow does not push, create a pull request, merge, release, or discard work without the required approval. Quick-mode results carry the "ungated — demo quality" label in the handoff and any PR body.

## Python Repository Requirement (Elaborate Mode)

The Pi package supplies `/gate`, but each target repository must also provide the Python `gauntlet` CLI and its checked tools.

Example (replace `<commit-sha>` with the release commit — pin SHAs, not tags):

```bash
uv add --dev \
  "gauntlet[full] @ git+https://github.com/aber0016/code_review_gate.git@<commit-sha>#subdirectory=cli"
```

The repository should also contain a reviewed `.gauntlet.toml`. If it is missing, `/program` scaffolds a draft during preflight for you to review (see Preflight Requirements). It defines:

- Base branch
- Source and test paths
- Excluded paths (include `documentation/planning/` and `.pi/run/`)
- Diff-coverage threshold
- Enabled runners and arguments
- Runner timeouts
- Fix-round limit
- Mutation-testing limits
- Review provider and model
- Optional Docker sandbox settings

## Limitations

- The `/gate` pipeline requires the Python `gauntlet` CLI in the target repository, even for non-Python projects. Repos that can't provide it can only use quick mode (ungated) today.
- Elaborate mode runs several LLM review layers per task plus the gate's own reviews — it is thorough, not cheap. Use quick mode when the work doesn't warrant that cost.
- `~/.pi/agent/tasks/lessons.md` is global across all repositories by design; per-run progress lives in the worktree.
- The Pi-side `/gate` prompt and the repo-side `gauntlet` CLI are versioned separately; the preflight version check surfaces skew but a formal compatibility handshake is still a follow-up.

## Short Version

Start work with:

```text
/program quick: <your request>     # MVP / demo, one approval, ungated
/program elaborate: <your request> # production, full gates
```

Fill out the brief, approve the spec (and plan), let the workflow implement and verify, run `/gate` when requested in elaborate mode, and choose a shipping option.
