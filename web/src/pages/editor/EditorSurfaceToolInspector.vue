<script setup lang="ts">
import {
  surfaceTerrain,
  surfaceVariantPreset,
  type EditorDefinition,
  type EntityCatalog,
  type SurfaceBrush,
  type SurfaceTool,
} from "@bobby/editor";
import type { ImageManager } from "@bobby/engine";
import { computed } from "vue";
import EditorEntityPreview from "./EditorEntityPreview.vue";

const props = defineProps<{
  tool: SurfaceTool;
  brush: SurfaceBrush;
  images: ImageManager;
  catalog: EntityCatalog;
  editor: EditorDefinition;
}>();

const terrain = computed(() => surfaceTerrain(props.brush.terrain));
const visuals = computed(() => {
  if (props.brush.pattern === "alternate")
    return props.brush.alternate ?? [terrain.value.primary];
  if (props.brush.pattern === "exact")
    return [props.brush.exact ?? terrain.value.primary];
  return [terrain.value.primary];
});
const patternLabel = computed(() => {
  if (props.brush.pattern === "exact") return "Exact";
  if (props.brush.pattern === "alternate") return "Alternating · A/B";
  return `Auto · ${terrain.value.auto.kind}`;
});
</script>

<template>
  <div class="editor-surface-tool-inspector">
    <section class="editor-inspector-section editor-surface-tool-summary editor-inspector-summary">
      <span class="editor-tool-kicker">{{ tool === 'fill' ? '填充' : '画笔' }} · Surface</span>
      <strong>{{ terrain.label }}</strong>
      <span class="editor-muted">{{ patternLabel }}</span>
    </section>
    <section class="editor-inspector-section">
      <div class="editor-surface-preview-list">
        <div v-for="visual in visuals" :key="visual" class="editor-surface-preview">
          <EditorEntityPreview
            :source="surfaceVariantPreset(visual)"
            :cell-size="44"
            :images="images"
            :catalog="catalog"
            :editor="editor"
            fallback-text=""
          />
          <code>{{ visual }}</code>
        </div>
      </div>
      <p v-if="brush.pattern === 'auto'" class="editor-muted editor-surface-note">
        实际单元由 Terrain 的 Auto 规则按目标坐标稳定决定。
      </p>
    </section>
  </div>
</template>

<style scoped>
.editor-surface-tool-summary {
  display: grid;
  gap: 3px;
}
.editor-tool-kicker {
  margin-bottom: 5px;
  color: #8ee7ff;
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.editor-surface-preview-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.editor-surface-preview {
  display: grid;
  place-items: center;
  gap: 5px;
  min-width: 70px;
  padding: 8px;
  border: 1px solid rgb(255 255 255 / 13%);
  border-radius: 8px;
  background: rgb(0 20 45 / 24%);
}
.editor-surface-preview code {
  color: var(--editor-muted);
  font-size: 10px;
}
.editor-surface-note {
  margin: 10px 0 0;
  font-size: 0.7rem;
  line-height: 1.45;
}
</style>
