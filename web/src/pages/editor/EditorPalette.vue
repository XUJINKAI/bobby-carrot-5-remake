<script setup lang="ts">
import {
  GROUP_ORDER,
  paletteGroup,
  paletteItems,
  paletteLabel,
  type EditorLevel,
  type PaletteItem,
} from "@bobby/editor";
import { customTileIconStyle, objectAtlasCell, terrainAtlasCell } from "@bobby/engine";
import { computed } from "vue";

const props = defineProps<{
  level: Readonly<EditorLevel>;
  selection: PaletteItem;
  size: number;
  atlasUrl: string;
}>();
const emit = defineEmits<{
  select: [item: PaletteItem];
  resize: [delta: number];
}>();
const groups = computed(() =>
  GROUP_ORDER.map((name) => ({
    name,
    items: paletteItems(props.level as EditorLevel).filter(
      (item) => paletteGroup(item) === name,
    ),
  })).filter((group) => group.items.length > 0),
);

function iconStyle(item: PaletteItem): Record<string, string> {
  const customStyle = customTileIconStyle(item.type, props.size);
  if (customStyle) return customStyle;
  const cell =
    item.kind === "terrain"
      ? terrainAtlasCell(item.type)
      : objectAtlasCell(item.type);
  const scale = props.size / 48;
  return {
    width: `${props.size}px`,
    height: `${props.size}px`,
    backgroundImage: `url('${props.atlasUrl}')`,
    backgroundSize: `${16 * 48 * scale}px ${16 * 48 * scale}px`,
    backgroundPosition: `${-cell.column * 48 * scale}px ${-cell.row * 48 * scale}px`,
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
    <div class="editor-selected-tile">
      <strong>{{ paletteLabel(selection) }}</strong>
      <span>{{ selection.type }}</span>
    </div>
    <div class="editor-palette-groups">
      <section v-for="group in groups" :key="group.name" class="editor-palette-group">
        <h3>{{ group.name }}</h3>
        <div class="editor-palette-grid" :style="{ '--palette-size': `${size}px` }">
          <button
            v-for="item in group.items"
            :key="`${item.kind}:${item.type}`"
            type="button"
            class="editor-palette-tile"
            :class="{ active: selection.kind === item.kind && selection.type === item.type }"
            :title="paletteLabel(item)"
            @click="emit('select', item)"
          >
            <span class="editor-palette-sprite" :style="iconStyle(item)" />
          </button>
        </div>
      </section>
    </div>
  </aside>
</template>
