export type ScreenDirection = "up" | "down" | "left" | "right";

export interface ScreenControlOptions {
  onDirection(direction: ScreenDirection): void;
}

export function renderScreenControl(): string {
  return `
    <div class="screen-control" data-screen-pad aria-label="屏幕摇杆">
      <button data-direction="up">▲</button>
      <button data-direction="left">◀</button>
      <button data-direction="down">▼</button>
      <button data-direction="right">▶</button>
    </div>`;
}

export function bindScreenControl(root: ParentNode, options: ScreenControlOptions): void {
  root.querySelectorAll<HTMLButtonElement>("[data-direction]").forEach((button) => {
    button.addEventListener("pointerdown", () => {
      const direction = button.dataset.direction as ScreenDirection | undefined;
      if (direction) options.onDirection(direction);
    });
  });
}
