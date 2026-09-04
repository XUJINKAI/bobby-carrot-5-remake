import type { Direction, EntityState, LevelEntity } from "@bobby/model";
import type { GlobalState } from "../GlobalState.js";
import type {
  RuntimeActionId,
  RuntimeActionSpec,
} from "../action/RuntimeAction.js";
import type { EntityId } from "../entity/EntityInstance.js";
import type { WorldEvent } from "../WorldTypes.js";
import type { BehaviorCommand } from "./Behavior.js";

export interface WorldCommandApi {
  spawn(entity: LevelEntity): void;
  destroy(entityId: EntityId): void;
  move(entityId: EntityId, x: number, y: number): void;
  setDirection(entityId: EntityId, direction: Direction): void;
  setState(entityId: EntityId, state: EntityState): void;
  downActor(entityId: EntityId, reason: string): void;
  reviveActor(entityId: EntityId): void;
  eliminateActor(entityId: EntityId, reason: string): void;
  loseWorld(reason: string, actorId?: EntityId): void;
  setGlobal<K extends keyof GlobalState>(key: K, value: GlobalState[K]): void;
  startAction(action: RuntimeActionSpec): void;
  cancelAction(actionId: RuntimeActionId): void;
  emit(event: WorldEvent): void;
}

/** 一个语义交互期间只排队；World 在解析完成后统一 commit。 */
export class CommandQueue implements WorldCommandApi {
  private readonly commands: BehaviorCommand[] = [];

  spawn(entity: LevelEntity): void {
    this.commands.push({ type: "spawn", entity: structuredClone(entity) });
  }

  destroy(entityId: EntityId): void {
    this.commands.push({ type: "destroy", entityId });
  }

  move(entityId: EntityId, x: number, y: number): void {
    this.commands.push({ type: "move", entityId, x, y });
  }

  setDirection(entityId: EntityId, direction: Direction): void {
    this.commands.push({ type: "set-direction", entityId, direction });
  }

  setState(entityId: EntityId, state: EntityState): void {
    this.commands.push({
      type: "set-state",
      entityId,
      state: structuredClone(state),
    });
  }

  downActor(entityId: EntityId, reason: string): void {
    this.commands.push({ type: "down-actor", entityId, reason });
  }

  reviveActor(entityId: EntityId): void {
    this.commands.push({ type: "revive-actor", entityId });
  }

  eliminateActor(entityId: EntityId, reason: string): void {
    this.commands.push({ type: "eliminate-actor", entityId, reason });
  }

  loseWorld(reason: string, actorId?: EntityId): void {
    this.commands.push({
      type: "lose-world",
      reason,
      ...(actorId !== undefined ? { actorId } : {}),
    });
  }

  setGlobal<K extends keyof GlobalState>(key: K, value: GlobalState[K]): void {
    this.commands.push({
      type: "set-global",
      key,
      value: structuredClone(value) as GlobalState[keyof GlobalState],
    });
  }

  startAction(action: RuntimeActionSpec): void {
    this.commands.push({ type: "start-action", action: structuredClone(action) });
  }

  cancelAction(actionId: RuntimeActionId): void {
    this.commands.push({ type: "cancel-action", actionId });
  }

  emit(event: WorldEvent): void {
    this.commands.push({ type: "emit", event: structuredClone(event) });
  }

  append(commands: readonly BehaviorCommand[]): void {
    this.commands.push(...commands.map((command) => structuredClone(command)));
  }

  drain(): BehaviorCommand[] {
    return this.commands.splice(0, this.commands.length);
  }

  get size(): number {
    return this.commands.length;
  }
}
