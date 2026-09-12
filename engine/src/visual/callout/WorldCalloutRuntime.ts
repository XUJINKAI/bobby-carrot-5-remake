import type { PresentationFrame } from "../../time/PresentationClock.js";
import type { World } from "../../world/World.js";
import type { EntityId } from "../../world/entity/EntityInstance.js";
import type { WorldEvent } from "../../world/WorldTypes.js";
import type { EntityVisualRuntimeState } from "../VisualDefinition.js";
import {
  accessibleWorldCalloutText,
  type WorldCalloutCue,
  type WorldCalloutRenderItem,
} from "./WorldCallout.js";
import type { WorldCalloutRegistry } from "./WorldCalloutRegistry.js";

interface ActiveWorldCallout {
  cue: WorldCalloutCue;
  startedAtMs: number;
}

export interface WorldCalloutRuntimeOptions {
  announce?(message: string): void;
}

/** PresentationClock 上的 Callout 生命周期；同一 channel 始终只保留最新提示。 */
export class WorldCalloutRuntime {
  private readonly instances = new Map<string, ActiveWorldCallout>();
  private readonly activeChannels = new Set<string>();
  private readonly announce: (message: string) => void;

  constructor(
    private readonly registry: WorldCalloutRegistry,
    options: WorldCalloutRuntimeOptions = {},
  ) {
    this.announce = options.announce ?? (() => {});
  }

  get isAnimating(): boolean {
    return this.activeChannels.size > 0;
  }

  consume(event: Readonly<WorldEvent>, frame: PresentationFrame): void {
    const cue = this.registry.resolve(event);
    if (!cue || !validCue(cue)) return;
    const stored: ActiveWorldCallout = {
      cue: structuredClone(cue),
      startedAtMs: frame.nowMs,
    };
    this.instances.set(cue.channel, stored);
    this.activeChannels.add(cue.channel);
    this.announce(accessibleWorldCalloutText(cue.content));
  }

  update(frame: PresentationFrame): void {
    for (const [channel, instance] of this.instances) {
      if (activeAt(instance, frame.nowMs)) this.activeChannels.add(channel);
      else this.activeChannels.delete(channel);
    }
  }

  clear(): void {
    this.instances.clear();
    this.activeChannels.clear();
  }

  removeEntity(entityId: EntityId): void {
    for (const [channel, instance] of this.instances) {
      const anchor = instance.cue.anchor;
      if (anchor.type !== "entity" || anchor.entityId !== entityId) continue;
      this.instances.delete(channel);
      this.activeChannels.delete(channel);
    }
  }

  renderItems(
    world: World,
    entityRuntime: ReadonlyMap<EntityId, EntityVisualRuntimeState>,
    frame: PresentationFrame,
  ): readonly WorldCalloutRenderItem[] {
    const items: WorldCalloutRenderItem[] = [];
    for (const channel of this.activeChannels) {
      const instance = this.instances.get(channel);
      if (!instance || !activeAt(instance, frame.nowMs)) continue;
      if (!visibleAt(instance, frame.nowMs)) continue;
      const anchor = resolveAnchor(world, entityRuntime, instance.cue);
      if (!anchor) {
        this.instances.delete(channel);
        this.activeChannels.delete(channel);
        continue;
      }
      items.push({
        channel,
        x: anchor.x,
        y: anchor.y,
        content: instance.cue.content,
        placement: instance.cue.placement,
        clearanceSourcePx: Math.max(
          0,
          instance.cue.clearanceSourcePx ?? 0,
        ),
      });
    }
    return items;
  }
}

function resolveAnchor(
  world: World,
  entityRuntime: ReadonlyMap<EntityId, EntityVisualRuntimeState>,
  cue: WorldCalloutCue,
): { x: number; y: number } | null {
  const anchor = cue.anchor;
  if (anchor.type === "cell") {
    if (!Number.isFinite(anchor.x) || !Number.isFinite(anchor.y)) return null;
    return { x: anchor.x + 0.5, y: anchor.y + 0.5 };
  }
  const entity = world.entity(anchor.entityId);
  if (!entity) return null;
  const runtime = entityRuntime.get(entity.id);
  return {
    x: entity.anchor.x + (runtime?.offsetX ?? 0) + 0.5,
    y: entity.anchor.y + (runtime?.offsetY ?? 0),
  };
}

function activeAt(instance: ActiveWorldCallout, nowMs: number): boolean {
  const elapsedMs = nowMs - instance.startedAtMs;
  return elapsedMs >= 0 && elapsedMs < instance.cue.durationMs;
}

function visibleAt(instance: ActiveWorldCallout, nowMs: number): boolean {
  const blink = instance.cue.blink;
  if (!blink) return true;
  const phase = (nowMs - instance.startedAtMs) % blink.periodMs;
  return phase >= blink.visibleFromMs && phase < blink.visibleUntilMs;
}

function validCue(cue: WorldCalloutCue): boolean {
  if (!cue.channel.trim() || !Number.isFinite(cue.durationMs)) return false;
  if (cue.durationMs <= 0) return false;
  const blink = cue.blink;
  if (!blink) return true;
  return (
    Number.isFinite(blink.periodMs) &&
    Number.isFinite(blink.visibleFromMs) &&
    Number.isFinite(blink.visibleUntilMs) &&
    blink.periodMs > 0 &&
    blink.visibleFromMs >= 0 &&
    blink.visibleUntilMs > blink.visibleFromMs &&
    blink.visibleUntilMs <= blink.periodMs
  );
}
