#!/usr/bin/env node
/**
 * Symlink agents/*.md into the pi agent discovery dir
 * ($PI_CODING_AGENT_DIR/agents, default ~/.pi/agent/agents).
 *
 * Existing symlinks are refreshed on every install; a pre-existing regular
 * file is left in place with a warning so a hand-edited agent is never
 * silently replaced — delete it and re-run `npm run link-agents` to adopt
 * the packaged version. Invoked automatically by `npm install`, which pi
 * runs on git package installs.
 */
import { readdirSync, symlinkSync, unlinkSync, mkdirSync, existsSync, lstatSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { homedir } from "node:os";

const pkgDir = dirname(dirname(fileURLToPath(import.meta.url)));
const src = join(pkgDir, "agents");
if (!existsSync(src)) process.exit(0);

const agentDir = process.env.PI_CODING_AGENT_DIR ?? join(homedir(), ".pi", "agent");
const target = join(agentDir, "agents");
mkdirSync(target, { recursive: true });

for (const name of readdirSync(src).filter((n) => n.endsWith(".md"))) {
  const dst = join(target, name);
  let stat;
  try {
    stat = lstatSync(dst);
  } catch {
    stat = undefined;
  }
  if (stat?.isSymbolicLink()) {
    unlinkSync(dst);
  } else if (stat) {
    console.warn(`pi-program: ${dst} exists as a regular file; leaving it. Delete it and run 'npm run link-agents' to use the packaged version.`);
    continue;
  }
  symlinkSync(join(src, name), dst);
  console.log(`pi-program: linked ${dst}`);
}
