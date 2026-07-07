#!/usr/bin/env bun
const HELP = `nest-boost — Laravel Boost for NestJS

Usage:
  nest-boost install     Detect packages, configure your AI agents, install guidelines + skills
  nest-boost update      Re-sync guidelines + skills for currently-installed packages
  nest-boost mcp         Run the MCP server over stdio (used by AI agents)

Options:
  -h, --help             Show this help
  -v, --version          Show version

Install options:
  --agents <a,b>         Preselect agents non-interactively (claude,cursor,codex,gemini,generic)
  --arch <style>         Architecture style (standard,cqrs,hexagonal)
  --auth <strategy>      Auth strategy (none,passport,better-auth)
  --runner <bunx|npx>    MCP launcher for the generated config (default: auto-detect)
  --fetch-auth-skill     Fetch the official community skill for the auth strategy (e.g. Better Auth)
  --yes                  Accept defaults, skip prompts
`;

async function main() {
  const [command, ...rest] = process.argv.slice(2);

  if (!command || command === "-h" || command === "--help" || command === "help") {
    process.stdout.write(HELP);
    return;
  }

  if (command === "-v" || command === "--version") {
    const pkg = await import("../package.json", { with: { type: "json" } }).catch(() => ({ default: { version: "0.0.0" } }));
    process.stdout.write(`${(pkg as any).default.version}\n`);
    return;
  }

  switch (command) {
    case "install":
      await (await import("./commands/install")).runInstall(rest);
      break;
    case "update":
      await (await import("./commands/update")).runUpdate(rest);
      break;
    case "mcp":
      await (await import("./commands/mcp")).runMcp(rest);
      break;
    default:
      process.stderr.write(`Unknown command: ${command}\n\n${HELP}`);
      process.exit(1);
  }
}

main().catch((err) => {
  process.stderr.write(`nest-boost error: ${err?.stack ?? err}\n`);
  process.exit(1);
});
