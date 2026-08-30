<script setup lang="ts">
import type {
  EditorTool,
  PaletteItem,
  ResolvedPaletteGroup,
} from "@bobby/editor";
import type { EntityCatalog, ImageManager } from "@bobby/engine/authoring";
import { ref } from "vue";
import { entityVisualStyle } from "../../services/assets/entityVisual.js";

const props = defineProps<{
  groups: readonly ResolvedPaletteGroup[];
  placement: PaletteItem;
  tool: EditorTool;
  size: number;
  images: ImageManager;
  catalog: EntityCatalog;
}>();
const emit = defineEmits<{
  select: [item: PaletteItem];
  tool: [tool: EditorTool];
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
function iconStyle(item: PaletteItem): Record<string, string> | null {
  return entityVisualStyle(props.images, {
    type: item.type,
    ...(item.direction ? { direction: item.direction } : {}),
    ...(item.properties ? { properties: item.properties } : {}),
    ...(item.state ? { state: item.state } : {}),
  }, props.size);
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
  tooltip.value = { ...tooltip.value, x: event.clientX + 14, y: event.clientY + 14 };
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
    <div class="editor-tool-row" role="toolbar" aria-label="编辑工具">
      <button type="button" class="editor-tool-btn" :class="{ active: tool === 'select' }" title="选择" @click="emit('tool', 'select')">↖</button>
      <button type="button" class="editor-tool-btn" :class="{ active: tool === 'place' }" title="放置" @click="emit('tool', 'place')">＋</button>
      <button type="button" class="editor-tool-btn" :class="{ active: tool === 'erase' }" title="橡皮擦" @click="emit('tool', 'erase')">⌫</button>
    </div>
    <div class="editor-palette-groups">
      <section v-for="group in groups" :key="group.id" class="editor-palette-group">
        <h3>{{ group.label }}</h3>
        <div v-for="(row, rowIndex) in group.rows" :key="`${group.id}:${rowIndex}`" class="editor-palette-grid" :style="{ '--palette-size': `${size}px` }">
          <button
            v-for="item in row"
            :key="item.key"
            type="button"
            class="editor-palette-tile"
            :class="{ active: tool === 'place' && placement.key === item.key }"
            @click="emit('select', item)"
            @mouseenter="showTooltip(item, $event)"
            @mousemove="moveTooltip"
            @mouseleave="tooltip = null"
          >
            <span class="editor-palette-sprite" :class="{ 'editor-palette-glyph': !iconStyle(item) }" :style="iconStyle(item) ?? undefined" aria-hidden="true">{{ iconStyle(item) ? '' : glyph(item) }}</span>
          </button>
        </div>
      </section>
    </div>
    <Teleport to="body">
      <div v-if="tooltip" class="editor-palette-tooltip" :style="{ left: `${tooltip.x}px`, top: `${tooltip.y}px` }">
        <strong>{{ tooltip.name }}</strong>
        <code>{{ tooltip.type }}</code>
        <div v-if="tooltip.traits.length"><span>traits</span> {{ tooltip.traits.join(', ') }}</div>
        <div v-if="tooltip.behaviors.length"><span>behaviors</span> {{ tooltip.behaviors.join(', ') }}</div>
      </div>
    </Teleport>
  </aside>
</template>

<style scoped>
.editor-tool-row { display:flex; gap:6px; padding:8px; border-bottom:1px solid var(--line); }
.editor-tool-btn { width:34px; height:32px; border:1px solid var(--line); border-radius:5px; background:var(--panel2); color:inherit; font-size:18px; }
.editor-tool-btn.active { background:var(--bc-active); }
.editor-palette-grid { display:flex; flex-wrap:nowrap; gap:4px; margin-bottom:4px; }
.editor-palette-tooltip { position:fixed; z-index:10000; max-width:320px; pointer-events:none; padding:8px 10px; border:1px solid #3d88bb; border-radius:6px; background:#082f59; color:#fff; box-shadow:0 6px 20px rgba(0,0,0,.35); font-size:12px; }
.editor-palette-tooltip strong, .editor-palette-tooltip code { display:block; margin-bottom:3px; }
.editor-palette-tooltip span { color:var(--bc-text-muted); }
</style>
