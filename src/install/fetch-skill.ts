import { execFile } from "node:child_process";
import { promisify } from "node:util";

const run = promisify(execFile);

export interface FetchResult {
  ok: boolean;
  output: string;
}

/**
 * Run an official-skill fetch command (e.g. `npx skills add better-auth/skills`)
 * in the project directory. The command string is split on whitespace and run
 * without a shell. Never throws — failures are reported in the result.
 */
export async function fetchOfficialSkill(projectRoot: string, command: string): Promise<FetchResult> {
  const [cmd, ...cmdArgs] = command.split(/\s+/).filter(Boolean);
  if (!cmd) return { ok: false, output: "Empty fetch command." };
  try {
    const { stdout, stderr } = await run(cmd, cmdArgs, {
      cwd: projectRoot,
      timeout: 180_000,
      maxBuffer: 10 * 1024 * 1024,
    });
    return { ok: true, output: [stdout, stderr].filter(Boolean).join("\n").trim() };
  } catch (err: any) {
    const output = [err.stdout, err.stderr].filter(Boolean).join("\n").trim();
    return { ok: false, output: output || `Command failed: ${err.message}` };
  }
}
