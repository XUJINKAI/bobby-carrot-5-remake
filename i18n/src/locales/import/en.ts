import type { ImportTranslationKey } from "./zh-CN.js";
const catalog = {
  "import.title": "Import Data",
  "import.raw": "View raw data",
  "import.home": "Back to Home",
  "import.adventureIncoming": "Adventure progress to import:",
  "import.exploreIncoming": "Explore progress to import:",
  "import.completed": "Completed",
  "import.collection": "Map collection",
  "import.adventureOverwrite": "Importing replaces the current Adventure Save.",
  "import.exploreOverwrite": "Importing replaces this collection's Explore Save.",
  "import.confirm": "Import and replace",
  "import.unknown": "This Bobby Carrot 5 Remake data could not be recognized.",
} satisfies Record<ImportTranslationKey, string>;
export default catalog;
