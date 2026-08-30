<script setup lang="ts">
import type {
  Cell,
  EditorCanvasContextMenuRequest,
  EditorMap,
  EditorSelection,
  EditorTool,
  InspectorModel,
  LevelValidationIssue,
  PaletteItem,
  ResolvedPaletteGroup,
  EntityCatalog,
} from "@bobby/editor";
import type { Direction } from "@bobby/model";
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
  palette: readonly ResolvedPaletteGroup[];
  paletteSize: number;
  paletteOpen: boolean;
  rightPanel: "inspector" | "level" | null;
  issues: readonly LevelValidationIssue[];
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
  resize: [width: number, height: number];
  property: [entityIndex: number, key: string, value: string];
  state: [entityIndex: number, key: string, value: string];
  direction: [value: Direction];
  variant: [index: number];
  maxMoves: [value: number | null];
  maxTime: [value: number | null];
  metadata: [value: { name: string; author?: string; description?: string }];
  win: [value: import("@bobby/model").WinCondition];
}>();
</script>

<template>
  <main class="editor-body" :class="{ playing, 'palette-hidden': !paletteOpen, 'right-hidden': rightPanel === null }">
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
        @hover="emit('hover', $event)"
        @primary-start="emit('primaryStart', $event)"
        @primary-move="emit('primaryMove', $event)"
        @primary-end="emit('primaryEnd', $event)"
        @context-menu="emit('contextMenu', $event)"
        @transform="(cell, step, result) => emit('transform', cell, step, result)"
      />
      <canvas v-show="playing" data-editor-game-canvas />
      <div data-editor-game-dialog-root />
    </section>
    <EditorInspector
      v-show="!playing && rightPanel === 'inspector'"
      :model="inspector"
      @property="(entityIndex, key, value) => emit('property', entityIndex, key, value)"
      @state="(entityIndex, key, value) => emit('state', entityIndex, key, value)"
      @direction="emit('direction', $event)"
      @variant="emit('variant', $event)"
    />
    <EditorLevelInfo
      v-show="!playing && rightPanel === 'level'"
      :level="level"
      :issues="issues"
      @resize="(width, height) => emit('resize', width, height)"
      @metadata="emit('metadata', $event)"
      @max-moves="emit('maxMoves', $event)"
      @max-time="emit('maxTime', $event)"
      @win="emit('win', $event)"
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
