<script setup lang="ts">
import type { InspectorModel } from "@bobby/editor";
import { ref, watch } from "vue";

const props = defineProps<{ model: InspectorModel }>();
const emit = defineEmits<{
  resize: [width: number, height: number];
  property: [x: number, y: number, key: string, value: string];
  trait: [x: number, y: number, trait: string, enabled: boolean];
  maxMoves: [value: number | null];
}>();
const width = ref(props.model.document.width);
const height = ref(props.model.document.height);
watch(
  () => props.model.document,
  (document) => {
    width.value = document.width;
    height.value = document.height;
  },
);
</script>

<template>
  <aside class="editor-inspector">
    <div class="editor-panel-title">Inspector</div>
    <section class="editor-inspector-section">
      <strong>{{ model.document.name }}</strong>
      <div class="editor-muted">
        {{ model.document.width }} × {{ model.document.height }} ·
        {{ model.document.objectCount }} Object anchors
      </div>
      <div class="editor-size-row">
        <label class="editor-field"><span>宽</span><input v-model.number="width" type="number" min="3" max="128"></label>
        <label class="editor-field"><span>高</span><input v-model.number="height" type="number" min="3" max="128"></label>
        <button class="editor-btn" type="button" @click="emit('resize', width, height)">调整地图</button>
      </div>
    </section>
    <section class="editor-inspector-section">
      <strong>地图规则</strong>
      <label class="editor-field">
        <span>最大步数</span>
        <input
          type="number"
          min="1"
          :value="model.document.maxMoves ?? ''"
          placeholder="不限"
          @change="emit('maxMoves', ($event.target as HTMLInputElement).value ? Number(($event.target as HTMLInputElement).value) : null)"
        >
      </label>
    </section>
    <section class="editor-inspector-section editor-definition">
      <header><strong>当前素材</strong><span>{{ model.selection.presentation.category }}</span></header>
      <div>{{ model.selection.presentation.name }}</div>
      <code>{{ model.selection.id }}</code>
      <div class="editor-traits">
        <code v-for="trait in model.selection.traits" :key="trait">{{ trait }}</code>
      </div>
    </section>
    <section v-if="model.owner && model.ownerDefinition" class="editor-inspector-section">
      <strong>Owner @ {{ model.owner.object.x }},{{ model.owner.object.y }}</strong>
      <div class="editor-muted">part {{ model.owner.partType }}</div>
      <div class="editor-definition">
        <header><strong>{{ model.ownerDefinition.presentation.name }}</strong><span>{{ model.ownerDefinition.presentation.category }}</span></header>
        <code>{{ model.ownerDefinition.id }}</code>
      </div>
      <label
        v-for="trait in model.ownerDefinition.authoring?.traits ?? []"
        :key="trait.trait"
        class="editor-field"
      >
        <span>{{ trait.label }}</span>
        <input
          type="checkbox"
          :checked="model.owner.object.traits?.includes(trait.trait) ?? false"
          @change="emit('trait', model.owner.object.x, model.owner.object.y, trait.trait, ($event.target as HTMLInputElement).checked)"
        >
      </label>
      <label
        v-for="property in model.ownerDefinition.authoring?.properties ?? []"
        :key="property.key"
        class="editor-field"
      >
        <span>{{ property.label }}</span>
        <select
          v-if="property.kind === 'enum'"
          :value="model.owner.object.properties?.[property.key] ?? ''"
          @change="emit('property', model.owner.object.x, model.owner.object.y, property.key, ($event.target as HTMLSelectElement).value)"
        >
          <option value="">未设置</option>
          <option v-for="option in property.options" :key="option.value" :value="option.value">{{ option.label ?? option.value }}</option>
        </select>
        <textarea
          v-else-if="property.multiline"
          :value="model.owner.object.properties?.[property.key] ?? ''"
          :maxlength="property.maxLength"
          :placeholder="property.placeholder"
          @change="emit('property', model.owner.object.x, model.owner.object.y, property.key, ($event.target as HTMLTextAreaElement).value)"
        />
        <input
          v-else
          type="text"
          :value="model.owner.object.properties?.[property.key] ?? ''"
          :maxlength="property.maxLength"
          :placeholder="property.placeholder"
          @change="emit('property', model.owner.object.x, model.owner.object.y, property.key, ($event.target as HTMLInputElement).value)"
        >
      </label>
    </section>
    <section v-else-if="model.hover" class="editor-inspector-section">
      <strong>格 {{ model.hover.x }}, {{ model.hover.y }}</strong>
      <div class="editor-muted">没有 Object owner</div>
    </section>
    <section class="editor-inspector-section">
      <strong>校验</strong>
      <div v-if="model.issues.length" class="editor-issues">
        <div v-for="issue in model.issues" :key="issue.message" class="editor-issue" :class="issue.level">{{ issue.message }}</div>
      </div>
      <div v-else class="editor-ok">没有结构警告</div>
    </section>
  </aside>
</template>
