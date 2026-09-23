import path from "node:path";
import { createServer } from "vite";
import { root, run } from "../lib/fs.mjs";

run(process.execPath, ["tools/cli.mjs", "assets", "prepare", "--dev"]);
run(process.execPath, [
  "tools/replay/mark-verified-maps.mjs",
  "--presence",
]);
const { attachAssetWatcher } = await import(
  "../assets/orchestrator/watcher.mjs"
);

const port = Number(process.env.PORT ?? 5173);
const devHost = process.env.BC5R_DEV_HOST ?? "0.0.0.0";
const server = await createServer({
  configFile: path.join(root, "web/vite.config.ts"),
  server: {
    host: devHost,
    port,
    strictPort: true,
  },
});
attachAssetWatcher({
  server,
});
await server.listen();

console.log(`Web UI: http://localhost:${port}`);
console.log(`Editor: http://localhost:${port}/edit`);
console.log("Press Ctrl+C to stop.");
