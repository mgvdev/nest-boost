import { cancel, confirm, isCancel, multiselect, select, text } from "@clack/prompts";
import { AGENTS } from "./agents/agent";
import { ARCHITECTURES, DEFAULT_ARCHITECTURE } from "./architectures";
import { AUTH_STRATEGIES } from "./auth";
import { TEST_LAYOUTS } from "./test-layout";

/** Interactive multiselect of which agents to configure. */
export async function promptAgents(defaults: string[]): Promise<string[]> {
  const selected = await multiselect({
    message: "Which coding agents should nest-boost configure?",
    options: AGENTS.map((a) => ({ value: a.id, label: a.label })),
    initialValues: defaults.length ? defaults : ["claude"],
    required: true,
  });
  if (isCancel(selected)) {
    cancel("Aborted.");
    process.exit(0);
  }
  return selected as string[];
}

/** Single-select the application architecture style. */
export async function promptArchitecture(initial = DEFAULT_ARCHITECTURE): Promise<string> {
  const choice = await select({
    message: "Which architecture style does this project follow?",
    initialValue: initial,
    options: ARCHITECTURES.map((a) => ({ value: a.id, label: a.label, hint: a.description })),
  });
  if (isCancel(choice)) {
    cancel("Aborted.");
    process.exit(0);
  }
  return choice as string;
}

/** Single-select the auth strategy. */
export async function promptAuth(initial: string): Promise<string> {
  const choice = await select({
    message: "Which authentication strategy does this project use?",
    initialValue: initial,
    options: AUTH_STRATEGIES.map((a) => ({ value: a.id, label: a.label, hint: a.description })),
  });
  if (isCancel(choice)) {
    cancel("Aborted.");
    process.exit(0);
  }
  return choice as string;
}

/** Single-select where test files live. */
export async function promptTestLayout(initial: string): Promise<string> {
  const choice = await select({
    message: "Where do test files live in this project?",
    initialValue: initial,
    options: TEST_LAYOUTS.map((l) => ({ value: l.id, label: l.label, hint: l.description })),
  });
  if (isCancel(choice)) {
    cancel("Aborted.");
    process.exit(0);
  }
  return choice as string;
}

/** Single-select the default workspace project (the app the MCP boots by default). */
export async function promptDefaultProject(appNames: string[], initial: string): Promise<string> {
  const choice = await select({
    message: "Which application is the default project (booted by the MCP when none is specified)?",
    initialValue: initial,
    options: appNames.map((name) => ({ value: name, label: name })),
  });
  if (isCancel(choice)) {
    cancel("Aborted.");
    process.exit(0);
  }
  return choice as string;
}

/** Yes/no confirm, used e.g. to fetch the official Better Auth skill. */
export async function promptConfirm(message: string): Promise<boolean> {
  const answer = await confirm({ message, initialValue: false });
  if (isCancel(answer)) {
    cancel("Aborted.");
    process.exit(0);
  }
  return answer as boolean;
}

/** Confirm or override the detected root module path. */
export async function promptEntryModule(detected: string): Promise<string> {
  const answer = await text({
    message: "Path to your root application module (exports AppModule):",
    initialValue: detected,
    placeholder: detected,
  });
  if (isCancel(answer)) {
    cancel("Aborted.");
    process.exit(0);
  }
  return (answer as string).trim() || detected;
}
