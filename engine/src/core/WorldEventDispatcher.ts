import type {
  ObjectInteractionEvent,
  WorldEvent,
} from "../world/WorldTypes.js";
import { isObjectInteractionEvent } from "../world/WorldTypes.js";

export type WorldEventListener = (event: WorldEvent) => void;
export type InteractionRequestListener = (
  event: ObjectInteractionEvent,
) => void;

/** 统一发布可观察事件，并按运行模式控制宿主交互请求。 */
export class WorldEventDispatcher {
  private readonly worldListeners = new Set<WorldEventListener>();
  private readonly interactionListeners = new Set<InteractionRequestListener>();

  onWorldEvent(listener: WorldEventListener): () => void {
    this.worldListeners.add(listener);
    return () => this.worldListeners.delete(listener);
  }

  onInteractionRequest(listener: InteractionRequestListener): () => void {
    this.interactionListeners.add(listener);
    return () => this.interactionListeners.delete(listener);
  }

  publish(
    events: readonly WorldEvent[],
    notifyInteractions: boolean,
    observe: (event: WorldEvent) => void,
  ): void {
    for (const event of events) {
      observe(event);
      for (const listener of this.worldListeners) listener(event);
      if (!notifyInteractions || !isObjectInteractionEvent(event)) continue;
      for (const listener of this.interactionListeners) listener(event);
    }
  }
}
