import type { Direction, EntityState, JsonValue } from "@bobby/model";
import type { EntityFieldDefinition } from "../../world/entity/EntityDefinition.js";
import type { EntityId } from "../../world/entity/EntityInstance.js";

/** Items carried by one Bobby inside the current gameplay World. */
export interface BobbyInventoryState {
  gas: boolean;
  kite: boolean;
  shovel: boolean;
  beans: number;
  temporaryKey: boolean;
}

export type BobbySpeedPhase = "full";

/** Runtime-only locomotion state created by the original Speed mechanism. */
export interface BobbySpeedBoostState {
  direction: Direction;
  phase: BobbySpeedPhase;
}

/** Authorable per-Bobby inventory defaults. Runtime-only relation fields stay implicit. */
export const BOBBY_INVENTORY_FIELDS: readonly EntityFieldDefinition[] = [
  { key: "gas", kind: "boolean", label: "Gas", default: false },
  { key: "kite", kind: "boolean", label: "Kite", default: false },
  { key: "shovel", kind: "boolean", label: "Shovel", default: false },
  { key: "beans", kind: "number", label: "Beans", default: 0 },
  {
    key: "temporaryKey",
    kind: "boolean",
    label: "Temporary Key",
    default: false,
  },
];

export function readBobbyInventory(
  state: EntityState | undefined,
): BobbyInventoryState {
  return {
    gas: state?.gas === true,
    kite: state?.kite === true,
    shovel: state?.shovel === true,
    beans: nonNegativeInt(state?.beans),
    temporaryKey: state?.temporaryKey === true,
  };
}

export function patchBobbyInventory(
  state: EntityState | undefined,
  patch: Partial<BobbyInventoryState>,
): EntityState {
  const current = readBobbyInventory(state);
  return {
    ...(state ?? {}),
    gas: patch.gas ?? current.gas,
    kite: patch.kite ?? current.kite,
    shovel: patch.shovel ?? current.shovel,
    beans: Math.max(0, Math.floor(patch.beans ?? current.beans)),
    temporaryKey: patch.temporaryKey ?? current.temporaryKey,
  };
}

export function readBobbySpeedBoost(
  state: EntityState | undefined,
): BobbySpeedBoostState | null {
  const raw = state?.speedBoost;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const direction = raw.direction;
  const phase = raw.phase;
  if (!isDirection(direction) || !isSpeedPhase(phase)) return null;
  return { direction, phase };
}

export function patchBobbySpeedBoost(
  state: EntityState | undefined,
  boost: BobbySpeedBoostState | null,
): EntityState {
  const result: EntityState = { ...(state ?? {}) };
  if (boost) result.speedBoost = { ...boost };
  else delete result.speedBoost;
  return result;
}

/** mountId is a lightweight relation to the concrete vehicle Entity. */
export function bobbyMountId(state: EntityState | undefined): EntityId | null {
  const value = state?.mountId;
  return typeof value === "number" && Number.isInteger(value) && value > 0
    ? value
    : null;
}

export function isBobbyFlying(state: EntityState | undefined): boolean {
  return state?.flying === true;
}

function nonNegativeInt(value: JsonValue | undefined): number {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.max(0, Math.floor(value))
    : 0;
}

function isDirection(value: JsonValue | undefined): value is Direction {
  return value === "up" || value === "down" || value === "left" || value === "right";
}

function isSpeedPhase(value: JsonValue | undefined): value is BobbySpeedPhase {
  return value === "full";
}
