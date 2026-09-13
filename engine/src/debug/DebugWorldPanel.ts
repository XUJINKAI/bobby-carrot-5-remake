import type { ActorEffectIntent } from "../world/movement/WorldIntent.js";
import type { DebugSnapshot } from "./DebugSnapshot.js";

export interface DebugWorldPanelActions {
  dispatchIntent(intent: ActorEffectIntent): void;
}

type JsonDetailsRef = { details: HTMLDetailsElement; pre: HTMLPreElement };

/** World 页只操作 Game 的语义 intent 入口，保证 Debug 操作能随正常 Tick 录制。 */
export class DebugWorldPanel {
  readonly root: HTMLDivElement;
  private readonly setup: JsonDetailsRef;
  private readonly current: JsonDetailsRef;
  private readonly pending: JsonDetailsRef;
  private readonly target: HTMLSpanElement;
  private readonly type: HTMLSelectElement;
  private readonly locomotionFields: HTMLDivElement;
  private readonly moveDurationMs: HTMLInputElement;
  private readonly apply: HTMLButtonElement;
  private readonly message: HTMLDivElement;
  private actorId: number | null = null;
  private canDispatch = false;

  constructor(private readonly actions: DebugWorldPanelActions) {
    this.root = document.createElement("div");
    this.root.className = "engine-debug-world-panel";

    this.setup = jsonDetails("Engine setup", true);
    this.current = jsonDetails("Current world", true);
    this.pending = jsonDetails("Pending intents", true);

    const injector = document.createElement("div");
    Object.assign(injector.style, { display: "grid", gap: "8px" });
    const targetRow = row("Target actor");
    this.target = document.createElement("span");
    targetRow.value.append(this.target);

    const typeRow = row("Intent");
    this.type = select([
      ["set-actor-locomotion", "Set locomotion"],
    ]);
    typeRow.value.append(this.type);

    this.locomotionFields = document.createElement("div");
    const durationRow = row("Move duration");
    this.moveDurationMs = document.createElement("input");
    this.moveDurationMs.type = "number";
    this.moveDurationMs.dataset.debugIntentMoveDuration = "";
    this.moveDurationMs.min = "1";
    this.moveDurationMs.step = "1";
    this.moveDurationMs.value = "350";
    styleInput(this.moveDurationMs);
    const durationSuffix = document.createElement("span");
    durationSuffix.textContent = " ms";
    durationRow.value.append(this.moveDurationMs, durationSuffix);
    this.locomotionFields.append(durationRow.root);

    this.apply = button("Dispatch intent", () => this.dispatch());
    this.apply.dataset.debugIntentDispatch = "";
    this.message = document.createElement("div");
    this.message.style.color = "#8da495";
    injector.append(
      targetRow.root,
      typeRow.root,
      this.locomotionFields,
      this.apply,
      this.message,
    );

    this.root.append(
      section("Intent injector", injector),
      spaced(this.setup.details),
      spaced(this.current.details),
      spaced(this.pending.details),
    );
  }

  render(snapshot: DebugSnapshot): void {
    const world = snapshot.world;
    const actor = snapshot.actor;
    if (!world) {
      this.actorId = null;
      this.canDispatch = false;
      this.target.textContent = "No level loaded";
      this.apply.disabled = true;
      this.message.textContent = "Load a level to inspect its World setup.";
      setJson(this.setup, null);
      setJson(this.current, null);
      setJson(this.pending, []);
      return;
    }

    const actorChanged = this.actorId !== (actor?.id ?? null);
    this.actorId = actor?.id ?? null;
    this.canDispatch = world.canDispatchActorEffects && this.actorId !== null;
    this.target.textContent = actor
      ? `#${actor.id} ${actor.type}`
      : "No player actor";
    if (actorChanged && actor) {
      const actorState = world.current.gameplay.actors.find(
        (candidate) => candidate.id === actor.id,
      );
      this.moveDurationMs.value = String(
        actorState?.moveDurationMs ?? world.setup.gameplay.bobbyLocomotion.moveMs,
      );
    }
    this.apply.disabled = !this.canDispatch;
    this.message.textContent = world.replay.playing
      ? "Intent injection is disabled during Replay playback."
      : snapshot.runtime.worldPaused
        ? "Queued intent will run on the next Step."
        : this.actorId === null
          ? "Select a player actor before dispatching."
          : "Intent will run on the next World Tick.";
    setJson(this.setup, world.setup);
    setJson(this.current, {
      ...world.current,
      replay: world.replay,
    });
    setJson(this.pending, world.pendingIntents);
  }

  private dispatch(): void {
    if (!this.canDispatch || this.actorId === null) return;
    const moveDurationMs = Number(this.moveDurationMs.value);
    if (!Number.isFinite(moveDurationMs) || moveDurationMs <= 0) {
      this.message.textContent = "Move duration must be greater than 0 ms.";
      return;
    }
    this.actions.dispatchIntent({
      type: "set-actor-locomotion",
      actorId: this.actorId,
      moveDurationMs,
    });
  }
}

function row(labelText: string): { root: HTMLDivElement; value: HTMLDivElement } {
  const root = document.createElement("div");
  Object.assign(root.style, {
    display: "grid",
    gridTemplateColumns: "110px minmax(0,1fr)",
    alignItems: "center",
    gap: "7px",
  });
  const label = document.createElement("span");
  label.textContent = labelText;
  label.style.color = "#8da495";
  const value = document.createElement("div");
  value.style.minWidth = "0";
  root.append(label, value);
  return { root, value };
}

function select(options: readonly (readonly [string, string])[]): HTMLSelectElement {
  const control = document.createElement("select");
  for (const [value, label] of options) {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = label;
    control.append(option);
  }
  styleInput(control);
  return control;
}

function styleInput(control: HTMLInputElement | HTMLSelectElement): void {
  Object.assign(control.style, {
    width: "100%",
    boxSizing: "border-box",
    padding: "5px 7px",
    border: "1px solid rgba(255,255,255,.2)",
    borderRadius: "4px",
    background: "#0b1710",
    color: "inherit",
    font: "inherit",
  });
}

function button(label: string, action: () => void): HTMLButtonElement {
  const control = document.createElement("button");
  control.type = "button";
  control.textContent = label;
  Object.assign(control.style, {
    padding: "6px 8px",
    border: "1px solid rgba(255,255,255,.2)",
    borderRadius: "4px",
    background: "#285135",
    color: "inherit",
    font: "inherit",
    cursor: "pointer",
  });
  control.addEventListener("click", action);
  return control;
}

function section(titleText: string, body: Node): HTMLElement {
  const root = document.createElement("section");
  Object.assign(root.style, {
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
  root.append(title, body);
  return root;
}

function jsonDetails(label: string, open: boolean): JsonDetailsRef {
  const details = document.createElement("details");
  details.open = open;
  const summary = document.createElement("summary");
  summary.textContent = label;
  summary.style.cursor = "pointer";
  const pre = document.createElement("pre");
  Object.assign(pre.style, {
    overflow: "auto",
    whiteSpace: "pre-wrap",
    overflowWrap: "anywhere",
    color: "#bfd0c3",
  });
  details.append(summary, pre);
  return { details, pre };
}

function setJson(ref: JsonDetailsRef, value: unknown): void {
  const text = JSON.stringify(value, null, 2) ?? String(value);
  if (ref.pre.textContent !== text) ref.pre.textContent = text;
}

function spaced<T extends HTMLElement>(element: T): T {
  element.style.marginTop = "9px";
  return element;
}
