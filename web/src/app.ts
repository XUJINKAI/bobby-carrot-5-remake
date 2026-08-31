import { BobbyApp } from "./app/BobbyApp.js";
import { initializeWebI18n } from "./i18n/webI18n.js";
import "../style.css";
import "../game-ui.css";
import "../../editor/style.css";

initializeWebI18n();
const root = document.querySelector<HTMLDivElement>("#app");
if (!root) throw new Error("#app not found");
const app = new BobbyApp(root);
await app.start();
