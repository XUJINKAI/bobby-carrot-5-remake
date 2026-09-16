import type { Behavior, BehaviorContext } from "../../world/behavior/Behavior.js";

export const objectInteractionBehavior: Behavior = {
  id: "object-interaction",
  onTouch: (context) => emitObjectInteraction(context, "touch"),
  onEnter: (context) => emitObjectInteraction(context, "enter"),
};

function emitObjectInteraction(
  context: BehaviorContext,
  action: "touch" | "enter",
): void {
  const dialogue = context.self.entity.state?.dialogue;
  if (dialogue !== undefined) {
    const lines = dialogueLines(dialogue);
    if (!lines) return;
    context.commands.emit({
      type: "dialogue-request",
      actorId: context.actor.id,
      entityId: context.self.entity.id,
      objectType: context.self.entity.type,
      ...(context.self.presence.role
        ? { role: context.self.presence.role }
        : {}),
      x: context.self.presence.cell.x,
      y: context.self.presence.cell.y,
      action,
      lines,
    });
    return;
  }
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

function dialogueLines(value: unknown): readonly string[] | null {
  if (typeof value === "string") return value.length > 0 ? [value] : null;
  if (
    !Array.isArray(value) ||
    value.length === 0 ||
    !value.every((line) => typeof line === "string" && line.length > 0)
  )
    return null;
  return value;
}
