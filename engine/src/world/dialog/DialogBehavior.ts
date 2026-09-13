import type { Behavior, BehaviorContext } from "../behavior/Behavior.js";

export const dialogTraitBehavior: Behavior = {
  id: "dialog",
  onTouch: emitDialog,
};

function emitDialog(context: BehaviorContext): void {
  if (context.self.presence.role && context.self.presence.role !== "body")
    return;
  const dialogue = context.self.entity.state?.dialogue;
  const message = nextDialogueLine(context, dialogue);
  if (message === null) return;
  context.commands.emit({
    type: "dialog",
    actorId: context.actor.id,
    entityId: context.self.entity.id,
    x: context.self.presence.cell.x,
    y: context.self.presence.cell.y,
    text: message,
  });
}

function nextDialogueLine(
  context: BehaviorContext,
  dialogue: unknown,
): string | null {
  if (typeof dialogue === "string") return dialogue.length > 0 ? dialogue : null;
  if (
    !Array.isArray(dialogue) ||
    dialogue.length === 0 ||
    !dialogue.every((line) => typeof line === "string" && line.length > 0)
  ) {
    return null;
  }
  const rawIndex = context.self.entity.state?.dialogueIndex;
  const index = typeof rawIndex === "number" && Number.isInteger(rawIndex)
    ? rawIndex
    : 0;
  context.commands.setState(context.self.entity.id, {
    ...context.self.entity.state,
    dialogueIndex: (index + 1) % dialogue.length,
  });
  return dialogue[index % dialogue.length] ?? null;
}
