import type { Direction } from "@bobby/model";
import { CommandQueue } from "../behavior/CommandQueue.js";
import type { CellPosition, EntityId } from "../entity/EntityInstance.js";
import type { EntityMotion } from "./WorldStepResult.js";

/**
 * 一次 WorldStep 内的 gameplay mutation buffer。
 * 单个 move 先在 child transaction 解析，成功后 absorb；blocked move 不泄漏半笔 mutation。
 */
export class MovementTransaction {
  readonly commands = new CommandQueue();
  readonly motions: EntityMotion[] = [];
  private readonly entryBypasses = new Set<EntityId>();
  private readonly reservedDestinations = new Map<string, EntityId>();

  allowEntryFor(entityId: EntityId): void {
    this.entryBypasses.add(entityId);
  }

  isEntryAllowed(entityId: EntityId): boolean {
    return this.entryBypasses.has(entityId);
  }

  canReserveDestination(entityId: EntityId, cell: CellPosition): boolean {
    const owner = this.reservedDestinations.get(key(cell));
    return owner === undefined || owner === entityId;
  }

  reserveDestination(entityId: EntityId, cell: CellPosition): void {
    this.reservedDestinations.set(key(cell), entityId);
  }

  move(
    entityId: EntityId,
    from: CellPosition,
    to: CellPosition,
    direction: Direction,
    updateDirection = true,
  ): void {
    this.commands.move(entityId, to.x, to.y);
    if (updateDirection) this.commands.setDirection(entityId, direction);
    this.motions.push({
      entityId,
      from: { ...from },
      to: { ...to },
      direction,
    });
  }

  absorb(child: MovementTransaction): void {
    this.commands.append(child.commands.drain());
    this.motions.push(...child.motions.map((motion) => structuredClone(motion)));
    for (const entityId of child.entryBypasses) this.entryBypasses.add(entityId);
  }
}

function key(cell: CellPosition): string {
  return `${cell.x},${cell.y}`;
}
