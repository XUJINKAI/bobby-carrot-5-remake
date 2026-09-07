import { EntityTypeId, MapEntityTypeId } from "@bobby/model";
import type { Behavior } from "../../world/behavior/Behavior.js";
import type {
  EntityModule,
  EntityModuleDefinition,
} from "../EntityModule.js";
import {
  bobbyMountId,
  patchBobbyMount,
  patchBobbySpeedBoost,
  readBobbyInventory,
  readBobbySpeedBoost,
} from "../player/BobbyState.js";
import {
  atlasVisual,
  CONTENT_STACK_ORDER,
  namedCell,
  originalModule,
  SURFACE_STACK_ORDER,
} from "./module.js";

const mowerVehicle: Behavior = {
  id: "mower-vehicle",
  canEnter({ actor, query }) {
    if (
      !query.entityHasTrait(actor.id, "player") ||
      bobbyMountId(actor.state) !== null
    )
      return { passable: false, reason: "mower-collision" };
    return readBobbyInventory(actor.state).gas
      ? { passable: true, reason: "mount-mower" }
      : { passable: false, reason: "mower-needs-gas" };
  },
  canLeave({ actor, self, query, movement }) {
    if (bobbyMountId(actor.state) !== self.entity.id) return;
    if (movement && query.hasTraitAt(movement.to, "moving-platform"))
      return { passable: false, reason: "mower-cannot-enter-moving-platform" };
    return { passable: true, reason: "drive-mower" };
  },
  onTouch({ actor, self, query, commands }) {
    if (
      !query.entityHasTrait(actor.id, "player") ||
      bobbyMountId(actor.state) !== null ||
      readBobbyInventory(actor.state).gas
    )
      return;
    commands.emit({
      type: "missing-item",
      entityId: actor.id,
      x: self.presence.cell.x,
      y: self.presence.cell.y,
      data: { item: "gas" },
    });
  },
  onArrive({ actor, self, query, commands }) {
    if (
      !query.entityHasTrait(actor.id, "player") ||
      bobbyMountId(actor.state) !== null ||
      !readBobbyInventory(actor.state).gas
    )
      return;
    commands.setState(
      actor.id,
      patchBobbyMount(patchBobbySpeedBoost(actor.state, null), self.entity.id),
    );
    commands.setState(self.entity.id, {
      ...self.entity.state,
      mountedByActorId: actor.id,
    });
    commands.emit({
      type: "mower-mounted",
      entityId: actor.id,
      x: self.presence.cell.x,
      y: self.presence.cell.y,
      data: { mowerId: self.entity.id },
    });
  },
};

const mowerParking: Behavior = {
  id: "mower-parking",
  onArrive({ actor, self, query, commands }) {
    const mowerId = bobbyMountId(actor.state);
    if (mowerId === null || !query.entityHasTrait(mowerId, "mower")) return;
    const mower = query.entity(mowerId);
    if (!mower) return;
    commands.setState(
      actor.id,
      patchBobbyMount(patchBobbySpeedBoost(actor.state, null), null),
    );
    commands.setState(mower.id, {
      ...mower.state,
      mountedByActorId: null,
    });
    commands.move(actor.id, self.presence.cell.x + 1, self.presence.cell.y);
    commands.emit({
      type: "mower-dismounted",
      entityId: actor.id,
      x: self.presence.cell.x,
      y: self.presence.cell.y,
      data: { mowerId: mower.id, exitX: self.presence.cell.x + 1 },
    });
  },
};

const smashCrumblyRock: Behavior = {
  id: "smash-crumbly-rock",
  resolveEntry({ actor, self, query, commands }) {
    const mowerId = bobbyMountId(actor.state);
    if (
      mowerId === null ||
      !query.entityHasTrait(mowerId, "mower") ||
      !readBobbySpeedBoost(actor.state)
    )
      return { result: "blocked", reason: "crumbly-rock" };
    commands.destroy(self.entity.id);
    commands.emit({
      type: "crumbly-rock-smashed",
      entityId: self.entity.id,
      x: self.presence.cell.x,
      y: self.presence.cell.y,
      data: { shakeSteps: 8 },
    });
    return { result: "clear-and-pass", reason: "speed-mower-smash" };
  },
};

const mowerDefinition: EntityModuleDefinition = {
  type: EntityTypeId.MOWER,
  traits: ["vehicle", "mower", "ride-carried", "blocking"],
  stackOrder: CONTENT_STACK_ORDER,
  state: [
    {
      key: "mountedByActorId",
      kind: "number",
      label: "骑乘者",
      default: 0,
    },
  ],
  presentation: { name: "Mower" },
};

export const mower: EntityModule = originalModule(
  mowerDefinition,
  atlasVisual(mowerDefinition, (context) =>
    Number(context.entity.state?.mountedByActorId ?? 0) > 0
      ? null
      : namedCell("mower"),
  ),
  [{ behavior: mowerVehicle }],
);

const parkingDefinition: EntityModuleDefinition = {
  type: EntityTypeId.MOWER_PARKING,
  traits: ["walkable", "mower-parking"],
  layer: "surface",
  stackOrder: SURFACE_STACK_ORDER,
  presentation: { name: "Mower Parking" },
};

export const mowerParkingTile: EntityModule = originalModule(
  parkingDefinition,
  atlasVisual(parkingDefinition, namedCell("mower-parking")),
  [{ behavior: mowerParking }],
);

const crumblyRockDefinition: EntityModuleDefinition = {
  type: EntityTypeId.CRUMBLY_ROCK,
  traits: ["blocking", "crumbly-rock"],
  stackOrder: CONTENT_STACK_ORDER,
  presentation: { name: "Crumbly Rock" },
};

export const crumblyRock: EntityModule = originalModule(
  crumblyRockDefinition,
  atlasVisual(crumblyRockDefinition, namedCell("crumbly-rock")),
  [{ behavior: smashCrumblyRock }],
);

const pushableRockDefinition: EntityModuleDefinition = {
  type: MapEntityTypeId.PUSHABLE_ROCK,
  traits: ["blocking", "crumbly-rock", "pushable"],
  stackOrder: CONTENT_STACK_ORDER,
  presentation: { name: "Pushable Rock" },
};

export const pushableRock: EntityModule = originalModule(
  pushableRockDefinition,
  atlasVisual(pushableRockDefinition, namedCell("crumbly-rock")),
  [{ behavior: smashCrumblyRock }],
);
