<script setup lang="ts">
import type {
  EditorMap,
  EditorRuleCapability,
  EditorRuleKind,
} from "@bobby/editor";
import { ref, watch } from "vue";

const props = defineProps<{
  level: Readonly<EditorMap>;
  rules: readonly EditorRuleCapability[];
}>();
const emit = defineEmits<{
  metadata: [value: { name: string; author?: string; note?: string }];
  maxMoves: [value: number | null];
  maxTime: [value: number | null];
  rule: [kind: EditorRuleKind, enabled: boolean];
}>();
const name = ref("");
const author = ref("");
const note = ref("");
const labels: Record<EditorRuleKind, string> = {
  carrots: "收集胡萝卜",
  eggs: "放置彩蛋",
  pushbox: "推箱子",
  exit: "到达终点",
};

watch(
  () => props.level,
  (level) => {
    name.value = level.meta.name;
    author.value = level.meta.author ?? "";
    note.value = level.note ?? "";
  },
  { immediate: true, deep: true },
);

function limit(type: "max-moves" | "max-time-seconds"): number | null {
  const item = props.level.rules?.limits?.find(
    (candidate) => candidate.type === type,
  );
  return item?.type === "max-moves"
    ? item.moves
    : item?.type === "max-time-seconds"
      ? item.seconds
      : null;
}

function numberValue(event: Event): number | null {
  const value = (event.target as HTMLInputElement).value;
  return value ? Number(value) : null;
}

function applyMetadata(): void {
  emit("metadata", {
    name: name.value,
    ...(author.value ? { author: author.value } : {}),
    ...(note.value ? { note: note.value } : {}),
  });
}
</script>

<template>
  <aside class="editor-inspector editor-level-info">
    <div class="editor-panel-title">Level</div>
    <section class="editor-inspector-section">
      <strong>地图信息</strong>
      <label class="editor-field">
        <span>名称</span>
        <input v-model="name" @change="applyMetadata">
      </label>
      <label class="editor-field">
        <span>作者</span>
        <input v-model="author" @change="applyMetadata">
      </label>
      <label class="editor-field">
        <span>注记</span>
        <textarea v-model="note" maxlength="500" rows="4" @change="applyMetadata"></textarea>
      </label>
    </section>
    <section class="editor-inspector-section editor-level-rules">
      <strong>关卡规则</strong>
      <div
        v-for="rule in rules.filter((item) => item.available)"
        :key="rule.kind"
        class="editor-rule-row"
      >
        <span>{{ labels[rule.kind] }}</span>
        <button
          type="button"
          class="editor-rule-toggle"
          :class="{ active: rule.enabled }"
          :aria-pressed="rule.enabled"
          @click="emit('rule', rule.kind, !rule.enabled)"
        >
          {{ rule.enabled ? "启用" : "停用" }}
        </button>
      </div>
      <label class="editor-rule-row editor-rule-limit">
        <span>最大步数</span>
        <input
          type="number"
          min="1"
          :value="limit('max-moves') ?? ''"
          placeholder="不限"
          @change="emit('maxMoves', numberValue($event))"
        >
      </label>
      <label class="editor-rule-row editor-rule-limit">
        <span>最大时间</span>
        <span class="editor-rule-number">
          <input
            type="number"
            min="1"
            :value="limit('max-time-seconds') ?? ''"
            placeholder="不限"
            @change="emit('maxTime', numberValue($event))"
          >
          <small>秒</small>
        </span>
      </label>
    </section>
  </aside>
</template>

<style scoped>
.editor-level-rules { display:grid; gap:10px; }
.editor-rule-row {
  display:grid;
  grid-template-columns:minmax(0, 1fr) auto;
  align-items:center;
  gap:12px;
  min-height:34px;
}
.editor-rule-toggle {
  min-width:58px;
  padding:5px 9px;
  border:1px solid var(--line);
  border-radius:5px;
  background:var(--panel2);
  color:inherit;
}
.editor-rule-toggle.active { background:var(--bc-active); }
.editor-rule-limit input {
  width:112px;
  min-width:0;
  border:1px solid #34463a;
  border-radius:6px;
  background:#0b130e;
  color:#edf5ef;
  padding:6px 8px;
}
.editor-rule-number { display:flex; align-items:center; gap:5px; }
.editor-rule-number small { color:var(--editor-muted); }
</style>
