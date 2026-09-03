import type { Direction } from "@bobby/model";
import type { EntityId } from "../world/entity/EntityInstance.js";
import {
  createGameplayRightInset,
  resolveGameplayMount,
  type GameplayRightInsetLease,
} from "../ui/gameplayMount.js";
import type { DebugEntitySnapshot, DebugSnapshot } from "./DebugSnapshot.js";

export interface DebugSidebarActions {
  pauseWorld(): void;
  resumeWorld(): void;
  stepWorld(): void;
  setHeldDirection(direction: Direction | null): void;
  selectActor(actorId: EntityId): void;
  pausePresentation(): void;
  resumePresentation(): void;
  stepPresentation(frames: number): void;
  stepPresentationToNextSprite(): void;
  stepPresentationToNextChange(): void;
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
  properties: JsonDetailsRef;
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
  private readonly controlRoot: HTMLDivElement;
  private readonly toolRoot: HTMLDivElement;
  private readonly gameplayInset: GameplayRightInsetLease;
  private readonly controlToolButton: HTMLButtonElement;
  private readonly infoToolButton: HTMLButtonElement;
  private controlVisible = true;
  private infoVisible = true;

  private readonly worldStatus: HTMLSpanElement;
  private readonly presentationStatus: HTMLSpanElement;
  private readonly worldPauseResumeButton: HTMLButtonElement;
  private readonly worldStepButton: HTMLButtonElement;
  private readonly presentationPauseResumeButton: HTMLButtonElement;
  private readonly frameBackButton: HTMLButtonElement;
  private readonly frameForwardButton: HTMLButtonElement;
  private readonly nextSpriteButton: HTMLButtonElement;
  private readonly nextChangeButton: HTMLButtonElement;
  private readonly controlActorSelect: HTMLSelectElement;
  private actorOptionsKey = "";
  private readonly directionButtons = new Map<Direction | "release", HTMLButtonElement>();

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
  private worldPaused = false;
  private presentationPaused = false;
  private debugHeldDirection: Direction | null = null;

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

    this.controlRoot = document.createElement("div");
    this.controlRoot.className = "engine-debug-control-rail";
    this.controlRoot.setAttribute("aria-label", "Engine Debug Controls");
    Object.assign(this.controlRoot.style, {
      position: "absolute",
      top: "0",
      right: `${TOOL_STRIP_WIDTH + INFO_PANE_WIDTH}px`,
      bottom: "0",
      width: `${CONTROL_PANE_WIDTH}px`,
      zIndex: "31",
      overflow: "auto",
      boxSizing: "border-box",
      padding: "10px",
      borderLeft: "1px solid rgba(255,255,255,.18)",
      background: "rgba(4, 11, 7, .96)",
      color: "#e8f3ea",
      font: "12px/1.4 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
      pointerEvents: "auto",
    });

    const controlHeader = document.createElement("header");
    Object.assign(controlHeader.style, {
      marginBottom: "9px",
      paddingBottom: "8px",
      borderBottom: "1px solid rgba(255,255,255,.08)",
    });
    const controlTitle = document.createElement("strong");
    controlTitle.textContent = "DEBUG CONTROL";
    controlTitle.style.letterSpacing = ".06em";
    controlHeader.append(controlTitle);

    const controlBody = document.createElement("div");
    Object.assign(controlBody.style, { display: "grid", gap: "8px" });

    const actorControl = document.createElement("div");
    const actorControlLabel = document.createElement("div");
    actorControlLabel.textContent = "Actor";
    actorControlLabel.style.color = "#8da495";
    actorControlLabel.style.marginBottom = "4px";
    this.controlActorSelect = document.createElement("select");
    Object.assign(this.controlActorSelect.style, {
      width: "100%",
      padding: "4px 5px",
      border: "1px solid rgba(255,255,255,.2)",
      borderRadius: "4px",
      background: "#14251a",
      color: "inherit",
      font: "inherit",
    });
    this.controlActorSelect.addEventListener("change", () => {
      const actorId = Number(this.controlActorSelect.value);
      if (Number.isFinite(actorId)) this.actions.selectActor(actorId);
    });
    actorControl.append(actorControlLabel, this.controlActorSelect);

