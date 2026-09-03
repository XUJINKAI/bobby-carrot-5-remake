import type { EntityId } from "../world/entity/EntityInstance.js";
import { resolveGameplayMount } from "../ui/gameplayMount.js";
import type { DebugEntitySnapshot, DebugSnapshot } from "./DebugSnapshot.js";

export interface DebugSidebarActions {
  pauseWorld(): void;
  resumeWorld(): void;
  stepWorld(): void;
  pausePresentation(): void;
  resumePresentation(): void;
  stepPresentation(frames: number): void;
  stepPresentationToNextChange(): void;
  clearTrace(): void;
  close(): void;
  selectEntity(entityId: EntityId): void;
}

type DebugTab = "actor" | "timeline" | "inspect";

/** Engine 自带的运行时调试侧栏，不依赖 Web / Editor 页面组件。 */
export class DebugSidebar {
  private readonly root: HTMLDivElement;
  private readonly worldStatus: HTMLSpanElement;
  private readonly presentationStatus: HTMLSpanElement;
  private readonly worldPauseResumeButton: HTMLButtonElement;
  private readonly worldStepButton: HTMLButtonElement;
  private readonly presentationPauseResumeButton: HTMLButtonElement;
  private readonly frameBackButton: HTMLButtonElement;
  private readonly frameForwardButton: HTMLButtonElement;
  private readonly nextChangeButton: HTMLButtonElement;
  private readonly actorPanel: HTMLDivElement;
  private readonly timelinePanel: HTMLDivElement;
  private readonly inspectPanel: HTMLDivElement;
  private readonly tabButtons = new Map<DebugTab, HTMLButtonElement>();
  private activeTab: DebugTab = "actor";
  private worldPaused = false;
  private presentationPaused = false;

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
      width: "min(420px, 94%)",
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

    const clock = document.createElement("div");
    Object.assign(clock.style, {
      display: "grid",
      gap: "7px",
      marginBottom: "10px",
      padding: "9px",
      border: "1px solid rgba(255,255,255,.12)",
      borderRadius: "6px",
      background: "rgba(255,255,255,.035)",
    });

    const worldRow = document.createElement("div");
    Object.assign(worldRow.style, {
      display: "grid",
      gridTemplateColumns: "minmax(0,1fr) auto auto",
      gap: "6px",
      alignItems: "center",
    });
    this.worldStatus = document.createElement("span");
    this.worldPauseResumeButton = this.button("⏸ World", () => {
      if (this.worldPaused) this.actions.resumeWorld();
      else this.actions.pauseWorld();
    });
    this.worldStepButton = this.button("Step", () => this.actions.stepWorld());
    worldRow.append(
      this.worldStatus,
      this.worldPauseResumeButton,
      this.worldStepButton,
    );

    const presentRow = document.createElement("div");
    Object.assign(presentRow.style, {
      display: "grid",
      gridTemplateColumns: "minmax(0,1fr) auto auto auto auto",
      gap: "6px",
      alignItems: "center",
    });
    this.presentationStatus = document.createElement("span");
    this.presentationPauseResumeButton = this.button("⏸ Present", () => {
      if (this.presentationPaused) this.actions.resumePresentation();
      else this.actions.pausePresentation();
    });
    this.frameBackButton = this.button("-1", () => this.actions.stepPresentation(-1));
    this.frameForwardButton = this.button("+1", () => this.actions.stepPresentation(1));
    this.nextChangeButton = this.button("Next", () =>
      this.actions.stepPresentationToNextChange(),
    );
    this.nextChangeButton.title = "Jump to the end of the current visible motion";
    presentRow.append(
      this.presentationStatus,
      this.presentationPauseResumeButton,
      this.frameBackButton,
      this.frameForwardButton,
      this.nextChangeButton,
    );
    clock.append(worldRow, presentRow);

