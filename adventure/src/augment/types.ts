import type {
  EntityType,
  JsonPrimitive,
  LevelEntity,
} from "@bobby/model";

export interface AdventureEntitySelector {
  x?: number;
  y?: number;
  type?: EntityType;
}

export type AdventureLevelPatch =
  | {
      operation: "add";
      entity: LevelEntity;
    }
  | {
      operation: "remove";
      selector: AdventureEntitySelector;
    }
  | {
      operation: "set-fields";
      selector: AdventureEntitySelector;
      fields: Record<string, JsonPrimitive>;
    };

export interface AdventureInteractionSelector extends AdventureEntitySelector {
  action?: "touch" | "enter";
  role?: string;
}

export type AdventureInteractionEffect =
  | {
      type: "dialogue";
      text: string;
    }
  | {
      type: "bonus-key-vendor";
      priceBonusCoins: number;
    };

export interface AdventureInteractionRule {
  selector: AdventureInteractionSelector;
  effect: AdventureInteractionEffect;
}

export interface AdventureAugmentation {
  levelPatches: readonly AdventureLevelPatch[];
  interactions: readonly AdventureInteractionRule[];
}

/** Engine `object-interaction` 的 Adventure 侧最小投影，不引入 Engine 依赖。 */
export interface AdventureInteractionRequest {
  objectType: string;
  x: number;
  y: number;
  action: "touch" | "enter";
  role?: string;
  hasSingleUseKey: boolean;
}
