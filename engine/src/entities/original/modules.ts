import { behaviorBindingsForDefinition } from "../behaviorLibrary.js";
import type { EntityModule } from "../EntityModule.js";
import { defineEntityModule } from "../EntityModule.js";
import { originalEntityDefinitions } from "./definitions.js";
import { applyOriginalRuntimeSemantics } from "./runtime-semantics.js";
import { originalVisualDefinition } from "./visuals.js";

export const originalEntityModules: readonly EntityModule[] =
  applyOriginalRuntimeSemantics(originalEntityDefinitions).map((definition) =>
    defineEntityModule({
      definition,
      visual: originalVisualDefinition(definition),
      behaviorBindings: behaviorBindingsForDefinition(definition),
    }),
  );
