import type { Navigate } from "./common.js";

export interface ShellOptions {
  title?: string;
  content: string;
  mode?: "home" | "adventure" | "explore" | "editor";
}

export function renderAppShell(options: ShellOptions): string {
  const mode = options.mode ?? "home";
  return `
    <div class="app-shell" data-mode="${mode}">
      <header class="app-topbar">
        <a class="app-brand" href="/" data-nav>Bobby Carrot 5 Remake</a>
        <nav class="mode-switcher">
          <a href="/adventure" data-nav class="${mode === "adventure" ? "active" : ""}">冒险</a>
          <a href="/levels" data-nav class="${mode === "explore" ? "active" : ""}">自由选关</a>
          <a href="/edit" data-nav class="${mode === "editor" ? "active" : ""}">编辑器</a>
        </nav>
        <div class="app-actions">
          <button type="button" data-action="music">♫</button>
          <button type="button" data-action="settings">⚙</button>
          <button type="button" data-action="help">?</button>
        </div>
      </header>
      <main class="app-content">${options.content}</main>
      <footer class="app-bottom-bar">
        <span data-context-info>准备就绪</span>
        <button type="button" data-action="screen-control">屏幕摇杆</button>
      </footer>
    </div>
  `;
}

export function bindShellNavigation(root: ParentNode, navigate: Navigate): void {
  root.querySelectorAll<HTMLAnchorElement>("a[data-nav]").forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      navigate(link.getAttribute("href") ?? "/");
    });
  });
}
