import type { Behavior, BehaviorContext } from "../behavior/Behavior.js";

export const dialogTraitBehavior: Behavior = {
  id: "dialog",
  onTouch: emitDialog,
};

function emitDialog(context: BehaviorContext): void {
  if (context.self.presence.role && context.self.presence.role !== "body")
    return;
  const message = context.self.entity.state?.dialogue;
  if (typeof message !== "string" || message.length === 0) return;
  context.commands.emit({
    type: "dialog",
    actorId: context.actor.id,
    entityId: context.self.entity.id,
    x: context.self.presence.cell.x,
    y: context.self.presence.cell.y,
    text: message,
  });
}
