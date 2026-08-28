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

type ValueMap = Map<string, HTMLSpanElement>;

/** Engine 自带的只读调试侧栏，不依赖 Web / Editor 页面组件。 */
export class DebugSidebar {
  private readonly root: HTMLDivElement;
  private readonly runtimeValues: ValueMap = new Map();
  private readonly selectionValues: ValueMap = new Map();
  private readonly entityValues: ValueMap = new Map();
  private readonly entityJson = new Map<string, HTMLPreElement>();
  private readonly forcedDetails: HTMLDetailsElement;
  private readonly forcedPre: HTMLPreElement;
  private readonly selectionSection: HTMLElement;
  private readonly selectionMessage: HTMLDivElement;
  private readonly selectionData: HTMLDivElement;
  private readonly selectionStack: HTMLDivElement;
  private readonly entitySection: HTMLElement;
  private readonly pauseResumeButton: HTMLButtonElement;
  private readonly step1Button: HTMLButtonElement;
  private readonly step4Button: HTMLButtonElement;
  private selectionStackSignature = "";
  private worldPaused = false;

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

    const content = document.createElement("div");
    content.style.display = "grid";
    content.style.gap = "10px";

    const runtimeBody = document.createElement("div");
    for (const [key, label] of [
      ["worldTick", "World Tick"],
      ["worldHz", "World Hz"],
      ["worldStep", "World Step"],
      ["worldClock", "World Clock"],
      ["presentationFrame", "Present Frame"],
      ["presentationHz", "Present Hz"],
      ["status", "Status"],
      ["moves", "Moves"],
      ["player", "Player"],
      ["facing", "Facing"],
      ["actions", "Actions"],
      ["inputBlocked", "Input Blocked"],
      ["cameraTarget", "Camera Target"],
      ["animating", "Animating"],
    ] as const)
      runtimeBody.append(this.valueRow(label, key, this.runtimeValues));
    const forced = this.jsonDetails("Forced");
    this.forcedDetails = forced.details;
    this.forcedPre = forced.pre;
    runtimeBody.append(this.forcedDetails);

    const controls = document.createElement("div");
    Object.assign(controls.style, {
      display: "flex",
      flexWrap: "wrap",
      gap: "6px",
      marginTop: "8px",
    });
    this.pauseResumeButton = this.button("⏸ Pause", () => {
      if (this.worldPaused) this.actions.resume();
      else this.actions.pause();
    });
    this.pauseResumeButton.setAttribute("aria-label", "Pause World Clock");
    this.step1Button = this.button("+1 Tick", () => this.actions.step(1));
    this.step4Button = this.button("+4 Ticks", () => this.actions.step(4));
    controls.append(
      this.pauseResumeButton,
      this.step1Button,
      this.step4Button,
    );
    runtimeBody.append(controls);

    const selectionBody = document.createElement("div");
    this.selectionMessage = document.createElement("div");
    this.selectionMessage.textContent = "Click a cell to inspect it.";
    this.selectionData = document.createElement("div");
    this.selectionData.append(
      this.valueRow("Cell", "cell", this.selectionValues),
      this.valueRow("Player here", "playerHere", this.selectionValues),
    );
    this.selectionStack = document.createElement("div");
    Object.assign(this.selectionStack.style, {
      display: "grid",
      gap: "4px",
      marginTop: "7px",
    });
    this.selectionData.append(this.selectionStack);
    selectionBody.append(this.selectionMessage, this.selectionData);
    this.selectionSection = this.section("Selection", selectionBody);

    const entityBody = document.createElement("div");
    for (const [key, label] of [
      ["entity", "Entity"],
      ["anchor", "Anchor"],
      ["direction", "Direction"],
      ["stack", "Stack"],
      ["behaviors", "Behaviors"],
      ["visual", "Visual"],
    ] as const)
      entityBody.append(this.valueRow(label, key, this.entityValues));
    for (const label of [
      "Traits",
      "Instance traits",
      "Properties",
      "State",
      "Footprint",
      "Presence",
      "Visual runtime",
      "Resolved layers",
    ]) {
      const block = this.jsonDetails(label);
      this.entityJson.set(label, block.pre);
      entityBody.append(block.details);
    }
    this.entitySection = this.section("Entity", entityBody);

