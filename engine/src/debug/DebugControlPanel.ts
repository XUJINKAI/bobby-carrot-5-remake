import type { Direction } from "@bobby/model";
import type { EntityId } from "../world/entity/EntityInstance.js";
import type { DebugEntitySnapshot, DebugSnapshot } from "./DebugSnapshot.js";

const HZ_OPTIONS = [8, 16, 20, 30, 60] as const;
const SPEED_OPTIONS = [0.125, 0.25, 0.5, 1, 2, 4, 8] as const;

export interface DebugControlPanelActions {
  pauseWorld(): void;
  resumeWorld(): void;
  stepWorld(): void;
  setWorldHz(hz: number): void;
  setWorldSpeed(speed: number): void;
  setHeldDirection(direction: Direction | null): void;
  selectActor(actorId: EntityId): void;
  pausePresentation(): void;
  resumePresentation(): void;
  stepPresentation(frames: number): void;
  setPresentationHz(hz: number): void;
  setPresentationSpeed(speed: number): void;
  stepPresentationToNextSprite(): void;
  stepPresentationToNextChange(): void;
}

/** Debug 操作面板只负责 Clock 与 Actor 控件，不持有 Inspector 内容。 */
export class DebugControlPanel {
  readonly root: HTMLDivElement;
  private readonly worldStatus: HTMLSpanElement;
  private readonly presentationStatus: HTMLSpanElement;
  private readonly worldPauseResumeButton: HTMLButtonElement;
  private readonly worldStepButton: HTMLButtonElement;
  private readonly worldHzSelect: HTMLSelectElement;
  private readonly worldSpeedSelect: HTMLSelectElement;
  private readonly presentationPauseResumeButton: HTMLButtonElement;
  private readonly frameBackButton: HTMLButtonElement;
  private readonly frameForwardButton: HTMLButtonElement;
  private readonly nextSpriteButton: HTMLButtonElement;
  private readonly nextChangeButton: HTMLButtonElement;
  private readonly presentationHzSelect: HTMLSelectElement;
  private readonly presentationSpeedSelect: HTMLSelectElement;
  private readonly actorSelect: HTMLSelectElement;
  private readonly directionButtons = new Map<Direction | "release", HTMLButtonElement>();
  private actorOptionsKey = "";
  private worldPaused = false;
  private presentationPaused = false;
  private debugHeldDirection: Direction | null = null;
  private speedsLinked = true;

