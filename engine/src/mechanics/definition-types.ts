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
  | "hidden-objective";
export interface TilePresentation {
  name: string;
  category: string;
}
export interface TileAuthoring {
  palette: boolean;
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
