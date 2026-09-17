import { MapEntityTypeId, type Direction } from "@bobby/model";
import type {
  CanvasVisualLayer,
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
const MOWER_FRAME_MS = 62;
const SPEED_MOWER_FRAME_MS = 31;
const SPEED_MOW_TRAIL_FRAME_MS = 93;
const BOBBY_STANDING_FRAME = 3;
const BOBBY_ICE_FRAME = 6;
const BOBBY_TRANSITION_FRAME_COUNT = 8;
const BOBBY_TRANSITION_STEP_COUNT = 10;
const FLIGHT_ELEVATION_STEP_PX = 6;
const FLIGHT_ELEVATION_PX = 24;
const NORMAL_TAKEOFF_STAGE_COUNT = 8;
const FAST_TAKEOFF_STAGE_COUNT = 4;
const LANDING_STAGE_COUNT = 4;
const DIRECTION_COLUMN: Readonly<Record<Direction, number>> = {
  left: 0,
  right: 1,
  up: 2,
  down: 3,
};
const MOWER_SOURCE_RECT: Readonly<Record<Direction, { x: number; width: number }>> = {
  left: { x: 0, width: 60 },
  right: { x: 60, width: 60 },
  up: { x: 120, width: 48 },
  down: { x: 168, width: 48 },
};
const MOWER_FRAME_HEIGHT = 83;

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
  transition: "bobby-transition",
  mower: "bobby-mower",
  snowplow: "bobby-snowplow",
  kite: "bobby-kite",
  speedTrail: "bobby-speed-trail",
} as const;

const definition: EntityModuleDefinition = {
  type: MapEntityTypeId.BOBBY,
  presenceFacts: ["player", "blocking"],
  state: BOBBY_INVENTORY_FIELDS,
  presentation: {
    name: "Bobby",
    renderPass: "standing",
  },
};

