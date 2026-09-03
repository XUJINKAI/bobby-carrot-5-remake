<script setup lang="ts">
import {
  SURFACE_GROUPS,
  surfaceGroup,
  type EditorDefinition,
  type SurfaceBrush,
  type SurfacePattern,
  type SurfaceTheme,
  type SurfaceTool,
  type SurfaceType,
} from "@bobby/editor";
import type { EntityCatalog, ImageManager } from "@bobby/engine";
import type { EntityType } from "@bobby/model";
import { computed } from "vue";
import EditorEntityPreview from "./EditorEntityPreview.vue";

const props = defineProps<{
  brush: SurfaceBrush;
  tool: SurfaceTool;
  selectionExists: boolean;
  images: ImageManager;
  catalog: EntityCatalog;
  editor: EditorDefinition;
}>();
const emit = defineEmits<{
  tool: [tool: SurfaceTool];
  type: [type: SurfaceType];
  theme: [theme: SurfaceTheme];
  pattern: [pattern: SurfacePattern];
  exact: [type: EntityType];
  alternateA: [type: EntityType];
  alternateB: [type: EntityType];
  reroll: [];
  applySelection: [];
}>();

const surfaceTypes: readonly { id: SurfaceType; label: string }[] = [
  { id: "ground", label: "Ground" },
  { id: "solid", label: "Solid" },
  { id: "water", label: "Water" },
  { id: "ice", label: "Ice" },
  { id: "sky", label: "Sky" },
  { id: "waterfall", label: "Waterfall" },
];
const tools: readonly { id: SurfaceTool; label: string }[] = [
  { id: "brush", label: "Brush" },
  { id: "rect", label: "Rect" },
  { id: "fill", label: "Fill" },
  { id: "selection", label: "Selection" },
];
const patterns: readonly { id: SurfacePattern; label: string }[] = [
  { id: "auto", label: "Auto" },
  { id: "exact", label: "Exact" },
  { id: "alternate", label: "Alternate" },
];

const themes = computed(() => {
  const seen = new Set<SurfaceTheme>();
  return SURFACE_GROUPS
    .filter((group) => group.type === props.brush.type)
    .map((group) => group.theme)
    .filter((theme) => {
      if (seen.has(theme)) return false;
      seen.add(theme);
      return true;
    });
});
const group = computed(() => surfaceGroup(props.brush.type, props.brush.theme));
const variants = computed(() => group.value?.variants ?? []);
const alternateA = computed(() => props.brush.alternate?.[0] ?? variants.value[0]?.type);
const alternateB = computed(() => props.brush.alternate?.[1] ?? variants.value[1]?.type ?? variants.value[0]?.type);

function themeLabel(theme: SurfaceTheme): string {
  return {
    forest: "Forest",
    snow: "Snow",
    desert: "Desert",
    space: "Space",
    shared: "Shared",
  }[theme];
}
</script>

<template>
  <aside class="editor-palette editor-surface-panel">
    <div class="editor-palette-head">
      <div>
        <div class="editor-panel-title">Surface</div>
        <div class="surface-summary">{{ brush.type }} · {{ brush.theme }} · {{ brush.pattern }}</div>
      </div>
      <button class="editor-mini-btn" type="button" title="重新分配 Auto variant" @click="emit('reroll')">↻</button>
    </div>

    <section class="surface-section">
      <h3>Tool</h3>
      <div class="surface-button-grid four">
        <button
          v-for="item in tools"
          :key="item.id"
          class="surface-choice"
          :class="{ active: tool === item.id }"
          type="button"
          @click="emit('tool', item.id)"
        >{{ item.label }}</button>
      </div>
      <button
        v-if="tool === 'selection'"
        class="editor-btn editor-primary surface-apply"
        type="button"
        :disabled="!selectionExists"
        @click="emit('applySelection')"
      >Apply to Selection</button>
    </section>

    <section class="surface-section">
      <h3>Type</h3>
      <div class="surface-button-grid three">
        <button
          v-for="item in surfaceTypes"
          :key="item.id"
          class="surface-choice"
          :class="{ active: brush.type === item.id }"
          type="button"
          @click="emit('type', item.id)"
        >{{ item.label }}</button>
      </div>
    </section>

    <section class="surface-section">
      <h3>Theme</h3>
      <div class="surface-button-grid three">
        <button
          v-for="theme in themes"
          :key="theme"
          class="surface-choice"
          :class="{ active: brush.theme === theme }"
          type="button"
          @click="emit('theme', theme)"
        >{{ themeLabel(theme) }}</button>
      </div>
    </section>

    <section class="surface-section">
      <h3>Pattern</h3>
      <div class="surface-button-grid three">
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
      <h3>Variants</h3>
      <p v-if="variants.length === 0" class="editor-muted">当前 Type / Theme 没有可用素材。</p>
      <div v-else class="surface-variant-grid">
        <button
          v-for="variant in variants"
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
      <p v-if="brush.pattern === 'alternate'" class="editor-muted surface-hint">
        左键选择 A，右键选择 B。棋盘格按地图坐标稳定交替。
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
  margin: 0 0 7px;
  color: var(--editor-muted);
  font-size: .7rem;
  text-transform: uppercase;
  letter-spacing: .08em;
}
.surface-button-grid {
  display: grid;
  gap: 5px;
}
.surface-button-grid.four { grid-template-columns: repeat(2, minmax(0, 1fr)); }
.surface-button-grid.three { grid-template-columns: repeat(3, minmax(0, 1fr)); }
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
.surface-choice:hover,
.surface-choice.active {
  background: var(--editor-accent);
  border-color: #b4eafd;
}
.surface-apply {
  width: 100%;
  margin-top: 7px;
}
.surface-variant-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, 48px);
  grid-auto-rows: 48px;
  gap: 6px;
}
.surface-variant {
  --palette-size: 48px;
  width: 48px;
  height: 48px;
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
