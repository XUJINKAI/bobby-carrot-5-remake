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
  if (context.self.presence.role && context.self.presence.role !== "body")
    return;
  const text = nextDialogueLine(context);
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
    ...(text ? { text } : {}),
  });
}

function nextDialogueLine(context: BehaviorContext): string | null {
  const dialogue = context.self.entity.state?.dialogue;
  if (typeof dialogue === "string") return dialogue.length > 0 ? dialogue : null;
  if (!Array.isArray(dialogue) || dialogue.length === 0) return null;
  const lines = dialogue.filter(
    (line): line is string => typeof line === "string" && line.length > 0,
  );
  if (lines.length !== dialogue.length) return null;
  const rawIndex = context.self.entity.state?.dialogueIndex;
  const index = typeof rawIndex === "number" && Number.isInteger(rawIndex)
    ? rawIndex
    : 0;
  context.commands.setState(context.self.entity.id, {
    ...context.self.entity.state,
    dialogueIndex: (index + 1) % lines.length,
  });
  return lines[index % lines.length] ?? null;
}
