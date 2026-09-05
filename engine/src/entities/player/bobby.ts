import { EntityTypeId, type Direction } from "@bobby/model";
import type {
  ImageVisualLayer,
  VisualResolveContext,
} from "../../visual/VisualDefinition.js";
import type { Behavior } from "../../world/behavior/Behavior.js";
import type {
  EntityModule,
  EntityModuleDefinition,
} from "../EntityModule.js";
import {
  clampProgress,
  CONTENT_STACK_ORDER,
  originalModule,
} from "../original/module.js";
import {
  BOBBY_INVENTORY_FIELDS,
  bobbyMountId,
  isBobbyFlying,
  readBobbySpeedBoost,
} from "./BobbyState.js";

const BOBBY_OFFSET_Y = -12;
const BOBBY_TILE_SIZE = 48;
const BOBBY_IDLE_DELAY_MS = 5000;
const BOBBY_IDLE_FRAME_MS = 50;
const BOBBY_SPEED_TRAIL_FRAME_MS = 80;
const BOBBY_STANDING_FRAME = 3;
const BOBBY_ICE_FRAME = 6;
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
  speedTrail: "bobby-speed-trail",
} as const;

const definition: EntityModuleDefinition = {
  type: EntityTypeId.BOBBY,
  traits: ["player"],
  stackOrder: CONTENT_STACK_ORDER,
  state: BOBBY_INVENTORY_FIELDS,
  presentation: {
    name: "Bobby",
    renderPass: "player",
  },
};

const bobbyMovementPolicy: Behavior = {
  id: "bobby-movement-policy",
  planMovement({ actor, query, to, target }) {
    if (isBobbyFlying(actor.state))
      return {
        passage: "unrestricted",
        lifecycle: {
          source: [],
          target: target.filter((presence) =>
            presence.traits.includes("flight-landing"),
          ),
        },
        reason: "airborne-passage",
      };

    const relation = bobbyMountId(actor.state);
    if (relation === null || !query.entityHasTrait(relation, "ride-carried"))
      return;
    return {
      companions: [
        {
          entityId: relation,
          to,
          cause: { type: "carry", carrierId: actor.id },
          updateDirection: true,
        },
      ],
    };
  },
};

const bobbyVisual = {
  id: EntityTypeId.BOBBY,
  resolve(context: VisualResolveContext) {
    const direction =
      context.runtime?.direction ?? context.entity.direction ?? "down";
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

    // 原版 Ice 全程固定在普通移动 strip 的第 7 帧。连续 Ice 格之间
    // Runtime motion 会短暂回到 stationary，因此静止在 Ice 上也保持同一帧。
    if (
      context.runtime?.animation === "ice" ||
      (!context.runtime?.moving && isStandingOnIce(context))
    ) {
      return composition({
        asset: BOBBY_VISUAL_ASSETS.move[direction],
        frameColumns: 8,
        frameRows: 1,
        frameIndex: BOBBY_ICE_FRAME,
      });
    }

    if (bobbyMountId(context.entity.state) !== null) {
      const row = (context.time?.frame ?? 0) % 2;
      return composition(
        {
          asset: BOBBY_VISUAL_ASSETS.mower,
          frameColumns: 4,
          frameRows: 2,
          frameIndex: DIRECTION_COLUMN[direction] + row * 4,
        },
        speedTrail(context, direction),
      );
    }

    if (isBobbyFlying(context.entity.state)) {
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

    return composition(
      {
        asset: BOBBY_VISUAL_ASSETS.move[direction],
        frameColumns: 8,
        frameRows: 1,
        frameIndex: context.runtime?.moving
          ? resolveWalkingFrame(rawProgress)
          : BOBBY_STANDING_FRAME,
      },
      speedTrail(context, direction),
    );
  },
};

export const bobby: EntityModule = originalModule(definition, bobbyVisual, [
  { behavior: bobbyMovementPolicy },
]);

function isStandingOnIce(context: VisualResolveContext): boolean {
  return context.query.presencesAt(context.entity.anchor).some((presence) =>
    context.query.entity(presence.entityId)?.type === EntityTypeId.ICE
  );
}

/** 原版普通走路以第 4 帧为起止点：4,5,6,7,8,1,2,3,4。 */
function resolveWalkingFrame(progress: number): number {
  const normalized = Math.max(0, Math.min(1, progress));
  const step = Math.min(8, Math.floor(normalized * 8));
  return (BOBBY_STANDING_FRAME + step) % 8;
}

function speedTrail(
  context: VisualResolveContext,
  direction: Direction,
): ImageVisualLayer | null {
  const boost = readBobbySpeedBoost(context.entity.state);
  if (!boost || boost.phase === "slow") return null;

  // Legacy normal/slow phases remain presentation-compatible even though the
  // current fixed continuation policy emits full. Presentation consumes the
  // recorded state and must not reinterpret its producer.
  if (
    boost.phase === "normal" &&
    !isInFirstHalfOfSpeedMotion(context, direction)
  )
    return null;

  const frame =
    Math.floor(
      Math.max(0, context.time?.nowMs ?? 0) / BOBBY_SPEED_TRAIL_FRAME_MS,
    ) % 5;
  const offset = speedTrailOffset(direction);
  return {
    kind: "image",
    asset: BOBBY_VISUAL_ASSETS.speedTrail,
    frameColumns: 5,
    frameRows: 2,
    // mow.png 第二行的 5 帧是 Bobby / mower 共用的加速尾焰。
    frameIndex: 5 + frame,
    anchor: "bottom",
    offsetX: offset.x,
    offsetY: BOBBY_OFFSET_Y + offset.y,
  };
}

function isInFirstHalfOfSpeedMotion(
  context: VisualResolveContext,
  direction: Direction,
): boolean {
  if (
    context.runtime?.animation !== "speed" ||
    context.runtime.moving !== true
  )
    return false;
  const remaining =
    direction === "left" || direction === "right"
      ? Math.abs(context.runtime.offsetX ?? 0)
      : Math.abs(context.runtime.offsetY ?? 0);
  return remaining > 0.5;
}

function speedTrailOffset(direction: Direction): { x: number; y: number } {
  if (direction === "left") return { x: BOBBY_TILE_SIZE, y: 0 };
  if (direction === "right") return { x: -BOBBY_TILE_SIZE, y: 0 };
  if (direction === "up") return { x: 0, y: BOBBY_TILE_SIZE };
  return { x: 0, y: -BOBBY_TILE_SIZE };
}

function composition(
  frame: {
    asset: string;
    frameColumns: number;
    frameRows: number;
    frameIndex?: number;
    frameProgress?: number;
  },
  background: ImageVisualLayer | null = null,
) {
  const foreground: ImageVisualLayer = {
    kind: "image",
    ...frame,
    anchor: "bottom",
    offsetY: BOBBY_OFFSET_Y,
  };
  return {
    layers: background ? [background, foreground] : [foreground],
  };
}

function resolveIdleFrame(
  stationarySinceMs: number | undefined,
  nowMs: number | undefined,
): number | null {
  if (stationarySinceMs === undefined || nowMs === undefined) return null;
  const idleMs = Math.max(0, nowMs - stationarySinceMs);
  if (idleMs < BOBBY_IDLE_DELAY_MS) return null;
  return (
    Math.floor(
      (idleMs - BOBBY_IDLE_DELAY_MS) / BOBBY_IDLE_FRAME_MS,
    ) % 3
  );
}
