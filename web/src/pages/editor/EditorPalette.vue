<script setup lang="ts">
import type {
  EditorDefinition,
  PaletteItem,
  ResolvedPaletteGroup,
} from "@bobby/editor";
import type { EntityCatalog, ImageManager } from "@bobby/engine";
import EditorEntityPreview from "./EditorEntityPreview.vue";
import EditorMaterialTooltip from "./EditorMaterialTooltip.vue";
import { useEditorMaterialTooltip } from "./editorMaterialTooltip.js";
import AppIcon from "../../shared/icons/AppIcon.vue";

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
const {
  tooltip,
  tooltipId,
  schedule,
  showOnFocus,
  hide,
} = useEditorMaterialTooltip();

function glyph(item: PaletteItem): string {
  return item.label.trim().slice(0, 2).toUpperCase();
}
function tileStyle(item: PaletteItem): Record<string, string> {
  return {
    gridColumn: `span ${item.previewWidth}`,
    gridRow: `span ${item.previewHeight}`,
  };
}
function tooltipContent(item: PaletteItem) {
  return {
    title: item.label,
    code: item.type,
    rows: [
      ...(item.traits.length > 0
        ? [{ label: "traits", value: item.traits.join(", ") }]
        : []),
      ...(item.behaviors.length > 0
        ? [{ label: "behaviors", value: item.behaviors.join(", ") }]
        : []),
      ...(item.supportedFields.length > 0
        ? [{ label: "fields", value: item.supportedFields.join(", ") }]
        : []),
    ],
  };
}
</script>

<template>
  <aside class="editor-palette">
    <div class="editor-palette-head">
      <div class="editor-panel-title">素材</div>
      <div class="editor-palette-zoom">
        <button class="editor-mini-btn" type="button" aria-label="缩小素材" @click="emit('resize', -1)">
          <AppIcon name="minus" />
        </button>
        <span>{{ size }}</span>
        <button class="editor-mini-btn" type="button" aria-label="放大素材" @click="emit('resize', 1)">
          <AppIcon name="place" />
        </button>
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
            :aria-label="item.label"
            :aria-describedby="tooltip?.key === item.key ? tooltipId : undefined"
            :data-palette-type="item.type"
            @click="emit('select', item)"
            @mouseenter="schedule(item.key, $event, tooltipContent(item))"
            @mouseleave="hide"
            @focus="showOnFocus(item.key, $event, tooltipContent(item))"
            @blur="hide"
          >
            <EditorEntityPreview
              :source="item.previewPreset"
              :cell-size="size"
              :images="images"
              :catalog="catalog"
              :editor="editor"
              :preview-state="item.preview?.state"
              :fallback-text="glyph(item)"
            />
          </button>
        </div>
      </section>
    </div>
    <EditorMaterialTooltip v-if="tooltip" :id="tooltipId" :model="tooltip" />
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
</style>
