import type { Direction } from "@bobby/model";
import type {
  LogicalInputAction,
  LogicalInputConsumer,
} from "../input/InputController.js";
import type { DialogueRequestEvent } from "../world/WorldTypes.js";
import {
  GameplayDialogView,
  type GameplayDialogOptionResult,
  type GameplayDialogPresentation,
  type GameplayDialogResult,
  type GameplayDialogViewOptions,
} from "./GameplayDialog.js";

export const DEFAULT_DIALOGUE_REPEAT_COOLDOWN_MS = 500;

export interface GameplayDialogControllerOptions
  extends GameplayDialogViewOptions {
  /** Entity 字面对白关闭后，同一 Bobby 再次触发同一 Entity 的抑制时间。 */
  repeatCooldownMs?: number;
}

interface GameplayDialogBlockLease {
  release(): void;
}

export interface GameplayDialogControllerHost {
  acquireBlock(reason: "dialogue"): GameplayDialogBlockLease;
  acquireInput(
    reason: "dialogue",
    consumer: LogicalInputConsumer,
  ): GameplayDialogBlockLease;
  now(): number;
  directionForDialogue(request: DialogueRequestEvent): Direction | null;
  moveFromDialogue(actorId: number, direction: Direction): void;
}

interface GameplayDialogSurface {
  show(message: string): Promise<GameplayDialogResult>;
  showSequence(
    messages: readonly string[],
    direction?: Direction | null,
  ): Promise<GameplayDialogResult>;
  present(
    presentation: GameplayDialogPresentation,
  ): Promise<GameplayDialogResult>;
  handleInput(input: LogicalInputAction): void;
  close(): void;
  destroy(): void;
}

interface QueuedDialog {
  run(): Promise<GameplayDialogResult>;
  resolve(result: GameplayDialogResult): void;
  reject(error: unknown): void;
}

const DISMISSED: GameplayDialogResult = { type: "dismissed" };

/**
 * Engine 对话的唯一生命周期入口。View 只负责 DOM；Controller 负责串行、门禁与
 * Entity 字面对白的短时重复抑制。
 */
export class GameplayDialogController {
  private readonly queue: QueuedDialog[] = [];
  private readonly entityCooldowns = new Map<string, number>();
  private readonly pendingEntities = new Set<string>();
  private readonly repeatCooldownMs: number;
  private running = false;
  private destroyed = false;
  private generation = 0;

  constructor(
    private readonly view: GameplayDialogSurface,
    private readonly host: GameplayDialogControllerHost,
    options: GameplayDialogControllerOptions = {},
  ) {
    this.repeatCooldownMs = resolveRepeatCooldown(options.repeatCooldownMs);
  }

  static create(
    canvas: HTMLCanvasElement,
    host: GameplayDialogControllerHost,
    options: GameplayDialogControllerOptions = {},
  ): GameplayDialogController {
    return new GameplayDialogController(
      new GameplayDialogView(canvas, options),
      host,
      options,
    );
  }

  show(message: string): Promise<GameplayDialogOptionResult> {
    return this.enqueue(() => this.view.show(message))
      .then(expectOptionResult);
  }

  present(
    presentation: GameplayDialogPresentation,
  ): Promise<GameplayDialogOptionResult> {
    return this.enqueue(() => this.view.present(presentation))
      .then(expectOptionResult);
  }

  /** World 的私有 dialogue request 入口；同一 actor/entity 在冷却或队列中时直接消费。 */
  handleEntityDialogue(request: DialogueRequestEvent): boolean {
    if (this.destroyed || request.lines.length === 0) return false;
    const key = entityDialogueKey(request.actorId, request.entityId);
    const now = this.host.now();
    this.pruneCooldowns(now);
    if (
      this.pendingEntities.has(key) ||
      (this.entityCooldowns.get(key) ?? 0) > now
    )
      return false;

    this.pendingEntities.add(key);
    const generation = this.generation;
    const direction = this.host.directionForDialogue(request);
    void this.enqueue(() => this.view.showSequence(request.lines, direction))
      .then((result) => {
        if (this.destroyed || generation !== this.generation) return;
        if (result.type === "move")
          this.host.moveFromDialogue(request.actorId, result.direction);
        this.entityCooldowns.set(
          key,
          this.host.now() + this.repeatCooldownMs,
        );
      })
      .catch((error: unknown) => {
        console.error("Entity dialogue failed", error);
      })
      .finally(() => this.pendingEntities.delete(key));
    return true;
  }

  reset(): void {
    this.generation += 1;
    this.entityCooldowns.clear();
    this.pendingEntities.clear();
    this.resolveQueuedDialogs();
    this.view.close();
  }

  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    this.generation += 1;
    this.entityCooldowns.clear();
    this.pendingEntities.clear();
    this.resolveQueuedDialogs();
    this.view.destroy();
  }

  private enqueue(
    run: () => Promise<GameplayDialogResult>,
  ): Promise<GameplayDialogResult> {
    if (this.destroyed) return Promise.resolve(DISMISSED);
    return new Promise((resolve, reject) => {
      this.queue.push({ run, resolve, reject });
      void this.drain();
    });
  }

  private async drain(): Promise<void> {
    if (this.running || this.destroyed) return;
    this.running = true;
    try {
      while (!this.destroyed) {
        const dialog = this.queue.shift();
        if (!dialog) break;
        const lease = this.host.acquireBlock("dialogue");
        const inputLease = this.host.acquireInput(
          "dialogue",
          (input) => this.view.handleInput(input),
        );
        try {
          dialog.resolve(await dialog.run());
        } catch (error) {
          dialog.reject(error);
        } finally {
          inputLease.release();
          lease.release();
        }
      }
    } finally {
      this.running = false;
    }
  }

  private resolveQueuedDialogs(): void {
    for (const dialog of this.queue.splice(0)) dialog.resolve(DISMISSED);
  }

  private pruneCooldowns(now: number): void {
    for (const [key, until] of this.entityCooldowns) {
      if (until <= now) this.entityCooldowns.delete(key);
    }
  }
}

function resolveRepeatCooldown(value: number | undefined): number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0
    ? value
    : DEFAULT_DIALOGUE_REPEAT_COOLDOWN_MS;
}

function entityDialogueKey(actorId: number, entityId: number): string {
  return `${actorId}:${entityId}`;
}

function expectOptionResult(
  result: GameplayDialogResult,
): GameplayDialogOptionResult {
  if (result.type === "move")
    throw new Error("选项与通用提示对话不能返回 Entity 方向移动");
  return result;
}
