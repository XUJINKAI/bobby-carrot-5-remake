<script setup lang="ts">
import {
  SURFACE_TERRAIN_GROUPS,
  SURFACE_THEMES,
  surfaceTerrain,
  type EditorDefinition,
  type SurfaceBrush,
  type SurfacePattern,
  type SurfaceTerrainId,
  type SurfaceTheme,
} from "@bobby/editor";
import type { EntityCatalog, ImageManager } from "@bobby/engine";
import type { EntityType } from "@bobby/model";
import { computed } from "vue";
import EditorEntityPreview from "./EditorEntityPreview.vue";

const props = defineProps<{
  brush: SurfaceBrush;
  currentTheme: SurfaceTheme;
  images: ImageManager;
  catalog: EntityCatalog;
  editor: EditorDefinition;
}>();
const emit = defineEmits<{
  terrain: [terrain: SurfaceTerrainId];
  theme: [theme: SurfaceTheme];
  pattern: [pattern: SurfacePattern];
  exact: [type: EntityType];
  alternateA: [type: EntityType];
  alternateB: [type: EntityType];
  reroll: [];
}>();

const patterns: readonly { id: SurfacePattern; label: string }[] = [
  { id: "auto", label: "Auto" },
  { id: "exact", label: "Exact" },
  { id: "alternate", label: "交错" },
];

const terrain = computed(() => surfaceTerrain(props.brush.terrain));
const variants = computed(() => terrain.value.rows.flat());
const alternateA = computed(
  () => props.brush.alternate?.[0] ?? variants.value[0]?.type,
);
const alternateB = computed(
  () =>
    props.brush.alternate?.[1] ??
    variants.value[1]?.type ??
    variants.value[0]?.type,
);
</script>

<template>
  <aside class="editor-palette editor-surface-panel">
    <div class="editor-palette-head">
      <div>
        <div class="editor-panel-title">Surface</div>
        <div class="surface-summary">{{ terrain.label }} · {{ brush.pattern }}</div>
      </div>
      <button
        class="editor-mini-btn"
        type="button"
        title="重新分配 Auto variant"
        @click="emit('reroll')"
      >↻</button>
    </div>

    <section class="surface-section">
      <h3>主题</h3>
      <div class="surface-theme-grid">
        <button
          v-for="theme in SURFACE_THEMES"
          :key="theme.id"
          class="surface-theme-card"
          :class="{ active: currentTheme === theme.id }"
          type="button"
          :title="theme.id === 'mixed' ? '保留混合主题' : `将可识别地形切换为${theme.label}主题`"
          @click="emit('theme', theme.id)"
        >
          <span class="surface-theme-preview" aria-hidden="true">
            <EditorEntityPreview
              v-for="type in theme.preview"
              :key="type"
              :source="{ type }"
              :cell-size="23"
              :images="images"
              :catalog="catalog"
              :editor="editor"
              fallback-text=""
            />
          </span>
          <span>{{ theme.label }}</span>
        </button>
      </div>
    </section>

    <section class="surface-section terrain-section">
      <h3>地形</h3>
      <div
        v-for="group in SURFACE_TERRAIN_GROUPS"
        :key="group.id"
        class="surface-terrain-group"
      >
        <div class="surface-group-label">{{ group.label }}</div>
        <div
          v-for="(row, rowIndex) in group.rows"
          :key="`${group.id}-${rowIndex}`"
          class="surface-tile-row"
        >
          <button
            v-for="terrainId in row"
            :key="terrainId"
            class="surface-terrain-tile"
            :class="{ active: brush.terrain === terrainId }"
            type="button"
            :title="surfaceTerrain(terrainId).label"
            @click="emit('terrain', terrainId)"
          >
            <EditorEntityPreview
              :source="{ type: surfaceTerrain(terrainId).primary }"
              :cell-size="48"
              :images="images"
              :catalog="catalog"
              :editor="editor"
              :fallback-text="surfaceTerrain(terrainId).label"
            />
            <span>{{ surfaceTerrain(terrainId).label }}</span>
          </button>
        </div>
      </div>
    </section>

    <section class="surface-section">
      <h3>Pattern</h3>
      <div class="surface-pattern-grid">
        <button
          v-for="item in patterns"
          :key="item.id"
          class="surface-choice"
          :class="{ active: brush.pattern === item.id }"
          type="button"
          @click="emit('pattern', item.id)"
        >{{ item.label }}</button>
      </div>
    </section>

    <section class="surface-section">
      <h3>Variants · {{ terrain.label }}</h3>
      <div class="surface-variant-rows">
        <div
          v-for="(row, rowIndex) in terrain.rows"
          :key="`${terrain.id}-variants-${rowIndex}`"
          class="surface-tile-row variant-row"
        >
          <button
            v-for="variant in row"
            :key="variant.type"
            class="editor-palette-tile surface-variant"
            :class="{
              active: brush.pattern === 'exact' && brush.exact === variant.type,
              'alternate-a': brush.pattern === 'alternate' && alternateA === variant.type,
              'alternate-b': brush.pattern === 'alternate' && alternateB === variant.type,
            }"
            type="button"
            :title="`${variant.label} · ${variant.type}`"
            @click="brush.pattern === 'alternate' ? emit('alternateA', variant.type) : emit('exact', variant.type)"
            @contextmenu.prevent="emit('alternateB', variant.type)"
          >
            <EditorEntityPreview
              :source="{ type: variant.type }"
              :cell-size="48"
              :images="images"
              :catalog="catalog"
              :editor="editor"
              :fallback-text="variant.label"
            />
            <span class="surface-variant-label">{{ variant.label }}</span>
          </button>
        </div>
      </div>
      <p v-if="brush.pattern === 'alternate'" class="editor-muted surface-hint">
        左键选择 A，右键选择 B；按地图坐标稳定交错。
      </p>
    </section>
  </aside>
