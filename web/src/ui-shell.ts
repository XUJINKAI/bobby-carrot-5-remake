import type { Navigate } from "./common.js";

export type AppMode = "home" | "adventure" | "explore" | "editor" | "custom";

export interface ShellOptions {
  title?: string;
  content: string;
  mode?: AppMode;
  contextActions?: string;
  contextInfo?: string;
  showBottomBar?: boolean;
  showScreenControlToggle?: boolean;
}

const modeLinks: Array<{ mode: AppMode; label: string; href: string }> = [
  { mode: "adventure", label: "冒险模式", href: "/adventure" },
  { mode: "explore", label: "自由探索模式", href: "/levels" },
  { mode: "editor", label: "编辑器模式", href: "/edit" },
];

const SCREEN_CONTROL_STORAGE_KEY = "bc5r:screen-control";

export function loadScreenControlPreference(): boolean {
  const stored = localStorage.getItem(SCREEN_CONTROL_STORAGE_KEY);
  if (stored !== null) return stored === "true";
  return window.matchMedia("(pointer: coarse)").matches;
}

export function storeScreenControlPreference(
  root: ParentNode,
  enabled: boolean,
): void {
  localStorage.setItem(SCREEN_CONTROL_STORAGE_KEY, String(enabled));
  if (root instanceof HTMLElement) {
    root.dispatchEvent(
      new CustomEvent("screen-control-change", {
        bubbles: true,
        detail: { enabled },
      }),
    );
  }
}

export function renderAppShell(options: ShellOptions): string {
  const mode = options.mode ?? "home";
  const selectedMode = mode === "custom" ? "explore" : mode;
  const currentMode = modeLinks.find((item) => item.mode === selectedMode);
  const modeSelector = currentMode
    ? `<details class="mode-selector">
        <summary>${currentMode.label}</summary>
        <nav aria-label="切换模式">
          ${modeLinks.map((item) => `
            <a href="${item.href}" data-nav class="${selectedMode === item.mode ? "active" : ""}">
              <span aria-hidden="true">${selectedMode === item.mode ? "✓" : ""}</span>${item.label}
            </a>`).join("")}
        </nav>
      </details>`
    : "";
  const bottomBar = options.showBottomBar === false ? "" : `
      <footer class="app-bottom-bar">
        <span data-context-info>${options.contextInfo ?? "准备就绪"}</span>
        ${options.showScreenControlToggle === false ? "" : '<button type="button" data-action="screen-control" aria-pressed="false">屏幕摇杆：关</button>'}
      </footer>`;

  return `
    <div class="app-shell" data-mode="${mode}">
      <header class="app-topbar">
        <a class="app-brand" href="/" data-nav><img src="assets/art/hd/icon.png" alt="">Bobby Carrot 5 Remake</a>
        ${modeSelector}
        <div class="app-context-actions">${options.contextActions ?? options.title ?? ""}</div>
        <div class="app-actions">
          <button type="button" data-action="music" title="音乐" aria-label="音乐">♫</button>
          <button type="button" data-action="settings" title="设置" aria-label="设置">⚙</button>
          <button type="button" data-action="help" title="帮助" aria-label="帮助">?</button>
        </div>
      </header>
      <main class="app-content">${options.content}</main>
      ${bottomBar}
      <div class="global-dialog-layer" data-dialog-layer hidden></div>
    </div>
  `;
}

export function openDialog(root: ParentNode, html: string): void {
  const layer = root.querySelector<HTMLElement>("[data-dialog-layer]");
  if (!layer) return;
  layer.innerHTML = html;
  layer.hidden = false;
  layer.dispatchEvent(new CustomEvent("shell-dialog-open", { bubbles: true }));
}

export function closeDialog(root: ParentNode): void {
  const layer = root.querySelector<HTMLElement>("[data-dialog-layer]");
  if (!layer || layer.hidden) return;
  layer.innerHTML = "";
  layer.hidden = true;
  layer.dispatchEvent(new CustomEvent("shell-dialog-close", { bubbles: true }));
}

export function renderSettingsDialog(options: {
  musicEnabled: boolean;
  musicVolume: number;
  soundVolume: number;
  screenControlEnabled: boolean;
  tone: "fm" | "chip";
  reverb: number;
  bonusCoins: number;
  goldenCarrots: number;
  completedLevels: number;
}): string {
  return `
    <section class="global-dialog settings-dialog" role="dialog" aria-label="设置">
      <header>设置 <button data-action="close-dialog">×</button></header>
      <div>
        <h3>音频</h3>
        <label>音乐 <input data-setting="music-enabled" type="checkbox" ${options.musicEnabled ? "checked" : ""}></label>
        <label>音乐音量 <input data-setting="music-volume" type="range" min="0" max="100" value="${options.musicVolume}"></label>
        <label>音效音量 <input data-setting="sound-volume" type="range" min="0" max="100" value="${options.soundVolume}"></label>
        <label>MIDI 音色 <select data-setting="midi-tone"><option value="fm" ${options.tone === "fm" ? "selected" : ""}>TinySynth FM</option><option value="chip" ${options.tone === "chip" ? "selected" : ""}>TinySynth Chip</option></select></label>
        <label>混响 <input data-setting="midi-reverb" type="range" min="0" max="100" value="${options.reverb}"></label>
        <h3>操作</h3>
        <label>屏幕摇杆 <input data-setting="screen-control" type="checkbox" ${options.screenControlEnabled ? "checked" : ""}></label>
        <h3>Adventure Save</h3>
        <p class="settings-save-summary">Bonus Coin ${options.bonusCoins} · Golden Carrot ${options.goldenCarrots} · 已完成 ${options.completedLevels}</p>
        <div class="settings-save-actions">
          <button type="button" data-settings-action="export">导出</button>
          <button type="button" data-settings-action="import">导入</button>
          <button type="button" data-settings-action="reset">清空</button>
          <input data-settings-file type="file" accept="application/json,.json" hidden>
        </div>
        <p class="settings-feedback" data-settings-feedback aria-live="polite"></p>
      </div>
    </section>`;
}

export function renderHelpDialog(context: AppMode): string {
  return `
    <section class="global-dialog help-dialog" role="dialog" aria-label="帮助">
      <header>${context} 操作帮助 <button data-action="close-dialog">×</button></header>
      <div>
        <p>WASD / 方向键：移动</p>
        <p>拖动画面：查看地图</p>
        ${context === "editor" ? "<p>右键 / Del：删除对象，Q / E：切换形态</p>" : ""}
      </div>
    </section>`;
}

export function bindShellNavigation(root: ParentNode, navigate: Navigate): void {
  root.querySelectorAll<HTMLAnchorElement>("a[data-nav]").forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      navigate(link.getAttribute("href") ?? "/");
    });
  });
}
