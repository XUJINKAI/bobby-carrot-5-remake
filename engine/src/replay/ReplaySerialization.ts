import type { Replay } from "./ReplayFormat.js";

/**
 * 保留 Replay 顶层的易读缩进，但让体积最大的 frames 每帧只占一行。
 * frames 固定放在最后，便于人工查看和追加录制内容。
 */
export function serializeReplay(replay: Replay): string {
  const { frames, ...header } = replay;
  const serializedHeader = JSON.stringify(header, null, 2);
  const prefix = serializedHeader.slice(0, -2);
  if (frames.length === 0)
    return `${prefix},\n  "frames": []\n}\n`;
  const serializedFrames = frames
    .map((frame) => `    ${JSON.stringify(frame)}`)
    .join(",\n");
  return `${prefix},\n  "frames": [\n${serializedFrames}\n  ]\n}\n`;
}
