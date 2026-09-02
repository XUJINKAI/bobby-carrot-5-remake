import fs from "node:fs";
import path from "node:path";

export function resolveDistRequest(base, requestUrl) {
  const url = new URL(requestUrl ?? "/", "http://localhost");
  let pathname;
  try {
    pathname = decodeURIComponent(url.pathname);
  } catch {
    return { status: 400, message: "Bad path encoding" };
  }

  const resolvedBase = path.resolve(base);
  let file = path.resolve(resolvedBase, `.${pathname}`);
  const normalizedRoot = `${resolvedBase}${path.sep}`;
  if (file !== resolvedBase && !file.startsWith(normalizedRoot))
    return { status: 403, message: "Forbidden" };

  if (fs.existsSync(file) && fs.statSync(file).isDirectory())
    file = path.join(file, "index.html");
  if (fs.existsSync(file) && fs.statSync(file).isFile())
    return { status: 200, file };

  return { status: 404, message: "Not found" };
}

export function contentType(file) {
  switch (path.extname(file).toLowerCase()) {
    case ".html":
      return "text/html; charset=utf-8";
    case ".js":
    case ".mjs":
      return "text/javascript; charset=utf-8";
    case ".css":
      return "text/css; charset=utf-8";
    case ".json":
    case ".map":
      return "application/json; charset=utf-8";
    case ".png":
      return "image/png";
    case ".mid":
      return "audio/midi";
    case ".svg":
      return "image/svg+xml";
    case ".xml":
      return "application/xml; charset=utf-8";
    case ".txt":
      return "text/plain; charset=utf-8";
    default:
      return "application/octet-stream";
  }
}

export function serveDistRequest(base, request, response) {
  const result = resolveDistRequest(base, request.url);
  if (!result.file) {
    response.writeHead(result.status, {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "no-store",
    });
    response.end(result.message ?? "Request failed");
    return;
  }
  response.writeHead(200, {
    "content-type": contentType(result.file),
    "cache-control": "no-store",
  });
  fs.createReadStream(result.file).pipe(response);
}
