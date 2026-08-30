<script setup lang="ts">
import type {
  Cell,
  EditorCanvasContextMenuRequest,
  EditorMap,
  EditorResizeEdges,
  EditorRuleCapability,
  EditorRuleKind,
  EditorSelection,
  EditorTool,
  EntityCatalog,
  InspectorModel,
  PaletteItem,
  ResolvedPaletteGroup,
} from "@bobby/editor";
import type { ImageManager } from "@bobby/engine";
import EditorCanvas from "./EditorCanvas.vue";
import EditorInspector from "./EditorInspector.vue";
import EditorLevelInfo from "./EditorLevelInfo.vue";
import EditorPalette from "./EditorPalette.vue";

defineProps<{
  level: Readonly<EditorMap>;
  revision: number;
  tool: EditorTool;
  placement: PaletteItem;
  selection: EditorSelection | null;
  hover: Cell | null;
  inspector: InspectorModel;
  rules: readonly EditorRuleCapability[];
  palette: readonly ResolvedPaletteGroup[];
  paletteSize: number;
  paletteOpen: boolean;
  rightPanel: "inspector" | "level" | null;
  playing: boolean;
  images: ImageManager;
  catalog: EntityCatalog;
}>();
const emit = defineEmits<{
  select: [item: PaletteItem];
  paletteResize: [delta: number];
  hover: [cell: Cell | null];
  primaryStart: [cell: Cell];
  primaryMove: [cell: Cell];
  primaryEnd: [cell: Cell | null];
  contextMenu: [request: EditorCanvasContextMenuRequest];
  transform: [cell: Cell, step: number, result: (changed: boolean) => void];
  resize: [edges: EditorResizeEdges];
  property: [entityIndex: number, key: string, value: string];
  state: [entityIndex: number, key: string, value: string];
  variant: [index: number];
  rule: [kind: EditorRuleKind, enabled: boolean];
  maxMoves: [value: number | null];
  maxTime: [value: number | null];
  metadata: [value: { name: string; author?: string; description?: string }];
}>();
</script>

<template>
  <main
    class="editor-body"
    :class="{
      playing,
      'palette-hidden': !paletteOpen,
      'right-hidden': rightPanel === null,
    }"
  >
    <EditorPalette
      v-show="!playing && paletteOpen"
      :groups="palette"
      :placement="placement"
      :size="paletteSize"
      :images="images"
      :catalog="catalog"
      @select="emit('select', $event)"
      @resize="emit('paletteResize', $event)"
    />
    <section class="editor-map-shell" :class="{ playing }">
      <EditorCanvas
        v-show="!playing"
        :level="level"
        :revision="revision"
        :tool="tool"
        :placement="placement"
        :selection="selection"
        :hover="hover"
        :enabled="!playing"
        :images="images"
        :catalog="catalog"
        @hover="emit('hover', $event)"
        @primary-start="emit('primaryStart', $event)"
        @primary-move="emit('primaryMove', $event)"
        @primary-end="emit('primaryEnd', $event)"
        @context-menu="emit('contextMenu', $event)"
        @transform="(cell, step, result) => emit('transform', cell, step, result)"
        @resize="emit('resize', $event)"
      />
      <canvas v-show="playing" data-editor-game-canvas />
      <div data-editor-game-dialog-root />
    </section>
    <EditorInspector
      v-show="!playing && rightPanel === 'inspector'"
      :model="inspector"
      :images="images"
      :catalog="catalog"
      @property="(entityIndex, key, value) => emit('property', entityIndex, key, value)"
      @state="(entityIndex, key, value) => emit('state', entityIndex, key, value)"
      @variant="emit('variant', $event)"
    />
    <EditorLevelInfo
      v-show="!playing && rightPanel === 'level'"
      :level="level"
      :rules="rules"
      @metadata="emit('metadata', $event)"
      @rule="(kind, enabled) => emit('rule', kind, enabled)"
      @max-moves="emit('maxMoves', $event)"
      @max-time="emit('maxTime', $event)"
    />
  </main>
</template>

<style scoped>
.editor-body.palette-hidden {
  grid-template-columns: minmax(0, 1fr) 350px;
}
.editor-body.right-hidden {
  grid-template-columns: 320px minmax(0, 1fr);
}
.editor-body.palette-hidden.right-hidden,
.editor-body.playing {
  grid-template-columns: minmax(0, 1fr);
}
@media (max-width: 1100px) and (min-width: 821px) {
  .editor-body.palette-hidden {
    grid-template-columns: minmax(0, 1fr) 310px;
  }
  .editor-body.right-hidden {
    grid-template-columns: 270px minmax(0, 1fr);
  }
}
@media (max-width: 820px) and (min-width: 621px) {
  .editor-body,
  .editor-body.right-hidden {
    grid-template-columns: 235px minmax(0, 1fr);
  }
  .editor-body.palette-hidden,
  .editor-body.palette-hidden.right-hidden {
    grid-template-columns: minmax(0, 1fr);
  }
}
@media (max-width: 620px) {
  .editor-body,
  .editor-body.palette-hidden,
  .editor-body.right-hidden,
  .editor-body.palette-hidden.right-hidden {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
