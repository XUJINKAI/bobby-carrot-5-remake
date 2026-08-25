import type {
  BobbyActorState,
  ActorPosition,
  ProfileCapabilities,
} from "./types.js";

export function createBobbyState(
  start: ActorPosition,
  profile: Partial<ProfileCapabilities>,
): BobbyActorState {
  return {
    player: { ...start },
    facing: "down",
    dead: false,
    inventory: { gas: false, kite: false, shovel: false, beans: 0 },
    profile: {
      superKey: profile.superKey ?? false,
      temporaryKey: profile.temporaryKey ?? false,
      speedShoes: profile.speedShoes ?? false,
    },
    ridingMower: false,
    moves: 0,
  };
}

export function updateBobbyProfile(
  state: BobbyActorState,
  profile: Partial<ProfileCapabilities>,
): void {
  state.profile = { ...state.profile, ...profile };
}
