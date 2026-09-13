import type { Direction } from "@bobby/model";
import { DebugRuntime } from "../debug/DebugRuntime.js";
import { buildDebugSnapshot } from "../debug/DebugSnapshot.js";
import type { InputController } from "../input/InputController.js";
import type { EngineTiming } from "../time/EngineTiming.js";
import type { WorldTick } from "../time/WorldClock.js";
import type { CellInspection } from "../world/WorldTypes.js";
import type { World } from "../world/World.js";
import type { WorldDelta } from "../world/delta/WorldDelta.js";
import type { CellPosition, EntityId } from "../world/entity/EntityInstance.js";
import type { ActorEffectIntent } from "../world/movement/WorldIntent.js";
import { resolveFootprintCells } from "../world/spatial/Footprint.js";
import type { GameplaySession, GameplayTickInput, GameplayTickResult } from "./GameplaySession.js";
import type { GamePresentation } from "./GamePresentation.js";

interface GameDebugHost {
  world(): World | null;
  pendingIntents(): readonly ActorEffectIntent[];
  replayState(): { recording: boolean; playing: boolean; paused: boolean };
  inspectPoint(clientX: number, clientY: number): CellInspection | null;
  dispatch(intent: ActorEffectIntent): void;
  setHeldDirection(direction: Direction | null): void;
  inputForTick(time: WorldTick): GameplayTickInput;
  consumeTick(tick: GameplayTickResult): void;
  restart(): void;
  render(): void;
  emitDebugChange(): void;
  clearLastResults(): void;
}

/** Game 的 Debug Sidebar、时钟控制、选中与 actor 操作边界。 */
export class GameDebugControls {
  private readonly runtime: DebugRuntime;
  private enabledValue: boolean;
  private externalActorIdValue: EntityId | null = null;

  constructor(
    canvas: HTMLCanvasElement,
    private readonly session: GameplaySession,
    private readonly presentation: GamePresentation,
    private readonly timing: EngineTiming,
    private readonly inputController: InputController | null,
    private readonly host: GameDebugHost,
    enabled: boolean,
  ) {
    this.enabledValue = enabled;
    this.presentation.setDebug(enabled);
    this.runtime = new DebugRuntime(canvas, {
      snapshot: (selection, actorId) =>
        buildDebugSnapshot({
          world: this.host.world(),
          scene: this.presentation.scene,
          visual: this.presentation.visual,
          worldClock: this.session.clock,
          presentationClock: this.presentation.clock,
          timing: this.timing,
          input: this.inputController?.inspectMovement() ?? null,
          setup: this.session.replaySetup,
          controls: this.session.controls,
          gameplayState: this.session.hasLevel ? this.session.state : null,
          pendingIntents: this.host.pendingIntents(),
          replay: this.host.replayState(),
          actorId,
          selection,
        }),
      inspectPoint: (clientX, clientY) =>
        this.host.inspectPoint(clientX, clientY),
      pause: () => this.pauseWorld(),
      resume: () => this.resumeWorld(),
      step: (count) => this.stepWorld(count),
      setWorldHz: (hz) => this.setWorldHz(hz),
      setWorldSpeed: (speed) => this.setWorldSpeed(speed),
      setHeldDirection: (actorId, direction) =>
        this.setHeldDirection(actorId, direction),
      teleportActor: (actorId, cell) => this.teleportActor(actorId, cell),
      dispatchIntent: (intent) => this.host.dispatch(intent),
      pausePresentation: () => this.pausePresentation(),
      resumePresentation: () => this.resumePresentation(),
      stepPresentation: (frames) => this.stepPresentation(frames),
      setPresentationHz: (hz) => this.setPresentationHz(hz),
      setPresentationSpeed: (speed) => this.setPresentationSpeed(speed),
      selectionChanged: (cell) => this.presentation.setDebugSelection(cell),
      requestRender: () => this.host.render(),
    });
    this.runtime.setEnabled(enabled);
  }

