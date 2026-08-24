import http from "node:http";
import path from "node:path";
import { root, run } from "./util.mjs";
import { serveDistRequest } from "./static-server.mjs";
const requestedMode = process.argv[2] ?? "web",
  mode = requestedMode === "editor" ? "editor" : "web",
  noBuild = process.argv.includes("--no-build");
if (!noBuild) run(process.execPath, ["tools/scripts/build.mjs"]);
const base = path.join(root, "dist"),
  port = Number(process.env.PORT ?? (mode === "editor" ? 5175 : 5173));
const server = http.createServer((request, response) =>
  serveDistRequest(base, request, response),
);
server.listen(port, "0.0.0.0", () => {
  const label = mode === "editor" ? "Editor" : "Web UI",
    suffix = mode === "editor" ? "/edit" : "";
  console.log(`${label}: http://localhost:${port}${suffix}`);
  console.log("Press Ctrl+C to stop.");
});