const bobbyMovementPolicy: Behavior = {
  id: "bobby-movement-policy",
  planMovement(context) {
    const { actor, query, to, target } = context;
    if (isBobbyFlying(actor.state))
      return {
        passage: "unrestricted",
        lifecycle: {
          source: [],
          target: target.filter((presence) =>
            query.entity(presence.entityId)?.type === MapEntityTypeId.LANDING,
          ),
        },
        reason: "airborne-passage",
      };

    const relation = bobbyMountId(actor.state);
    if (relation === null || query.entity(relation)?.type !== MapEntityTypeId.MOWER) {
      return;
    }
    return {
      // Mower 的重量与机关交互读取完整栈；普通 Bobby 仍使用默认接触栈。
      contacts: {
        source: [...query.allPresencesAt(context.from)].reverse(),
        target: [...query.allPresencesAt(to)].reverse(),
      },
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
  id: MapEntityTypeId.BOBBY,
  resolve(context: VisualResolveContext) {
    const direction =
      context.runtime?.direction ?? context.entity.direction ?? "down";
    const rawProgress = context.runtime?.progress ?? 1;
    const progress = clampProgress(rawProgress);

    if (context.outcome?.phase === "lost") {
      return composition(context, {
        asset: BOBBY_VISUAL_ASSETS.death,
        frameColumns: 8,
        frameRows: 1,
        ...(rawProgress >= 1
          ? { frameIndex: 7 }
          : { frameProgress: progress }),
      });
    }

    if (context.runtime?.animation === "level-enter") {
      const frameIndex =
        BOBBY_TRANSITION_STEP_COUNT - 1 - transitionStep(progress);
      if (frameIndex >= BOBBY_TRANSITION_FRAME_COUNT) return null;
      return composition(context, {
        asset: BOBBY_VISUAL_ASSETS.transition,
        frameColumns: BOBBY_TRANSITION_FRAME_COUNT,
        frameRows: 1,
        frameIndex,
      });
    }

    if (context.runtime?.animation === "level-exit") {
      if (rawProgress >= 1) return null;
      const frameIndex = transitionStep(progress);
      if (frameIndex >= BOBBY_TRANSITION_FRAME_COUNT) return null;
      return composition(context, {
        asset: BOBBY_VISUAL_ASSETS.transition,
        frameColumns: BOBBY_TRANSITION_FRAME_COUNT,
        frameRows: 1,
        frameIndex,
      });
    }

    // World 完成后只允许通关 transition 绘制 Bobby；动画结束后角色保持隐藏。
    if (context.outcome?.phase === "won") return null;

    if (context.runtime?.animation === "shovel") {
      const row = Math.min(2, Math.floor(progress * 3));
      return composition(context, {
        asset: BOBBY_VISUAL_ASSETS.snowplow,
        frameColumns: 4,
        frameRows: 3,
        frameIndex: DIRECTION_COLUMN[direction] + row * 4,
      });
    }

    // Ice 的滑动姿势只属于正在进行的空间运动；停在 Ice 上时仍使用普通站姿。
    if (
      context.runtime?.animation === "ice" &&
      context.runtime.moving === true
    ) {
      return composition(context, {
        asset: BOBBY_VISUAL_ASSETS.move[direction],
        frameColumns: 8,
        frameRows: 1,
        frameIndex: BOBBY_ICE_FRAME,
      });
    }

    const mountId = bobbyMountId(context.entity.state);
    const mount = mountId === null ? undefined : context.query.entity(mountId);
    if (mount?.type === MapEntityTypeId.MOWER) {
      const accelerated = readBobbySpeedBoost(context.entity.state) !== null;
      const row = timedFrame(
        context,
        accelerated ? SPEED_MOWER_FRAME_MS : MOWER_FRAME_MS,
        2,
      );
      const source = MOWER_SOURCE_RECT[direction];
      return composition(
        context,
        {
          asset: BOBBY_VISUAL_ASSETS.mower,
          sourceX: source.x,
          sourceY: row * MOWER_FRAME_HEIGHT,
          frameWidth: source.width,
          frameHeight: MOWER_FRAME_HEIGHT,
          offsetX: source.width === 60 ? -6 : 0,
        },
        speedTrail(context, direction),
      );
    }

    // Carry is a passive positional movement. The carrier and every carried
    // player share one Presentation timeline, while Bobby keeps a standing pose.
    if (context.runtime?.animation === "carry") {
      return composition(context, {
        asset: BOBBY_VISUAL_ASSETS.move[direction],
        frameColumns: 8,
        frameRows: 1,
        frameIndex: BOBBY_STANDING_FRAME,
      });
    }

    // 原版在进入 Whirlwind 的后半格仍绘制普通 Bobby，只通过 aW 分阶段上抬；
    // 抵达后才切换 b9.png。逆向依据见 docs/reference/runtime-animation.md。
    if (context.entity.state?.flightTransition === "takeoff") {
      return composition(context, {
        asset: BOBBY_VISUAL_ASSETS.move[direction],
        frameColumns: 8,
        frameRows: 1,
        frameIndex: context.runtime?.moving
          ? resolveWalkingFrame(rawProgress)
          : BOBBY_STANDING_FRAME,
      });
    }

    if (
      isBobbyFlying(context.entity.state) ||
      context.entity.state?.flightTransition === "landing"
    ) {
      return composition(context, {
        asset: BOBBY_VISUAL_ASSETS.kite,
        frameColumns: 4,
        frameRows: 1,
        frameIndex: DIRECTION_COLUMN[direction],
      });
    }

    // 藤蔓的攀爬姿势始终使用背面人物 strip，朝向状态本身仍由 World 持有。
    if (isStandingOnClimbable(context)) {
      return composition(context, {
        asset: BOBBY_VISUAL_ASSETS.move.up,
        frameColumns: 8,
        frameRows: 1,
        frameIndex: context.runtime?.moving
          ? resolveWalkingFrame(rawProgress)
          : BOBBY_STANDING_FRAME,
      });
    }

    if (!context.runtime?.moving) {
      const idleFrame = resolveIdleFrame(
        context.runtime?.stationarySinceMs,
        context.time?.nowMs,
      );
      if (idleFrame !== null) {
        return composition(context, {
          asset: BOBBY_VISUAL_ASSETS.idle,
          frameColumns: 3,
          frameRows: 1,
          frameIndex: idleFrame,
        });
      }
    }

    return composition(
      context,
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

function isStandingOnClimbable(context: VisualResolveContext): boolean {
  return context.query.presencesAt(context.entity.anchor).some((presence) =>
    presence.facts.includes("climbable")
  );
}

/** 原版普通走路以第 4 帧为起止点：4,5,6,7,8,1,2,3,4。 */
function resolveWalkingFrame(progress: number): number {
  const normalized = Math.max(0, Math.min(1, progress));
  const step = Math.min(8, Math.floor(normalized * 8));
  return (BOBBY_STANDING_FRAME + step) % 8;
}

function transitionStep(progress: number): number {
  return Math.min(
    BOBBY_TRANSITION_STEP_COUNT - 1,
    Math.floor(clampProgress(progress) * BOBBY_TRANSITION_STEP_COUNT),
  );
}

function speedTrail(
  context: VisualResolveContext,
  direction: Direction,
): ImageVisualLayer | null {
  const boost = readBobbySpeedBoost(context.entity.state);
  if (!boost || boost.phase === "slow") return null;

  // normal 表示 Speed 未续按时的最后一格；拖尾只保留到该格中点。
  if (
    boost.phase === "normal" &&
    !isInFirstHalfOfSpeedMotion(context, direction)
  )
    return null;

  const frame = timedFrame(
    context,
    SPEED_MOW_TRAIL_FRAME_MS,
    4,
  );
  const offset = speedTrailOffset(direction);
  return {
    kind: "image",
    asset: BOBBY_VISUAL_ASSETS.speedTrail,
    frameColumns: 5,
    frameRows: 2,
    // mow.png 第二行只有前四列参与 gameplay renderer。
    frameIndex: 5 + frame,
    anchor: "bottom",
    offsetX: offset.x,
    offsetY: BOBBY_OFFSET_Y - visualElevation(context) + offset.y,
  };
}

function timedFrame(
  context: VisualResolveContext,
  frameMs: number,
  frameCount: number,
): number {
  const nowMs = context.time?.nowMs ?? 0;
  const startedAtMs = context.runtime?.animationStartedAtMs ?? 0;
  return Math.floor(Math.max(0, nowMs - startedAtMs) / frameMs) % frameCount;
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

function visualElevation(context: VisualResolveContext): number {
  const progress = clampProgress(context.runtime?.progress ?? 1);
  if (context.entity.state?.flightTransition === "takeoff") {
    const stages = context.runtime?.animation === "speed"
      ? FAST_TAKEOFF_STAGE_COUNT
      : NORMAL_TAKEOFF_STAGE_COUNT;
    return completedFlightTransitionStages(progress, stages) *
      FLIGHT_ELEVATION_STEP_PX;
  }
  if (context.entity.state?.flightTransition === "landing") {
    return Math.max(
      0,
      FLIGHT_ELEVATION_PX -
        completedFlightTransitionStages(progress, LANDING_STAGE_COUNT) *
          FLIGHT_ELEVATION_STEP_PX,
    );
  }
  if (isBobbyFlying(context.entity.state)) return FLIGHT_ELEVATION_PX;
  const value = context.runtime?.elevationPx;
  return typeof value === "number" && Number.isFinite(value)
    ? Math.max(0, value)
    : 0;
}

/**
 * 原版在移动中点开始更新 aW；每完成一个等分的 Presentation 毫秒区间推进一阶段。
 * progress 来自 WorldMotion 的真实 durationMs，因此不同渲染帧率采样结果一致。
 */
function completedFlightTransitionStages(
  progress: number,
  stageCount: number,
): number {
  if (progress <= 0.5) return 0;
  const phaseProgress = Math.min(1, (progress - 0.5) * 2);
  return Math.min(stageCount, Math.floor(phaseProgress * stageCount));
}

function composition(
  context: VisualResolveContext,
  frame: Omit<ImageVisualLayer, "kind" | "anchor" | "offsetY">,
  background: ImageVisualLayer | null = null,
) {
  const marker = playerMarker(context);
  const foreground: ImageVisualLayer = {
    kind: "image",
    ...frame,
    anchor: "bottom",
    offsetY: BOBBY_OFFSET_Y - visualElevation(context),
  };
  return {
    layers: [
      ...(marker ? [marker] : []),
      ...(background ? [background] : []),
      foreground,
    ],
  };
}

function playerMarker(context: VisualResolveContext): CanvasVisualLayer | null {
  const players = [...context.query.entitiesWithFact("player")].sort(
    (left, right) =>
      playerChannelOrder(left.state?.["controller"]) -
        playerChannelOrder(right.state?.["controller"]) ||
      left.id - right.id,
  );
  if (players.length < 2) return null;
  const index = players.findIndex((player) => player.id === context.entity.id);
  const color = index === 0 ? "#ff665e" : "#5796ff";
  const elevation = visualElevation(context) / BOBBY_TILE_SIZE;
  return {
    kind: "canvas",
    draw(canvas, x, y, size) {
      canvas.save();
      canvas.beginPath();
      canvas.ellipse(
        x + size / 2,
        y + size * (0.8 - elevation),
        size * 0.34,
        size * 0.13,
        0,
        0,
        Math.PI * 2,
      );
      canvas.fillStyle = `${color}55`;
      canvas.fill();
      canvas.strokeStyle = color;
      canvas.lineWidth = Math.max(1, size * 0.045);
      canvas.stroke();
      canvas.restore();
    },
  };
}

function playerChannelOrder(value: unknown): number {
  return value === 1 ? 1 : 0;
}

function resolveIdleFrame(
  stationarySinceMs: number | undefined,
  nowMs: number | undefined,
): number | null {
  if (stationarySinceMs === undefined || nowMs === undefined) return null;
  const idleMs = Math.max(0, nowMs - stationarySinceMs);
  if (idleMs < BOBBY_IDLE_DELAY_MS) return null;
  const frame = Math.floor(
    (idleMs - BOBBY_IDLE_DELAY_MS) / BOBBY_IDLE_FRAME_MS,
  ) % 4;
  return frame <= 2 ? frame : 1;
}
