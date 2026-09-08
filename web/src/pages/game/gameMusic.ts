import type { MapMusic } from "@bobby/model";

export interface GameMusicContext {
  specialScene: boolean;
}

const RANDOM_GAME_TRACKS = ["ingame0", "ingame1", "ingame2"] as const;

export function resolveGameMusic(
  music: MapMusic | undefined,
  context: Readonly<GameMusicContext>,
  random: () => number = Math.random,
): string | null {
  if (music === "none") return null;
  if (music && music !== "random") return music;
  if (context.specialScene) return "title";
  const index = Math.min(
    RANDOM_GAME_TRACKS.length - 1,
    Math.floor(random() * RANDOM_GAME_TRACKS.length),
  );
  return RANDOM_GAME_TRACKS[Math.max(0, index)]!;
}
