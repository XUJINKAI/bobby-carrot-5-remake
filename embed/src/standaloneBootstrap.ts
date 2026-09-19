import { mount } from "./mount.js";
import type {
  BC5RGlobal,
  BC5RMount,
  BC5RMountOptions,
  BC5RQueue,
} from "./types.js";

export interface BC5RBootstrapState {
  queue?: BC5RQueue | BC5RMountOptions[];
}

export interface BC5RHost {
  BC5R?: BC5RBootstrapState | BC5RGlobal;
}

type ErrorReporter = (error: unknown) => void;

/** 把脚本加载前的配置队列升级为正式 standalone API。 */
export function installStandaloneApi(
  host: BC5RHost,
  mountEmbed: BC5RMount = mount,
  reportError: ErrorReporter = defaultErrorReporter,
): BC5RGlobal {
  const pending = Array.isArray(host.BC5R?.queue)
    ? [...host.BC5R.queue]
    : [];
  const start = (options: BC5RMountOptions): void => {
    try {
      void mountEmbed(options).ready.catch(reportError);
    } catch (error) {
      reportError(error);
    }
  };
  const queue: BC5RQueue = {
    push(...options): number {
      for (const entry of options) start(entry);
      return options.length;
    },
  };
  const api = { mount: mountEmbed, queue };
  host.BC5R = api;
  for (const options of pending) start(options);
  return api;
}

function defaultErrorReporter(error: unknown): void {
  console.error("BC5R Embed failed to mount", error);
}
