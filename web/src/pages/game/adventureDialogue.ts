import {
  ADVENTURE_DIALOGUE_ARRAY_KEYS,
  ADVENTURE_DIALOGUE_STRING_KEYS,
  type AdventureDialogueCopy,
} from "@bobby/adventure";
import { webT, webTArray } from "../../i18n/webI18n.js";

/** 关卡加载时固定语言，避免运行中的地图对白随页面设置漂移。 */
export function adventureDialogueCopy(): AdventureDialogueCopy {
  return Object.fromEntries(
    [
      ...ADVENTURE_DIALOGUE_STRING_KEYS.map((key) => [
        key,
        webT(`adventure.dialogue.${key}`),
      ]),
      ...ADVENTURE_DIALOGUE_ARRAY_KEYS.map((key) => [
        key,
        webTArray(`adventure.dialogue.${key}`),
      ]),
    ],
  ) as AdventureDialogueCopy;
}
