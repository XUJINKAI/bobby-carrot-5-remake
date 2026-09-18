import type { EmbedRuntimeTranslationKey } from "./zh-CN.js";

const catalog = {
  "embedRuntime.won": "Level complete",
  "embedRuntime.dead": "Game over",
  "embedRuntime.restart": "Restart",
  "embedRuntime.official": "Visit BC5R",
  "embedRuntime.open": "Open in new window",
  "embedRuntime.mute": "Mute",
  "embedRuntime.unmute": "Unmute",
  "embedRuntime.joystick": "Toggle screen joystick",
  "embedRuntime.movementHint": "Move with WASD / arrow keys",
} satisfies Record<EmbedRuntimeTranslationKey, string>;

export default catalog;
