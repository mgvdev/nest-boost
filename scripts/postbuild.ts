import { chmodSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

// Ensure the built CLI has a Node shebang and is executable.
const cli = join(import.meta.dir, "..", "dist", "cli.js");
const SHEBANG = "#!/usr/bin/env node\n";

let source = readFileSync(cli, "utf8");
if (!source.startsWith("#!")) {
  source = SHEBANG + source;
} else {
  source = source.replace(/^#![^\n]*\n/, SHEBANG);
}
writeFileSync(cli, source);
chmodSync(cli, 0o755);
console.log("postbuild: dist/cli.js shebang + chmod done");
