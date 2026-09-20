import {
  type Direction,
  type EntityType,
} from "@bobby/model";
import type { Behavior } from "../../world/behavior/Behavior.js";

/** Speed Switch 与 Tide Switch 的整图同步规则相同，共用工厂避免两套行为漂移。 */
export function directionalSwitchBehavior(
  id: string,
  switchType: EntityType,
  targetType: EntityType,
): Behavior {
  return {
    id,
    onEnter({ actor, self, query, commands }) {
      if (!query.entityHasFact(actor.id, "player")) return;
      // 原版只有 Raised 状态会启动整图变换；Pressed 状态再次进入不触发。
      if (self.entity.state?.pressed === true) return;

      for (const entity of query.entitiesMatching({
        kind: "type",
        value: switchType,
      })) {
        if (entity.type !== switchType) continue;
        commands.setState(entity.id, {
          ...entity.state,
          pressed: entity.state?.pressed !== true,
        });
      }

      for (const entity of query.entitiesMatching({
        kind: "type",
        value: targetType,
      })) {
        if (entity.type !== targetType) continue;
        commands.setDirection(
          entity.id,
          oppositeDirection(entity.direction ?? "right"),
        );
      }
    },
  };
}

function oppositeDirection(direction: Direction): Direction {
  return {
    up: "down",
    down: "up",
    left: "right",
    right: "left",
  }[direction] as Direction;
}
