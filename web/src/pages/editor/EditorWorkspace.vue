<script setup lang="ts">
import type {
  Cell,
  EditorLevel,
  InspectorModel,
  PaletteItem,
} from "@bobby/editor";
import type { ImageManager } from "@bobby/engine";
import EditorCanvas from "./EditorCanvas.vue";
import EditorInspector from "./EditorInspector.vue";
import EditorPalette from "./EditorPalette.vue";

defineProps<{
  level: Readonly<EditorLevel>;
  revision: number;
  placementSequence: number;
  selection: PaletteItem;
  hover: Cell | null;
  inspector: InspectorModel;
  paletteSize: number;
  playing: boolean;
  images: ImageManager;
}>();
const emit = defineEmits<{
  select: [item: PaletteItem];
  paletteResize: [delta: number];
  hover: [cell: Cell | null];
  stroke: [cell: Cell, button: 0 | 2];
  beginStroke: [];
  endStroke: [];
  transform: [cell: Cell, step: number, result: (changed: boolean) => void];
  resize: [width: number, height: number];
  property: [entityIndex: number, key: string, value: string];
  maxMoves: [value: number | null];
}>();
</script>

<template>
  <main class="editor-body" :class="{ playing }">
    <EditorPalette
      v-show="!playing"
      :selection="selection"
      :size="paletteSize"
      :images="images"
      @select="emit('select', $event)"
      @resize="emit('paletteResize', $event)"
    />
    <section class="editor-map-shell" :class="{ playing }">
      <EditorCanvas
        v-show="!playing"
        :level="level"
        :revision="revision"
        :placement-sequence="placementSequence"
        :selection="selection"
        :hover="hover"
        :enabled="!playing"
        :images="images"
        @hover="emit('hover', $event)"
        @stroke="(cell, button) => emit('stroke', cell, button)"
        @begin-stroke="emit('beginStroke')"
        @end-stroke="emit('endStroke')"
        @transform="(cell, step, result) => emit('transform', cell, step, result)"
      />
      <canvas v-show="playing" data-editor-game-canvas />
      <div data-editor-game-dialog-root />
    </section>
    <EditorInspector
      v-show="!playing"
      :model="inspector"
      @resize="(width, height) => emit('resize', width, height)"
      @property="(entityIndex, key, value) => emit('property', entityIndex, key, value)"
      @max-moves="emit('maxMoves', $event)"
    />
  </main>
</template>