    const tabs = document.createElement("div");
    Object.assign(tabs.style, {
      display: "grid",
      gridTemplateColumns: "repeat(3,minmax(0,1fr))",
      gap: "6px",
      marginBottom: "10px",
    });
    for (const [tab, label] of [
      ["actor", "Actor"],
      ["timeline", "Timeline"],
      ["inspect", "Inspect"],
    ] as const) {
      const button = this.button(label, () => this.setTab(tab));
      this.tabButtons.set(tab, button);
      tabs.append(button);
    }

    this.actorPanel = document.createElement("div");
    this.timelinePanel = document.createElement("div");
    this.inspectPanel = document.createElement("div");

    this.root.append(
      header,
      clock,
      tabs,
      this.actorPanel,
      this.timelinePanel,
      this.inspectPanel,
    );
    mount.append(this.root);
    this.root.hidden = true;
    this.setTab("actor");
  }

  setEnabled(enabled: boolean): void {
    this.root.hidden = !enabled;
  }

  render(snapshot: DebugSnapshot): void {
    if (this.root.hidden) return;
    this.updateClocks(snapshot);
    this.renderActor(snapshot);
    this.renderTimeline(snapshot);
    this.renderInspect(snapshot);
  }

  destroy(): void {
    this.root.remove();
  }

  private updateClocks(snapshot: DebugSnapshot): void {
    const runtime = snapshot.runtime;
    this.worldPaused = runtime.worldPaused;
    this.presentationPaused = runtime.presentationPaused;
    this.worldStatus.textContent = `World W${runtime.worldTickCount} · ${runtime.worldHz}Hz`;
    this.presentationStatus.textContent = `Present P${runtime.presentationFrame} · ${runtime.presentationHz}Hz`;
    this.worldPauseResumeButton.textContent = runtime.worldPaused ? "▶ World" : "⏸ World";
    this.presentationPauseResumeButton.textContent = runtime.presentationPaused
      ? "▶ Present"
      : "⏸ Present";
    this.worldStepButton.disabled = !runtime.worldPaused;
    this.frameBackButton.disabled =
      !runtime.presentationPaused || runtime.presentationFrame <= 0;
    this.frameForwardButton.disabled = !runtime.presentationPaused;
    this.nextChangeButton.disabled = !runtime.presentationPaused;
  }

  private renderActor(snapshot: DebugSnapshot): void {
    const actor = snapshot.actor;
    if (!actor) {
      this.actorPanel.replaceChildren(document.createTextNode("No player actor."));
      return;
    }
    const body = document.createElement("div");
    body.append(
      this.valueRow("Actor", `#${actor.id} ${actor.type}`),
      this.valueRow("Position", `${actor.anchor.x}, ${actor.anchor.y}`),
      this.valueRow("Direction", actor.direction ?? "-"),
      this.valueRow("Input", snapshot.runtime.inputBlocked ? "blocked" : "ready"),
    );
    body.append(this.jsonDetails("Entity state", actor.state, true));
    const ownedActions = snapshot.actions.filter(
      (action) =>
        action.ownerEntityId === actor.id || action.focus?.entityId === actor.id,
    );
    body.append(this.jsonDetails("Runtime actions", ownedActions, true));
    body.append(this.jsonDetails("Presentation", actor.visual.runtime, true));
    this.actorPanel.replaceChildren(this.section(`Selected actor #${actor.id}`, body));
  }

  private renderTimeline(snapshot: DebugSnapshot): void {
    const entries = [...(snapshot.trace ?? [])].reverse();
    const body = document.createElement("div");
    const toolbar = document.createElement("div");
    Object.assign(toolbar.style, {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "7px",
    });
    const count = document.createElement("span");
    count.textContent = `${entries.length}/50 events`;
    count.style.color = "#8da495";
    toolbar.append(count, this.button("Clear", () => this.actions.clearTrace()));
    body.append(toolbar);

    for (const entry of entries) {
      const details = document.createElement("details");
      const summary = document.createElement("summary");
      summary.style.cursor = "pointer";
      const world = entry.worldTick === null ? "W-" : `W${entry.worldTick}`;
      summary.textContent = `${world} ${entry.category.padEnd(12)} ${entry.summary}`;
      details.append(summary);
      const pre = document.createElement("pre");
      Object.assign(pre.style, {
        margin: "5px 0 7px",
        padding: "7px",
        overflow: "auto",
        borderRadius: "4px",
        background: "#020604",
        whiteSpace: "pre-wrap",
      });
      pre.textContent = JSON.stringify(entry, null, 2);
      details.append(pre);
      body.append(details);
    }
    if (entries.length === 0)
      body.append(document.createTextNode("No runtime changes recorded yet."));
    this.timelinePanel.replaceChildren(this.section("Timeline", body));
  }

  private renderInspect(snapshot: DebugSnapshot): void {
    const selection = snapshot.selection;
    if (!selection) {
      this.inspectPanel.replaceChildren(
        this.section("Inspect", document.createTextNode("Click a cell to inspect it.")),
      );
      return;
    }
    const body = document.createElement("div");
    body.append(this.valueRow("Cell", `${selection.cell.x}, ${selection.cell.y}`));
    const stack = document.createElement("div");
    Object.assign(stack.style, { display: "grid", gap: "4px", marginTop: "7px" });
    for (const presence of [...selection.presences].reverse()) {
      const button = this.button(
        `[${presence.stackOrder}] #${presence.entityId} ${presence.type}${presence.role ? ` (${presence.role})` : ""}`,
        () => this.actions.selectEntity(presence.entityId),
      );
      button.style.textAlign = "left";
      stack.append(button);
    }
    if (selection.presences.length === 0) stack.append("Empty cell");
    body.append(stack);
    if (selection.entity) body.append(this.entityDetails(selection.entity));
    this.inspectPanel.replaceChildren(this.section("Inspect", body));
  }

  private entityDetails(entity: DebugEntitySnapshot): HTMLElement {
    const body = document.createElement("div");
    body.append(
      this.valueRow("Entity", `#${entity.id} ${entity.type}`),
      this.valueRow("Direction", entity.direction ?? "-"),
      this.valueRow("Visual", entity.visual.visualId),
      this.jsonDetails("Traits", entity.definition.traits, true),
      this.jsonDetails("Behaviors", entity.behaviors, true),
      this.jsonDetails("Instance traits", entity.instanceTraits),
      this.jsonDetails("Properties", entity.properties),
      this.jsonDetails("State", entity.state),
      this.jsonDetails("Footprint", entity.definition.footprint),
      this.jsonDetails("Presence", entity.presences),
      this.jsonDetails("Visual runtime", entity.visual.runtime),
      this.jsonDetails("Resolved layers", entity.visual.renderItems),
    );
    return body;
  }

  private setTab(tab: DebugTab): void {
    this.activeTab = tab;
    this.actorPanel.hidden = tab !== "actor";
    this.timelinePanel.hidden = tab !== "timeline";
    this.inspectPanel.hidden = tab !== "inspect";
    for (const [key, button] of this.tabButtons)
      button.style.background = key === tab ? "#285135" : "#14251a";
  }

  private valueRow(labelText: string, value: string): HTMLElement {
    const row = document.createElement("div");
    Object.assign(row.style, {
      display: "grid",
      gridTemplateColumns: "86px minmax(0,1fr)",
      gap: "7px",
    });
    const label = document.createElement("span");
    label.textContent = labelText;
    label.style.color = "#8da495";
    const data = document.createElement("span");
    data.textContent = value;
    data.style.overflowWrap = "anywhere";
    row.append(label, data);
    return row;
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

  private jsonDetails(label: string, value: unknown, open = false): HTMLDetailsElement {
    const details = document.createElement("details");
    details.open = open;
    details.style.marginTop = "6px";
    const summary = document.createElement("summary");
    summary.textContent = label;
    summary.style.cursor = "pointer";
    const pre = document.createElement("pre");
    Object.assign(pre.style, {
      margin: "6px 0 0",
      padding: "7px",
      overflow: "auto",
      borderRadius: "4px",
      background: "#020604",
      whiteSpace: "pre-wrap",
      overflowWrap: "anywhere",
    });
    pre.textContent = JSON.stringify(value, null, 2) ?? String(value);
    details.append(summary, pre);
    return details;
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
