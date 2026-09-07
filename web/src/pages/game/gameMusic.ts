import type { MapMusic } from "@bobby/model";

export interface GameMusicContext {
  bonus: boolean;
  specialScene: boolean;
}

export function resolveGameMusic(
  music: MapMusic | undefined,
  context: Readonly<GameMusicContext>,
): string | null {
  if (music === "none") return null;
  if (music && music !== "random") return music;
  if (context.specialScene) return "title";
  return context.bonus ? "bonus" : "ingame1";
}
