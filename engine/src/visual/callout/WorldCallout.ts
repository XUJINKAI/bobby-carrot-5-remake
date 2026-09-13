import type { EntityId } from "../../world/entity/EntityInstance.js";

export type WorldCalloutContent =
  | {
      type: "image-slice";
      sliceId: string;
      accessibleText: string;
    }
  | {
      type: "text";
      text: string;
    };

export type WorldCalloutAnchor =
  | { type: "entity"; entityId: EntityId }
  | { type: "cell"; x: number; y: number };

export interface WorldCalloutBlink {
  periodMs: number;
  visibleFromMs: number;
  visibleUntilMs: number;
}

/** 由事件 Definition 解析出的纯表现提示，不进入 World 或 Replay。 */
export interface WorldCalloutCue {
  channel: string;
  anchor: WorldCalloutAnchor;
  content: WorldCalloutContent;
  placement: "above" | "below" | "auto-vertical";
  durationMs: number;
  /** Entity 图像可能高于所在格；clearance 让提示避开主体视觉。 */
  clearanceSourcePx?: number;
  blink?: WorldCalloutBlink;
}

/** RenderScene 中已经解析为连续世界坐标的 Callout。 */
export interface WorldCalloutRenderItem {
  channel: string;
  x: number;
  y: number;
  content: WorldCalloutContent;
  placement: WorldCalloutCue["placement"];
  clearanceSourcePx: number;
}

export function accessibleWorldCalloutText(
  content: WorldCalloutContent,
): string {
  return content.type === "image-slice" ? content.accessibleText : content.text;
}
