export interface FocusGroup {
  id: string;
  selector: string;
  tab: "each" | "group";
  arrows?: "vertical" | "horizontal" | "spatial";
}

export interface FocusPlan {
  initial?: string;
  tabAction?: "cycle-collection";
  tabNavigation?: boolean;
  defaultArrowGroup?: string;
  groups: readonly FocusGroup[];
}

const forms: FocusGroup = {
  id: "fields",
  selector: "input:not([type='hidden']), textarea, select",
  tab: "each",
};
const replay: FocusGroup = {
  id: "replay",
  selector: ".replay-panel button, .replay-panel input, .replay-panel textarea",
  tab: "each",
};

/** 数组顺序就是 Tab 组顺序；group 只保留一个停靠点，由方向键在组内选择。 */
export const PAGE_FOCUS_PLANS = {
  home: {
    defaultArrowGroup: "modes",
    initial: ".home-mode-card",
    groups: [
      { id: "modes", selector: ".home-mode-card, .home-embed-link", tab: "group", arrows: "vertical" },
      { id: "demo", selector: ".home-demo-panel canvas", tab: "each" },
    ],
  },
  explore: {
    defaultArrowGroup: "maps",
    tabAction: "cycle-collection",
    initial: ".explore-map-card",
    groups: [
      forms,
      { id: "maps", selector: ".explore-map-card", tab: "group", arrows: "spatial" },
    ],
  },
  adventure: {
    initial: ".adventure-menu-card, .adventure-chapter, a.adventure-level-row, .night-train-menu a",
    groups: [
      { id: "menu", selector: ".adventure-menu-card, a.adventure-level-row, .night-train-menu a", tab: "group", arrows: "vertical" },
      { id: "chapters", selector: ".adventure-chapter", tab: "group", arrows: "spatial" },
    ],
  },
  play: {
    initial: "canvas#game, canvas#editor-game",
    groups: [
      { id: "game", selector: "canvas#game, canvas#editor-game", tab: "each" },
      replay,
    ],
  },
  editor: {
    tabNavigation: false,
    initial: "canvas.editor-canvas",
    groups: [
      { id: "canvas", selector: "canvas.editor-canvas", tab: "each" },
      forms,
    ],
  },
  settings: {
    initial: "[role='tab'][aria-selected='true']",
    groups: [
      { id: "tabs", selector: "[role='tab']", tab: "group", arrows: "horizontal" },
      forms,
      { id: "exchange", selector: ".data-exchange-panel button", tab: "each" },
    ],
  },
  import: {
    groups: [forms, { id: "actions", selector: "button, a[href]", tab: "each" }],
  },
  embed: {
    groups: [forms, { id: "actions", selector: "button, .bc5r-canvas-wrap", tab: "each" }],
  },
} satisfies Record<string, FocusPlan>;

export const RESULT_FOCUS_PLAN: FocusPlan = {
  initial: ".primary-btn:enabled",
  groups: [
    { id: "result-actions", selector: ".result-actions button", tab: "group", arrows: "horizontal" },
  ],
};

export const MODAL_FOCUS_PLAN: FocusPlan = {
  groups: [
    { id: "dialog", selector: "button, a[href], input:not([type='hidden']), textarea, select", tab: "each" },
  ],
};

export function pageFocusPlan(path: string): FocusPlan {
  if (path === "/") return PAGE_FOCUS_PLANS.home;
  if (path.includes("/play/") || path === "/edit/test" || path === "/import/v1")
    return path === "/import/v1" ? PAGE_FOCUS_PLANS.import : PAGE_FOCUS_PLANS.play;
  if (path.startsWith("/explore")) return PAGE_FOCUS_PLANS.explore;
  if (path === "/edit") return PAGE_FOCUS_PLANS.editor;
  if (path.startsWith("/adventure")) return PAGE_FOCUS_PLANS.adventure;
  if (path === "/settings") return PAGE_FOCUS_PLANS.settings;
  if (path === "/embed") return PAGE_FOCUS_PLANS.embed;
  return { groups: [forms] };
}
