import type { Direction } from "@bobby/model";
import { CommandQueue } from "../behavior/CommandQueue.js";
import type { CellPosition, EntityId } from "../entity/EntityInstance.js";
import type { EntityMotion } from "./WorldStepResult.js";

/**
 * 一次 WorldStep 内的 gameplay mutation buffer。
 * Behavior 只看到 commands；World 在所有 movement resolution 完成后统一 commit。
 */
export class MovementTransaction {
  readonly commands = new CommandQueue();
  readonly motions: EntityMotion[] = [];
  private readonly clearedEntries = new Set<EntityId>();
  private readonly reservedDestinations = new Map<string, EntityId>();

  clearForEntry(entityId: EntityId): void {
    this.clearedEntries.add(entityId);
  }

  isClearedForEntry(entityId: EntityId): boolean {
    return this.clearedEntries.has(entityId);
  }

  reserveDestination(entityId: EntityId, cell: CellPosition): boolean {
    const key = `${cell.x},${cell.y}`;
    const owner = this.reservedDestinations.get(key);
    if (owner !== undefined && owner !== entityId) return false;
    this.reservedDestinations.set(key, entityId);
    return true;
  }

  move(
    entityId: EntityId,
    from: CellPosition,
    to: CellPosition,
    direction: Direction,
  ): void {
    this.commands.move(entityId, to.x, to.y);
    this.commands.setDirection(entityId, direction);
    this.motions.push({
      entityId,
      from: { ...from },
      to: { ...to },
      direction,
    });
  }
}
