<script setup lang="ts">
import type {
  EditorDefinition,
  PaletteItem,
  ResolvedPaletteGroup,
} from "@bobby/editor";
import type { EntityCatalog, ImageManager } from "@bobby/engine";
import { ref } from "vue";
import EditorEntityPreview from "./EditorEntityPreview.vue";

const props = defineProps<{
  groups: readonly ResolvedPaletteGroup[];
  placement: PaletteItem;
  size: number;
  images: ImageManager;
  catalog: EntityCatalog;
  editor: EditorDefinition;
}>();
const emit = defineEmits<{
  select: [item: PaletteItem];
  resize: [delta: number];
}>();
const tooltip = ref<null | {
  x: number;
  y: number;
  name: string;
  type: string;
  traits: readonly string[];
  behaviors: readonly string[];
}>(null);

function glyph(item: PaletteItem): string {
  return item.label.trim().slice(0, 2).toUpperCase();
}
function tileStyle(item: PaletteItem): Record<string, string> {
  return {
    gridColumn: `span ${item.previewWidth}`,
    gridRow: `span ${item.previewHeight}`,
  };
}
function showTooltip(item: PaletteItem, event: MouseEvent): void {
  const definition = props.catalog.require(item.type);
  tooltip.value = {
    x: event.clientX + 14,
    y: event.clientY + 14,
    name: item.label,
    type: item.type,
    traits: definition.traits,
    behaviors: definition.behaviors ?? [],
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
</script>

<template>
  <aside class="editor-palette">
    <div class="editor-palette-head">
      <div class="editor-panel-title">素材</div>
      <div class="editor-palette-zoom">
        <button class="editor-mini-btn" type="button" @click="emit('resize', -1)">−</button>
        <span>{{ size }}</span>
        <button class="editor-mini-btn" type="button" @click="emit('resize', 1)">+</button>
      </div>
    </div>
    <div class="editor-palette-groups">
      <section v-for="group in groups" :key="group.id" class="editor-palette-group">
        <h3>{{ group.label }}</h3>
        <div
          v-for="(row, rowIndex) in group.rows"
          :key="`${group.id}:${rowIndex}`"
          class="editor-palette-grid"
          :style="{ '--palette-size': `${size}px` }"
        >
          <button
            v-for="item in row"
            :key="item.key"
            type="button"
            class="editor-palette-tile"
            :class="{ active: placement.key === item.key }"
            :style="tileStyle(item)"
            @click="emit('select', item)"
            @mouseenter="showTooltip(item, $event)"
            @mousemove="moveTooltip"
            @mouseleave="tooltip = null"
          >
            <EditorEntityPreview
              :source="item.previewPreset"
              :cell-size="size"
              :images="images"
              :catalog="catalog"
              :editor="editor"
              :fallback-text="glyph(item)"
            />
          </button>
        </div>
      </section>
    </div>
    <Teleport to="body">
      <div
        v-if="tooltip"
        class="editor-palette-tooltip"
        :style="{ left: `${tooltip.x}px`, top: `${tooltip.y}px` }"
      >
        <strong>{{ tooltip.name }}</strong>
        <code>{{ tooltip.type }}</code>
        <div v-if="tooltip.traits.length">
          <span>traits</span> {{ tooltip.traits.join(', ') }}
        </div>
        <div v-if="tooltip.behaviors.length">
          <span>behaviors</span> {{ tooltip.behaviors.join(', ') }}
        </div>
      </div>
    </Teleport>
  </aside>
</template>

<style scoped>
.editor-palette-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, var(--palette-size));
  grid-auto-rows: var(--palette-size);
  grid-auto-flow: row dense;
  gap: 4px;
  margin-bottom: 4px;
  overflow: hidden;
}
.editor-palette-tile {
  width: auto;
  height: auto;
  min-width: 0;
  min-height: 0;
  border: 0;
  box-shadow: none;
}
.editor-palette-tooltip {
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
.editor-palette-tooltip strong,
.editor-palette-tooltip code {
  display: block;
  margin-bottom: 3px;
}
.editor-palette-tooltip span {
  color: var(--bc-text-muted);
}
</style>
