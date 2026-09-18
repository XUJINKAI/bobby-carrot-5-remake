import type { HomeTranslationKey } from "./zh-CN.js";
const catalog = {
  "home.startAria": "Start game",
  "home.modeAria": "Choose a mode",
  "home.modeTitle": "Choose a mode",
  "home.adventure": "Adventure",
  "home.adventureDescription": "Play the original campaign experience",
  "home.explore": "Explore",
  "home.exploreDescription": "Browse original and extended map collections",
  "home.editor": "Map Editor",
  "home.editorDescription": "Create, edit, play-test, and share maps",
  "home.import": "Import",
  "home.importDescription": "Import a custom map or save",
  "home.embed": "Embed your custom map on another website",
  "home.importDialog": "Import data",
  "home.importOpen": "Open",
  "home.importPlaceholder": "Paste JSON, BC5R1 text, or a shared link…",
  "home.demoMove": "Move with WASD / arrow keys",
  "home.demoRemaining": "{count} targets remaining",
  "home.demoEnteringAdventure": "Entering Adventure…",
  "home.demoDead": "Bobby is in trouble. Restart to try again.",
  "home.demoDeathReason": "Bobby could not continue.",
} satisfies Record<HomeTranslationKey, string>;
export default catalog;