  get enabled(): boolean {
    return this.enabledValue;
  }

  get externalActorId(): EntityId | null {
    return this.externalActorIdValue;
  }

  setEnabled(value: boolean): void {
    if (value === this.enabledValue) return;
    if (!value && this.session.clock.paused) this.resumeWorld();
    if (!value && this.presentation.clock.paused) this.resumePresentation();
    this.enabledValue = value;
    this.presentation.setDebug(value);
    this.runtime.setEnabled(value);
    this.host.render();
    this.host.emitDebugChange();
  }

  resetSession(): void {
    this.externalActorIdValue = null;
    this.runtime.clearSelection();
  }

  clearSelection(): void {
    this.runtime.clearSelection();
  }

  recordWorldDeltas(deltas: readonly WorldDelta[], frame: number): void {
    this.runtime.recordWorldDeltas(deltas, frame);
  }

  render(): void {
    this.runtime.render();
  }

  destroy(): void {
    this.runtime.destroy();
  }

  private setHeldDirection(
    actorId: EntityId,
    direction: Direction | null,
  ): void {
    if (direction === null) {
      if (this.externalActorIdValue === actorId)
        this.externalActorIdValue = null;
      this.host.setHeldDirection(null);
      return;
    }
    this.externalActorIdValue = actorId;
    this.host.setHeldDirection(direction);
  }

  private teleportActor(actorId: EntityId, cell: CellPosition): boolean {
    const world = this.host.world();
    if (!this.enabledValue || !world) return false;
    const actor = world.entities.get(actorId);
    if (!actor || !this.session.actorIds.includes(actorId)) return false;
    const definition = world.definition(actorId);
    const footprint = resolveFootprintCells(
      {
        anchor: cell,
        ...(actor.direction ? { direction: actor.direction } : {}),
      },
      definition.footprint,
    );
    if (!footprint.every((part) => world.spatial.inBounds(part))) return false;
    if (
      world.spatial.presencesAt(cell).some(
        (presence) =>
          presence.entityId !== actorId && presence.traits.includes("player"),
      )
    ) return false;

    world.actions.cancelOwnedBy(actorId);
    world.movement?.clearEntity(actorId);
    this.session.discardPendingHistory();
    if (this.externalActorIdValue === actorId)
      this.setHeldDirection(actorId, null);
    world.spatial.moveEntity(actorId, cell);
    this.presentation.visual.clearEntity(actorId);
    this.host.clearLastResults();
    return true;
  }

  private pauseWorld(): void {
    if (this.session.clock.paused) return;
    this.session.clock.pause();
    this.host.render();
  }

  private resumeWorld(): void {
    if (!this.session.clock.paused) return;
    this.session.clock.resume();
    this.host.render();
  }

  private stepWorld(count: number): void {
    for (const tick of this.session.stepPaused(count, (time) =>
      this.host.inputForTick(time),
    )) this.host.consumeTick(tick);
    this.host.render();
  }

  private setWorldHz(hz: number): void {
    if (hz === this.session.clock.hz) return;
    this.session.clock.setHz(hz);
    this.host.restart();
  }

  private setWorldSpeed(speed: number): void {
    this.session.clock.setSpeed(speed);
    this.host.render();
  }

  private pausePresentation(): void {
    if (this.presentation.clock.paused) return;
    this.presentation.pause();
    this.host.render();
  }

  private resumePresentation(): void {
    if (!this.presentation.clock.paused) return;
    this.presentation.resume();
    this.host.render();
  }

  private stepPresentation(frames: number): void {
    this.presentation.step(frames, this.host.world());
    this.host.render();
  }

  private setPresentationHz(hz: number): void {
    this.presentation.setHz(hz);
    this.host.render();
  }

  private setPresentationSpeed(speed: number): void {
    this.presentation.setSpeed(speed);
    this.host.render();
  }
}
