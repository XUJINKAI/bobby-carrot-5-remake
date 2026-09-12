import type { GameOptions } from "./GameOptions.js";
import type { RenderScene } from "../render/RenderScene.js";
import { Renderer } from "../render/Renderer.js";
import type { EngineTiming } from "../time/EngineTiming.js";
import { PresentationClock } from "../time/PresentationClock.js";
import { VisualRuntime } from "../visual/VisualRuntime.js";
import type { PresentationTuning } from "../visual/tuning/PresentationTuning.js";
import { visualRegistry } from "../entities/registry.js";
import type { World } from "../world/World.js";
import type { WorldDelta } from "../world/delta/WorldDelta.js";
import type { EntityMotion } from "../world/movement/WorldStepResult.js";
import {
  createWorldCalloutAnnouncer,
  type WorldCalloutAnnouncer,
} from "../ui/WorldCalloutAnnouncer.js";
import { createBuiltinWorldCalloutRegistry } from "../visual/callout/builtinCallouts.js";

/**
 * Game 的纯表现侧门面：统一持有 Renderer、Camera、VisualRuntime 与表现时钟。
 * World 状态仍由 GameplaySession 持有，这里只消费已经发生的 WorldDelta。
 */
export class GamePresentation {
  readonly renderer: Renderer;
  readonly visual: VisualRuntime;
  readonly clock: PresentationClock;
  private readonly calloutAnnouncer: WorldCalloutAnnouncer | null;
  private sceneValue: RenderScene | null = null;

  constructor(
    options: GameOptions,
    timing: EngineTiming,
    private readonly tuning: PresentationTuning,
  ) {
    this.renderer = new Renderer(options.canvas, options.images);
    this.calloutAnnouncer = createWorldCalloutAnnouncer(options.canvas);
    this.visual = new VisualRuntime(
      visualRegistry,
      options.images.sourceTileSize,
      options.runtime?.camera,
      {
        announce: (message) => this.calloutAnnouncer?.announce(message),
        callouts: createBuiltinWorldCalloutRegistry(),
      },
    );
    this.clock = new PresentationClock(
      timing.presentationHz,
      timing.presentationSpeed,
    );
    if (typeof performance !== "undefined") this.clock.advance(performance.now());
  }

  get canvas(): HTMLCanvasElement {
    return this.renderer.canvas;
  }

  get scene(): RenderScene | null {
    return this.sceneValue;
  }

  get zoom(): number {
    return this.visual.camera.zoom;
  }

  get sourceTileSize(): number {
    return this.visual.camera.sourceTileSize;
  }

  get isAnimating(): boolean {
    return this.visual.isAnimating;
  }

  get blocksGameplay(): boolean {
    return this.visual.blocksGameplay;
  }

  async load(): Promise<void> {
    await this.renderer.load();
  }

  resetLevelView(): void {
    this.visual.clear();
    this.calloutAnnouncer?.clear();
    this.visual.camera.resetFollow();
    this.visual.camera.resetPan();
    this.sceneValue = null;
  }

  resetMotion(): void {
    this.visual.clear();
    this.calloutAnnouncer?.clear();
  }

  destroy(): void {
    this.calloutAnnouncer?.destroy();
  }

  beginLevel(
    world: World,
    status: "playing" | "won" | "dead",
    blockInput: () => void,
  ): void {
    const frame = this.clock.current;
    if (status === "won") {
      this.visual.beginLevelExit(
        world,
        this.tuning.levelTransition.exitMs,
        frame,
      );
      return;
    }
    if (status !== "playing") return;
    this.visual.beginLevelEntrance(
      world,
      this.tuning.levelTransition.enterMs,
      frame,
    );
    blockInput();
  }

  consumeWorldDeltas(world: World, deltas: readonly WorldDelta[]): void {
    if (deltas.length === 0) return;
    const frame = this.clock.current;
    this.visual.camera.recenterPan(frame);
    this.visual.consumeWorldDeltas(world, deltas, frame, {
      motionDuration: (motion: EntityMotion) => motion.durationMs,
      stationaryDeathDurationMs: this.tuning.motion.normalMs,
      levelExitDurationMs: this.tuning.levelTransition.exitMs,
    });
  }

  setZoom(value: number): void {
    this.visual.camera.setZoom(value);
  }

  setZoomAt(value: number, clientX: number, clientY: number): void {
    const rect = this.canvas.getBoundingClientRect();
    this.visual.camera.setZoomAt(value, clientX - rect.left, clientY - rect.top);
  }

  setZoomLimits(min: number, max?: number): void {
    this.visual.camera.setZoomLimits(min, max);
  }

  zoomBy(factor: number): void {
    this.visual.camera.zoomBy(factor);
  }

  panByScreen(dx: number, dy: number): void {
    this.visual.camera.panByScreen(dx, dy);
  }

  setDebug(value: boolean): void {
    this.renderer.setDebug(value);
  }

  setDebugSelection(cell: { x: number; y: number } | null): void {
    this.renderer.setDebugSelection(cell);
  }

  inspectCell(clientX: number, clientY: number): { x: number; y: number } {
    const rect = this.canvas.getBoundingClientRect();
    return this.visual.camera.screenToTile(
      clientX - rect.left,
      clientY - rect.top,
    );
  }

  pause(): void {
    this.clock.pause();
  }

  resume(): void {
    this.clock.resume();
  }

  step(frames: number, world: World | null): void {
    const frame = this.clock.step(frames);
    if (frame && world) this.visual.update(frame, this.tuning.motion.easing);
  }

  setHz(hz: number): void {
    this.clock.setHz(hz);
  }

  setSpeed(speed: number): void {
    this.clock.setSpeed(speed);
  }

  shake(durationMs: number, amplitudeSourcePx: number): void {
    this.visual.camera.shake(
      this.clock.current,
      durationMs,
      amplitudeSourcePx,
    );
  }

  render(world: World | null): void {
    if (!world) {
      this.sceneValue = null;
      return;
    }
    const viewport = this.renderer.measureViewport();
    this.visual.camera.setViewport(viewport.width, viewport.height);
    const scene = this.visual.scene(world, world.cameraTarget);
    this.sceneValue = scene;
    this.renderer.render(scene, this.visual.camera, viewport);
  }

  advance(
    timestamp: number,
    world: World | null,
  ): { animationCompleted: boolean } | null {
    const frame = this.clock.advance(timestamp);
    if (!world || !frame) return null;
    const wasAnimating = this.visual.isAnimating;
    this.visual.update(frame, this.tuning.motion.easing);
    this.render(world);
    return { animationCompleted: wasAnimating && !this.visual.isAnimating };
  }
}