  constructor(
    right: number,
    width: number,
    private readonly actions: DebugControlPanelActions,
  ) {
    this.root = document.createElement("div");
    this.root.className = "engine-debug-control-rail";
    this.root.setAttribute("aria-label", "Engine Debug Controls");
    Object.assign(this.root.style, {
      position: "absolute",
      top: "0",
      right: `${right}px`,
      bottom: "0",
      width: `${width}px`,
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

    const header = document.createElement("header");
    Object.assign(header.style, {
      marginBottom: "9px",
      paddingBottom: "8px",
      borderBottom: "1px solid rgba(255,255,255,.08)",
    });
    const title = document.createElement("strong");
    title.textContent = "DEBUG CONTROL";
    title.style.letterSpacing = ".06em";
    header.append(title);

    const body = document.createElement("div");
    Object.assign(body.style, { display: "grid", gap: "8px" });
    this.actorSelect = this.createActorControl(body);

    const worldControl = this.controlSection("World");
    this.worldStatus = statusText();
    this.worldHzSelect = rateSelect(HZ_OPTIONS, (value) =>
      this.actions.setWorldHz(value),
    );
    this.worldHzSelect.title = "修改 World Hz 会从关卡起点重新运行";
    this.worldSpeedSelect = rateSelect(SPEED_OPTIONS, (value) => {
      this.actions.setWorldSpeed(value);
      if (this.speedsLinked) this.actions.setPresentationSpeed(value);
    }, "×");
    worldControl.append(
      this.worldStatus,
      rateRow("Hz", this.worldHzSelect),
      rateRow("Speed", this.worldSpeedSelect),
    );
    const worldButtons = buttonGrid("minmax(0,1fr) auto");
    this.worldPauseResumeButton = button("⏸ Pause", () => {
      if (this.worldPaused) this.actions.resumeWorld();
      else this.actions.pauseWorld();
    });
    this.worldStepButton = button("Step", () => this.actions.stepWorld());
    worldButtons.append(this.worldPauseResumeButton, this.worldStepButton);
    worldControl.append(worldButtons);

    const presentationControl = this.controlSection("Presentation");
    this.presentationStatus = statusText();
    this.presentationHzSelect = rateSelect(HZ_OPTIONS, (value) =>
      this.actions.setPresentationHz(value),
    );
    this.presentationSpeedSelect = rateSelect(SPEED_OPTIONS, (value) => {
      this.actions.setPresentationSpeed(value);
      if (this.speedsLinked) this.actions.setWorldSpeed(value);
    }, "×");
    const link = document.createElement("label");
    Object.assign(link.style, {
      display: "flex",
      alignItems: "center",
      gap: "5px",
      marginTop: "5px",
      color: "#8da495",
    });
    const linkInput = document.createElement("input");
    linkInput.type = "checkbox";
    linkInput.checked = true;
    linkInput.addEventListener("change", () => {
      this.speedsLinked = linkInput.checked;
      if (this.speedsLinked)
        this.actions.setPresentationSpeed(Number(this.worldSpeedSelect.value));
    });
    link.append(linkInput, "联动速度");
    presentationControl.append(
      this.presentationStatus,
      rateRow("Hz", this.presentationHzSelect),
      rateRow("Speed", this.presentationSpeedSelect),
      link,
    );
    this.presentationPauseResumeButton = button("⏸ Pause", () => {
      if (this.presentationPaused) this.actions.resumePresentation();
      else this.actions.pausePresentation();
    });
    this.presentationPauseResumeButton.style.marginTop = "5px";
    this.presentationPauseResumeButton.style.width = "100%";
    const presentationButtons = buttonGrid("repeat(4,minmax(0,1fr))", "4px");
    this.frameBackButton = button("-1", () => this.actions.stepPresentation(-1));
    this.frameForwardButton = button("+1", () => this.actions.stepPresentation(1));
    this.nextSpriteButton = button("Sprite", () =>
      this.actions.stepPresentationToNextSprite(),
    );
    this.nextSpriteButton.title = "Advance until the selected actor changes sprite frame";
    this.nextChangeButton = button("Next", () =>
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
    body.append(worldControl, presentationControl, inputControl, teleportHint);
    this.root.append(header, body);
  }

  render(snapshot: DebugSnapshot): void {
    const runtime = snapshot.runtime;
    const external = snapshot.input?.channels.find(
      (channel) => channel.source === "external",
    );
    this.debugHeldDirection = external?.physicalDirection ?? null;
    this.worldPaused = runtime.worldPaused;
    this.presentationPaused = runtime.presentationPaused;
    this.worldStatus.textContent = `W${runtime.worldTickCount} · ${runtime.worldHz}Hz`;
    this.presentationStatus.textContent =
      `P${runtime.presentationFrame} · ${runtime.presentationHz}Hz`;
    setSelectValue(this.worldHzSelect, runtime.worldHz);
    setSelectValue(this.worldSpeedSelect, runtime.worldSpeed);
    setSelectValue(this.presentationHzSelect, runtime.presentationHz);
    setSelectValue(this.presentationSpeedSelect, runtime.presentationSpeed);
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

  private createActorControl(parent: HTMLElement): HTMLSelectElement {
    const root = document.createElement("div");
    const label = document.createElement("div");
    label.textContent = "Actor";
    label.style.color = "#8da495";
    label.style.marginBottom = "4px";
    const select = document.createElement("select");
    Object.assign(select.style, {
      width: "100%",
      padding: "4px 5px",
      border: "1px solid rgba(255,255,255,.2)",
      borderRadius: "4px",
      background: "#14251a",
      color: "inherit",
      font: "inherit",
    });
    select.addEventListener("change", () => {
      const actorId = Number(select.value);
      if (Number.isFinite(actorId)) this.actions.selectActor(actorId);
    });
    root.append(label, select);
    parent.append(root);
    return select;
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
      this.actorSelect.replaceChildren(fragment);
    }
    this.actorSelect.disabled = snapshot.actors.length === 0;
    if (snapshot.actor) this.actorSelect.value = String(snapshot.actor.id);
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
      const directionButton = button(label, () => {
        const direction = key === "release" ? null : key;
        this.actions.setHeldDirection(
          direction !== null && direction === this.debugHeldDirection
            ? null
            : direction,
        );
      });
      directionButton.style.padding = "2px";
      this.directionButtons.set(key, directionButton);
      pad.append(directionButton);
    }
    return pad;
  }

  private updateDirectionPad(hasActor: boolean): void {
    const externalDirection = this.debugHeldDirection;
    for (const [key, directionButton] of this.directionButtons) {
      directionButton.disabled = !this.worldPaused || !hasActor;
      directionButton.title = !hasActor
        ? "No selected actor"
        : this.worldPaused
          ? key === "release"
            ? "Release debug input"
            : `Hold debug input ${key}`
          : "Pause World before injecting debug input";
      directionButton.style.background =
        key !== "release" && key === externalDirection ? "#477a53" : "#14251a";
    }
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
}

function buttonGrid(columns: string, gap = "5px"): HTMLDivElement {
  const root = document.createElement("div");
  Object.assign(root.style, {
    display: "grid",
    gridTemplateColumns: columns,
    gap,
    marginTop: "5px",
  });
  return root;
}

function rateRow(labelText: string, control: HTMLElement): HTMLLabelElement {
  const row = document.createElement("label");
  Object.assign(row.style, {
    display: "grid",
    gridTemplateColumns: "52px minmax(0,1fr)",
    alignItems: "center",
    gap: "5px",
    marginTop: "5px",
    color: "#8da495",
  });
  row.append(labelText, control);
  return row;
}

function rateSelect(
  values: readonly number[],
  change: (value: number) => void,
  suffix = "",
): HTMLSelectElement {
  const select = document.createElement("select");
  Object.assign(select.style, {
    width: "100%",
    padding: "3px 4px",
    border: "1px solid rgba(255,255,255,.2)",
    borderRadius: "4px",
    background: "#14251a",
    color: "inherit",
    font: "inherit",
  });
  for (const value of values) {
    const option = document.createElement("option");
    option.value = String(value);
    option.textContent = `${value}${suffix}`;
    select.append(option);
  }
  select.addEventListener("change", () => change(Number(select.value)));
  return select;
}

function setSelectValue(select: HTMLSelectElement, value: number): void {
  const encoded = String(value);
  if (![...select.options].some((option) => option.value === encoded)) {
    const option = document.createElement("option");
    option.value = encoded;
    option.textContent = encoded;
    select.append(option);
  }
  select.value = encoded;
}

function statusText(): HTMLSpanElement {
  const status = document.createElement("span");
  status.style.color = "#8da495";
  return status;
}

function button(label: string, action: () => void): HTMLButtonElement {
  const result = document.createElement("button");
  result.type = "button";
  result.textContent = label;
  Object.assign(result.style, {
    padding: "5px 8px",
    border: "1px solid rgba(255,255,255,.2)",
    borderRadius: "4px",
    background: "#14251a",
    color: "inherit",
    font: "inherit",
    cursor: "pointer",
    minWidth: "0",
  });
  result.addEventListener("click", action);
  return result;
}

function hasActiveActorPresentation(actor: DebugEntitySnapshot): boolean {
  if (!actor.visual.runtime || typeof actor.visual.runtime !== "object")
    return false;
  const runtime = actor.visual.runtime as Record<string, unknown>;
  return runtime.moving === true || typeof runtime.animation === "string";
}
