<script setup lang="ts">
import {
  applyEditorVariant,
  editorVariantIndex,
  type EditorDefinition,
  type EditorEntityDefinition,
  type EditorPlacementPreset,
  type EntityCatalog,
  type EntityCatalogEntry,
} from "@bobby/editor";
import type { ImageManager } from "@bobby/engine";
import type { JsonValue, LevelEntity } from "@bobby/model";
import { computed } from "vue";
import EditorEntityPreview from "./EditorEntityPreview.vue";

const props = defineProps<{
  targets: readonly LevelEntity[];
  definition: EntityCatalogEntry;
  entityPolicy?: EditorEntityDefinition;
  images: ImageManager;
  catalog: EntityCatalog;
  editor: EditorDefinition;
}>();
const emit = defineEmits<{
  property: [key: string, value: string];
  state: [key: string, value: string];
  variant: [index: number];
}>();

const activeVariant = computed(() => {
  if (props.targets.length === 0) return -1;
  const indexes = props.targets.map((entity) =>
    editorVariantIndex(entity, props.catalog, props.entityPolicy),
  );
  return indexes.every((index) => index === indexes[0]) ? indexes[0]! : -1;
});
const directionVariants = computed(() => variantEntries(true));
const shapeVariants = computed(() => variantEntries(false));
const controlledStateKeys = computed(() =>
  new Set(
    (props.entityPolicy?.variants ?? []).flatMap((variant) =>
      Object.keys(variant.state ?? {}),
    ),
  ),
);
const controlledPropertyKeys = computed(() =>
  new Set(
    (props.entityPolicy?.variants ?? []).flatMap((variant) =>
      Object.keys(variant.properties ?? {}),
    ),
  ),
);
const editableState = computed(() =>
  (props.definition.state ?? []).filter(
    (field) => !controlledStateKeys.value.has(field.key),
  ),
);
const editableProperties = computed(() =>
  (props.definition.properties ?? []).filter(
    (field) => !controlledPropertyKeys.value.has(field.key),
  ),
);
const hasFields = computed(
  () =>
    directionVariants.value.length > 0 ||
    shapeVariants.value.length > 0 ||
    editableProperties.value.length > 0 ||
    editableState.value.length > 0,
);

function variantEntries(directional: boolean) {
  return (props.entityPolicy?.variants ?? [])
    .map((variant, index) => ({ variant, index }))
    .filter(({ variant }) => Boolean(variant.direction) === directional);
}

function variantSource(index: number): EditorPlacementPreset {
  const source = props.targets[0]!;
  const variant = props.entityPolicy?.variants?.[index];
  const candidate = variant ? applyEditorVariant(source, variant) : source;
  return {
    type: candidate.type,
    ...(candidate.direction ? { direction: candidate.direction } : {}),
    ...(candidate.properties ? { properties: candidate.properties } : {}),
    ...(candidate.state ? { state: candidate.state } : {}),
  };
}

function variantLabel(index: number): string {
  const variant = props.entityPolicy?.variants?.[index];
  return variant?.label ?? variant?.direction ?? `Variant ${index + 1}`;
}

function fieldValue(
  section: "properties" | "state",
  key: string,
  fallback: JsonValue | undefined,
): string {
  if (props.targets.length === 0) return "";
  const values = props.targets.map(
    (entity) => entity[section]?.[key] ?? fallback ?? null,
  );
  const first = JSON.stringify(values[0]);
  if (!values.every((value) => JSON.stringify(value) === first)) return "";
  const value = values[0];
  return value === null ? "" : String(value);
}

function fieldMixed(
  section: "properties" | "state",
  key: string,
  fallback: JsonValue | undefined,
): boolean {
  if (props.targets.length < 2) return false;
  const values = props.targets.map(
    (entity) => entity[section]?.[key] ?? fallback ?? null,
  );
  const first = JSON.stringify(values[0]);
  return !values.every((value) => JSON.stringify(value) === first);
}
</script>

<template>
  <div class="editor-entity-fields">
    <section v-if="directionVariants.length" class="editor-fields-block">
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
          <EditorEntityPreview
            :source="variantSource(entry.index)"
            :cell-size="28"
            :images="images"
            :catalog="catalog"
            :editor="editor"
            :fallback-text="entry.variant.direction"
          />
          <small>{{ variantLabel(entry.index) }}</small>
        </button>
      </div>
    </section>

    <section v-if="shapeVariants.length" class="editor-fields-block">
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
          <EditorEntityPreview
            :source="variantSource(entry.index)"
            :cell-size="28"
            :images="images"
            :catalog="catalog"
            :editor="editor"
            fallback-text="◇"
          />
          <small>{{ variantLabel(entry.index) }}</small>
        </button>
      </div>
    </section>

    <section v-if="editableProperties.length" class="editor-fields-block">
      <strong>属性</strong>
      <label
        v-for="property in editableProperties"
        :key="property.key"
        class="editor-field"
      >
        <span>{{ property.label ?? property.key }}</span>
        <select
          v-if="property.kind === 'enum'"
          :value="fieldValue('properties', property.key, property.default)"
          @change="emit('property', property.key, ($event.target as HTMLSelectElement).value)"
        >
          <option v-if="fieldMixed('properties', property.key, property.default)" value="">— 多种值 —</option>
          <option v-else value="">未设置</option>
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
          :value="fieldValue('properties', property.key, property.default)"
          :placeholder="fieldMixed('properties', property.key, property.default) ? '多种值' : ''"
          @change="emit('property', property.key, ($event.target as HTMLInputElement).value)"
        >
      </label>
    </section>

    <section v-if="editableState.length" class="editor-fields-block">
      <strong>初始状态</strong>
      <label v-for="field in editableState" :key="field.key" class="editor-field">
        <span>{{ field.label ?? field.key }}</span>
        <select
          v-if="field.kind === 'enum' || field.kind === 'boolean'"
          :value="fieldValue('state', field.key, field.default)"
          @change="emit('state', field.key, ($event.target as HTMLSelectElement).value)"
        >
          <option v-if="fieldMixed('state', field.key, field.default)" value="">— 多种值 —</option>
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
          :value="fieldValue('state', field.key, field.default)"
          :placeholder="fieldMixed('state', field.key, field.default) ? '多种值' : ''"
          @change="emit('state', field.key, ($event.target as HTMLInputElement).value)"
        >
      </label>
    </section>

    <div v-if="!hasFields" class="editor-muted">没有额外可编辑属性。</div>
  </div>
</template>

<style scoped>
.editor-entity-fields,
.editor-fields-block {
  display: grid;
  gap: 8px;
}
.editor-fields-block + .editor-fields-block {
  padding-top: 10px;
  border-top: 1px solid rgb(255 255 255 / 10%);
}
.editor-variant-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(78px, 1fr));
  gap: 7px;
}
.editor-variant-btn {
  display: grid;
  place-items: center;
  gap: 4px;
  min-width: 0;
  min-height: 70px;
  padding: 6px;
  overflow: hidden;
  border: 2px solid var(--line);
  border-radius: 7px;
  background: var(--panel2);
  color: inherit;
}
.editor-variant-btn.active {
  border-color: #8ee7ff;
  background: var(--bc-active);
}
.editor-variant-btn small {
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