    content.append(
      this.section("Runtime", runtimeBody),
      this.selectionSection,
      this.entitySection,
    );
    this.root.append(header, content);
    mount.append(this.root);
    this.root.hidden = true;
  }

  setEnabled(enabled: boolean): void {
    this.root.hidden = !enabled;
  }

  render(snapshot: DebugSnapshot): void {
    if (this.root.hidden) return;
    this.updateRuntime(snapshot);
    this.updateSelection(snapshot);
  }

  destroy(): void {
    this.root.remove();
  }

  private updateRuntime(snapshot: DebugSnapshot): void {
    const runtime = snapshot.runtime;
    this.worldPaused = runtime.worldPaused;
    this.setValue(this.runtimeValues, "worldTick", String(runtime.worldTickCount));
    this.setValue(this.runtimeValues, "worldHz", String(runtime.worldHz));
    this.setValue(this.runtimeValues, "worldStep", `${runtime.worldStepMs} ms`);
    this.setValue(
      this.runtimeValues,
      "worldClock",
      runtime.worldPaused ? "paused" : "running",
    );
    this.setValue(
      this.runtimeValues,
      "presentationFrame",
      String(runtime.presentationFrame),
    );
    this.setValue(this.runtimeValues, "presentationHz", String(runtime.presentationHz));
    this.setValue(this.runtimeValues, "status", runtime.status);
    this.setValue(this.runtimeValues, "moves", String(runtime.moves));
    this.setValue(
      this.runtimeValues,
      "player",
      runtime.player ? `${runtime.player.x}, ${runtime.player.y}` : "-",
    );
    this.setValue(this.runtimeValues, "facing", runtime.facing ?? "-");
    this.setValue(this.runtimeValues, "actions", String(runtime.actionCount));
    this.setValue(this.runtimeValues, "inputBlocked", String(runtime.inputBlocked));
    this.setValue(
      this.runtimeValues,
      "cameraTarget",
      runtime.cameraTarget === null ? "Bobby" : `#${runtime.cameraTarget}`,
    );
    this.setValue(this.runtimeValues, "animating", String(runtime.animating));
    this.forcedDetails.hidden = runtime.forced === null;
    if (runtime.forced !== null) this.forcedPre.textContent = formatJson(runtime.forced);
    this.pauseResumeButton.textContent = runtime.worldPaused
      ? "▶ Resume"
      : "⏸ Pause";
    const clockAction = runtime.worldPaused ? "Resume" : "Pause";
    this.pauseResumeButton.title = `${clockAction} World Clock`;
    this.pauseResumeButton.setAttribute(
      "aria-label",
      `${clockAction} World Clock`,
    );
    this.step1Button.disabled = !runtime.worldPaused;
    this.step4Button.disabled = !runtime.worldPaused;
  }

  private updateSelection(snapshot: DebugSnapshot): void {
    const selection = snapshot.selection;
    this.selectionMessage.hidden = selection !== null;
    this.selectionData.hidden = selection === null;
    this.entitySection.hidden = !selection?.entity;
    if (!selection) return;

    this.setValue(this.selectionValues, "cell", `${selection.cell.x}, ${selection.cell.y}`);
    this.setValue(this.selectionValues, "playerHere", String(selection.playerHere));
    const signature = JSON.stringify(
      selection.presences.map((presence) => [
        presence.entityId,
        presence.type,
        presence.role,
        presence.stackBand,
      ]),
    );
    if (signature !== this.selectionStackSignature) {
      this.selectionStackSignature = signature;
      const buttons = [...selection.presences].reverse().map((presence) => {
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
        return button;
      });
      this.selectionStack.replaceChildren(
        ...(buttons.length > 0 ? buttons : [document.createTextNode("Empty cell")]),
      );
    }
    if (selection.entity) this.updateEntity(selection.entity);
  }

  private updateEntity(entity: DebugEntitySnapshot): void {
    this.setValue(this.entityValues, "entity", `#${entity.id} ${entity.type}`);
    this.setValue(this.entityValues, "anchor", `${entity.anchor.x}, ${entity.anchor.y}`);
    this.setValue(this.entityValues, "direction", entity.direction ?? "-");
    this.setValue(this.entityValues, "stack", entity.definition.stackBand);
    this.setValue(this.entityValues, "behaviors", entity.behaviors.join(", ") || "-");
    this.setValue(this.entityValues, "visual", entity.visual.visualId);
    this.setJson("Traits", entity.definition.traits);
    this.setJson("Instance traits", entity.instanceTraits);
    this.setJson("Properties", entity.properties);
    this.setJson("State", entity.state);
    this.setJson("Footprint", entity.definition.footprint);
    this.setJson("Presence", entity.presences);
    this.setJson("Visual runtime", entity.visual.runtime);
    this.setJson("Resolved layers", entity.visual.renderItems);
  }

  private setValue(values: ValueMap, key: string, value: string): void {
    const target = values.get(key);
    if (target && target.textContent !== value) target.textContent = value;
  }

  private setJson(label: string, value: unknown): void {
    const target = this.entityJson.get(label);
    const text = formatJson(value);
    if (target && target.textContent !== text) target.textContent = text;
  }

  private valueRow(labelText: string, key: string, values: ValueMap): HTMLElement {
    const row = document.createElement("div");
    Object.assign(row.style, {
      display: "grid",
      gridTemplateColumns: "100px minmax(0, 1fr)",
      gap: "7px",
    });
    const label = document.createElement("span");
    label.textContent = labelText;
    label.style.color = "#8da495";
    const data = document.createElement("span");
    data.style.overflowWrap = "anywhere";
    values.set(key, data);
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

  private jsonDetails(label: string): {
    details: HTMLDetailsElement;
    pre: HTMLPreElement;
  } {
    const details = document.createElement("details");
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
    details.append(summary, pre);
    return { details, pre };
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

function formatJson(value: unknown): string {
  return JSON.stringify(value, null, 2) ?? String(value);
}
