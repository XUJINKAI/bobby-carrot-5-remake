<script setup lang="ts">
import type {
  Cell,
  EditorDefinition,
  EditorMap,
  EditorPlacementPreset,
  EditorResizeEdges,
  EditorRuleCapability,
  EditorRuleKind,
  EditorSelection,
  EditorTool,
  EntityCatalog,
  InspectorModel,
  PaletteItem,
  PlacementInspectorPreviewModel,
  ResolvedPaletteGroup,
  SurfaceBrush,
  SurfacePattern,
  SurfaceTerrainId,
  SurfaceTheme,
  SurfaceTool,
} from "@bobby/editor";
import type { ImageManager } from "@bobby/engine";
import type { EntityType, LevelEntityFieldValue } from "@bobby/model";
import type { EditorLeftPanel } from "./useEditorPage.js";
import EditorCanvas from "./EditorCanvas.vue";
import EditorInspector from "./EditorInspector.vue";
import EditorLevelInfo from "./EditorLevelInfo.vue";
import EditorPalette from "./EditorPalette.vue";
import EditorSurface from "./EditorSurface.vue";
import ReplayPanel from "../game/ReplayPanel.vue";

defineProps<{
  level: Readonly<EditorMap>;
  revision: number;
  tool: EditorTool;
  placement: EditorPlacementPreset | null;
  palettePlacement: PaletteItem;
  leftPanel: EditorLeftPanel;
  surfaceTool: SurfaceTool;
  surfaceBrush: SurfaceBrush;
  surfaceTheme: SurfaceTheme;
  selection: EditorSelection | null;
  hover: Cell | null;
  inspector: InspectorModel;
  hoverInspector: InspectorModel;
  placementInspectorPreview: PlacementInspectorPreviewModel;
  deletionTargetIndex: number | null;
  rules: readonly EditorRuleCapability[];
  palette: readonly ResolvedPaletteGroup[];
  paletteSize: number;
  leftOpen: boolean;
  rightPanel: "inspector" | "level" | null;
  playing: boolean;
  playComplete: boolean;
  images: ImageManager;
  catalog: EntityCatalog;
  editor: EditorDefinition;
}>();
const emit = defineEmits<{
  select: [item: PaletteItem];
  paletteResize: [delta: number];
  surfaceTerrain: [terrain: SurfaceTerrainId];
  surfaceTheme: [theme: SurfaceTheme];
  surfacePattern: [pattern: SurfacePattern];
  surfaceExact: [type: EntityType];
  surfaceAlternateA: [type: EntityType];
  surfaceAlternateB: [type: EntityType];
  hover: [cell: Cell | null];
  primaryStart: [cell: Cell];
  primaryMove: [cell: Cell];
  primaryEnd: [cell: Cell | null];
  secondarySelect: [cell: Cell];
  resize: [edges: EditorResizeEdges];
  field: [entityIndex: number, key: string, value: LevelEntityFieldValue];
  variant: [entityIndex: number, index: number];
  surfaceVariant: [entityIndex: number, type: EntityType];
  deleteLayer: [entityIndex: number];
  reorderLayers: [refsTopToBottom: number[]];
  batchField: [type: string, key: string, value: LevelEntityFieldValue];
  batchVariant: [type: string, index: number];
  batchSurfaceVariant: [type: string, variantType: EntityType];
  batchDelete: [type: string];
  placementField: [key: string, value: LevelEntityFieldValue];
  placementVariant: [index: number];
  rule: [kind: EditorRuleKind, enabled: boolean];
  maxMoves: [value: number | null];
  maxTime: [value: number | null];
  metadata: [value: { name: string; author?: string }];
  playRestart: [];
  playStop: [];
}>();
</script>

<template>
  <main
    class="editor-body"
    :class="{
      playing,
      'palette-hidden': !leftOpen,
      'right-hidden': rightPanel === null,
    }"
  >
    <EditorPalette
      v-if="!playing && leftOpen && leftPanel === 'palette'"
      :groups="palette"
      :placement="palettePlacement"
      :size="paletteSize"
      :images="images"
      :catalog="catalog"
      :editor="editor"
      @select="emit('select', $event)"
      @resize="emit('paletteResize', $event)"
    />
    <EditorSurface
      v-if="!playing && leftOpen && leftPanel === 'surface'"
      :brush="surfaceBrush"
      :current-theme="surfaceTheme"
      :size="paletteSize"
      :images="images"
      :catalog="catalog"
      :editor="editor"
      @terrain="emit('surfaceTerrain', $event)"
      @theme="emit('surfaceTheme', $event)"
      @pattern="emit('surfacePattern', $event)"
      @exact="emit('surfaceExact', $event)"
      @alternate-a="emit('surfaceAlternateA', $event)"
      @alternate-b="emit('surfaceAlternateB', $event)"
      @resize="emit('paletteResize', $event)"
    />
    <section
      class="editor-map-shell"
      :class="{ playing }"
      data-game-stage
    >
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
        @secondary-select="emit('secondarySelect', $event)"
        @resize="emit('resize', $event)"
      />
      <div v-show="playing" class="editor-game-canvas-layer">
        <canvas data-editor-game-canvas />
        <div data-editor-game-dialog-root />
        <div v-if="playComplete" class="result-overlay editor-play-result">
          <div class="result-card">
            <div class="result-kicker">PLAY TEST</div>
            <h2>通关</h2>
            <p>测试关卡已经完成。可以立即重玩，或返回编辑器继续调整地图。</p>
            <div class="result-actions">
              <button class="primary-btn" type="button" @click="emit('playRestart')">重玩</button>
              <button class="ghost-btn" type="button" @click="emit('playStop')">返回编辑</button>
            </div>
          </div>
        </div>
      </div>
      <ReplayPanel v-if="playing" :show-builtin="false" />
    </section>
    <EditorInspector
      v-show="!playing && rightPanel === 'inspector'"
      :model="inspector"
      :images="images"
      :catalog="catalog"
      :editor="editor"
      :authoring-panel="leftPanel"
      :palette-tool="tool"
      :surface-tool="surfaceTool"
      :placement="palettePlacement"
      :surface-brush="surfaceBrush"
      :hover-model="hoverInspector"
      :placement-preview="placementInspectorPreview"
      :deletion-target-index="deletionTargetIndex"
      @field="(entityIndex, key, value) => emit('field', entityIndex, key, value)"
      @variant="(entityIndex, index) => emit('variant', entityIndex, index)"
      @surface-variant="(entityIndex, type) => emit('surfaceVariant', entityIndex, type)"
      @delete-layer="emit('deleteLayer', $event)"
      @reorder="emit('reorderLayers', $event)"
      @batch-field="(type, key, value) => emit('batchField', type, key, value)"
      @batch-variant="(type, index) => emit('batchVariant', type, index)"
      @batch-surface-variant="(type, variantType) => emit('batchSurfaceVariant', type, variantType)"
      @batch-delete="emit('batchDelete', $event)"
      @placement-field="(key, value) => emit('placementField', key, value)"
      @placement-variant="emit('placementVariant', $event)"
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
.editor-game-canvas-layer {
  position: absolute;
  inset: 0;
  min-width: 0;
}
.editor-game-canvas-layer > canvas[data-editor-game-canvas] {
  width: calc(100% - var(--engine-gameplay-right-inset, 0px)) !important;
}
@media (min-width: 621px) {
  .editor-map-shell.replay-panel-open .editor-game-canvas-layer {
    left: 330px;
  }
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
