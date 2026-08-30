import { EntityTypeId, type Direction } from "@bobby/model";
import type {
  EntityModule,
  EntityModuleDefinition,
} from "../EntityModule.js";
import {
  clampProgress,
  CONTENT_STACK_ORDER,
  originalModule,
} from "../original/module.js";

const BOBBY_OFFSET_Y = -12;
const BOBBY_IDLE_DELAY_MS = 5000;
const BOBBY_SOURCE_FRAME_MS = 1000 / 60;
const DIRECTION_COLUMN: Readonly<Record<Direction, number>> = {
  left: 0,
  right: 1,
  up: 2,
  down: 3,
};

/** Bobby 的原版人物素材与 sprite-sheet 语义集中在 Player module。 */
export const BOBBY_VISUAL_ASSETS = {
  move: {
    left: "bobby-left",
    right: "bobby-right",
    up: "bobby-up",
    down: "bobby-down",
  } satisfies Readonly<Record<Direction, string>>,
  idle: "bobby-idle",
  death: "bobby-death",
  mower: "bobby-mower",
  snowplow: "bobby-snowplow",
  kite: "bobby-kite",
} as const;

const definition: EntityModuleDefinition = {
  type: EntityTypeId.BOBBY,
  traits: ["player"],
  stackOrder: CONTENT_STACK_ORDER,
  presentation: {
    name: "Bobby",
    renderPass: "player",
    visualBounds: { left: 0, top: -1, right: 0, bottom: 0 },
  },
};

export const bobby: EntityModule = originalModule(definition, {
  id: EntityTypeId.BOBBY,
  resolve(context) {
    const direction = context.runtime?.direction ?? context.entity.direction ?? "down";
    const rawProgress = context.runtime?.progress ?? 1;
    const progress = clampProgress(rawProgress);

    if (context.global?.dead) {
      return composition({
        asset: BOBBY_VISUAL_ASSETS.death,
        frameColumns: 8,
        frameRows: 1,
        ...(rawProgress >= 1
          ? { frameIndex: 7 }
          : { frameProgress: progress }),
      });
    }

    if (context.runtime?.animation === "shovel") {
      const row = Math.min(2, Math.floor(progress * 3));
      return composition({
        asset: BOBBY_VISUAL_ASSETS.snowplow,
        frameColumns: 4,
        frameRows: 3,
        frameIndex: DIRECTION_COLUMN[direction] + row * 4,
      });
    }

    if (context.global?.ridingMower) {
      const row = (context.time?.frame ?? 0) % 2;
      return composition({
        asset: BOBBY_VISUAL_ASSETS.mower,
        frameColumns: 4,
        frameRows: 2,
        frameIndex: DIRECTION_COLUMN[direction] + row * 4,
      });
    }

    if (context.global?.forced?.kind === "flight") {
      return composition({
        asset: BOBBY_VISUAL_ASSETS.kite,
        frameColumns: 4,
        frameRows: 1,
        frameIndex: DIRECTION_COLUMN[direction],
      });
    }

    if (!context.runtime?.moving) {
      const idleFrame = resolveIdleFrame(
        context.runtime?.stationarySinceMs,
        context.time?.nowMs,
      );
      if (idleFrame !== null) {
        return composition({
          asset: BOBBY_VISUAL_ASSETS.idle,
          frameColumns: 3,
          frameRows: 1,
          frameIndex: idleFrame,
        });
      }
    }

    return composition({
      asset: BOBBY_VISUAL_ASSETS.move[direction],
      frameColumns: 8,
      frameRows: 1,
      ...(context.runtime?.moving
        ? { frameProgress: progress }
        : { frameIndex: 7 }),
    });
  },
});

function composition(
  frame: {
    asset: string;
    frameColumns: number;
    frameRows: number;
    frameIndex?: number;
    frameProgress?: number;
  },
) {
  return {
    layers: [
      {
        kind: "image" as const,
        ...frame,
        anchor: "bottom" as const,
        offsetY: BOBBY_OFFSET_Y,
      },
    ],
  };
}

function resolveIdleFrame(
  stationarySinceMs: number | undefined,
  nowMs: number | undefined,
): number | null {
  if (stationarySinceMs === undefined || nowMs === undefined) return null;
  const idleMs = Math.max(0, nowMs - stationarySinceMs);
  if (idleMs < BOBBY_IDLE_DELAY_MS) return null;
  return Math.floor((idleMs - BOBBY_IDLE_DELAY_MS) / BOBBY_SOURCE_FRAME_MS) % 3;
}