    const worldControl = this.controlSection("World");
    this.worldStatus = document.createElement("span");
    this.worldStatus.style.color = "#8da495";
    const worldButtons = document.createElement("div");
    Object.assign(worldButtons.style, {
      display: "grid",
      gridTemplateColumns: "minmax(0,1fr) auto",
      gap: "5px",
      marginTop: "5px",
    });
    this.worldPauseResumeButton = this.button("⏸ Pause", () => {
      if (this.worldPaused) this.actions.resumeWorld();
      else this.actions.pauseWorld();
    });
    this.worldStepButton = this.button("Step", () => this.actions.stepWorld());
    worldButtons.append(this.worldPauseResumeButton, this.worldStepButton);
    worldControl.append(this.worldStatus, worldButtons);

    const presentationControl = this.controlSection("Presentation");
    this.presentationStatus = document.createElement("span");
    this.presentationStatus.style.color = "#8da495";
    this.presentationPauseResumeButton = this.button("⏸ Pause", () => {
      if (this.presentationPaused) this.actions.resumePresentation();
      else this.actions.pausePresentation();
    });
    this.presentationPauseResumeButton.style.marginTop = "5px";
    this.presentationPauseResumeButton.style.width = "100%";
    const presentationButtons = document.createElement("div");
    Object.assign(presentationButtons.style, {
      display: "grid",
      gridTemplateColumns: "repeat(4,minmax(0,1fr))",
      gap: "4px",
      marginTop: "5px",
    });
    this.frameBackButton = this.button("-1", () => this.actions.stepPresentation(-1));
    this.frameForwardButton = this.button("+1", () => this.actions.stepPresentation(1));
    this.nextSpriteButton = this.button("Sprite", () =>
      this.actions.stepPresentationToNextSprite(),
    );
    this.nextSpriteButton.title =
      "Advance until the selected actor changes sprite frame";
    this.nextChangeButton = this.button("Next", () =>
      this.actions.stepPresentationToNextChange(),
    );
    this.nextChangeButton.title = "Jump to the end of the current visible motion";
    presentationButtons.append(
      this.frameBackButton,
      this.frameForwardButton,
      this.nextSpriteButton,
      this.nextChangeButton,
    );
    presentationControl.append(
      this.presentationStatus,
      this.presentationPauseResumeButton,
      presentationButtons,
    );

    const inputControl = this.controlSection("Input");
    const padWrap = document.createElement("div");
    Object.assign(padWrap.style, {
      display: "flex",
      justifyContent: "center",
      marginTop: "2px",
    });
    padWrap.append(this.directionPad());
    const inputHint = document.createElement("div");
    inputHint.textContent = "Pause World, choose a direction, then Step.";
    Object.assign(inputHint.style, {
      marginTop: "6px",
      color: "#8da495",
      fontSize: "11px",
    });
    inputControl.append(padWrap, inputHint);

    const teleportHint = document.createElement("div");
    teleportHint.textContent = "Double-click map: teleport selected actor";
    Object.assign(teleportHint.style, {
      paddingTop: "2px",
      color: "#8da495",
      fontSize: "11px",
    });

    controlBody.append(
      actorControl,
      worldControl,
      presentationControl,
      inputControl,
      teleportHint,
    );
    this.controlRoot.append(controlHeader, controlBody);

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
      display: "flex",
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

