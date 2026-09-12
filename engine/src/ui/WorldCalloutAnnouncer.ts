import { resolveGameplayMount } from "./gameplayMount.js";

/** Canvas Callout 的辅助技术镜像；视觉布局仍完全由 Renderer 承担。 */
export class WorldCalloutAnnouncer {
  readonly root: HTMLDivElement;
  private announcementVersion = 0;

  constructor(canvas: HTMLCanvasElement) {
    const mount = resolveGameplayMount(canvas, undefined, "WorldCalloutAnnouncer");
    this.root = document.createElement("div");
    this.root.className = "engine-world-callout-status";
    this.root.setAttribute("role", "status");
    this.root.setAttribute("aria-live", "polite");
    this.root.setAttribute("aria-atomic", "true");
    Object.assign(this.root.style, {
      position: "absolute",
      width: "1px",
      height: "1px",
      padding: "0",
      margin: "-1px",
      overflow: "hidden",
      clip: "rect(0, 0, 0, 0)",
      whiteSpace: "nowrap",
      border: "0",
    });
    mount.append(this.root);
  }

  announce(message: string): void {
    const normalized = message.trim();
    if (!normalized) return;
    const version = ++this.announcementVersion;
    this.root.textContent = "";
    queueMicrotask(() => {
      if (version === this.announcementVersion && this.root.isConnected)
        this.root.textContent = normalized;
    });
  }

  clear(): void {
    this.announcementVersion += 1;
    this.root.textContent = "";
  }

  destroy(): void {
    this.clear();
    this.root.remove();
  }
}

export function createWorldCalloutAnnouncer(
  canvas: HTMLCanvasElement,
): WorldCalloutAnnouncer | null {
  if (
    typeof document === "undefined" ||
    typeof window === "undefined" ||
    !canvas.parentElement
  )
    return null;
  return new WorldCalloutAnnouncer(canvas);
}
