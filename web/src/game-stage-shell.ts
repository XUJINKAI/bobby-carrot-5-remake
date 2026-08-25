import { renderResultOverlay } from "./gameplay-overlay.js";

export interface GameStageOptions {
  canvasId?: string;
  content?: string;
  overlay?: string;
}

/** Engine 在 Canvas 层内创建基础 HUD 与摇杆；产品层只叠加 Debug 和 Result。 */
export function renderGameStage(options: GameStageOptions = {}): string {
  return `
    <section class="game-stage" data-game-stage>
      <div class="game-canvas-layer">
        ${options.content ?? `<canvas id="${options.canvasId ?? "game"}"></canvas>`}
      </div>
      <div class="result-overlay" data-result-overlay hidden>
        ${options.overlay ?? renderResultOverlay()}
      </div>
    </section>
  `;
}
