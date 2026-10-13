import { cpSync, existsSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const frontendRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const standaloneRoot = resolve(frontendRoot, ".next", "standalone");
const staticSource = resolve(frontendRoot, ".next", "static");
const staticTarget = resolve(standaloneRoot, ".next", "static");
const publicSource = resolve(frontendRoot, "public");
const publicTarget = resolve(standaloneRoot, "public");

if (!existsSync(standaloneRoot)) {
  throw new Error("Next standalone output was not generated.");
}

mkdirSync(resolve(standaloneRoot, ".next"), { recursive: true });
cpSync(staticSource, staticTarget, { recursive: true });

if (existsSync(publicSource)) {
  cpSync(publicSource, publicTarget, { recursive: true });
}
