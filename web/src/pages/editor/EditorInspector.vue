<script setup lang="ts">
import {
  applyEditorVariant,
  editorVariantIndex,
  type EntityCatalog,
  type InspectorModel,
} from "@bobby/editor";
import type { ImageManager } from "@bobby/engine";
import { computed } from "vue";
import { entityVisualStyle } from "../../services/assets/entityVisual.js";

const props = defineProps<{
  model: InspectorModel;
  images: ImageManager;
  catalog: EntityCatalog;
}>();
const emit = defineEmits<{
  property: [entityIndex: number, key: string, value: string];
  state: [entityIndex: number, key: string, value: string];
  variant: [index: number];
}>();
const activeVariant = computed(() => {
  const entity = props.model.entity;
  return entity
    ? editorVariantIndex(entity.entity, props.catalog, entity.editor)
    : -1;
});
const directionVariants = computed(() => variantEntries(true));
const shapeVariants = computed(() => variantEntries(false));
const controlledStateKeys = computed(() =>
  new Set(
    (props.model.entity?.editor?.variants ?? []).flatMap((variant) =>
      Object.keys(variant.state ?? {}),
    ),
  ),
);
const controlledPropertyKeys = computed(() =>
  new Set(
    (props.model.entity?.editor?.variants ?? []).flatMap((variant) =>
      Object.keys(variant.properties ?? {}),
    ),
  ),
);
const editableState = computed(() =>
  (props.model.entity?.definition.state ?? []).filter(
    (field) => !controlledStateKeys.value.has(field.key),
  ),
);
const editableProperties = computed(() =>
  (props.model.entity?.definition.properties ?? []).filter(
    (field) => !controlledPropertyKeys.value.has(field.key),
  ),
);

function variantEntries(directional: boolean) {
  return (props.model.entity?.editor?.variants ?? [])
    .map((variant, index) => ({ variant, index }))
    .filter(({ variant }) => Boolean(variant.direction) === directional);
}

function variantStyle(index: number): Record<string, string> | null {
  const selected = props.model.entity;
  const variant = selected?.editor?.variants?.[index];
  if (!selected || !variant) return null;
  const candidate = applyEditorVariant(selected.entity, variant);
  return entityVisualStyle(
    props.images,
    {
      type: candidate.type,
      ...(candidate.direction ? { direction: candidate.direction } : {}),
      ...(candidate.properties ? { properties: candidate.properties } : {}),
      ...(candidate.state ? { state: candidate.state } : {}),
    },
    54,
  );
}

function variantLabel(index: number): string {
  const variant = props.model.entity?.editor?.variants?.[index];
  return variant?.label ?? variant?.direction ?? `Variant ${index + 1}`;
}
</script>

