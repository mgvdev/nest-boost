import { intro, log, note, outro } from "@clack/prompts";
import pkg from "../../package.json";
import { printBanner } from "../install/banner";
import { saveConfig, type NestBoostConfig, type ProjectConfig } from "../install/config";
import { detect, isNestProject, type Detection } from "../install/detect";
import { findEntryModule, findEntryModuleIn } from "../install/entry";
import { agentById, AGENTS, type Agent } from "../install/agents/agent";
import { DEFAULT_ARCHITECTURE } from "../install/architectures";
import { authById, defaultAuthFor } from "../install/auth";
import { fetchOfficialSkill } from "../install/fetch-skill";
import { promptAgents, promptArchitecture, promptAuth, promptConfirm, promptDefaultProject, promptEntryModule, promptTestLayout } from "../install/prompt";
import { DEFAULT_TEST_LAYOUT } from "../install/test-layout";
import { mcpCommandString, mcpServerEntry, resolveRunner, type Runner } from "../install/runner";
import type { Selection } from "../install/selection";
import { composeGuidelines, writeGuidelines } from "../install/writers/guidelines";
import { writeMcpConfig } from "../install/writers/mcp-config";
import { copySkills, resolveSkills } from "../install/writers/skills";

export interface InstallOptions {
  agents: string[];
  projects: ProjectConfig[];
  defaultProject: string;
  architecture: string;
  auth: string;
  /** Test layout id; defaults to "colocated" when omitted. */
  testLayout?: string;
  /** Launcher for the MCP server entry (bunx or npx). */
  runner: Runner;
}

export interface InstallSummary {
  agents: string[];
  filesWritten: string[];
  skills: string[];
  hints: string[];
}

/** Pure install: writes MCP config, guidelines, and skills for the chosen agents. */
export function performInstall(
  projectRoot: string,
  detection: Detection,
  options: InstallOptions,
): InstallSummary {
  const testLayout = options.testLayout ?? DEFAULT_TEST_LAYOUT;
  const selection: Selection = { architecture: options.architecture, auth: options.auth, testLayout };
  const guidelines = composeGuidelines(detection, selection);
  const skills = resolveSkills(projectRoot, detection, selection);
  const filesWritten: string[] = [];
  const hints: string[] = [];
  const installedSkills = new Set<string>();

  const mcpEntry = mcpServerEntry(options.runner);
  const mcpCommand = mcpCommandString(options.runner);

  for (const id of options.agents) {
    const agent = agentById(id);
    if (!agent) continue;

    if (agent.mcp) filesWritten.push(writeMcpConfig(projectRoot, agent.mcp, mcpEntry));
    if (agent.mcpHint) hints.push(agent.mcpHint(mcpCommand));
    if (agent.guidelines) filesWritten.push(writeGuidelines(projectRoot, agent.guidelines, guidelines));
    if (agent.skills) {
      for (const name of copySkills(projectRoot, agent.skills, skills)) {
        installedSkills.add(`${agent.skills.dir}/${name}`);
      }
    }
  }

  const authStrategy = authById(options.auth);
  if (authStrategy?.fetchSkillCommand) {
    hints.push(`Official ${authStrategy.label} skill: ${authStrategy.fetchSkillCommand}`);
  }

  const config: NestBoostConfig = {
    projects: options.projects,
    defaultProject: options.defaultProject,
    agents: options.agents,
    architecture: options.architecture,
    auth: options.auth,
    testLayout,
  };
  saveConfig(projectRoot, config);
  filesWritten.push("nest-boost.json");

  return {
    agents: options.agents,
    filesWritten: [...new Set(filesWritten)],
    skills: [...installedSkills],
    hints: [...new Set(hints)],
  };
}

interface Flags {
  agents?: string[];
  yes: boolean;
  entry?: string;
  module?: string;
  arch?: string;
  auth?: string;
  testLayout?: string;
  runner?: string;
  defaultProject?: string;
  fetchAuthSkill: boolean;
}

function parseFlags(args: string[]): Flags {
  const flags: Flags = { yes: false, fetchAuthSkill: false };
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--yes" || arg === "-y") flags.yes = true;
    else if (arg === "--agents") flags.agents = (args[++i] ?? "").split(",").map((s) => s.trim()).filter(Boolean);
    else if (arg === "--entry") flags.entry = args[++i];
    else if (arg === "--module") flags.module = args[++i];
    else if (arg === "--arch" || arg === "--architecture") flags.arch = args[++i];
    else if (arg === "--auth") flags.auth = args[++i];
    else if (arg === "--test-layout") flags.testLayout = args[++i];
    else if (arg === "--runner") flags.runner = args[++i];
    else if (arg === "--default-project") flags.defaultProject = args[++i];
    else if (arg === "--fetch-auth-skill") flags.fetchAuthSkill = true;
  }
  return flags;
}

/**
 * Build the project list + default project. In a monorepo, derive one entry per
 * workspace project from nest-cli.json; otherwise discover a single app.
 */
