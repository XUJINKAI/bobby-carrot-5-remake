import { MapEntityTypeId, type MapMusic } from "@bobby/model";
import { RuntimeEntityTypeId } from "../entities/runtime-types.js";
import type { World } from "../world/World.js";
import type { WorldEvent } from "../world/WorldTypes.js";
import type { AudioBackend } from "./AudioBackend.js";

const RANDOM_GAME_TRACKS = ["ingame0", "ingame1", "ingame2"] as const;
const MUSIC_OVERRIDE_PRIORITY = ["timed-bonus", "mower"] as const;

export type LevelMusicOutcome = "playing" | "won" | "dead";

/** 地图基础音乐、地图内覆盖与终局音乐的唯一 Engine 协调器。 */
export class LevelMusicController {
  private baseTrack: string | null = null;
  private readonly overrides = new Map<string, string>();
  private outcomeTrack: "cleared" | "death" | null = null;

  constructor(
    private readonly audio: AudioBackend,
    private readonly random: () => number = Math.random,
  ) {}

  load(music: MapMusic | undefined, override?: string | null): void {
    this.overrides.clear();
    this.outcomeTrack = null;
    this.baseTrack = override === undefined
      ? resolveLevelMusic(music, this.random)
      : override;
    this.resume();
  }

  observe(event: Readonly<WorldEvent>): void {
    if (event.type !== "music-state") return;
    const source = event.data?.source;
    const track = event.data?.track;
    if (typeof source !== "string") return;
    if (typeof track === "string") this.overrides.set(source, track);
    else if (track === null) this.overrides.delete(source);
    else return;
    this.resume();
  }

  /** Undo / Redo 后从可快照 World state 重建两个内建覆盖。 */
  syncWorld(world: World): void {
    this.overrides.delete("timed-bonus");
    this.overrides.delete("mower");
    if (world.query.entityCountMatching({
      kind: "type",
      value: RuntimeEntityTypeId.TIMED_CHALLENGE,
    }) > 0) this.overrides.set("timed-bonus", "bonus");
    const mowerMounted = world.query.entitiesWithFact("player").some((actor) => {
      const mountId = actor.state?.mountId;
      return typeof mountId === "number" &&
        world.entity(mountId)?.type === MapEntityTypeId.MOWER;
    });
    if (mowerMounted) this.overrides.set("mower", "mow");
    this.outcomeTrack = outcomeTrack(
      world.dead ? "dead" : world.completed ? "won" : "playing",
    );
    this.resume();
  }

  setOutcome(outcome: LevelMusicOutcome): void {
    const track = outcomeTrack(outcome);
    if (track === this.outcomeTrack) return;
    this.outcomeTrack = track;
    this.resume();
  }

  resetMechanics(): void {
    this.overrides.clear();
    this.outcomeTrack = null;
    this.resume();
  }

  resume(): void {
    if (this.outcomeTrack) {
      this.audio.playMusic(this.outcomeTrack);
      return;
    }
    let track = this.baseTrack;
    for (const source of MUSIC_OVERRIDE_PRIORITY) {
      const override = this.overrides.get(source);
      if (override) track = override;
    }
    if (track) this.audio.playMusic(track);
    else this.audio.stopMusic();
  }

  stop(): void {
    this.overrides.clear();
    this.outcomeTrack = null;
    this.baseTrack = null;
    this.audio.stopMusic();
  }
}

function outcomeTrack(
  outcome: LevelMusicOutcome,
): "cleared" | "death" | null {
  if (outcome === "won") return "cleared";
  if (outcome === "dead") return "death";
  return null;
}

export function resolveLevelMusic(
  music: MapMusic | undefined,
  random: () => number = Math.random,
): string | null {
  if (music === "none") return null;
  if (music && music !== "random") return music;
  const index = Math.min(
    RANDOM_GAME_TRACKS.length - 1,
    Math.max(0, Math.floor(random() * RANDOM_GAME_TRACKS.length)),
  );
  return RANDOM_GAME_TRACKS[index]!;
}
