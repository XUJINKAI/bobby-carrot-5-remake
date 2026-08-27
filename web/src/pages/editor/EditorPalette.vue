<script setup lang="ts">
import {
  paletteGroup,
  paletteGroups,
  paletteItems,
  paletteLabel,
  type PaletteItem,
} from "@bobby/editor";
import { createBuiltinEntityRegistry } from "@bobby/engine";
import { computed } from "vue";

const props = defineProps<{
  selection: PaletteItem;
  size: number;
}>();
const emit = defineEmits<{
  select: [item: PaletteItem];
  resize: [delta: number];
}>();
const registry = createBuiltinEntityRegistry();
const items = paletteItems(registry);
const groups = computed(() =>
  paletteGroups(registry)
    .map((name) => ({
      name,
      items: items.filter((item) => paletteGroup(registry, item) === name),
    }))
    .filter((group) => group.items.length > 0),
);

function label(item: PaletteItem): string {
  return paletteLabel(registry, item);
}

function glyph(item: PaletteItem): string {
  const name = label(item).trim();
  return name.slice(0, 2).toUpperCase();
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
      <strong>{{ label(selection) }}</strong>
      <span>{{ selection.type }}</span>
    </div>
    <div class="editor-palette-groups">
      <section v-for="group in groups" :key="group.name" class="editor-palette-group">
        <h3>{{ group.name }}</h3>
        <div class="editor-palette-grid" :style="{ '--palette-size': `${size}px` }">
          <button
            v-for="item in group.items"
            :key="item.type"
            type="button"
            class="editor-palette-tile"
            :class="{ active: selection.type === item.type }"
            :title="label(item)"
            @click="emit('select', item)"
          >
            <span class="editor-palette-sprite editor-palette-glyph" aria-hidden="true">{{ glyph(item) }}</span>
          </button>
        </div>
      </section>
    </div>
  </aside>
</template>
