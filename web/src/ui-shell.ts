import type { Navigate } from "./common.js";

export type AppMode = "home" | "adventure" | "explore" | "editor" | "custom";

export interface ShellOptions {
  title?: string;
  content: string;
  mode?: AppMode;
  contextInfo?: string;
  showBottomBar?: boolean;
}

const modeLinks: Array<{ mode: AppMode; label: string; href: string }> = [
  { mode: "adventure", label: "冒险", href: "/adventure" },
  { mode: "explore", label: "自由选关", href: "/levels" },
  { mode: "editor", label: "编辑器", href: "/edit" },
];

export function renderAppShell(options: ShellOptions): string {
  const mode = options.mode ?? "home";
  const bottomBar = options.showBottomBar === false ? "" : `
      <footer class="app-bottom-bar">
        <span data-context-info>${options.contextInfo ?? "准备就绪"}</span>
        <button type="button" data-action="screen-control">屏幕摇杆</button>
      </footer>`;

  return `
    <div class="app-shell" data-mode="${mode}">
      <header class="app-topbar">
        <a class="app-brand" href="/" data-nav>Bobby Carrot 5 Remake</a>
        <nav class="mode-switcher" aria-label="游戏模式">
          ${modeLinks.map((item) => `
            <a href="${item.href}" data-nav class="${mode === item.mode ? "active" : ""}">${item.label}</a>
          `).join("")}
        </nav>
        <div class="app-actions">
          <button type="button" data-action="music">♫</button>
          <button type="button" data-action="settings">⚙</button>
          <button type="button" data-action="help">?</button>
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
}

export function closeDialog(root: ParentNode): void {
  const layer = root.querySelector<HTMLElement>("[data-dialog-layer]");
  if (!layer) return;
  layer.innerHTML = "";
  layer.hidden = true;
}

export function renderSettingsDialog(): string {
  return `
    <section class="global-dialog settings-dialog" role="dialog" aria-label="设置">
      <header>设置 <button data-action="close-dialog">×</button></header>
      <div>
        <h3>音频</h3>
        <label>音乐 <input type="checkbox" checked></label>
        <label>音效 <input type="range"></label>
        <h3>操作</h3>
        <label>屏幕摇杆 <input type="checkbox"></label>
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