async function resolveProjects(
  projectRoot: string,
  detection: Detection,
  flags: Flags,
  nonInteractive: boolean,
): Promise<{ projects: ProjectConfig[]; defaultProject: string }> {
  if (detection.monorepo && detection.projects.length > 0) {
    const projects: ProjectConfig[] = detection.projects.map((p) => {
      if (p.type === "library") return { name: p.name, type: "library", root: p.root };
      const entry = findEntryModuleIn(projectRoot, { sourceRoot: p.sourceRoot, entryFile: p.entryFile });
      return {
        name: p.name,
        type: "application",
        root: p.root,
        entryModule: entry.entryModule,
        moduleExport: entry.moduleExport,
      };
    });

    const appNames = projects.filter((p) => p.type === "application").map((p) => p.name);
    let defaultProject = flags.defaultProject ?? detection.defaultProject ?? appNames[0] ?? projects[0].name;
    if (!nonInteractive && !flags.defaultProject && appNames.length > 1) {
      defaultProject = await promptDefaultProject(appNames, defaultProject);
    }
    return { projects, defaultProject };
  }

  const discovered = findEntryModule(projectRoot);
  const entryModule = flags.entry ?? (nonInteractive ? discovered.entryModule : await promptEntryModule(discovered.entryModule));
  const moduleExport = flags.module ?? discovered.moduleExport;
  return {
    projects: [{ name: "app", type: "application", root: ".", entryModule, moduleExport }],
    defaultProject: "app",
  };
}

export async function runInstall(args: string[]): Promise<void> {
  const flags = parseFlags(args);
  const projectRoot = process.cwd();
  const detection = detect(projectRoot);
  const nonInteractive = flags.yes || !!flags.agents;

  printBanner(pkg.version);
  intro("nest-boost install");

  if (!isNestProject(detection)) {
    log.warn("No @nestjs/core found in package.json — this may not be a NestJS project.");
  } else {
    log.info(`Detected NestJS ${detection.nest?.version ?? "?"} with ${detection.entries.length} ecosystem package(s).`);
  }

  if (detection.monorepo) {
    const apps = detection.projects.filter((p) => p.type === "application").length;
    const libs = detection.projects.filter((p) => p.type === "library").length;
    log.info(`Monorepo workspace: ${apps} app(s), ${libs} lib(rary/ies).`);
  }

  const { projects, defaultProject } = await resolveProjects(projectRoot, detection, flags, nonInteractive);

  const architecture = flags.arch ?? (nonInteractive ? DEFAULT_ARCHITECTURE : await promptArchitecture());

  const authDefault = defaultAuthFor(detection);
  const auth = flags.auth ?? (nonInteractive ? authDefault : await promptAuth(authDefault));

  const testLayout = flags.testLayout ?? (nonInteractive ? DEFAULT_TEST_LAYOUT : await promptTestLayout(DEFAULT_TEST_LAYOUT));

  const presentDefaults = AGENTS.filter((a) => a.isPresent(projectRoot)).map((a) => a.id);
  const agents = flags.agents ?? (nonInteractive ? (presentDefaults.length ? presentDefaults : ["claude"]) : await promptAgents(presentDefaults));

  const runner = resolveRunner(flags.runner);

  const summary = performInstall(projectRoot, detection, { agents, projects, defaultProject, architecture, auth, testLayout, runner });

  const projectsLine = detection.monorepo
    ? `Projects: ${projects.map((p) => (p.name === defaultProject ? `${p.name}*` : p.name)).join(", ")}  (*=default)`
    : "";
  note(
    [
      projectsLine,
      `Arch:    ${architecture}`,
      `Auth:    ${auth}`,
      `Tests:   ${testLayout}`,
      `Runner:  ${runner}`,
      `Agents:  ${summary.agents.join(", ")}`,
      `Files:   ${summary.filesWritten.join(", ")}`,
      summary.skills.length ? `Skills:  ${summary.skills.join(", ")}` : "",
    ].filter(Boolean).join("\n"),
    "Installed",
  );

  // Offer to fetch the official community skill for the chosen auth strategy.
  const authStrategy = authById(auth);
  if (authStrategy?.fetchSkillCommand) {
    const shouldFetch =
      flags.fetchAuthSkill ||
      (!nonInteractive &&
        (await promptConfirm(`Fetch the official ${authStrategy.label} skill now? (runs \`${authStrategy.fetchSkillCommand}\`)`)));
    if (shouldFetch) {
      log.info(`Running \`${authStrategy.fetchSkillCommand}\`…`);
      const result = await fetchOfficialSkill(projectRoot, authStrategy.fetchSkillCommand);
      (result.ok ? log.success : log.warn)(result.output || (result.ok ? "Done." : "Failed."));
    }
  }

  if (summary.hints.length) {
    note(summary.hints.join("\n"), "Next steps");
  }

  note(
    "Generated agent files are regenerated by `nest-boost update` — safe to .gitignore:\n" +
      "  .mcp.json, CLAUDE.md, AGENTS.md, .cursor/, .gemini/, nest-boost.json\n" +
      "Commit `.nest-boost/skills/` — it's your custom-skill knowledge base (source of truth).\n" +
      "Add a skill for any library with the `skill-builder` skill.",
    "Tip",
  );

  outro("Done. Your agent now understands this NestJS app.");
}
