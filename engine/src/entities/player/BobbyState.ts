import type { EntityState, JsonValue } from "@bobby/model";
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
