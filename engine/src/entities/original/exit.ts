import { MapEntityTypeId } from "@bobby/model";
import type { WinConditionState } from "../../world/WorldTypes.js";
import type {
  VisualDefinition,
  VisualResolveContext,
} from "../../visual/VisualDefinition.js";
import type {
  EntityModule,
  EntityModuleDefinition,
} from "../EntityModule.js";
import { requiresUnmountedReachBehavior } from "../behaviorLibrary.js";
import {
  originalAmbientAnimationLayer,
  originalModule,
  tileCell,
} from "./module.js";

const definition: EntityModuleDefinition = {
  type: MapEntityTypeId.EXIT,
  presenceFacts: ["walkable"],
  presentation: { name: "Exit" },
};

const base = tileCell(MapEntityTypeId.EXIT);

const visual: VisualDefinition = {
  id: MapEntityTypeId.EXIT,
  resolve(context) {
    const ambient = exitCanCompleteWinCondition(context.winState)
      ? exitAmbientLayer(context)
      : null;
    return {
      layers: [
        ambient ?? {
          kind: "atlas",
          column: base.column,
          row: base.row,
        },
      ],
    };
  },
};

export const exit: EntityModule = originalModule(definition, visual, [
  { behavior: requiresUnmountedReachBehavior },
]);

function exitAmbientLayer(context: VisualResolveContext) {
  if (!context.time) return null;
  return originalAmbientAnimationLayer(
    { type: MapEntityTypeId.EXIT, id: "ambient" },
    context.time.nowMs,
  );
}

/**
 * 保持其它 Goal 的当前值，只把尚未完成的 Exit 投影为完成；若根条件因此成立，
 * Exit 就是当前可完成关卡的路径，应当播放提示动画。
 */
function exitCanCompleteWinCondition(
  state: Readonly<WinConditionState> | null | undefined,
): boolean {
  if (!state || state.completed) return false;
  const projection = projectExitCompletion(state);
  return projection.pendingExit && projection.completed;
}

interface ExitCompletionProjection {
  completed: boolean;
  pendingExit: boolean;
}

function projectExitCompletion(
  state: Readonly<WinConditionState>,
): ExitCompletionProjection {
  if (state.type === "exit") {
    return {
      completed: true,
      pendingExit: !state.completed,
    };
  }
  if (state.type !== "all" && state.type !== "any") {
    return {
      completed: state.completed,
      pendingExit: false,
    };
  }

  const children = state.conditions.map(projectExitCompletion);
  return {
    completed: state.type === "all"
      ? children.every((child) => child.completed)
      : children.some((child) => child.completed),
    pendingExit: children.some((child) => child.pendingExit),
  };
}
