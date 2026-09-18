<script setup lang="ts">
import type {
  EditorMap,
  EditorRuleCapability,
  EditorRuleKind,
  EditorRuleMode,
} from "@bobby/editor";
import type { MapMusic } from "@bobby/model";
import { computed } from "vue";
import { useEditorMetadataDraft } from "./useEditorMetadataDraft.js";

const props = defineProps<{
  level: Readonly<EditorMap>;
  rules: readonly EditorRuleCapability[];
  ruleMode: EditorRuleMode;
}>();
const emit = defineEmits<{
  metadata: [value: { name: string; author?: string; note?: string }];
  music: [value: MapMusic | undefined];
  maxMoves: [value: number | null];
  maxTime: [value: number | null];
  rule: [kind: EditorRuleKind, enabled: boolean];
  ruleMode: [mode: EditorRuleMode];
}>();
const { metadata } = useEditorMetadataDraft({
  source: () => props.level.meta,
  apply: (value) => emit("metadata", value),
});
const labels: Record<EditorRuleKind, string> = {
  carrots: "收集胡萝卜",
  eggs: "放置彩蛋",
  pushbox: "推箱子",
  exit: "到达终点",
  "golden-carrot": "取得金胡萝卜",
};
const musicOptions: readonly { value: MapMusic; label: string }[] = [
  { value: "none", label: "无音乐" },
  { value: "ingame0", label: "INGAME 1" },
  { value: "ingame1", label: "INGAME 2" },
  { value: "ingame2", label: "INGAME 3" },
  { value: "mow", label: "Lawnmower" },
  { value: "shop", label: "Beaver Shop" },
  { value: "bonus", label: "Bonus Level" },
  { value: "sandman", label: "Sandman" },
  { value: "train", label: "Night Train" },
  { value: "universe", label: "Universe" },
  { value: "fly", label: "Golden Carrot" },
  { value: "title", label: "Title" },
];
const selectedMusic = computed(() =>
  props.level.music === "random" ? "" : props.level.music ?? "",
);
const knownMusic = computed(() =>
  selectedMusic.value === "" ||
  musicOptions.some((option) => option.value === selectedMusic.value),
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

function applyMusic(event: Event): void {
  const value = (event.target as HTMLSelectElement).value;
  emit("music", value ? value : undefined);
}
</script>

<template>
  <aside class="editor-inspector editor-level-info">
    <div class="editor-panel-title">Level</div>
    <section class="editor-inspector-section">
      <strong>地图信息</strong>
      <label class="editor-field">
        <span>名称</span>
        <input v-model="metadata.name" data-editor-metadata="name">
      </label>
      <label class="editor-field">
        <span>作者</span>
        <input v-model="metadata.author" data-editor-metadata="author">
      </label>
      <label class="editor-field">
        <span>注记</span>
        <textarea
          v-model="metadata.note"
          data-editor-metadata="note"
          maxlength="500"
          rows="4"
        />
      </label>
      <label class="editor-field">
        <span>背景音乐</span>
        <select
          data-editor-music
          :value="selectedMusic"
          @change="applyMusic"
        >
          <option value="">默认（随机）</option>
          <option
            v-if="!knownMusic"
            :value="selectedMusic"
          >{{ selectedMusic }}</option>
          <option
            v-for="option in musicOptions"
            :key="option.value"
            :value="option.value"
          >{{ option.label }}</option>
        </select>
      </label>
    </section>
    <section class="editor-inspector-section editor-level-rules">
      <div class="editor-rule-title">
        <strong>关卡规则</strong>
        <span
          class="editor-rule-mode"
          :class="`mode-${ruleMode}`"
          role="group"
          aria-label="关卡规则组合方式"
        >
          <span class="editor-rule-mode-thumb" />
          <button
            type="button"
            data-rule-mode="any"
            :aria-pressed="ruleMode === 'any'"
            @click="emit('ruleMode', 'any')"
          >任一</button>
          <button
            type="button"
            data-rule-mode="all"
            :aria-pressed="ruleMode === 'all'"
            @click="emit('ruleMode', 'all')"
          >全部</button>
        </span>
      </div>
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
          step="1"
          :value="limit('max-moves') ?? ''"
          placeholder="不限"
          @change="emit('maxMoves', numberValue($event))"
        >
      </label>
      <label class="editor-rule-row editor-rule-limit">
        <span>最大时间（秒）</span>
        <input
          type="number"
          min="1"
          step="1"
          :value="limit('max-time-seconds') ?? ''"
          placeholder="不限"
          @change="emit('maxTime', numberValue($event))"
        >
      </label>
    </section>
  </aside>
</template>

<style scoped>
.editor-level-rules { display:grid; gap:10px; }
.editor-rule-title {
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:12px;
}
.editor-rule-mode {
  position:relative;
  display:grid;
  grid-template-columns:1fr 1fr;
  width:112px;
  padding:2px;
  border:1px solid var(--line);
  border-radius:999px;
  background:var(--panel2);
}
.editor-rule-mode-thumb {
  position:absolute;
  z-index:0;
  top:2px;
  bottom:2px;
  left:2px;
  width:calc(50% - 2px);
  border-radius:999px;
  background:var(--bc-active);
  transition:transform 140ms ease;
}
.editor-rule-mode.mode-all .editor-rule-mode-thumb {
  transform:translateX(100%);
}
.editor-rule-mode button {
  position:relative;
  z-index:1;
  min-width:0;
  padding:4px 8px;
  border:0;
  background:transparent;
  color:inherit;
  font:inherit;
}
.editor-rule-mode button[aria-pressed="false"] {
  color:var(--editor-muted);
}
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
@media (prefers-reduced-motion: reduce) {
  .editor-rule-mode-thumb { transition:none; }
}
</style>
