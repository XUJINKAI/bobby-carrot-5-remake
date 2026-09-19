import { installStandaloneApi, type BC5RHost } from "./standaloneBootstrap.js";

const api = installStandaloneApi(globalThis as BC5RHost);

export const mount = api.mount;
export const queue = api.queue;
