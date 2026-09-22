import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import {
  defineConfig,
  type ConfigEnv,
  type UserConfig,
  type ViteDevServer,
} from "vite";
import vue from "@vitejs/plugin-vue";
import { markdownPlugin } from "../i18n/build/markdownPlugin.js";
import { replaySaveMiddleware } from "./dev/replaySaveMiddleware.js";

const webRoot = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(webRoot, "..");

export function createWebViteConfig(
  command: ConfigEnv["command"],
): UserConfig {
  const isDevelopmentServer = command === "serve";
  return {
    root: webRoot,
    base: process.env.BC5R_BASE_PATH ?? "/",
    publicDir: false,
    resolve: {
      alias: [
        ...(isDevelopmentServer
          ? [
              {
                find: "@bobby/i18n",
                replacement: path.join(projectRoot, "i18n/src/index.ts"),
              },
            ]
          : []),
        {
          find: "@bobby/embed",
          replacement: path.join(projectRoot, "embed/src/public.ts"),
        },
        {
          find: "@bobby/engine/authoring",
          replacement: path.join(projectRoot, "engine/src/authoring.ts"),
        },
        {
          find: /^@bobby\/engine$/,
          replacement: path.join(projectRoot, "engine/src/public.ts"),
        },
        {
          find: "@bobby/model",
          replacement: path.join(projectRoot, "model/src/index.ts"),
        },
        {
          find: "@bobby/exchange",
          replacement: path.join(projectRoot, "exchange/src/index.ts"),
        },
        {
          find: "@bobby/adventure",
          replacement: path.join(projectRoot, "adventure/src/index.ts"),
        },
        {
          find: "@bobby/editor",
          replacement: path.join(projectRoot, "editor/src/index.ts"),
        },
      ],
    },
    server: {
      fs: {
        allow: [projectRoot],
      },
    },
    plugins: [
      vue(),
      ...(isDevelopmentServer ? [markdownPlugin()] : []),
      developmentReplaySave(),
      developmentDirectory("/assets", path.join(projectRoot, "assets")),
      replayVerificationWatcher(),
    ],
    build: {
      outDir: "../dist",
      assetsDir: "app",
      emptyOutDir: true,
    },
  };
}

export default defineConfig(({ command }) => createWebViteConfig(command));

function developmentReplaySave() {
  return {
    name: "bc5r-development-replay-save",
    configureServer(server: ViteDevServer) {
      server.middlewares.use(
        replaySaveMiddleware(path.join(projectRoot, "assets/replays")),
      );
    },
  };
}

function replayVerificationWatcher() {
  const replaySource = path.join(projectRoot, "assets/replays");
  const verificationScript = path.join(
    projectRoot,
    "tools/replay/mark-verified-maps.mjs",
  );
  let timer: ReturnType<typeof setTimeout> | undefined;

  return {
    name: "bc5r-replay-presence-watcher",
    configureServer(server: ViteDevServer) {
      server.watcher.add(replaySource);
      const changed = (file: string): void => {
        const replayChanged = file.startsWith(`${replaySource}${path.sep}`);
        if (!replayChanged) return;
        if (timer) clearTimeout(timer);
        timer = setTimeout(() => {
          const mark = spawnSync(
            process.execPath,
            [verificationScript, "--presence"],
            { cwd: projectRoot, stdio: "inherit" },
          );
          if (mark.status !== 0) clearVerification();
          server.ws.send({ type: "full-reload" });
        }, 150);
      };
      server.watcher.on("change", changed);
      server.watcher.on("add", changed);
      server.watcher.on("unlink", changed);
    },
  };

  function clearVerification(): void {
    spawnSync(process.execPath, [verificationScript, "--clear"], {
      cwd: projectRoot,
      stdio: "inherit",
    });
  }
}

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
    case ".ogg":
      return "audio/ogg";
    case ".js":
      return "text/javascript; charset=utf-8";
    case ".png":
      return "image/png";
    default:
      return "application/octet-stream";
  }
}
