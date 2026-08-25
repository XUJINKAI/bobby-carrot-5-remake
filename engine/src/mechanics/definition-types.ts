import type { BehaviorDescription, TileBehavior } from "./behaviors.js";

export type TileTrait =
  | "walkable"
  | "water"
  | "carousel"
  | "mirror"
  | "directional-passage"
  | "rotatable"
  | "terrain-passage-override"
  | "object-passage-override"
  | "terrain-overlay"
  | "blocking"
  | "collectible"
  | "dynamic"
  | "forced-movement"
  | "switch"
  | "hazard"
  | "exit"
  | "pickup"
  | "beanstalk-growth"
  | "cloud-passable"
  | "dragon-fire-passable"
  | "dragon-fire-melt"
  | "dragon-fire-blocking"
  | "dragon-head"
  | "climbable"
  | "dynamic-cloud"
  | "dynamic-leaf"
  | "windmill"
  | "cloud-grid"
  | "start"
  | "objective-carrot"
  | "objective-nest"
  | "hidden-objective"
  | "pushbox"
  | "push-goal";

export interface TilePresentation {
  name: string;
  category: string;
}

export interface StringPropertyDefinition {
  key: string;
  kind: "string";
  label: string;
  multiline?: boolean;
  maxLength?: number;
  placeholder?: string;
}

export interface EnumPropertyOption {
  value: string;
  label?: string;
}

export interface EnumPropertyDefinition {
  key: string;
  kind: "enum";
  label: string;
  options: readonly EnumPropertyOption[];
}

/**
 * Editor 只根据 Definition 渲染当前需要的两类属性。
 * channel 等离散参数使用 enum，不建立独立的 Portal/Sandman Inspector 特例。
 */
export type ObjectPropertyDefinition =
  | StringPropertyDefinition
  | EnumPropertyDefinition;

export interface TileAuthoring {
  palette: boolean;
  properties?: readonly ObjectPropertyDefinition[];
}

export interface TileDefinition<T extends string> {
  id: T;
  presentation: TilePresentation;
  traits: readonly TileTrait[];
  behaviors: readonly TileBehavior[];
  authoring?: TileAuthoring;
}

export interface TileDefinitionInspection {
  id: string;
  presentation: TilePresentation;
  traits: readonly TileTrait[];
  behaviors: BehaviorDescription[];
  authoring?: TileAuthoring;
}
