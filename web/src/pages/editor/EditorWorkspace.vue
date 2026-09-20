<script setup lang="ts">
import type {
  Cell,
  EditorDefinition,
  EditorMap,
  EditorPlacementPreset,
  EditorResizeEdges,
  EditorRuleCapability,
  EditorRuleKind,
  EditorRuleMode,
  EditorSelection,
  EditorTool,
  EngineEnvironment,
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
import type {
  EntityType,
  LevelEntityFieldValue,
  MapMusic,
} from "@bobby/model";
import type { EditorLeftPanel, EditorMetadataField } from "./useEditorPage.js";
import { webT } from "../../i18n/webI18n.js";
import EditorCanvas from "./EditorCanvas.vue";
import EditorInspector from "./EditorInspector.vue";
import EditorLevelInfo from "./EditorLevelInfo.vue";
import EditorPalette from "./EditorPalette.vue";
import EditorSurface from "./EditorSurface.vue";
import GameStage from "../game/GameStage.vue";

defineProps<{
  level: Readonly<EditorMap>;
  nameValue: string;
  authorValue: string;
  noteValue: string;
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
  ruleMode: EditorRuleMode;
  palette: readonly ResolvedPaletteGroup[];
  paletteSize: number;
  leftOpen: boolean;
  rightPanel: "inspector" | "level" | null;
  playing: boolean;
  playResult: "complete" | "death" | null;
  images: ImageManager;
  environment: EngineEnvironment;
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
  ruleMode: [mode: EditorRuleMode];
  maxMoves: [value: number | null];
  maxTime: [value: number | null];
  metadataField: [field: EditorMetadataField, value: string];
  music: [value: MapMusic | undefined];
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
      :environment="environment"
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
      :environment="environment"
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
        :environment="environment"
        :catalog="catalog"
        @hover="emit('hover', $event)"
        @primary-start="emit('primaryStart', $event)"
        @primary-move="emit('primaryMove', $event)"
        @primary-end="emit('primaryEnd', $event)"
        @secondary-select="emit('secondarySelect', $event)"
        @resize="emit('resize', $event)"
      />
      <GameStage
        v-show="playing"
        class="editor-game-stage"
        canvas-id="editor-game"
        :show-replay-panel="playing"
        :show-builtin-replay="false"
      >
        <template #result>
          <div v-if="playResult" class="result-overlay editor-play-result">
            <div class="result-card">
              <div
                class="result-kicker"
                :class="{ danger: playResult === 'death' }"
              >PLAY TEST</div>
              <h2>
                {{ playResult === "complete"
                  ? webT("editor.playCompleted")
                  : webT("editor.playFailed") }}
              </h2>
              <p>
                {{ playResult === "complete"
                  ? webT("editor.playCompletedDetail")
                  : webT("editor.playFailedDetail") }}
              </p>
              <div class="result-actions">
                <button
                  class="primary-btn"
                  type="button"
                  @click="emit('playRestart')"
                >{{ webT("editor.retryPlay") }}</button>
                <button
                  class="ghost-btn"
                  type="button"
                  @click="emit('playStop')"
                >{{ webT("editor.returnToEdit") }}</button>
              </div>
            </div>
          </div>
        </template>
      </GameStage>
    </section>
    <EditorInspector
      v-show="!playing && rightPanel === 'inspector'"
      :model="inspector"
      :images="images"
      :environment="environment"
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
      :name-value="nameValue"
      :author-value="authorValue"
      :note-value="noteValue"
      :rules="rules"
      :rule-mode="ruleMode"
      @metadata-field="(field, value) => emit('metadataField', field, value)"
      @music="emit('music', $event)"
      @rule="(kind, enabled) => emit('rule', kind, enabled)"
      @rule-mode="emit('ruleMode', $event)"
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
.editor-game-stage {
  position: absolute;
  inset: 0;
  min-width: 0;
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
