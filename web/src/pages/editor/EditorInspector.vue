<script setup lang="ts">
import type { InspectorModel } from "@bobby/editor";
import { ref, watch } from "vue";

const props = defineProps<{ model: InspectorModel }>();
const emit = defineEmits<{
  resize: [width: number, height: number];
  property: [entityIndex: number, key: string, value: string];
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
        {{ model.document.entityCount }} Entities
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
      <header>
        <strong>当前素材</strong>
        <span>{{ model.selection.presentation.category ?? '其他' }}</span>
      </header>
      <div>{{ model.selection.presentation.name }}</div>
      <code>{{ model.selection.type }}</code>
      <div class="editor-traits">
        <code v-for="trait in model.selection.traits" :key="trait">{{ trait }}</code>
      </div>
    </section>
    <section v-if="model.cell" class="editor-inspector-section">
      <strong>格 {{ model.cell.x }}, {{ model.cell.y }}</strong>
      <div v-if="model.cell.presences.length" class="editor-traits">
        <code
          v-for="presence in model.cell.presences"
          :key="`${presence.ref.index}:${presence.presence.role ?? ''}`"
        >
          [{{ presence.presence.stackOrder }}] · {{ presence.entity.type }}{{ presence.presence.role ? `:${presence.presence.role}` : '' }}
        </code>
      </div>
      <div v-else class="editor-muted">Implicit Void</div>
    </section>
    <section v-if="model.cell?.top" class="editor-inspector-section">
      <strong>
        Entity #{{ model.cell.top.ref.index }} · {{ model.cell.top.definition.presentation.name }}
      </strong>
      <div class="editor-muted">
        anchor {{ model.cell.top.entity.x }},{{ model.cell.top.entity.y }} ·
        stack {{ model.cell.top.presence.stackOrder }}{{ model.cell.top.presence.role ? ` · ${model.cell.top.presence.role}` : '' }}
      </div>
      <code>{{ model.cell.top.entity.type }}</code>
      <div class="editor-traits">
        <code v-for="trait in model.cell.top.presence.traits" :key="trait">{{ trait }}</code>
      </div>
      <label
        v-for="property in model.cell.top.definition.properties ?? []"
        :key="property.key"
        class="editor-field"
      >
        <span>{{ property.label ?? property.key }}</span>
        <select
          v-if="property.kind === 'enum'"
          :value="model.cell.top.entity.properties?.[property.key] ?? property.default ?? ''"
          @change="emit('property', model.cell!.top!.ref.index, property.key, ($event.target as HTMLSelectElement).value)"
        >
          <option value="">未设置</option>
          <option
            v-for="option in property.options ?? []"
            :key="String(option.value)"
            :value="String(option.value)"
          >{{ option.label ?? option.value }}</option>
        </select>
        <input
          v-else
          type="text"
          :value="model.cell.top.entity.properties?.[property.key] ?? property.default ?? ''"
          @change="emit('property', model.cell!.top!.ref.index, property.key, ($event.target as HTMLInputElement).value)"
        >
      </label>
    </section>
    <section class="editor-inspector-section">
      <strong>校验</strong>
      <div v-if="model.issues.length" class="editor-issues">
        <div
          v-for="issue in model.issues"
          :key="issue.message"
          class="editor-issue"
          :class="issue.level"
        >{{ issue.message }}</div>
      </div>
      <div v-else class="editor-ok">没有结构警告</div>
    </section>
  </aside>
</template>
