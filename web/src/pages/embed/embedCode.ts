import type { BC5RMountOptions } from "@bobby/embed";

export type EmbedPreviewOptions = Omit<BC5RMountOptions, "target">;

const QUEUE_CALL = /\bBC5R\s*\.\s*queue\s*\.\s*push\s*\(/;

export function generateEmbedCode(
  config: BC5RMountOptions,
  standaloneUrl: string,
): string {
  const serialized = JSON.stringify(config, null, 2).replaceAll("<", "\\u003c");
  return `<div id="bc5r" style="width:100%;height:520px;display:grid;place-items:center;
  border:1px solid #254868;background:#071522;color:#c9e6f7">Loading Bobby Carrot 5 Remake…</div>

<script>
window.BC5R = window.BC5R || { queue: [] };
BC5R.queue.push(${serialized});
<\/script>

<script async src="${standaloneUrl}"><\/script>`;
}

export function parseEmbedCode(source: string): EmbedPreviewOptions {
  const match = QUEUE_CALL.exec(source);
  if (!match) throw new Error("Embed code does not contain BC5R.queue.push().");
  const argumentStart = match.index + match[0].length;
  const argumentEnd = findCallEnd(source, argumentStart);
  const value: unknown = JSON.parse(source.slice(argumentStart, argumentEnd));
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("BC5R.queue.push() config must be a JSON object.");
  }
  const { target: _target, ...options } = value as Record<string, unknown>;
  return options as EmbedPreviewOptions;
}

function findCallEnd(source: string, argumentStart: number): number {
  let parenthesisDepth = 1;
  let inString = false;
  let escaped = false;
  for (let index = argumentStart; index < source.length; index++) {
    const character = source[index];
    if (inString) {
      if (escaped) escaped = false;
      else if (character === "\\") escaped = true;
      else if (character === '"') inString = false;
      continue;
    }
    if (character === '"') {
      inString = true;
      continue;
    }
    if (character === "(") parenthesisDepth++;
    if (character !== ")") continue;
    parenthesisDepth--;
    if (parenthesisDepth === 0) return index;
  }
  throw new Error("BC5R.queue.push() call is incomplete.");
}
