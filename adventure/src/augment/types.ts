import type {
  EntityType,
  LevelPatch,
} from "@bobby/model";
import type { AdventureSave } from "../save.js";

/** Engine `object-interaction` 的 Adventure 侧最小投影，不引入 Engine 依赖。 */
export interface AdventureInteractionRequest {
  requestId: number;
  actorId: number;
  entityId: number;
  objectType: string;
  x: number;
  y: number;
  action: "touch" | "enter";
  role?: string;
  lockKeyCount: number;
}

export interface AdventureDialogOption {
  id: string;
  label: string;
}

export type AdventureDialogResult =
  | { type: "selected"; optionId: string }
  | { type: "dismissed" };

export interface AdventureInteractionContext {
  request: AdventureInteractionRequest;
  save: AdventureSave;
  showDialogue(text: string): void;
  presentDialogue(presentation: {
    message: string;
    options: readonly [AdventureDialogOption, ...AdventureDialogOption[]];
  }): Promise<AdventureDialogResult>;
  commitSave(save: AdventureSave): void;
  /** Engine 接受背包动作后再提交关联 Save，避免 World 拒绝动作却提前写档。 */
  addActorInventoryItem(
    item: "lock-key",
    count: number,
    saveOnAccepted?: AdventureSave,
  ): void;
  replaceInteractedEntity(type: EntityType): void;
}

export type AdventureInteractionHandler = (
  context: AdventureInteractionContext,
) => void | Promise<void>;

export interface AdventureAugmentation {
  /** 与 Save 无关、可以直接审阅的加载前地图补丁。 */
  levelPatches: readonly LevelPatch[];
  /** 把永久 Adventure 状态投影为本次 Session 的地图补丁。 */
  savePatches?(save: AdventureSave): readonly LevelPatch[];
  /** 只处理跨关经济、永久道具等 Campaign 交互。 */
  interaction?: AdventureInteractionHandler;
}

export type AdventurePurchaseCurrency = "bonus-coins" | "golden-carrots";
export type AdventureItemPurchaseOutcome =
  | "already-owned"
  | "purchased"
  | "insufficient-funds";
