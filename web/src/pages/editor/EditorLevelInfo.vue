<script setup lang="ts">
import type { EditorMap, LevelValidationIssue } from "@bobby/editor";
import type { WinCondition } from "@bobby/model";
import { ref, watch } from "vue";

const props = defineProps<{
  level: Readonly<EditorMap>;
  issues: readonly LevelValidationIssue[];
}>();
const emit = defineEmits<{
  resize: [width: number, height: number];
  metadata: [value: { name: string; author?: string; description?: string }];
  maxMoves: [value: number | null];
  maxTime: [value: number | null];
  win: [value: WinCondition];
}>();
const name = ref("");
const author = ref("");
const description = ref("");
const width = ref(16);
const height = ref(16);
const winText = ref("");
const winError = ref("");
watch(
  () => props.level,
  (level) => {
    name.value = level.name;
    author.value = level.author ?? "";
    description.value = level.description ?? "";
    width.value = level.width;
    height.value = level.height;
    winText.value = JSON.stringify(
      level.rules?.win ?? { type: "reach", target: "exit" },
      null,
      2,
    );
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
function applyMetadata(): void {
  emit("metadata", {
    name: name.value,
    ...(author.value ? { author: author.value } : {}),
    ...(description.value ? { description: description.value } : {}),
  });
}
function applyWin(): void {
  try {
    const value = JSON.parse(winText.value) as WinCondition;
    if (!value || typeof value.type !== "string") throw new Error("invalid");
    winError.value = "";
    emit("win", value);
  } catch {
    winError.value = "获胜规则不是有效 JSON";
  }
}
</script>

<template>
  <aside class="editor-inspector editor-level-info">
    <div class="editor-panel-title">Level</div>
    <section class="editor-inspector-section">
      <strong>地图信息</strong>
      <label class="editor-field"><span>名称</span><input v-model="name" @change="applyMetadata"></label>
      <label class="editor-field"><span>作者</span><input v-model="author" @change="applyMetadata"></label>
      <label class="editor-field"><span>描述</span><textarea v-model="description" rows="3" @change="applyMetadata" /></label>
    </section>
    <section class="editor-inspector-section">
      <strong>尺寸</strong>
      <div class="editor-size-row">
        <label class="editor-field"><span>宽</span><input v-model.number="width" type="number" min="3" max="128"></label>
        <label class="editor-field"><span>高</span><input v-model.number="height" type="number" min="3" max="128"></label>
        <button class="editor-btn" type="button" @click="emit('resize', width, height)">调整</button>
      </div>
    </section>
    <section class="editor-inspector-section">
      <strong>限制</strong>
      <label class="editor-field"><span>最大步数</span><input type="number" min="1" :value="limit('max-moves') ?? ''" placeholder="不限" @change="emit('maxMoves', ($event.target as HTMLInputElement).value ? Number(($event.target as HTMLInputElement).value) : null)"></label>
      <label class="editor-field"><span>最大时间（秒）</span><input type="number" min="1" :value="limit('max-time-seconds') ?? ''" placeholder="不限" @change="emit('maxTime', ($event.target as HTMLInputElement).value ? Number(($event.target as HTMLInputElement).value) : null)"></label>
    </section>
    <section class="editor-inspector-section">
      <strong>获胜规则</strong>
      <textarea v-model="winText" class="editor-rule-json" rows="10" spellcheck="false" />
      <div v-if="winError" class="editor-issue error">{{ winError }}</div>
      <button class="editor-btn" type="button" @click="applyWin">应用规则</button>
    </section>
    <section class="editor-inspector-section">
      <strong>校验</strong>
      <div v-if="issues.length" class="editor-issues"><div v-for="issue in issues" :key="issue.message" class="editor-issue" :class="issue.level">{{ issue.message }}</div></div>
      <div v-else class="editor-ok">没有结构警告</div>
    </section>
  </aside>
</template>

<style scoped>.editor-rule-json{width:100%;resize:vertical;font-family:ui-monospace,SFMono-Regular,Consolas,monospace;font-size:12px}</style>
