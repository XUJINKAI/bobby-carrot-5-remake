<script setup lang="ts">
import type { InspectorModel } from "@bobby/editor";
import type { Direction } from "@bobby/model";

const props = defineProps<{ model: InspectorModel }>();
const emit = defineEmits<{
  property: [entityIndex: number, key: string, value: string];
  state: [entityIndex: number, key: string, value: string];
  direction: [direction: Direction];
  variant: [index: number];
}>();
const directions: readonly Direction[] = ["up", "right", "down", "left"];
</script>

<template>
  <aside class="editor-inspector">
    <div class="editor-panel-title">Inspector</div>
    <section v-if="!model.selection" class="editor-inspector-section editor-muted">使用选择工具点选或框选地图内容。</section>
    <section v-else class="editor-inspector-section">
      <strong>选区</strong>
      <div class="editor-muted">{{ model.rect?.width }} × {{ model.rect?.height }} · {{ model.entityCount }} Entities</div>
    </section>
    <template v-if="model.entity">
      <section class="editor-inspector-section">
        <strong>{{ model.entity.definition.presentation.name }}</strong>
        <code>{{ model.entity.entity.type }}</code>
        <div class="editor-muted">anchor {{ model.entity.entity.x }},{{ model.entity.entity.y }} · Entity #{{ model.entity.ref.index }}</div>
        <div class="editor-traits">
          <code v-for="trait in model.entity.definition.traits" :key="trait">{{ trait }}</code>
        </div>
      </section>
      <section class="editor-inspector-section">
        <strong>方向</strong>
        <div class="editor-quick-grid">
          <button v-for="direction in directions" :key="direction" type="button" class="editor-mini-btn" :class="{ active: model.entity.entity.direction === direction }" @click="emit('direction', direction)">{{ direction }}</button>
        </div>
      </section>
      <section v-if="model.entity.editor?.variants?.length" class="editor-inspector-section">
        <strong>Variants</strong>
        <div class="editor-quick-grid">
          <button v-for="(_, index) in model.entity.editor.variants" :key="index" type="button" class="editor-mini-btn" @click="emit('variant', index)">Variant {{ index + 1 }}</button>
        </div>
      </section>
      <section v-if="model.entity.definition.properties?.length" class="editor-inspector-section">
        <strong>Properties</strong>
        <label v-for="property in model.entity.definition.properties" :key="property.key" class="editor-field">
          <span>{{ property.label ?? property.key }}</span>
          <select v-if="property.kind === 'enum'" :value="model.entity.entity.properties?.[property.key] ?? property.default ?? ''" @change="emit('property', model.entity!.ref.index, property.key, ($event.target as HTMLSelectElement).value)">
            <option value="">未设置</option>
            <option v-for="option in property.options ?? []" :key="String(option.value)" :value="String(option.value)">{{ option.label ?? option.value }}</option>
          </select>
          <input v-else type="text" :value="model.entity.entity.properties?.[property.key] ?? property.default ?? ''" @change="emit('property', model.entity!.ref.index, property.key, ($event.target as HTMLInputElement).value)">
        </label>
      </section>
      <section v-if="model.entity.definition.state?.length" class="editor-inspector-section">
        <strong>Initial State</strong>
        <label v-for="field in model.entity.definition.state" :key="field.key" class="editor-field">
          <span>{{ field.label ?? field.key }}</span>
          <select v-if="field.kind === 'enum' || field.kind === 'boolean'" :value="model.entity.entity.state?.[field.key] ?? field.default ?? ''" @change="emit('state', model.entity!.ref.index, field.key, ($event.target as HTMLSelectElement).value)">
            <option v-if="field.kind === 'boolean'" value="true">true</option><option v-if="field.kind === 'boolean'" value="false">false</option>
            <option v-for="option in field.options ?? []" :key="String(option.value)" :value="String(option.value)">{{ option.label ?? option.value }}</option>
          </select>
          <input v-else type="text" :value="model.entity.entity.state?.[field.key] ?? field.default ?? ''" @change="emit('state', model.entity!.ref.index, field.key, ($event.target as HTMLInputElement).value)">
        </label>
      </section>
    </template>
    <section v-else-if="model.selection && model.entityCount > 1" class="editor-inspector-section editor-muted">多选时显示汇总信息；属性编辑需要单选 Entity。</section>
  </aside>
</template>

<style scoped>.editor-quick-grid{display:flex;flex-wrap:wrap;gap:6px}.editor-mini-btn.active{background:var(--bc-active)}</style>
