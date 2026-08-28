import type { EntityId } from "../world/entity/EntityInstance.js";
import { resolveGameplayMount } from "../ui/gameplayMount.js";
import type {
  DebugEntitySnapshot,
  DebugSnapshot,
} from "./DebugSnapshot.js";

export interface DebugSidebarActions {
  pause(): void;
  resume(): void;
  step(count: number): void;
  close(): void;
  selectEntity(entityId: EntityId): void;
}

/** Engine 自带的只读调试侧栏，不依赖 Web / Editor 页面组件。 */
export class DebugSidebar {
  private readonly root: HTMLDivElement;
  private readonly content: HTMLDivElement;

  constructor(
    canvas: HTMLCanvasElement,
    private readonly actions: DebugSidebarActions,
  ) {
    const mount = resolveGameplayMount(canvas, undefined, "DebugSidebar");
    this.root = document.createElement("div");
    this.root.className = "engine-debug-sidebar";
    this.root.setAttribute("aria-label", "Engine Debug");
    Object.assign(this.root.style, {
      position: "absolute",
      top: "0",
      right: "0",
      bottom: "0",
      width: "min(380px, 92%)",
      zIndex: "30",
      overflow: "auto",
      boxSizing: "border-box",
      padding: "12px",
      borderLeft: "1px solid rgba(255,255,255,.18)",
      background: "rgba(4, 11, 7, .96)",
      boxShadow: "-16px 0 36px rgba(0,0,0,.42)",
      color: "#e8f3ea",
      font: "12px/1.45 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
      pointerEvents: "auto",
    });

    const header = document.createElement("header");
    Object.assign(header.style, {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: "8px",
      marginBottom: "10px",
    });
    const title = document.createElement("strong");
    title.textContent = "ENGINE DEBUG";
    title.style.letterSpacing = ".08em";
    const close = this.button("×", () => this.actions.close());
    close.setAttribute("aria-label", "Close Engine Debug");
    header.append(title, close);

    this.content = document.createElement("div");
    this.content.style.display = "grid";
    this.content.style.gap = "10px";
    this.root.append(header, this.content);
    mount.append(this.root);
    this.root.hidden = true;
  }

  setEnabled(enabled: boolean): void {
    this.root.hidden = !enabled;
  }

  render(snapshot: DebugSnapshot): void {
    if (this.root.hidden) return;
    this.content.replaceChildren();
    this.content.append(this.runtimeSection(snapshot));
    const selection = snapshot.selection;
    if (!selection) {
      this.content.append(
        this.section("Selection", this.text("Click a cell to inspect it.")),
      );
      return;
    }

    this.content.append(this.selectionSection(snapshot));
    if (selection.entity) this.content.append(this.entitySection(selection.entity));
  }

  destroy(): void {
    this.root.remove();
  }

  private runtimeSection(snapshot: DebugSnapshot): HTMLElement {
    const runtime = snapshot.runtime;
    const rows = document.createElement("div");
    rows.append(
      this.kv("Tick", String(runtime.tickCount)),
      this.kv("Step", `${runtime.stepMs} ms`),
      this.kv("Clock", runtime.paused ? "paused" : "running"),
      this.kv("Status", runtime.status),
      this.kv("Moves", String(runtime.moves)),
      this.kv(
        "Player",
        runtime.player ? `${runtime.player.x}, ${runtime.player.y}` : "-",
      ),
      this.kv("Facing", runtime.facing ?? "-"),
      this.kv("Animating", String(runtime.animating)),
    );
    if (runtime.forced) rows.append(this.jsonBlock("Forced", runtime.forced));

    const controls = document.createElement("div");
    Object.assign(controls.style, {
      display: "flex",
      flexWrap: "wrap",
      gap: "6px",
      marginTop: "8px",
    });
    const pause = this.button("Pause", () => this.actions.pause());
    const step1 = this.button("+1 Tick", () => this.actions.step(1));
    const step4 = this.button("+4 Ticks", () => this.actions.step(4));
    const resume = this.button("Resume", () => this.actions.resume());
    pause.disabled = runtime.paused;
    step1.disabled = !runtime.paused;
    step4.disabled = !runtime.paused;
    resume.disabled = !runtime.paused;
    controls.append(pause, step1, step4, resume);
    rows.append(controls);
    return this.section("Runtime", rows);
  }

