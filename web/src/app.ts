import { BobbyApp } from "./application.js";

const root = document.querySelector<HTMLDivElement>("#app");
if (!root) throw new Error("#app not found");
const app = new BobbyApp(root);
await app.start();
