import type { Behavior, BehaviorContext } from "../behavior/Behavior.js";

export const objectInteractionTraitBehavior: Behavior = {
  id: "object-interaction",
  onTouch: (context) => emitObjectInteraction(context, "touch"),
  onEnter: (context) => emitObjectInteraction(context, "enter"),
};

function emitObjectInteraction(
  context: BehaviorContext,
  action: "touch" | "enter",
): void {
  if (context.self.presence.role && context.self.presence.role !== "body")
    return;
  context.commands.emit({
    type: "object-interaction",
    actorId: context.actor.id,
    entityId: context.self.entity.id,
    objectType: context.self.entity.type,
    ...(context.self.presence.role
      ? { role: context.self.presence.role }
      : {}),
    x: context.self.presence.cell.x,
    y: context.self.presence.cell.y,
    action,
  });
}
