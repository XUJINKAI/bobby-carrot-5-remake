<script setup lang="ts">
import {
  applyEditorVariant,
  editorEntityDirection,
  editorVariantIndex,
  surfaceTerrainForEntity,
  surfaceVariantPreset,
  surfaceVisualVariant,
  type EditorDefinition,
  type EditorEntityDefinition,
  type EditorPlacementPreset,
  type EntityCatalog,
  type EntityCatalogEntry,
  type SurfaceVariant,
} from "@bobby/editor";
import type { ImageManager } from "@bobby/engine";
import {
  entityMapDefinition,
  type EntityMapFieldDefinition,
  type EntityType,
  type JsonPrimitive,
  type LevelEntity,
} from "@bobby/model";
import { computed } from "vue";
import EditorEntityPreview from "./EditorEntityPreview.vue";

const props = withDefaults(defineProps<{
  targets: readonly LevelEntity[];
  definition: EntityCatalogEntry;
  entityPolicy?: EditorEntityDefinition | undefined;
  images: ImageManager;
  catalog: EntityCatalog;
  editor: EditorDefinition;
  showMapFields?: boolean;
  emptyText?: string;
}>(), {
  showMapFields: true,
  emptyText: "该素材没有可编辑地图字段。",
});
const emit = defineEmits<{
  field: [key: string, value: string];
  variant: [index: number];
  surfaceVariant: [type: EntityType];
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
const surfaceTerrain = computed(() =>
  props.targets.length > 0
    ? surfaceTerrainForEntity(props.targets[0]!.type)
    : null,
);
const surfaceRows = computed(() => surfaceTerrain.value?.rows ?? []);
const activeSurfaceVariant = computed(() => {
  if (props.targets.length === 0) return null;
  const variants = props.targets.map(surfaceVisualVariant);
  return variants.every((variant) => variant === variants[0])
    ? variants[0]
    : null;
});
const controlledFieldKeys = computed(() => {
  const keys = new Set<string>();
  if (surfaceTerrain.value) keys.add("variant");
  for (const variant of props.entityPolicy?.variants ?? []) {
    if (variant.direction) keys.add("direction");
    for (const key of Object.keys(variant.fields ?? {})) keys.add(key);
  }
  return keys;
});
const editableFields = computed(() =>
  props.showMapFields
    ? (entityMapDefinition(props.definition.type)?.fields ?? []).filter(
        (field) => !controlledFieldKeys.value.has(field.key),
      )
    : [],
);
const hasFields = computed(
  () =>
    directionVariants.value.length > 0 ||
    shapeVariants.value.length > 0 ||
    surfaceRows.value.length > 0 ||
    editableFields.value.length > 0,
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
  const direction = editorEntityDirection(candidate);
  const fields: Record<string, JsonPrimitive> = {};
  for (const field of entityMapDefinition(candidate.type)?.fields ?? []) {
    const value = candidate[field.key];
    if (value !== undefined) fields[field.key] = value;
  }
  if (direction) fields.direction = direction;
  return {
    type: candidate.type,
    ...(Object.keys(fields).length > 0 ? { fields } : {}),
  };
}

function variantLabel(index: number): string {
  const variant = props.entityPolicy?.variants?.[index];
  return variant?.label ?? variant?.direction ?? `Variant ${index + 1}`;
}

function surfaceVariantSource(variant: SurfaceVariant): EditorPlacementPreset {
  return surfaceVariantPreset(variant.type);
}

function fieldValue(
  key: string,
  fallback: JsonPrimitive | undefined,
): string {
  if (props.targets.length === 0) return "";
  const values = props.targets.map(
    (entity) => entity[key] ?? fallback ?? null,
  );
  if (!values.every((value) => Object.is(value, values[0]))) return "";
  const value = values[0];
  return value === null ? "" : String(value);
}

function fieldMixed(
  key: string,
  fallback: JsonPrimitive | undefined,
): boolean {
  if (props.targets.length < 2) return false;
  const values = props.targets.map(
    (entity) => entity[key] ?? fallback ?? null,
  );
  return !values.every((value) => Object.is(value, values[0]));
}

function inputType(field: EntityMapFieldDefinition): "number" | "text" {
  return field.kind === "number" || field.kind === "integer" ? "number" : "text";
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
            fallback-icon="shape"
          />
          <small>{{ variantLabel(entry.index) }}</small>
        </button>
      </div>
    </section>

    <section v-if="surfaceRows.length" class="editor-fields-block">
      <strong>Visual variant</strong>
      <div
        v-for="(row, rowIndex) in surfaceRows"
        :key="`${surfaceTerrain?.id}:${rowIndex}`"
        class="editor-surface-variant-row"
      >
        <button
          v-for="variant in row"
          :key="variant.type"
          type="button"
          class="editor-surface-variant-btn"
          :class="{ active: activeSurfaceVariant === variant.type }"
          :title="variant.label"
          @click="emit('surfaceVariant', variant.type)"
        >
          <EditorEntityPreview
            :source="surfaceVariantSource(variant)"
            :cell-size="32"
            :images="images"
            :catalog="catalog"
            :editor="editor"
            fallback-text=""
          />
        </button>
      </div>
    </section>

    <section v-if="editableFields.length" class="editor-fields-block">
      <strong>地图字段</strong>
      <label
        v-for="field in editableFields"
        :key="field.key"
        class="editor-field"
        :title="field.description"
      >
        <span>{{ field.key }}</span>
        <select
          v-if="field.kind === 'enum'"
          :value="fieldValue(field.key, field.default)"
          @change="emit('field', field.key, ($event.target as HTMLSelectElement).value)"
        >
          <option
            v-if="fieldMixed(field.key, field.default)"
            value=""
            disabled
          >
            多种值
          </option>
          <option
            v-for="value in field.values"
            :key="String(value)"
            :value="String(value)"
          >
            {{ value }}
          </option>
        </select>
        <input
          v-else-if="field.kind === 'boolean'"
          type="checkbox"
          :checked="fieldValue(field.key, field.default) === 'true'"
          @change="emit('field', field.key, String(($event.target as HTMLInputElement).checked))"
        />
        <input
          v-else
          :type="inputType(field)"
          :step="field.kind === 'integer' ? 1 : undefined"
          :min="field.kind === 'number' || field.kind === 'integer' ? field.min : undefined"
          :max="field.kind === 'number' || field.kind === 'integer' ? field.max : undefined"
          :value="fieldValue(field.key, field.default)"
          :placeholder="fieldMixed(field.key, field.default) ? '多种值' : ''"
          @change="emit('field', field.key, ($event.target as HTMLInputElement).value)"
        />
      </label>
    </section>

    <p v-if="!hasFields" class="editor-muted">{{ emptyText }}</p>
  </div>
</template>

<style scoped>
.editor-entity-fields {
  display: grid;
  gap: 12px;
}
.editor-fields-block {
  display: grid;
  gap: 7px;
}
.editor-fields-block > strong {
  font-size: 0.7rem;
  color: var(--editor-muted);
}
.editor-variant-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(58px, 1fr));
  gap: 6px;
}
.editor-variant-btn {
  min-width: 0;
  display: grid;
  place-items: center;
  gap: 3px;
  padding: 5px;
  border: 1px solid #ffffff18;
  border-radius: 7px;
  background: #0b130e;
  color: #fff;
}
.editor-variant-btn.active {
  outline: 2px solid var(--editor-accent);
  outline-offset: 1px;
}
.editor-variant-btn small {
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--editor-muted);
  font-size: 0.62rem;
}
.editor-surface-variant-row {
  display: flex;
  flex-wrap: wrap;
  gap: 2px;
  padding-bottom: 3px;
  border-bottom: 1px solid rgb(255 255 255 / 10%);
}
.editor-surface-variant-btn {
  display: grid;
  place-items: center;
  width: 38px;
  height: 38px;
  padding: 2px;
  border: 1px solid transparent;
  border-radius: 4px;
  background: #0b130e;
}
.editor-surface-variant-btn.active {
  border-color: var(--editor-accent);
  outline: 1px solid var(--editor-accent);
}
</style>
