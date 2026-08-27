import type { Direction, EntityState, LevelEntity } from "@bobby/model";
import type { GlobalState } from "../GlobalState.js";
import type { EntityId } from "../entity/EntityInstance.js";
import type { WorldEvent } from "../WorldTypes.js";
import type { BehaviorCommand } from "./Behavior.js";

export interface WorldCommandApi {
  spawn(entity: LevelEntity): void;
  destroy(entityId: EntityId): void;
  move(entityId: EntityId, x: number, y: number): void;
  setDirection(entityId: EntityId, direction: Direction): void;
  setState(entityId: EntityId, state: EntityState): void;
  setGlobal<K extends keyof GlobalState>(key: K, value: GlobalState[K]): void;
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

  setGlobal<K extends keyof GlobalState>(key: K, value: GlobalState[K]): void {
    this.commands.push({
      type: "set-global",
      key,
      value: structuredClone(value) as GlobalState[keyof GlobalState],
    });
  }

  emit(event: WorldEvent): void {
    this.commands.push({ type: "emit", event: structuredClone(event) });
  }

  drain(): BehaviorCommand[] {
    return this.commands.splice(0, this.commands.length);
  }

  get size(): number {
    return this.commands.length;
  }
}
