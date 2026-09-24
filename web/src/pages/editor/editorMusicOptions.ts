import type { MapMusic } from "@bobby/model";

export interface EditorMusicOption {
  value: MapMusic;
  label: string;
}

/** Editor Level 面板可选的循环背景音乐，曲目顺序也是面板展示顺序。 */
export const EDITOR_MUSIC_OPTIONS: readonly EditorMusicOption[] = [
  { value: "random", label: "random" },
  { value: "none", label: "none" },
  { value: "ingame0", label: "ingame0" },
  { value: "ingame1", label: "ingame1" },
  { value: "ingame2", label: "ingame2" },
  { value: "shop", label: "shop" },
  { value: "sandman", label: "sandman" },
  { value: "universe", label: "universe" },
  { value: "fly", label: "fly" },
  { value: "robo2/menu", label: "robo2/menu" },
];
