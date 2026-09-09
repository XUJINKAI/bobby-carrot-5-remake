import type { EntityId } from "../world/entity/EntityInstance.js";
import {
  createGameplayRightInset,
  resolveGameplayMount,
  type GameplayRightInsetLease,
} from "../ui/gameplayMount.js";
import type { DebugEntitySnapshot, DebugSnapshot } from "./DebugSnapshot.js";
import {
  DebugControlPanel,
  type DebugControlPanelActions,
} from "./DebugControlPanel.js";

export interface DebugSidebarActions extends DebugControlPanelActions {
  clearTrace(): void;
  selectEntity(entityId: EntityId): void;
  layoutChanged(): void;
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
  state: JsonDetailsRef;
  footprint: JsonDetailsRef;
  presence: JsonDetailsRef;
  visualRuntime: JsonDetailsRef;
  resolvedLayers: JsonDetailsRef;
}

const TOOL_STRIP_WIDTH = 44;
const CONTROL_PANE_WIDTH = 220;
const INFO_PANE_WIDTH = 440;

/**
 * Engine Debug 是一个真正占据 gameplay 右侧空间的 dock：
 * Canvas | Control | Inspector | Tool Strip。
 * Tool Strip 永远存在；两个 pane 由它独立开关，不再产生 collapsed pane。
 */
export class DebugSidebar {
  private readonly root: HTMLDivElement;
  private readonly controlPanel: DebugControlPanel;
  private readonly toolRoot: HTMLDivElement;
  private readonly gameplayInset: GameplayRightInsetLease;
  private readonly controlToolButton: HTMLButtonElement;
  private readonly infoToolButton: HTMLButtonElement;
  private enabled = false;
  private controlVisible = true;
  private infoVisible = true;

  private readonly actorPanel: HTMLDivElement;
  private readonly timelinePanel: HTMLDivElement;
  private readonly inspectPanel: HTMLDivElement;
  private readonly tabButtons = new Map<DebugTab, HTMLButtonElement>();

  private readonly actorTitleText: HTMLSpanElement;
  private readonly actorValue: ValueRef;
  private readonly actorPosition: ValueRef;
  private readonly actorDirection: ValueRef;
  private readonly actorInput: ValueRef;
  private readonly actorSprite: ValueRef;
  private readonly actorInputDetails: JsonDetailsRef;
  private readonly actorStateDetails: JsonDetailsRef;
  private readonly actorActionsDetails: JsonDetailsRef;
  private readonly actorPresentationDetails: JsonDetailsRef;

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

