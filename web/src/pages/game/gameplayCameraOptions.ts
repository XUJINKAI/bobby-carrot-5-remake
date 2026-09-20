import type { CameraOptions } from "@bobby/engine";
import type { GamePageMode } from "./gamePageCapabilities.js";

/** Explore、Import 与 Editor Play Test 共用的自由浏览镜头。 */
export const FREE_GAMEPLAY_CAMERA_OPTIONS: Readonly<CameraOptions> = {
  zoom: 1.1,
  minZoom: .25,
  maxZoom: 4,
  panBounds: "map-edge",
};

const ADVENTURE_GAMEPLAY_CAMERA_OPTIONS: Readonly<CameraOptions> = {
  zoom: 1.05,
  minZoom: 0.8,
  maxZoom: 1.15,
  panBounds: "viewport",
};

export function gameplayCameraOptions(
  mode: GamePageMode,
): Readonly<CameraOptions> {
  return mode === "explore"
    ? FREE_GAMEPLAY_CAMERA_OPTIONS
    : ADVENTURE_GAMEPLAY_CAMERA_OPTIONS;
}
