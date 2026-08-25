export interface GameStageOptions {
  canvasId?: string;
  hud?: string;
  content?: string;
  overlay?: string;
}

/**
 * Shared gameplay container.
 * The Engine owns canvas rendering; this layer owns the product-side
 * placement of HUD, controls and overlays around it.
 */
export function renderGameStage(options: GameStageOptions = {}): string {
  return `
    <section class="game-stage" data-game-stage>
      <div class="game-canvas-layer">
        ${options.content ?? `<canvas id="${options.canvasId ?? "game"}"></canvas>`}
      </div>
      <div class="hud-overlay" data-hud-overlay>
        ${options.hud ?? ""}
      </div>
      <div class="screen-control-overlay" data-screen-control hidden></div>
      <div class="result-overlay" data-result-overlay hidden>
        ${options.overlay ?? ""}
      </div>
    </section>
  `;
}

export function toggleScreenControl(root: ParentNode, enabled: boolean): void {
  const control = root.querySelector<HTMLElement>("[data-screen-control]");
  if (control) control.hidden = !enabled;
}
