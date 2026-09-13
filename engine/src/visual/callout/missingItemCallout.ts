import {
  isMissingItemEvent,
  type MissingItemKind,
} from "../../world/WorldTypes.js";
import type { WorldCalloutDefinition } from "./WorldCalloutDefinition.js";

export const MISSING_ITEM_CALLOUT_DURATION_MS = 992;
export const MISSING_ITEM_CALLOUT_BLINK_PERIOD_MS = 248;

interface MissingItemPresentation {
  sliceId: string;
  accessibleText: string;
}

const MISSING_ITEM_PRESENTATIONS: Readonly<
  Record<MissingItemKind, MissingItemPresentation>
> = {
  gas: { sliceId: "hud-gas", accessibleText: "需要汽油" },
  "lock-key": { sliceId: "hud-key", accessibleText: "需要钥匙" },
  kite: { sliceId: "hud-kite", accessibleText: "需要风筝" },
  shovel: { sliceId: "hud-shovel", accessibleText: "需要雪铲" },
  bean: { sliceId: "hud-bean", accessibleText: "需要魔豆" },
};

/** 缺少道具只携带语义 item；图标和表现时序集中在 Presentation。 */
export const missingItemCalloutDefinition: WorldCalloutDefinition = {
  id: "missing-item",
  eventType: "missing-item",
  resolve(event) {
    if (!isMissingItemEvent(event)) return null;
    const presentation = MISSING_ITEM_PRESENTATIONS[event.data.item];
    return {
      channel: `missing-item:${event.actorId}`,
      anchor: { type: "entity", entityId: event.actorId },
      content: {
        type: "image-slice",
        sliceId: presentation.sliceId,
        accessibleText: presentation.accessibleText,
      },
      placement: "auto-vertical",
      durationMs: MISSING_ITEM_CALLOUT_DURATION_MS,
      clearanceSourcePx: 36,
      blink: {
        periodMs: MISSING_ITEM_CALLOUT_BLINK_PERIOD_MS,
        visibleFromMs: MISSING_ITEM_CALLOUT_BLINK_PERIOD_MS / 2,
        visibleUntilMs: MISSING_ITEM_CALLOUT_BLINK_PERIOD_MS,
      },
    };
  },
};
