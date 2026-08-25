import { renderGameplayHud, renderResultOverlay } from "./gameplay-overlay.js";

export interface GameStageOptions {
  canvasId?: string;
  hud?: string;
  content?: string;
  overlay?: string;
}

/** Engine 绘制 Canvas；产品层在同一个 Stage 内组织 HUD、屏幕控件和结果层。 */
export function renderGameStage(options: GameStageOptions = {}): string {
  return `
    <section class="game-stage" data-game-stage>
      <div class="game-canvas-layer">
        ${options.content ?? `<canvas id="${options.canvasId ?? "game"}"></canvas>`}
      </div>
      <div class="hud-overlay" data-hud-overlay>
        ${options.hud ?? renderGameplayHud()}
      </div>
      <div class="screen-control-overlay" data-screen-control hidden></div>
      <div class="result-overlay" data-result-overlay hidden>
        ${options.overlay ?? renderResultOverlay()}
      </div>
    </section>
  `;
}

export function toggleScreenControl(root: ParentNode, enabled: boolean): void {
  const control = root.querySelector<HTMLElement>("[data-screen-control]");
  if (control) control.hidden = !enabled;
}
