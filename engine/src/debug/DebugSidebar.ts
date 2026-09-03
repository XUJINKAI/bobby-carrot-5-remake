import type { Direction } from "@bobby/model";
import type { EntityId } from "../world/entity/EntityInstance.js";
import { resolveGameplayMount } from "../ui/gameplayMount.js";
import type { DebugEntitySnapshot, DebugSnapshot } from "./DebugSnapshot.js";

export interface DebugSidebarActions {
  pauseWorld(): void;
  resumeWorld(): void;
  stepWorld(): void;
  setHeldDirection(direction: Direction | null): void;
  pausePresentation(): void;
  resumePresentation(): void;
  stepPresentation(frames: number): void;
  stepPresentationToNextChange(): void;
  clearTrace(): void;
  close(): void;
  selectEntity(entityId: EntityId): void;
}

type DebugTab = "actor" | "timeline" | "inspect";
type JsonDetailsRef = { details: HTMLDetailsElement; pre: HTMLPreElement };
type ValueRef = { root: HTMLDivElement; value: HTMLSpanElement };

interface InspectEntityRefs {
  entityId: EntityId;
  direction: ValueRef;
  visual: ValueRef;
  traits: JsonDetailsRef;
  behaviors: JsonDetailsRef;
  instanceTraits: JsonDetailsRef;
  properties: JsonDetailsRef;
  state: JsonDetailsRef;
  footprint: JsonDetailsRef;
  presence: JsonDetailsRef;
  visualRuntime: JsonDetailsRef;
  resolvedLayers: JsonDetailsRef;
}

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

  private readonly actorTitle: HTMLDivElement;
  private readonly actorValue: ValueRef;
  private readonly actorPosition: ValueRef;
  private readonly actorDirection: ValueRef;
  private readonly actorInput: ValueRef;
  private readonly actorInputDetails: JsonDetailsRef;
  private readonly actorStateDetails: JsonDetailsRef;
  private readonly actorActionsDetails: JsonDetailsRef;
  private readonly actorPresentationDetails: JsonDetailsRef;
  private readonly directionButtons = new Map<Direction | "release", HTMLButtonElement>();

  private readonly timelineCount: HTMLSpanElement;
  private readonly timelineList: HTMLDivElement;
  private timelineKey = "";

  private readonly inspectMessage: HTMLDivElement;
  private readonly inspectBody: HTMLDivElement;
  private readonly inspectCell: ValueRef;
  private readonly inspectStack: HTMLDivElement;
  private readonly inspectEntityContainer: HTMLDivElement;
  private inspectStackKey = "";
  private inspectEntityRefs: InspectEntityRefs | null = null;

  private activeTab: DebugTab = "actor";
  private worldPaused = false;
  private presentationPaused = false;
  private debugHeldDirection: Direction | null = null;

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
    const actorBody = document.createElement("div");
    const actorSummary = document.createElement("div");
    Object.assign(actorSummary.style, {
      display: "grid",
      gridTemplateColumns: "minmax(0,1fr) auto",
      gap: "12px",
      alignItems: "start",
    });
    const actorFacts = document.createElement("div");
    this.actorValue = this.valueRef("Actor");
    this.actorPosition = this.valueRef("Position");
    this.actorDirection = this.valueRef("Direction");
    this.actorInput = this.valueRef("Input");
    actorFacts.append(
      this.actorValue.root,
      this.actorPosition.root,
      this.actorDirection.root,
      this.actorInput.root,
    );
    actorSummary.append(actorFacts, this.directionPad());
    actorBody.append(actorSummary);
    this.actorInputDetails = this.jsonDetails("Input channels", true);
    this.actorStateDetails = this.jsonDetails("Entity state", true);
    this.actorActionsDetails = this.jsonDetails("Runtime actions", true);
    this.actorPresentationDetails = this.jsonDetails("Presentation", true);
    actorBody.append(
      this.actorInputDetails.details,
      this.actorStateDetails.details,
      this.actorActionsDetails.details,
      this.actorPresentationDetails.details,
    );
    const actorSection = this.section("Selected actor", actorBody);
    this.actorTitle = actorSection.firstElementChild as HTMLDivElement;
    this.actorPanel.append(actorSection);

    this.timelinePanel = document.createElement("div");
    const timelineBody = document.createElement("div");
    const timelineToolbar = document.createElement("div");
    Object.assign(timelineToolbar.style, {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "7px",
    });
    this.timelineCount = document.createElement("span");
    this.timelineCount.style.color = "#8da495";
    timelineToolbar.append(
      this.timelineCount,
      this.button("Clear", () => this.actions.clearTrace()),
    );
    this.timelineList = document.createElement("div");
    timelineBody.append(timelineToolbar, this.timelineList);
    this.timelinePanel.append(this.section("Timeline", timelineBody));

    this.inspectPanel = document.createElement("div");
    const inspectSectionBody = document.createElement("div");
    this.inspectMessage = document.createElement("div");
    this.inspectMessage.textContent = "Click a cell to inspect it.";
    this.inspectBody = document.createElement("div");
    this.inspectCell = this.valueRef("Cell");
    this.inspectStack = document.createElement("div");
    Object.assign(this.inspectStack.style, {
      display: "grid",
      gap: "4px",
      marginTop: "7px",
    });
    this.inspectEntityContainer = document.createElement("div");
    this.inspectBody.append(
      this.inspectCell.root,
      this.inspectStack,
      this.inspectEntityContainer,
    );
    inspectSectionBody.append(this.inspectMessage, this.inspectBody);
    this.inspectPanel.append(this.section("Inspect", inspectSectionBody));

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
      this.actorTitle.textContent = "Selected actor";
      this.setValue(this.actorValue, "-");
      this.setValue(this.actorPosition, "-");
      this.setValue(this.actorDirection, "-");
      this.setValue(this.actorInput, "no actor");
      return;
    }

    const external = snapshot.input?.channels.find(
      (channel) => channel.source === "external",
    );
    this.debugHeldDirection = external?.physicalDirection ?? null;
    const activeChannels = snapshot.input?.channels.filter(
      (channel) =>
        channel.physicalDirection !== null || channel.repeater?.heldInput !== null,
    );
    const inputLabel = snapshot.runtime.inputBlocked
      ? "blocked"
      : activeChannels && activeChannels.length > 0
        ? activeChannels
            .map(
              (channel) =>
                `${channel.source}:${channel.physicalDirection ?? channel.repeater?.heldInput?.direction ?? "held"}`,
            )
            .join(" ")
        : "ready";

    this.actorTitle.textContent = `Selected actor #${actor.id}`;
    this.setValue(this.actorValue, `#${actor.id} ${actor.type}`);
    this.setValue(this.actorPosition, `${actor.anchor.x}, ${actor.anchor.y}`);
    this.setValue(this.actorDirection, actor.direction ?? "-");
    this.setValue(this.actorInput, inputLabel);
    this.updateDirectionPad();
    this.setJson(this.actorInputDetails, snapshot.input);
    this.setJson(this.actorStateDetails, actor.state);
    const ownedActions = snapshot.actions.filter(
      (action) =>
        action.ownerEntityId === actor.id || action.focus?.entityId === actor.id,
    );
    this.setJson(this.actorActionsDetails, ownedActions);
    this.setJson(this.actorPresentationDetails, actor.visual.runtime);
  }

  private directionPad(): HTMLElement {
    const pad = document.createElement("div");
    Object.assign(pad.style, {
      display: "grid",
      gridTemplateColumns: "repeat(3, 30px)",
      gridTemplateRows: "repeat(3, 28px)",
      gap: "3px",
    });
    const cells: Array<[string, Direction | "release"] | null> = [
      null,
      ["↑", "up"],
      null,
      ["←", "left"],
      ["·", "release"],
      ["→", "right"],
      null,
      ["↓", "down"],
      null,
    ];
    for (const cell of cells) {
      if (!cell) {
        pad.append(document.createElement("span"));
        continue;
      }
      const [label, key] = cell;
      const button = this.button(label, () => {
        const direction = key === "release" ? null : key;
        this.actions.setHeldDirection(
          direction !== null && direction === this.debugHeldDirection
            ? null
            : direction,
        );
      });
      button.style.padding = "2px";
      this.directionButtons.set(key, button);
      pad.append(button);
    }
    return pad;
  }

  private updateDirectionPad(): void {
    for (const [key, button] of this.directionButtons) {
      button.disabled = !this.worldPaused;
      button.title = this.worldPaused
        ? key === "release"
          ? "Release debug input"
          : `Hold debug input ${key}`
        : "Pause World before injecting debug input";
      button.style.background =
        key !== "release" && key === this.debugHeldDirection
          ? "#477a53"
          : "#14251a";
    }
  }

  private renderTimeline(snapshot: DebugSnapshot): void {
    const entries = [...(snapshot.trace ?? [])].reverse();
    const key = entries.map((entry) => entry.seq).join(",");
    this.timelineCount.textContent = `${entries.length}/50 events`;
    if (key === this.timelineKey) return;
    this.timelineKey = key;

    const openEntries = new Set(
      [...this.timelineList.querySelectorAll("details[open]")]
        .map((details) => details.getAttribute("data-seq"))
        .filter((value): value is string => value !== null),
    );
    const fragment = document.createDocumentFragment();
    for (const entry of entries) {
      const details = document.createElement("details");
      details.dataset.seq = String(entry.seq);
      details.open = openEntries.has(String(entry.seq));
      const summary = document.createElement("summary");
      summary.style.cursor = "pointer";
      const world = entry.worldTick === null ? "W-" : `W${entry.worldTick}`;
      summary.textContent = `${world} ${entry.category.padEnd(12)} ${entry.summary}`;
      const pre = this.pre();
      pre.textContent = JSON.stringify(entry, null, 2);
      details.append(summary, pre);
      fragment.append(details);
    }
    if (entries.length === 0)
      fragment.append(document.createTextNode("No runtime changes recorded yet."));
    this.timelineList.replaceChildren(fragment);
  }

  private renderInspect(snapshot: DebugSnapshot): void {
    const selection = snapshot.selection;
    this.inspectMessage.hidden = selection !== null;
    this.inspectBody.hidden = selection === null;
    if (!selection) return;

    this.setValue(this.inspectCell, `${selection.cell.x}, ${selection.cell.y}`);
    const stackKey = selection.presences
      .map((presence) => `${presence.entityId}:${presence.stackOrder}:${presence.role ?? ""}`)
      .join("|");
    if (stackKey !== this.inspectStackKey) {
      this.inspectStackKey = stackKey;
      const fragment = document.createDocumentFragment();
      for (const presence of [...selection.presences].reverse()) {
        const button = this.button(
          `[${presence.stackOrder}] #${presence.entityId} ${presence.type}${presence.role ? ` (${presence.role})` : ""}`,
          () => this.actions.selectEntity(presence.entityId),
        );
        button.style.textAlign = "left";
        fragment.append(button);
      }
      if (selection.presences.length === 0)
        fragment.append(document.createTextNode("Empty cell"));
      this.inspectStack.replaceChildren(fragment);
    }

    const entity = selection.entity;
    if (!entity) {
      this.inspectEntityContainer.hidden = true;
      return;
    }
    this.inspectEntityContainer.hidden = false;
    if (!this.inspectEntityRefs || this.inspectEntityRefs.entityId !== entity.id)
      this.buildInspectEntity(entity);
    this.updateInspectEntity(entity);
  }

  private buildInspectEntity(entity: DebugEntitySnapshot): void {
    const refs: InspectEntityRefs = {
      entityId: entity.id,
      direction: this.valueRef("Direction"),
      visual: this.valueRef("Visual"),
      traits: this.jsonDetails("Traits", true),
      behaviors: this.jsonDetails("Behaviors", true),
      instanceTraits: this.jsonDetails("Instance traits"),
      properties: this.jsonDetails("Properties"),
      state: this.jsonDetails("State"),
      footprint: this.jsonDetails("Footprint"),
      presence: this.jsonDetails("Presence"),
      visualRuntime: this.jsonDetails("Visual runtime"),
      resolvedLayers: this.jsonDetails("Resolved layers"),
    };
    const body = document.createElement("div");
    body.append(
      refs.direction.root,
      refs.visual.root,
      refs.traits.details,
      refs.behaviors.details,
      refs.instanceTraits.details,
      refs.properties.details,
      refs.state.details,
      refs.footprint.details,
      refs.presence.details,
      refs.visualRuntime.details,
      refs.resolvedLayers.details,
    );
    this.inspectEntityContainer.replaceChildren(
      this.section(`Entity #${entity.id} ${entity.type}`, body),
    );
    this.inspectEntityRefs = refs;
  }

  private updateInspectEntity(entity: DebugEntitySnapshot): void {
    const refs = this.inspectEntityRefs;
    if (!refs) return;
    this.setValue(refs.direction, entity.direction ?? "-");
    this.setValue(refs.visual, entity.visual.visualId);
    this.setJson(refs.traits, entity.definition.traits);
    this.setJson(refs.behaviors, entity.behaviors);
    this.setJson(refs.instanceTraits, entity.instanceTraits);
    this.setJson(refs.properties, entity.properties);
    this.setJson(refs.state, entity.state);
    this.setJson(refs.footprint, entity.definition.footprint);
    this.setJson(refs.presence, entity.presences);
    this.setJson(refs.visualRuntime, entity.visual.runtime);
    this.setJson(refs.resolvedLayers, entity.visual.renderItems);
  }

  private setTab(tab: DebugTab): void {
    this.activeTab = tab;
    this.actorPanel.hidden = tab !== "actor";
    this.timelinePanel.hidden = tab !== "timeline";
    this.inspectPanel.hidden = tab !== "inspect";
    for (const [key, button] of this.tabButtons)
      button.style.background = key === tab ? "#285135" : "#14251a";
  }

  private valueRef(labelText: string): ValueRef {
    const root = document.createElement("div");
    Object.assign(root.style, {
      display: "grid",
      gridTemplateColumns: "86px minmax(0,1fr)",
      gap: "7px",
    });
    const label = document.createElement("span");
    label.textContent = labelText;
    label.style.color = "#8da495";
    const value = document.createElement("span");
    value.style.overflowWrap = "anywhere";
    root.append(label, value);
    return { root, value };
  }

  private setValue(ref: ValueRef, value: string): void {
    if (ref.value.textContent !== value) ref.value.textContent = value;
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

  private jsonDetails(label: string, open = false): JsonDetailsRef {
    const details = document.createElement("details");
    details.open = open;
    details.style.marginTop = "6px";
    const summary = document.createElement("summary");
    summary.textContent = label;
    summary.style.cursor = "pointer";
    const pre = this.pre();
    details.append(summary, pre);
    return { details, pre };
  }

  private pre(): HTMLPreElement {
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
    return pre;
  }

  private setJson(ref: JsonDetailsRef, value: unknown): void {
    const text = JSON.stringify(value, null, 2) ?? String(value);
    if (ref.pre.textContent !== text) ref.pre.textContent = text;
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
