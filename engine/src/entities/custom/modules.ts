import { behaviorBindingsForDefinition } from "../behaviorLibrary.js";
import type { EntityModule } from "../EntityModule.js";
import { defineEntityModule } from "../EntityModule.js";
import { customEntityDefinitions } from "./definitions.js";
import { customVisualDefinition } from "./visuals.js";

export const customEntityModules: readonly EntityModule[] = customEntityDefinitions.map(
  (definition) =>
    defineEntityModule({
      definition,
      visual: customVisualDefinition(definition),
      behaviorBindings: behaviorBindingsForDefinition(definition),
    }),
);
