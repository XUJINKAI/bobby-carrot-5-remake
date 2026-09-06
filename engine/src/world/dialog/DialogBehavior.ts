import type { JsonValue } from "@bobby/model";
import type { Behavior, BehaviorContext } from "../behavior/Behavior.js";

export type DialogInitializer = (
  context: BehaviorContext,
) => string | null | undefined;

const dialogInitializers = new Map<string, DialogInitializer>();

/**
 * 注册一个运行时 Dialog 函数。LevelMap 只保存 message-ref，函数仍属于代码层。
 * 同一 ref 后注册的实现覆盖前一个，便于宿主按当前产品上下文提供行为。
 */
export function createDialogBehavior(
  messageRef: string,
  initializer: DialogInitializer,
): () => void {
  if (!messageRef.trim()) throw new Error("Dialog message-ref 不能为空");
  dialogInitializers.set(messageRef, initializer);
  return () => {
    if (dialogInitializers.get(messageRef) === initializer)
      dialogInitializers.delete(messageRef);
  };
}

export const dialogTraitBehavior: Behavior = {
  id: "dialog",
  onTouch: emitDialog,
  onEnter: emitDialog,
};

function emitDialog(context: BehaviorContext): void {
  const message = resolveDialogMessage(
    context.self.entity.state?.dialog,
    context,
  );
  if (message === undefined || message === null) return;
  context.commands.emit({
    type: "dialog",
    entityId: context.self.entity.id,
    x: context.self.presence.cell.x,
    y: context.self.presence.cell.y,
    text: message,
  });
}

function resolveDialogMessage(
  value: JsonValue | undefined,
  context: BehaviorContext,
): string | null | undefined {
  if (!isRecord(value)) return undefined;

  if (typeof value.message === "string") return value.message;

  const messageRef = value["message-ref"];
  if (typeof messageRef !== "string" || messageRef.length === 0) return undefined;
  return dialogInitializers.get(messageRef)?.(context);
}

function isRecord(value: JsonValue | undefined): value is Record<string, JsonValue> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
