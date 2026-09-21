import type { AdventureSpecialSceneId } from "@bobby/adventure";
import type { OutcomeMusicOptions } from "@bobby/engine";

const SILENT_COMPLETION_SCENES = new Set<AdventureSpecialSceneId>([
  "beaver-shop",
  "cloud-9",
  "dream-machine",
  "dreamland-reward",
]);

const SILENT_COMPLETION_MUSIC: OutcomeMusicOptions = Object.freeze({
  won: false,
});

/** 会直接返回产品导航的 Adventure Scene 不播放普通关卡完成音乐。 */
export function resolveGameplayOutcomeMusic(
  sceneId: AdventureSpecialSceneId | undefined,
): OutcomeMusicOptions | undefined {
  return sceneId && SILENT_COMPLETION_SCENES.has(sceneId)
    ? SILENT_COMPLETION_MUSIC
    : undefined;
}
