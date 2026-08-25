export type ScreenDirection = "up" | "down" | "left" | "right";

export interface ScreenControlOptions {
  onDirection(direction: ScreenDirection | null): void;
}

export function renderScreenControl(): string {
  return `
    <div class="screen-control" data-screen-pad aria-label="屏幕摇杆">
      <button data-move="up">▲</button>
      <button data-move="left">◀</button>
      <button data-move="down">▼</button>
      <button data-move="right">▶</button>
    </div>`;
}

export function bindScreenControl(root: ParentNode, options: ScreenControlOptions): void {
  root.querySelectorAll<HTMLButtonElement>("[data-move]").forEach((button) => {
    button.addEventListener("pointerdown", () => {
      const direction = button.dataset.move as ScreenDirection | undefined;
      if (direction) options.onDirection(direction);
    });
    button.addEventListener("pointerup", () => options.onDirection(null));
    button.addEventListener("pointercancel", () => options.onDirection(null));
  });
}
