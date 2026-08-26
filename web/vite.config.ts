import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

const webRoot = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(webRoot, "..");

export default defineConfig({
  root: webRoot,
  base: process.env.BC5R_BASE_PATH ?? "/",
  publicDir: false,
  resolve: {
    alias: {
      "@bobby/model": path.join(projectRoot, "model/src/index.ts"),
      "@bobby/adventure": path.join(projectRoot, "adventure/src/index.ts"),
      "@bobby/engine": path.join(projectRoot, "engine/src/index.ts"),
      "@bobby/editor": path.join(projectRoot, "editor/src/index.ts"),
    },
  },
  server: {
    fs: {
      allow: [projectRoot],
    },
  },
  plugins: [
    vue(),
    developmentDirectory("/assets", path.join(projectRoot, "assets/generated")),
    developmentDirectory(
      "/vendor",
      path.join(projectRoot, "node_modules/webaudio-tinysynth"),
    ),
  ],
  build: {
    outDir: "dist-vite",
    emptyOutDir: true,
  },
});

function developmentDirectory(prefix, directory) {
  return {
    name: `bc5r-development-${prefix.slice(1)}`,
    configureServer(server) {
      server.middlewares.use(prefix, (request, response, next) => {
        const requestUrl = new URL(request.url ?? "/", "http://localhost");
        let requestPath;
        try {
          requestPath = decodeURIComponent(requestUrl.pathname);
        } catch {
          response.statusCode = 400;
          response.end("Bad path encoding");
          return;
        }
        const relativePath = requestPath.startsWith(prefix)
          ? requestPath.slice(prefix.length)
          : requestPath;
        const file = path.resolve(directory, `.${relativePath}`);
        const normalizedDirectory = `${path.resolve(directory)}${path.sep}`;
        if (
          file !== path.resolve(directory) &&
          !file.startsWith(normalizedDirectory)
        ) {
          response.statusCode = 403;
          response.end("Forbidden");
          return;
        }
        if (!fs.existsSync(file) || !fs.statSync(file).isFile()) {
          next();
          return;
        }
        response.setHeader("cache-control", "no-store");
        response.setHeader("content-type", contentType(file));
        fs.createReadStream(file).pipe(response);
      });
    },
  };
}

function contentType(file) {
  switch (path.extname(file).toLowerCase()) {
    case ".json":
      return "application/json; charset=utf-8";
    case ".mid":
      return "audio/midi";
    case ".js":
      return "text/javascript; charset=utf-8";
    case ".png":
      return "image/png";
    default:
      return "application/octet-stream";
  }
}
