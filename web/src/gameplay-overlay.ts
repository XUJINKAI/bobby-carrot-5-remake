export interface GameplayHudState {
  time: string;
  objective: string;
  moves: string;
  items: string;
}

export function renderGameplayHud(): string {
  return `
    <div class="gameplay-hud" data-gameplay-hud>
      <span class="hud-chip"><strong data-hud-time>00:00</strong></span>
      <span class="hud-chip"><span data-hud-objective-icon class="hud-art hud-carrot"></span><strong data-hud-objective>—</strong></span>
      <span class="hud-items" data-hud-items></span>
      <span class="hud-chip step-chip"><strong data-hud-moves>0</strong><span>STEPS</span></span>
    </div>`;
}

export function updateGameplayHud(root: ParentNode, state: GameplayHudState): void {
  const time = root.querySelector<HTMLElement>("[data-hud-time]");
  const objective = root.querySelector<HTMLElement>("[data-hud-objective]");
  const moves = root.querySelector<HTMLElement>("[data-hud-moves]");
  const items = root.querySelector<HTMLElement>("[data-hud-items]");
  if (time) time.textContent = state.time;
  if (objective) objective.textContent = state.objective;
  if (moves) moves.textContent = state.moves;
  if (items) items.innerHTML = state.items;
}

export function renderResultOverlay(): string {
  return `
    <div class="result-card" data-result-card>
      <div data-result-content></div>
    </div>`;
}
