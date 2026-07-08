import { cpSync, existsSync, mkdirSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { skillsDir } from "../../lib/resources";
import { architectureById } from "../architectures";
import { authById } from "../auth";
import type { Detection } from "../detect";
import type { Selection } from "../selection";
import type { SkillsTarget } from "../agents/agent";

/**
 * Skills always installed regardless of detected packages: the docs + development
 * baseline, plus the skill-builder generator so agents can grow the knowledge base.
 */
const BASE_SKILLS = ["nestjs-development", "nestjs-docs", "skill-builder", "using-evaluate"];

/**
 * Project-local knowledge base. Custom skills (including agent-generated ones)
 * live here, are the source of truth, and get copied into each configured agent's
 * skill directory by install/update. A local skill overrides a packaged one of the
 * same name.
 */
export const LOCAL_SKILLS_DIR = ".nest-boost/skills";

export interface ResolvedSkill {
  name: string;
  /** Absolute source directory to copy from. */
  src: string;
}

/** Packaged skill folder names selected for a project (baseline + detected + choices). */
export function skillsForDetection(detection: Detection, selection: Selection = {}): string[] {
  const names = new Set(BASE_SKILLS);
  for (const entry of detection.entries) {
    if (entry.skill) names.add(entry.skill);
  }
  const arch = selection.architecture ? architectureById(selection.architecture) : undefined;
  if (arch) names.add(arch.skill);
  const auth = selection.auth ? authById(selection.auth) : undefined;
  if (auth?.skill) names.add(auth.skill);
  // Only install skills that actually exist in the packaged resources.
  return [...names].filter((name) => existsSync(join(skillsDir(), name)));
}

/** Local custom skills found under `.nest-boost/skills/<name>/SKILL.md`. */
export function localSkills(projectRoot: string): ResolvedSkill[] {
  const root = join(projectRoot, LOCAL_SKILLS_DIR);
  if (!existsSync(root)) return [];
  const out: ResolvedSkill[] = [];
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const src = join(root, entry.name);
    if (existsSync(join(src, "SKILL.md"))) out.push({ name: entry.name, src });
  }
  return out;
}

/**
 * Resolve the full set of skills to install: packaged skills for the project,
 * merged with local custom skills. Local skills override packaged ones by name.
 */
export function resolveSkills(
  projectRoot: string,
  detection: Detection,
  selection: Selection = {},
): ResolvedSkill[] {
  const byName = new Map<string, ResolvedSkill>();
  for (const name of skillsForDetection(detection, selection)) {
    byName.set(name, { name, src: join(skillsDir(), name) });
  }
  for (const skill of localSkills(projectRoot)) {
    byName.set(skill.name, skill); // local overrides packaged
  }
  return [...byName.values()];
}

/** Copy resolved skill folders into an agent's skills directory. */
export function copySkills(
  projectRoot: string,
  target: SkillsTarget,
  skills: ResolvedSkill[],
): string[] {
  const destRoot = join(projectRoot, target.dir);
  mkdirSync(destRoot, { recursive: true });

  const copied: string[] = [];
  for (const skill of skills) {
    if (!existsSync(skill.src)) continue;
    cpSync(skill.src, join(destRoot, skill.name), { recursive: true });
    copied.push(skill.name);
  }
  return copied;
}