  constructor(
    canvas: HTMLCanvasElement,
    private readonly actions: DebugSidebarActions,
  ) {
    const mount = resolveGameplayMount(canvas, undefined, "DebugSidebar");
    this.gameplayInset = createGameplayRightInset(canvas, "DebugSidebar");

    this.root = document.createElement("div");
    this.root.className = "engine-debug-sidebar";
    this.root.setAttribute("aria-label", "Engine Debug Inspector");
    Object.assign(this.root.style, {
      position: "absolute",
      top: "0",
      right: `${TOOL_STRIP_WIDTH}px`,
      bottom: "0",
      width: `${INFO_PANE_WIDTH}px`,
      zIndex: "30",
      overflow: "auto",
      boxSizing: "border-box",
      padding: "12px",
      borderLeft: "1px solid rgba(255,255,255,.18)",
      background: "rgba(4, 11, 7, .98)",
      color: "#e8f3ea",
      font: "12px/1.45 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
      pointerEvents: "auto",
    });

    const sidebarHeader = document.createElement("header");
    Object.assign(sidebarHeader.style, {
      position: "sticky",
      top: "-12px",
      zIndex: "2",
      margin: "-12px -12px 10px",
      padding: "12px",
      background: "rgba(4, 11, 7, .99)",
      borderBottom: "1px solid rgba(255,255,255,.08)",
    });
    const sidebarTitle = document.createElement("strong");
    sidebarTitle.textContent = "ENGINE DEBUG";
    sidebarTitle.style.letterSpacing = ".08em";
    sidebarHeader.append(sidebarTitle);

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
    const actorFacts = document.createElement("div");
    this.actorValue = this.valueRef("Actor");
    this.actorPosition = this.valueRef("Position");
    this.actorDirection = this.valueRef("Direction");
    this.actorInput = this.valueRef("Input");
    this.actorSprite = this.valueRef("Sprite");
    actorFacts.append(
      this.actorValue.root,
      this.actorPosition.root,
      this.actorDirection.root,
      this.actorInput.root,
      this.actorSprite.root,
    );
    actorBody.append(actorFacts);
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
    const actorTitle = actorSection.firstElementChild as HTMLDivElement;
    actorTitle.textContent = "";
    this.actorTitleText = document.createElement("span");
    this.actorTitleText.textContent = "Selected actor";
    actorTitle.append(this.actorTitleText);
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
    this.inspectMessage.textContent =
      "Click a cell to inspect it. Double-click a cell to teleport the selected actor.";
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
    this.root.append(sidebarHeader, tabs, this.actorPanel, this.timelinePanel, this.inspectPanel);

    this.controlPanel = new DebugControlPanel(
      TOOL_STRIP_WIDTH + INFO_PANE_WIDTH,
      CONTROL_PANE_WIDTH,
      this.actions,
    );

    this.toolRoot = document.createElement("div");
    this.toolRoot.className = "engine-debug-tool-strip";
    this.toolRoot.setAttribute("aria-label", "Engine Debug Tools");
    Object.assign(this.toolRoot.style, {
      position: "absolute",
      top: "0",
      right: "0",
      bottom: "0",
      width: `${TOOL_STRIP_WIDTH}px`,
      zIndex: "32",
      display: "none",
      flexDirection: "column",
      alignItems: "stretch",
      gap: "4px",
      boxSizing: "border-box",
      padding: "4px",
      borderLeft: "1px solid rgba(255,255,255,.2)",
      background: "rgba(2, 7, 4, .99)",
      color: "#e8f3ea",
      font: "11px/1 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
      pointerEvents: "auto",
    });
    this.controlToolButton = this.toolButton("C", "Toggle debug controls", () => {
      this.controlVisible = !this.controlVisible;
      this.applyDockLayout();
    });
    this.infoToolButton = this.toolButton("D", "Toggle debug information", () => {
      this.infoVisible = !this.infoVisible;
      this.applyDockLayout();
    });
    this.toolRoot.append(this.controlToolButton, this.infoToolButton);

    mount.append(this.controlPanel.root, this.root, this.toolRoot);
    this.root.hidden = true;
    this.controlPanel.root.hidden = true;
    this.setTab("actor");
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled) {
      this.toolRoot.style.display = "none";
      this.root.hidden = true;
      this.controlPanel.root.hidden = true;
      this.gameplayInset.set(0);
      return;
    }
    this.controlVisible = true;
    this.infoVisible = true;
    this.toolRoot.style.display = "flex";
    this.applyDockLayout(false);
  }

  render(snapshot: DebugSnapshot): void {
    if (!this.enabled) return;
    this.controlPanel.render(snapshot);
    this.renderActor(snapshot);
    this.renderTimeline(snapshot);
    this.renderInspect(snapshot);
  }

  destroy(): void {
    this.gameplayInset.release();
    this.controlPanel.root.remove();
    this.root.remove();
    this.toolRoot.remove();
  }

  private applyDockLayout(requestRender = true): void {
    if (!this.enabled) return;
    this.root.hidden = !this.infoVisible;
    this.controlPanel.root.hidden = !this.controlVisible;
    this.controlPanel.root.style.right = `${
      TOOL_STRIP_WIDTH + (this.infoVisible ? INFO_PANE_WIDTH : 0)
    }px`;
    this.controlToolButton.style.background = this.controlVisible
      ? "#285135"
      : "#14251a";
    this.infoToolButton.style.background = this.infoVisible
      ? "#285135"
      : "#14251a";
    const dockWidth =
      TOOL_STRIP_WIDTH +
      (this.controlVisible ? CONTROL_PANE_WIDTH : 0) +
      (this.infoVisible ? INFO_PANE_WIDTH : 0);
    this.gameplayInset.set(dockWidth);
    if (requestRender) this.actions.layoutChanged();
  }

  private renderActor(snapshot: DebugSnapshot): void {
    const actor = snapshot.actor;
    if (!actor) {
      this.actorTitleText.textContent = "Selected actor";
      this.setValue(this.actorValue, "-");
      this.setValue(this.actorPosition, "-");
      this.setValue(this.actorDirection, "-");
      this.setValue(this.actorInput, "no actor");
      this.setValue(this.actorSprite, "-");
      return;
    }

    const activeChannels = snapshot.input?.channels.filter(
      (channel) =>
        channel.physicalDirection !== null ||
        (channel.repeater?.heldInput ?? null) !== null,
    );
    const inputLabel = actor.inputBlocked
      ? "blocked"
      : activeChannels && activeChannels.length > 0
        ? activeChannels
            .map(
              (channel) =>
                `${channel.source}:${channel.physicalDirection ?? channel.repeater?.heldInput?.direction ?? "held"}`,
            )
            .join(" ")
        : "ready";

    this.actorTitleText.textContent = `Selected actor #${actor.id}`;
    this.setValue(this.actorValue, `#${actor.id} ${actor.type}`);
    this.setValue(
      this.actorPosition,
      `${actor.anchor.x}, ${actor.anchor.y} / pose ${actor.worldPose.x.toFixed(2)}, ${actor.worldPose.y.toFixed(2)}`,
    );
    this.setValue(this.actorDirection, actor.direction ?? "-");
    this.setValue(this.actorInput, inputLabel);
    this.setValue(this.actorSprite, spriteLabel(actor));
    this.setJson(this.actorInputDetails, snapshot.input);
    this.setJson(this.actorStateDetails, {
      lifecycle: actor.lifecycle,
      anchor: actor.anchor,
      worldPose: actor.worldPose,
      worldMotion: actor.worldMotion,
      entityState: actor.state,
    });
    const ownedActions = snapshot.actions.filter(
      (action) =>
        action.ownerEntityId === actor.id || action.focus?.entityId === actor.id,
    );
    this.setJson(this.actorActionsDetails, ownedActions);
    this.setJson(this.actorPresentationDetails, {
      runtime: actor.visual.runtime,
      renderItems: actor.visual.renderItems,
    });
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
      const delta =
        entry.worldSequence === undefined ? "" : ` Δ${entry.worldSequence}`;
      const time =
        entry.worldTimeMs === undefined ? "" : ` ${entry.worldTimeMs}ms`;
      summary.textContent = `${world}${delta}${time} ${entry.category.padEnd(12)} ${entry.summary}`;
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
      minWidth: "0",
    });
    button.addEventListener("click", action);
    return button;
  }

  private toolButton(
    label: string,
    title: string,
    action: () => void,
  ): HTMLButtonElement {
    const button = this.button(label, action);
    button.title = title;
    button.setAttribute("aria-label", title);
    Object.assign(button.style, {
      width: "36px",
      height: "36px",
      padding: "0",
      fontWeight: "700",
    });
    return button;
  }
}

function spriteLabel(actor: DebugEntitySnapshot): string {
  const imageLayers = actor.visual.renderItems
    .flatMap((item) => item.layers)
    .filter((layer) => layer.kind === "image");
  const layer = imageLayers.at(-1);
  if (!layer) return "-";
  const asset = typeof layer.asset === "string" ? layer.asset : "image";
  if (typeof layer.frameIndex === "number")
    return `${asset} #${layer.frameIndex + 1}`;
  if (typeof layer.frameProgress === "number")
    return `${asset} ${(layer.frameProgress * 100).toFixed(1)}%`;
  return asset;
}
