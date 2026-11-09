// Runs `vite build`. On Node 18 the service worker build (workbox → terser worker threads)
// needs the global `crypto`, which only exists there behind a flag – so add it when needed.
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const major = Number(process.versions.node.split(".")[0]);
const vite = fileURLToPath(new URL("../node_modules/vite/bin/vite.js", import.meta.url));
const flags = major < 20 && !globalThis.crypto ? ["--experimental-global-webcrypto"] : [];
const result = spawnSync(process.execPath, [...flags, vite, "build", ...process.argv.slice(2)], { stdio: "inherit" });
process.exit(result.status ?? 1);

