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
  "embedRuntime.loading": "Loading map…",
  "embedRuntime.loadFailed": "Unable to load map",
  "embedRuntime.missingMap": "Provide map data or a map URL.",
  "embedRuntime.multipleInputs": "Provide either map or mapUrl, not both.",
  "embedRuntime.mapRequestFailed": "Unable to fetch map data.",
  "embedRuntime.mapRequestHttp": "Map request failed: HTTP {status}",
  "embedRuntime.invalidJson": "Invalid JSON.",
  "embedRuntime.unknownRepresentation": "Unrecognized map data format.",
  "embedRuntime.invalidPayload": "Invalid map payload encoding.",
  "embedRuntime.damagedGzip": "Compressed map data is corrupted.",
  "embedRuntime.saveNotMap": "The {scope} data is a save, not a map.",
  "embedRuntime.invalidMap": "This data is not a valid map.",
  "embedRuntime.unknownError": "An error occurred while loading the map.",
} satisfies Record<EmbedRuntimeTranslationKey, string>;

export default catalog;