  private selectionSection(snapshot: DebugSnapshot): HTMLElement {
    const selection = snapshot.selection!;
    const body = document.createElement("div");
    body.append(
      this.kv("Cell", `${selection.cell.x}, ${selection.cell.y}`),
      this.kv("Player here", String(selection.playerHere)),
    );
    const stack = document.createElement("div");
    stack.style.display = "grid";
    stack.style.gap = "4px";
    stack.style.marginTop = "7px";
    for (const presence of [...selection.presences].reverse()) {
      const label = [
        `[${presence.stackBand}]`,
        `#${presence.entityId}`,
        presence.type,
        presence.role ? `(${presence.role})` : "",
      ]
        .filter(Boolean)
        .join(" ");
      const button = this.button(label, () =>
        this.actions.selectEntity(presence.entityId),
      );
      button.style.textAlign = "left";
      button.style.width = "100%";
      stack.append(button);
    }
    if (selection.presences.length === 0) stack.append(this.text("Empty cell"));
    body.append(stack);
    return this.section("Selection", body);
  }

  private entitySection(entity: DebugEntitySnapshot): HTMLElement {
    const body = document.createElement("div");
    body.append(
      this.kv("Entity", `#${entity.id} ${entity.type}`),
      this.kv("Anchor", `${entity.anchor.x}, ${entity.anchor.y}`),
      this.kv("Direction", entity.direction ?? "-"),
      this.kv("Stack", entity.definition.stackBand),
      this.kv("Behaviors", entity.behaviors.join(", ") || "-"),
      this.kv("Visual", entity.visual.visualId),
      this.jsonBlock("Traits", entity.definition.traits),
      this.jsonBlock("Instance traits", entity.instanceTraits),
      this.jsonBlock("Properties", entity.properties),
      this.jsonBlock("State", entity.state),
      this.jsonBlock("Footprint", entity.definition.footprint),
      this.jsonBlock("Presence", entity.presences),
      this.jsonBlock("Visual runtime", entity.visual.runtime),
      this.jsonBlock("Resolved layers", entity.visual.renderItems),
    );
    return this.section("Entity", body);
  }

  private section(titleText: string, body: Node): HTMLElement {
    const section = document.createElement("section");
    Object.assign(section.style, {
      padding: "9px",
      border: "1px solid rgba(255,255,255,.12)",
      borderRadius: "6px",
      background: "rgba(255,255,255,.035)",
    });
    const title = document.createElement("div");
    title.textContent = titleText;
    Object.assign(title.style, {
      marginBottom: "7px",
      color: "#9fd6aa",
      fontWeight: "700",
      letterSpacing: ".04em",
    });
    section.append(title, body);
    return section;
  }

  private kv(key: string, value: string): HTMLElement {
    const row = document.createElement("div");
    row.style.display = "grid";
    row.style.gridTemplateColumns = "90px minmax(0, 1fr)";
    row.style.gap = "7px";
    const label = document.createElement("span");
    label.textContent = key;
    label.style.color = "#8da495";
    const data = document.createElement("span");
    data.textContent = value;
    data.style.overflowWrap = "anywhere";
    row.append(label, data);
    return row;
  }

  private jsonBlock(label: string, value: unknown): HTMLElement {
    const details = document.createElement("details");
    details.style.marginTop = "6px";
    const summary = document.createElement("summary");
    summary.textContent = label;
    summary.style.cursor = "pointer";
    const pre = document.createElement("pre");
    pre.textContent = JSON.stringify(value, null, 2) ?? String(value);
    Object.assign(pre.style, {
      margin: "6px 0 0",
      padding: "7px",
      overflow: "auto",
      borderRadius: "4px",
      background: "#020604",
      whiteSpace: "pre-wrap",
      overflowWrap: "anywhere",
    });
    details.append(summary, pre);
    return details;
  }

  private text(value: string): Text {
    return document.createTextNode(value);
  }

  private button(label: string, action: () => void): HTMLButtonElement {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = label;
    Object.assign(button.style, {
      padding: "5px 8px",
      border: "1px solid rgba(255,255,255,.2)",
      borderRadius: "4px",
      background: "#14251a",
      color: "inherit",
      font: "inherit",
      cursor: "pointer",
    });
    button.addEventListener("click", action);
    return button;
  }
}