</template>

<style scoped>
.editor-surface-panel {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.surface-summary {
  margin-top: 4px;
  color: var(--editor-muted);
  font: 11px ui-monospace, monospace;
  text-transform: uppercase;
}
.surface-section {
  padding: 11px 0;
  border-top: 1px solid #ffffff18;
}
.surface-section h3 {
  margin: 0 0 8px;
  color: var(--editor-muted);
  font-size: .7rem;
  text-transform: uppercase;
  letter-spacing: .08em;
}
.surface-theme-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 7px;
}
.surface-theme-card {
  display: grid;
  grid-template-columns: 48px minmax(0, 1fr);
  align-items: center;
  gap: 7px;
  min-width: 0;
  padding: 5px;
  border: 1px solid #ffffff20;
  border-radius: 6px;
  background: #07518f;
  color: #fff;
  cursor: pointer;
  text-align: left;
  font-size: .74rem;
}
.surface-theme-card:hover,
.surface-theme-card.active,
.surface-terrain-tile:hover,
.surface-terrain-tile.active,
.surface-choice:hover,
.surface-choice.active {
  background: var(--editor-accent);
  border-color: #b4eafd;
}
.surface-theme-preview {
  display: grid;
  grid-template-columns: repeat(2, 23px);
  grid-template-rows: repeat(2, 23px);
  width: 48px;
  height: 48px;
  overflow: hidden;
  border-radius: 3px;
  background: #002d62;
}
.surface-terrain-group + .surface-terrain-group {
  margin-top: 10px;
}
.surface-group-label {
  margin: 0 0 5px;
  color: #a7d9f2;
  font-size: .67rem;
  letter-spacing: .04em;
}
.surface-tile-row {
  display: flex;
  flex-wrap: nowrap;
  gap: 6px;
  overflow-x: auto;
  padding-bottom: 3px;
}
.surface-tile-row + .surface-tile-row {
  margin-top: 6px;
}
.surface-terrain-tile {
  position: relative;
  flex: 0 0 58px;
  width: 58px;
  padding: 4px 4px 5px;
  border: 1px solid #ffffff20;
  border-radius: 5px;
  background: #063c70;
  color: #fff;
  cursor: pointer;
}
.surface-terrain-tile > span {
  display: block;
  margin-top: 2px;
  overflow: hidden;
  font-size: 9px;
  line-height: 1.2;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.surface-pattern-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 5px;
}
.surface-choice {
  min-width: 0;
  padding: 7px 5px;
  border: 1px solid #ffffff20;
  border-radius: 5px;
  background: #07518f;
  color: #fff;
  cursor: pointer;
  font-size: .72rem;
}
.surface-variant-rows {
  display: flex;
  flex-direction: column;
  gap: 0;
  overflow-x: auto;
}
.variant-row {
  width: max-content;
  min-width: 100%;
  gap: 0;
  overflow: visible;
  padding-bottom: 0;
}
.variant-row + .variant-row {
  margin-top: 0;
  border-top: 2px solid #b4eafd;
}
.surface-variant {
  --palette-size: 48px;
  flex: 0 0 48px;
  width: 48px;
  height: 48px;
  margin: 0;
  border-radius: 0;
}
.surface-variant + .surface-variant {
  margin-left: -1px;
}
.surface-variant-label {
  position: absolute;
  right: 2px;
  bottom: 2px;
  padding: 1px 3px;
  border-radius: 3px;
  background: #00285ccc;
  color: #fff;
  font: 9px ui-monospace, monospace;
}
.surface-variant.alternate-a::before,
.surface-variant.alternate-b::after {
  position: absolute;
  z-index: 3;
  top: 2px;
  padding: 1px 3px;
  border-radius: 3px;
  background: #082f59;
  color: #fff;
  font: 9px ui-monospace, monospace;
}
.surface-variant.alternate-a::before { content: "A"; left: 2px; }
.surface-variant.alternate-b::after { content: "B"; right: 2px; }
.surface-hint { margin: 8px 0 0; }
</style>
