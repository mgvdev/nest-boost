import { spawn } from "node:child_process";

export interface FetchResult {
  ok: boolean;
  output: string;
}

const TIMEOUT_MS = 300_000;

/**
 * Run an official-skill fetch command (e.g. `npx -y skills add better-auth/skills`)
 * in the project directory.
 *
 * The command is run with **inherited stdio** so its interactive prompts (npx's
 * install confirmation, the skills CLI's target questions) are shown to the user
 * and can be answered — otherwise the child blocks on stdin and appears to hang.
 * The command string is split on whitespace and run without a shell. Never
 * throws; failures are reported in the result.
 */
export function fetchOfficialSkill(projectRoot: string, command: string): Promise<FetchResult> {
  const [cmd, ...args] = command.split(/\s+/).filter(Boolean);
  if (!cmd) return Promise.resolve({ ok: false, output: "Empty fetch command." });

  return new Promise((resolve) => {
    let done = false;
    const finish = (result: FetchResult) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      resolve(result);
    };

    const child = spawn(cmd, args, { cwd: projectRoot, stdio: "inherit", shell: false });

    const timer = setTimeout(() => {
      child.kill("SIGTERM");
      finish({ ok: false, output: `Timed out after ${TIMEOUT_MS / 1000}s.` });
    }, TIMEOUT_MS);

    child.on("error", (err) => finish({ ok: false, output: err.message }));
    child.on("close", (code) =>
      finish(code === 0 ? { ok: true, output: "Done." } : { ok: false, output: `Exited with code ${code}.` }),
    );
  });
}
