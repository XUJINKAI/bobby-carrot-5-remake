import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { root } from "../lib/fs.mjs";
import { serveDistRequest } from "../lib/static-server.mjs";

export function createPreviewServer(base = path.join(root, "dist")) {
  return http.createServer((request, response) =>
    serveDistRequest(base, request, response),
  );
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const port = Number(process.env.PORT ?? 5173);
  const server = createPreviewServer();
  server.listen(port, "0.0.0.0", () => {
    console.log(`Web UI Preview: http://localhost:${port}`);
    console.log("Press Ctrl+C to stop.");
  });
}
