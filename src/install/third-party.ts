import { existsSync, readdirSync } from "node:fs";
import { basename, join } from "node:path";
import { allDependencies, readPackageJson } from "../lib/pkg";
import type { ResolvedSkill } from "./writers/skills";

/**
 * Directory roots a dependency may bundle skills under, when it doesn't declare
 * them explicitly. Each root is scanned for `<skill-name>/SKILL.md` (and may
 * itself be a single skill directory containing a `SKILL.md`).
 */
const CONVENTION_ROOTS = ["nest-boost/skills", "resources/nest-boost/skills", "skills", "skill"];

/**
 * Discover skills bundled inside installed dependencies (Laravel Boost's
 * "third-party package skills"). A package can opt in explicitly with a
 * `package.json` field:
 *
 *   "nestBoost": { "skills": ["skill"] }
 *
 * where each entry is a directory containing `<name>/SKILL.md` (or a single
 * skill directory with a `SKILL.md`). Otherwise the conventional roots above are
 * scanned. Only direct dependencies are inspected.
 */
export function discoverPackageSkills(projectRoot: string): ResolvedSkill[] {
  const pkg = readPackageJson(projectRoot);
  if (!pkg) return [];

  const out: ResolvedSkill[] = [];
  const seen = new Set<string>();

  for (const dep of Object.keys(allDependencies(pkg))) {
    const depDir = join(projectRoot, "node_modules", ...dep.split("/"));
    if (!existsSync(depDir)) continue;

    const declared = (readPackageJson(depDir) as Record<string, any> | null)?.nestBoost as
      | { skills?: string[] }
      | undefined;
    const roots = declared?.skills ?? CONVENTION_ROOTS;

    for (const root of roots) {
      const dir = join(depDir, root);
      if (!existsSync(dir)) continue;

      // A root that is itself a skill (has SKILL.md).
      if (existsSync(join(dir, "SKILL.md"))) {
        add(out, seen, basename(dir), dir);
        continue;
      }
      // Otherwise a container of <name>/SKILL.md folders.
      for (const entry of safeReaddir(dir)) {
        const skillDir = join(dir, entry);
        if (existsSync(join(skillDir, "SKILL.md"))) add(out, seen, entry, skillDir);
      }
    }
  }

  return out;
}

function add(out: ResolvedSkill[], seen: Set<string>, name: string, src: string): void {
  if (seen.has(name)) return;
  seen.add(name);
  out.push({ name, src });
}

function safeReaddir(dir: string): string[] {
  try {
    return readdirSync(dir, { withFileTypes: true })
      .filter((e) => e.isDirectory())
      .map((e) => e.name);
  } catch {
    return [];
  }
}
