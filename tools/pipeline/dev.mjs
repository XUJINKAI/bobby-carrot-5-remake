import http from "node:http";
import path from "node:path";
import { createServer } from "vite";
import { root, run } from "../lib/fs.mjs";
import { serveDistRequest } from "../lib/static-server.mjs";
const requestedMode = process.argv[2] ?? "web",
  mode = requestedMode === "editor" ? "editor" : "web",
  noBuild = process.argv.includes("--no-build"),
  staticOnly = process.argv.includes("--static");
if (!noBuild)
  run(process.execPath, ["tools/cli.mjs", "assets", "prepare", "--dev"]);
const base = path.join(root, "dist"),
  port = Number(process.env.PORT ?? (mode === "editor" ? 5175 : 5173)),
  devHost = process.env.BC5R_DEV_HOST ?? "0.0.0.0";

if (staticOnly) {
  const server = http.createServer((request, response) =>
    serveDistRequest(base, request, response),
  );
  server.listen(port, "0.0.0.0", () => printAddress(port, mode));
} else {
  const server = await createServer({
    configFile: path.join(root, "web/vite.config.ts"),
    server: {
      host: devHost,
      port,
      strictPort: true,
    },
  });
  await server.listen();
  printAddress(port, mode);
}

function printAddress(serverPort, serverMode) {
  const label = serverMode === "editor" ? "Editor" : "Web UI",
    suffix = serverMode === "editor" ? "/edit" : "";
  console.log(`${label}: http://localhost:${serverPort}${suffix}`);
  console.log("Press Ctrl+C to stop.");
}