<template>
  <aside class="editor-inspector">
    <div class="editor-panel-title">Inspector</div>
    <section v-if="!model.selection" class="editor-inspector-section editor-muted">
      使用选择工具点选或框选地图内容。
    </section>
    <section v-else class="editor-inspector-section">
      <strong>选区</strong>
      <div class="editor-muted">
        {{ model.rect?.width }} × {{ model.rect?.height }} · {{ model.entityCount }} Entities
      </div>
    </section>
    <template v-if="model.entity">
      <section class="editor-inspector-section editor-entity-summary">
        <strong>{{ model.entity.definition.presentation.name }}</strong>
        <code>{{ model.entity.entity.type }}</code>
        <div class="editor-info-grid">
          <span>位置</span>
          <strong>{{ model.entity.entity.x }}, {{ model.entity.entity.y }}</strong>
          <span>占用</span>
          <strong>{{ model.entity.definition.footprint?.parts.length ?? 1 }} 格</strong>
        </div>
        <div v-if="model.entity.definition.traits.length" class="editor-traits">
          <code v-for="trait in model.entity.definition.traits" :key="trait">{{ trait }}</code>
        </div>
      </section>
      <section v-if="directionVariants.length" class="editor-inspector-section">
        <strong>方向</strong>
        <div class="editor-variant-grid">
          <button
            v-for="entry in directionVariants"
            :key="entry.index"
            type="button"
            class="editor-variant-btn"
            :class="{ active: activeVariant === entry.index }"
            :title="variantLabel(entry.index)"
            @click="emit('variant', entry.index)"
          >
            <span
              v-if="variantStyle(entry.index)"
              class="editor-variant-visual"
              :style="variantStyle(entry.index) ?? undefined"
              aria-hidden="true"
            />
            <span v-else class="editor-variant-glyph" aria-hidden="true">
              {{ entry.variant.direction === "up" ? "↑" : entry.variant.direction === "down" ? "↓" : entry.variant.direction === "left" ? "←" : "→" }}
            </span>
            <small>{{ variantLabel(entry.index) }}</small>
          </button>
        </div>
      </section>
      <section v-if="shapeVariants.length" class="editor-inspector-section">
        <strong>形态</strong>
        <div class="editor-variant-grid">
          <button
            v-for="entry in shapeVariants"
            :key="entry.index"
            type="button"
            class="editor-variant-btn"
            :class="{ active: activeVariant === entry.index }"
            :title="variantLabel(entry.index)"
            @click="emit('variant', entry.index)"
          >
            <span
              v-if="variantStyle(entry.index)"
              class="editor-variant-visual"
              :style="variantStyle(entry.index) ?? undefined"
              aria-hidden="true"
            />
            <span v-else class="editor-variant-glyph" aria-hidden="true">◇</span>
            <small>{{ variantLabel(entry.index) }}</small>
          </button>
        </div>
      </section>
      <section v-if="editableProperties.length" class="editor-inspector-section">
        <strong>属性</strong>
        <label v-for="property in editableProperties" :key="property.key" class="editor-field">
          <span>{{ property.label ?? property.key }}</span>
          <select
            v-if="property.kind === 'enum'"
            :value="model.entity.entity.properties?.[property.key] ?? property.default ?? ''"
            @change="emit('property', model.entity!.ref.index, property.key, ($event.target as HTMLSelectElement).value)"
          >
            <option value="">未设置</option>
            <option
              v-for="option in property.options ?? []"
              :key="String(option.value)"
              :value="String(option.value)"
            >
              {{ option.label ?? option.value }}
            </option>
          </select>
          <input
            v-else
            type="text"
            :value="model.entity.entity.properties?.[property.key] ?? property.default ?? ''"
            @change="emit('property', model.entity!.ref.index, property.key, ($event.target as HTMLInputElement).value)"
          >
        </label>
      </section>
      <section v-if="editableState.length" class="editor-inspector-section">
        <strong>初始状态</strong>
        <label v-for="field in editableState" :key="field.key" class="editor-field">
          <span>{{ field.label ?? field.key }}</span>
          <select
            v-if="field.kind === 'enum' || field.kind === 'boolean'"
            :value="model.entity.entity.state?.[field.key] ?? field.default ?? ''"
            @change="emit('state', model.entity!.ref.index, field.key, ($event.target as HTMLSelectElement).value)"
          >
            <option v-if="field.kind === 'boolean'" value="true">true</option>
            <option v-if="field.kind === 'boolean'" value="false">false</option>
            <option
              v-for="option in field.options ?? []"
              :key="String(option.value)"
              :value="String(option.value)"
            >
              {{ option.label ?? option.value }}
            </option>
          </select>
          <input
            v-else
            type="text"
            :value="model.entity.entity.state?.[field.key] ?? field.default ?? ''"
            @change="emit('state', model.entity!.ref.index, field.key, ($event.target as HTMLInputElement).value)"
          >
        </label>
      </section>
      <section
        v-if="!directionVariants.length && !shapeVariants.length && !editableProperties.length && !editableState.length"
        class="editor-inspector-section editor-muted"
      >
        这个对象没有额外的可编辑属性。
      </section>
    </template>
    <section
      v-else-if="model.selection && model.entityCount > 1"
      class="editor-inspector-section editor-muted"
    >
      多选用于复制、剪切和删除；属性编辑需要单选 Entity。
    </section>
  </aside>
</template>

<style scoped>
.editor-entity-summary { display:grid; gap:8px; }
.editor-entity-summary > code { color:var(--editor-muted); }
.editor-info-grid {
  display:grid;
  grid-template-columns:auto 1fr;
  gap:5px 10px;
  font-size:12px;
}
.editor-info-grid > span { color:var(--editor-muted); }
.editor-variant-grid {
  display:grid;
  grid-template-columns:repeat(auto-fill, minmax(72px, 1fr));
  gap:7px;
  margin-top:8px;
}
.editor-variant-btn {
  display:grid;
  place-items:center;
  gap:4px;
  min-width:0;
  min-height:82px;
  padding:6px;
  border:2px solid var(--line);
  border-radius:7px;
  background:var(--panel2);
  color:inherit;
}
.editor-variant-btn.active {
  border-color:#8ee7ff;
  background:var(--bc-active);
}
.editor-variant-visual {
  display:block;
  image-rendering:pixelated;
}
.editor-variant-glyph {
  display:grid;
  place-items:center;
  width:54px;
  height:54px;
  font-size:28px;
}
.editor-variant-btn small {
  max-width:100%;
  overflow:hidden;
  text-overflow:ellipsis;
  white-space:nowrap;
}
</style>
