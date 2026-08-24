import { Game, InputController, type GameOptions, type LevelMap } from '@bobby/engine';

export interface GameSession {
  game: Game;
  input: InputController;
  destroy(): void;
}

export interface CreateGameSessionOptions {
  root: ParentNode;
  canvas: HTMLCanvasElement;
  level: LevelMap;
  gameOptions: Omit<GameOptions, 'canvas'>;
}

/**
 * Web-owned adapter around the Engine lifecycle.
 *
 * Pages decide what level/profile/session rules mean. This module only owns the
 * repeated browser plumbing around Game + InputController + mobile controls.
 */
export async function createGameSession(options: CreateGameSessionOptions): Promise<GameSession> {
  const game = new Game({ canvas: options.canvas, ...options.gameOptions });
  const input = new InputController(game);
  bindMobileControls(options.root, game);
  try {
    await game.loadLevel(options.level);
  } catch (error) {
    input.destroy();
    game.destroy();
    throw error;
  }
  return {
    game,
    input,
    destroy(): void {
      input.destroy();
      game.destroy();
    }
  };
}

function bindMobileControls(root: ParentNode, game: Game): void {
  root.querySelectorAll<HTMLButtonElement>('[data-move]').forEach((button) => {
    const direction = button.dataset.move as 'up' | 'down' | 'left' | 'right';
    button.addEventListener('pointerdown', (event) => {
      event.preventDefault();
      button.setPointerCapture(event.pointerId);
      game.setHeldDirection(direction);
    });
    const release = (event: PointerEvent): void => {
      event.preventDefault();
      game.setHeldDirection(null);
    };
    button.addEventListener('pointerup', release);
    button.addEventListener('pointercancel', release);
    button.addEventListener('lostpointercapture', () => game.setHeldDirection(null));
  });
}
