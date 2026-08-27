import type { EntityTrait } from "../entity/EntityDefinition.js";
import type { StackBand } from "./StackBand.js";

export interface FootprintPart {
  dx: number;
  dy: number;
  role?: string;
  stackBand?: StackBand;
  stackOrder?: number;
  traits?: readonly EntityTrait[];
}

export interface FootprintDefinition {
  parts: readonly FootprintPart[];
}

export const SINGLE_CELL_FOOTPRINT: FootprintDefinition = {
  parts: [{ dx: 0, dy: 0 }],
};