    mount.append(this.controlRoot, this.root, this.toolRoot);
    this.root.hidden = true;
    this.controlRoot.hidden = true;
    this.toolRoot.hidden = true;
    this.setTab("actor");
  }

  setEnabled(enabled: boolean): void {
    this.toolRoot.hidden = !enabled;
    if (!enabled) {
      this.root.hidden = true;
      this.controlRoot.hidden = true;
      this.gameplayInset.set(0);
      return;
    }
    this.applyDockLayout(false);
  }

  render(snapshot: DebugSnapshot): void {
    if (this.toolRoot.hidden) return;
    this.updateControls(snapshot);
    this.renderActor(snapshot);
    this.renderTimeline(snapshot);
    this.renderInspect(snapshot);
  }

  destroy(): void {
    this.gameplayInset.release();
    this.controlRoot.remove();
    this.root.remove();
    this.toolRoot.remove();
  }

  private applyDockLayout(requestRender = true): void {
    if (this.toolRoot.hidden) return;
    this.root.hidden = !this.infoVisible;
    this.controlRoot.hidden = !this.controlVisible;
    this.controlRoot.style.right = `${
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

  private updateControls(snapshot: DebugSnapshot): void {
    const runtime = snapshot.runtime;
    this.worldPaused = runtime.worldPaused;
    this.presentationPaused = runtime.presentationPaused;
    this.worldStatus.textContent = `W${runtime.worldTickCount} · ${runtime.worldHz}Hz`;
    this.presentationStatus.textContent =
      `P${runtime.presentationFrame} · ${runtime.presentationHz}Hz`;
    this.worldPauseResumeButton.textContent = runtime.worldPaused
      ? "▶ Resume"
      : "⏸ Pause";
    this.presentationPauseResumeButton.textContent = runtime.presentationPaused
      ? "▶ Resume"
      : "⏸ Pause";
    this.worldStepButton.disabled = !runtime.worldPaused;
    this.frameBackButton.disabled =
      !runtime.presentationPaused || runtime.presentationFrame <= 0;
    this.frameForwardButton.disabled = !runtime.presentationPaused;
    this.nextSpriteButton.disabled =
      !runtime.presentationPaused ||
      !snapshot.actor ||
      !hasActiveActorPresentation(snapshot.actor);
    this.nextChangeButton.disabled = !runtime.presentationPaused;
    this.updateActorSelector(snapshot);
    this.updateDirectionPad(snapshot.actor !== null);
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

    const external = snapshot.input?.channels.find(
      (channel) => channel.source === "external",
    );
    this.debugHeldDirection = external?.physicalDirection ?? null;
    const activeChannels = snapshot.input?.channels.filter(
      (channel) =>
        channel.physicalDirection !== null ||
        (channel.repeater?.heldInput ?? null) !== null,
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

    this.actorTitleText.textContent = `Selected actor #${actor.id}`;
    this.setValue(this.actorValue, `#${actor.id} ${actor.type}`);
    this.setValue(this.actorPosition, `${actor.anchor.x}, ${actor.anchor.y}`);
    this.setValue(this.actorDirection, actor.direction ?? "-");
    this.setValue(this.actorInput, inputLabel);
    this.setValue(this.actorSprite, spriteLabel(actor));
    this.setJson(this.actorInputDetails, snapshot.input);
    this.setJson(this.actorStateDetails, actor.state);
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

  private updateActorSelector(snapshot: DebugSnapshot): void {
    const key = snapshot.actors.map((actor) => `${actor.id}:${actor.type}`).join("|");
    if (key !== this.actorOptionsKey) {
      this.actorOptionsKey = key;
      const fragment = document.createDocumentFragment();
      for (const actor of snapshot.actors) {
        const option = document.createElement("option");
        option.value = String(actor.id);
        option.textContent = `#${actor.id} ${actor.type}`;
        fragment.append(option);
      }
      this.controlActorSelect.replaceChildren(fragment);
    }
    this.controlActorSelect.disabled = snapshot.actors.length === 0;
    if (snapshot.actor) this.controlActorSelect.value = String(snapshot.actor.id);
  }

  private directionPad(): HTMLElement {
    const pad = document.createElement("div");
    Object.assign(pad.style, {
      display: "grid",
      gridTemplateColumns: "repeat(3, 34px)",
      gridTemplateRows: "repeat(3, 32px)",
      gap: "4px",
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

  private updateDirectionPad(hasActor: boolean): void {
    for (const [key, button] of this.directionButtons) {
      button.disabled = !this.worldPaused || !hasActor;
      button.title = !hasActor
        ? "No selected actor"
        : this.worldPaused
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

  private controlSection(titleText: string): HTMLDivElement {
    const section = document.createElement("div");
    Object.assign(section.style, {
      padding: "7px",
      border: "1px solid rgba(255,255,255,.12)",
      borderRadius: "5px",
      background: "rgba(255,255,255,.03)",
    });
    const title = document.createElement("div");
    title.textContent = titleText;
    Object.assign(title.style, {
      marginBottom: "3px",
      color: "#9fd6aa",
      fontWeight: "700",
    });
    section.append(title);
    return section;
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

function hasActiveActorPresentation(actor: DebugEntitySnapshot): boolean {
  if (!actor.visual.runtime || typeof actor.visual.runtime !== "object")
    return false;
  const runtime = actor.visual.runtime as Record<string, unknown>;
  return runtime.moving === true || typeof runtime.animation === "string";
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
