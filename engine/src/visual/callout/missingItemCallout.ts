import {
  isMissingItemEvent,
  type MissingItemKind,
} from "../../world/WorldTypes.js";
import { ORIGINAL_GAMEPLAY_HUD_SLICE_IDS } from "../../image/OriginalGameplayImages.js";
import type { WorldCalloutDefinition } from "./WorldCalloutDefinition.js";

export const MISSING_ITEM_CALLOUT_DURATION_MS = 992;
export const MISSING_ITEM_CALLOUT_BLINK_PERIOD_MS = 248;

interface MissingItemPresentation {
  sliceId: string;
  accessibleText: string;
}

const MISSING_ITEM_PRESENTATIONS: Readonly<
  Partial<Record<MissingItemKind, MissingItemPresentation>>
> = {
  gas: {
    sliceId: ORIGINAL_GAMEPLAY_HUD_SLICE_IDS.gas,
    accessibleText: "需要汽油",
  },
  "lock-key": {
    sliceId: ORIGINAL_GAMEPLAY_HUD_SLICE_IDS.key,
    accessibleText: "需要钥匙",
  },
  kite: {
    sliceId: ORIGINAL_GAMEPLAY_HUD_SLICE_IDS.kite,
    accessibleText: "需要风筝",
  },
  shovel: {
    sliceId: ORIGINAL_GAMEPLAY_HUD_SLICE_IDS.shovel,
    accessibleText: "需要雪铲",
  },
  bean: {
    sliceId: ORIGINAL_GAMEPLAY_HUD_SLICE_IDS.bean,
    accessibleText: "需要魔豆",
  },
};

/** 缺少道具只携带语义 item；图标和表现时序集中在 Presentation。 */
export const missingItemCalloutDefinition: WorldCalloutDefinition = {
  id: "missing-item",
  eventType: "missing-item",
  resolve(event) {
    if (!isMissingItemEvent(event)) return null;
    const presentation = MISSING_ITEM_PRESENTATIONS[event.data.item];
    if (!presentation) return null;
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
