import fs from "node:fs/promises";
import path from "node:path";
import type { IncomingMessage, ServerResponse } from "node:http";

const REPLAY_URL_PREFIX = "/assets/replays/";

/** 开发服务器把面板文本写到与加载内置过法相同的仓库路径。 */
export function replaySaveMiddleware(replayRoot: string) {
  const root = path.resolve(replayRoot);
  return async (
    request: IncomingMessage,
    response: ServerResponse,
    next: () => void,
  ): Promise<void> => {
    const pathname = new URL(request.url ?? "/", "http://localhost").pathname;
    if (request.method !== "PUT" || !pathname.startsWith(REPLAY_URL_PREFIX)) {
      next();
      return;
    }

    let relativePath: string;
    try {
      relativePath = decodeURIComponent(pathname.slice(REPLAY_URL_PREFIX.length));
    } catch {
      response.statusCode = 400;
      response.end("Bad path encoding");
      return;
    }
    const file = path.resolve(root, relativePath);
    if (!file.startsWith(`${root}${path.sep}`)) {
      response.statusCode = 403;
      response.end("Forbidden");
      return;
    }

    try {
      const chunks: Buffer[] = [];
      for await (const chunk of request) chunks.push(Buffer.from(chunk));
      await fs.mkdir(path.dirname(file), { recursive: true });
      await fs.writeFile(file, Buffer.concat(chunks));
      response.statusCode = 204;
      response.end();
    } catch (error) {
      response.statusCode = 500;
      response.end(error instanceof Error ? error.message : String(error));
    }
  };
}
