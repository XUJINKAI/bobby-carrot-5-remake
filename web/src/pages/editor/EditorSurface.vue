<script setup lang="ts">
import {
  SURFACE_TERRAIN_GROUPS,
  SURFACE_THEMES,
  surfaceTerrain,
  surfaceVariantPreset,
  type EditorDefinition,
  type SurfaceBrush,
  type SurfacePattern,
  type SurfaceTerrainDefinition,
  type SurfaceTerrainId,
  type SurfaceTheme,
} from "@bobby/editor";
import type { EntityCatalog, ImageManager } from "@bobby/engine";
import type { EntityType } from "@bobby/model";
import { computed, ref } from "vue";
import EditorEntityPreview from "./EditorEntityPreview.vue";

const props = defineProps<{
  brush: SurfaceBrush;
  currentTheme: SurfaceTheme;
  size: number;
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
  resize: [delta: number];
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
const tooltip = ref<null | {
  x: number;
  y: number;
  name: string;
  type?: string;
  variantCount?: number;
  surfaceType?: string;
  slot?: string;
  theme?: string;
  auto?: string;
  detail?: string;
}>(null);

function showTerrainTooltip(
  definition: SurfaceTerrainDefinition,
  event: MouseEvent,
): void {
  tooltip.value = {
    x: event.clientX + 14,
    y: event.clientY + 14,
    name: definition.label,
    variantCount: definition.rows.flat().length,
    surfaceType: definition.type,
    slot: definition.slot,
    ...(definition.theme ? { theme: definition.theme } : {}),
    auto: autoLabel(definition),
  };
}

function showVariantTooltip(
  definition: SurfaceTerrainDefinition,
  type: EntityType,
  label: string,
  event: MouseEvent,
): void {
  const all = definition.rows.flat();
  const index = all.findIndex((variant) => variant.type === type);
  tooltip.value = {
    x: event.clientX + 14,
    y: event.clientY + 14,
    name: `${definition.label} · ${label}`,
    type,
    detail: `variant ${Math.max(1, index + 1)} / ${all.length}`,
    surfaceType: definition.type,
    slot: definition.slot,
  };
}

function moveTooltip(event: MouseEvent): void {
  if (!tooltip.value) return;
  tooltip.value = {
    ...tooltip.value,
    x: event.clientX + 14,
    y: event.clientY + 14,
  };
}

function autoLabel(definition: SurfaceTerrainDefinition): string {
  const auto = definition.auto;
  if (auto.kind === "weighted") return `weighted · ${auto.variants.length} entries`;
  if (auto.kind === "vertical") return "vertical topology";
  if (auto.kind === "fence") return `adjacency · ${auto.variants.length} variants`;
  if (auto.kind === "neighbor") return `neighbor rules · ${auto.rules.length}`;
  return "primary";
}
</script>

<template>
  <aside class="editor-palette editor-surface-panel">
    <div class="editor-palette-head">
      <div class="editor-panel-title">Surface</div>
      <div class="editor-palette-zoom">
        <button class="editor-mini-btn" type="button" @click="emit('resize', -1)">−</button>
        <span>{{ size }}</span>
        <button class="editor-mini-btn" type="button" @click="emit('resize', 1)">+</button>
      </div>
    </div>

    <details class="surface-theme-section">
      <summary>主题</summary>
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
              :source="surfaceVariantPreset(type)"
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
    </details>

    <div class="editor-palette-groups surface-groups">
      <section
        v-for="group in SURFACE_TERRAIN_GROUPS"
        :key="group.id"
        class="editor-palette-group"
      >
        <h3>{{ group.label }}</h3>
        <div
          v-for="(row, rowIndex) in group.rows"
          :key="`${group.id}:${rowIndex}`"
          class="editor-palette-grid surface-palette-grid"
          :style="{ '--palette-size': `${size}px` }"
        >
          <button
            v-for="terrainId in row"
            :key="terrainId"
            type="button"
            class="editor-palette-tile surface-terrain-tile"
            :class="{ active: brush.terrain === terrainId }"
            @click="emit('terrain', terrainId)"
            @mouseenter="showTerrainTooltip(surfaceTerrain(terrainId), $event)"
            @mousemove="moveTooltip"
            @mouseleave="tooltip = null"
          >
            <EditorEntityPreview
              :source="surfaceVariantPreset(surfaceTerrain(terrainId).primary)"
              :cell-size="size"
              :images="images"
              :catalog="catalog"
              :editor="editor"
              fallback-text=""
            />
          </button>
        </div>
      </section>
    </div>

    <section class="surface-control-section">
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

    <section class="editor-palette-group surface-variants">
      <h3>Variants</h3>
      <div
        v-for="(row, rowIndex) in terrain.rows"
        :key="`${terrain.id}:variant:${rowIndex}`"
        class="editor-palette-grid surface-palette-grid"
        :style="{ '--palette-size': `${size}px` }"
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
          @click="brush.pattern === 'alternate' ? emit('alternateA', variant.type) : emit('exact', variant.type)"
          @contextmenu.prevent="emit('alternateB', variant.type)"
          @mouseenter="showVariantTooltip(terrain, variant.type, variant.label, $event)"
          @mousemove="moveTooltip"
          @mouseleave="tooltip = null"
        >
          <EditorEntityPreview
            :source="surfaceVariantPreset(variant.type)"
            :cell-size="size"
            :images="images"
            :catalog="catalog"
            :editor="editor"
            fallback-text=""
          />
        </button>
      </div>
    </section>

    <Teleport to="body">
      <div
        v-if="tooltip"
        class="editor-palette-tooltip surface-tooltip"
        :style="{ left: `${tooltip.x}px`, top: `${tooltip.y}px` }"
      >
        <strong>{{ tooltip.name }}</strong>
        <code v-if="tooltip.type">{{ tooltip.type }}</code>
        <div v-if="tooltip.variantCount !== undefined">
          <span>variants</span> {{ tooltip.variantCount }}
        </div>
        <div v-if="tooltip.detail">{{ tooltip.detail }}</div>
        <div v-if="tooltip.surfaceType"><span>type</span> {{ tooltip.surfaceType }}</div>
        <div v-if="tooltip.slot"><span>slot</span> {{ tooltip.slot }}</div>
        <div v-if="tooltip.theme"><span>theme</span> {{ tooltip.theme }}</div>
        <div v-if="tooltip.auto"><span>auto</span> {{ tooltip.auto }}</div>
      </div>
    </Teleport>
  </aside>
</template>

<style scoped>
.editor-surface-panel {
  display: block;
}
.surface-theme-section {
  margin: 0 0 14px;
  border-bottom: 1px solid #ffffff18;
  padding-bottom: 10px;
}
.surface-theme-section summary {
  padding: 5px 0 9px;
  color: var(--editor-muted);
  cursor: pointer;
  font-size: .72rem;
  font-weight: 700;
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
.surface-groups {
  margin-bottom: 14px;
}
.surface-palette-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, var(--palette-size));
  grid-auto-rows: var(--palette-size);
  grid-auto-flow: row dense;
  gap: 4px;
  margin-bottom: 4px;
  overflow: hidden;
}
.surface-terrain-tile,
.surface-variant {
  width: auto;
  height: auto;
  min-width: 0;
  min-height: 0;
  border: 0;
  box-shadow: none;
}
.surface-control-section {
  padding: 10px 0 14px;
  border-top: 1px solid #ffffff18;
}
.surface-control-section h3,
.surface-variants h3 {
  margin: 0 0 7px;
  color: #bdc9c0;
  font-size: .72rem;
  font-weight: 700;
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
.surface-variant.alternate-a::before {
  content: "A";
  left: 2px;
}
.surface-variant.alternate-b::after {
  content: "B";
  right: 2px;
}
.surface-tooltip {
  position: fixed;
  z-index: 10000;
  max-width: 320px;
  pointer-events: none;
  padding: 8px 10px;
  border: 1px solid #3d88bb;
  border-radius: 6px;
  background: #082f59;
  color: #fff;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.35);
  font-size: 12px;
}
.surface-tooltip strong,
.surface-tooltip code {
  display: block;
  margin-bottom: 3px;
}
.surface-tooltip span {
  color: var(--bc-text-muted);
}
</style>
