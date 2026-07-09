import { intro, log, note, outro } from "@clack/prompts";
import { loadConfig } from "../install/config";
import { detect } from "../install/detect";
import { agentById } from "../install/agents/agent";
import { discoverPackageMcpServers } from "../install/third-party";
import { composeGuidelines, writeGuidelines } from "../install/writers/guidelines";
import { mergeMcpServer } from "../install/writers/mcp-config";
import { copySkills, resolveSkills } from "../install/writers/skills";

/**
 * Re-sync guidelines and skills for the agents already recorded in
 * nest-boost.json. Does not re-prompt. Intended for a post-update hook.
 */
export async function runUpdate(_args: string[]): Promise<void> {
  const projectRoot = process.cwd();
  intro("nest-boost update");

  const config = loadConfig(projectRoot);
  if (!config) {
    log.error("No nest-boost.json found. Run `nest-boost install` first.");
    process.exit(1);
  }

  const detection = detect(projectRoot);
  const selection = { architecture: config.architecture, auth: config.auth, testLayout: config.testLayout };
  const guidelines = composeGuidelines(detection, selection);
  const skills = resolveSkills(projectRoot, detection, selection);
  const pkgServers = discoverPackageMcpServers(projectRoot);
  const written: string[] = [];

  for (const id of config.agents) {
    const agent = agentById(id);
    if (!agent) continue;
    if (agent.guidelines) written.push(writeGuidelines(projectRoot, agent.guidelines, guidelines));
    if (agent.skills) {
      for (const name of copySkills(projectRoot, agent.skills, skills)) {
        written.push(`${agent.skills.dir}/${name}`);
      }
    }
    // Pick up MCP servers newly exposed by installed packages (nest-boost's own
    // server is left untouched — it was written at install with the chosen runner).
    if (agent.mcp) {
      for (const srv of pkgServers) {
        mergeMcpServer(projectRoot, agent.mcp.file, srv.key, srv.entry, agent.mcp.format);
        written.push(`${agent.mcp.file}#${srv.key}`);
      }
    }
  }

  note(
    `Agents: ${config.agents.join(", ")}\nUpdated: ${[...new Set(written)].join(", ") || "(nothing)"}` +
      (pkgServers.length ? `\nPackage MCP servers: ${pkgServers.map((s) => s.key).join(", ")}` : ""),
    "Resynced",
  );
  outro("Guidelines, skills, and MCP servers are up to date.");
}
