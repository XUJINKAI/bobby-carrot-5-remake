import type { AdventureSpecialSceneId } from "@bobby/adventure";
import type { GameplayHudOptions } from "@bobby/engine";
import type { GamePageMode } from "./gamePageCapabilities.js";

export function resolveGameplayHudConfig(
  mode: GamePageMode,
  sceneId: AdventureSpecialSceneId | undefined,
  adventureCoins: () => number,
): boolean | GameplayHudOptions {
  if (mode === "explore") return true;
  if (sceneId === undefined) return { steps: false };
  if (sceneId === "beaver-shop") {
    return {
      timer: false,
      steps: false,
      objective: false,
      items: false,
      coins: adventureCoins,
    };
  }
  return false;
}
