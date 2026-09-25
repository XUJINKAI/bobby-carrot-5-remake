<script setup lang="ts">
import type {
  EditorMap,
  EditorRuleCapability,
  EditorRuleKind,
  EditorRuleMode,
} from "@bobby/editor";
import type { MapMusic } from "@bobby/model";
import { computed } from "vue";
import { EDITOR_MUSIC_OPTIONS } from "./editorMusicOptions.js";
import type { EditorMetadataField } from "./useEditorPage.js";
import { webT } from "../../i18n/webI18n.js";

const props = defineProps<{
  level: Readonly<EditorMap>;
  nameValue: string;
  authorValue: string;
  noteValue: string;
  rules: readonly EditorRuleCapability[];
  ruleMode: EditorRuleMode;
  musicPreviewing: boolean;
}>();
const emit = defineEmits<{
  metadataField: [field: EditorMetadataField, value: string];
  music: [value: MapMusic | undefined];
  musicPreviewToggle: [];
  maxMoves: [value: number | null];
  maxTime: [value: number | null];
  rule: [kind: EditorRuleKind, enabled: boolean];
  ruleMode: [mode: EditorRuleMode];
}>();
const labelKeys = {
  carrots: "editor.ruleCarrots",
  eggs: "editor.ruleEggs",
  pushbox: "editor.rulePushbox",
  exit: "editor.ruleExit",
  "golden-carrot": "editor.ruleGoldenCarrot",
} as const satisfies Record<EditorRuleKind, Parameters<typeof webT>[0]>;
const selectedMusic = computed(() => props.level.music ?? "random");
const knownMusic = computed(() =>
  EDITOR_MUSIC_OPTIONS.some((option) => option.value === selectedMusic.value),
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
  const value = (event.target as HTMLSelectElement).value as MapMusic;
  emit("music", value === "random" ? undefined : value);
}

function textValue(event: Event): string {
  return (event.target as HTMLInputElement | HTMLTextAreaElement).value;
}
</script>

<template>
  <aside class="editor-inspector editor-level-info">
    <div class="editor-panel-title">Level</div>
    <section class="editor-inspector-section">
      <strong>{{ webT('editor.mapInfo') }}</strong>
      <label class="editor-field">
        <span>{{ webT('editor.mapName') }}</span>
        <input
          :value="nameValue"
          data-editor-metadata="name"
          @input="emit('metadataField', 'name', textValue($event))"
        >
      </label>
      <label class="editor-field">
        <span>{{ webT('editor.mapAuthor') }}</span>
        <input
          :value="authorValue"
          data-editor-metadata="author"
          @input="emit('metadataField', 'author', textValue($event))"
        >
      </label>
      <label class="editor-field">
        <span>{{ webT('editor.mapNote') }}</span>
        <textarea
          :value="noteValue"
          data-editor-metadata="note"
          maxlength="500"
          rows="4"
          @input="emit('metadataField', 'note', textValue($event))"
        />
      </label>
      <label class="editor-field">
        <span>{{ webT('editor.backgroundMusic') }}</span>
        <span class="editor-music-control">
          <select
            data-editor-music
            :value="selectedMusic"
            @change="applyMusic"
          >
            <option
              v-if="!knownMusic"
              :value="selectedMusic"
            >{{ selectedMusic }}</option>
            <option
              v-for="option in EDITOR_MUSIC_OPTIONS"
              :key="option.value"
              :value="option.value"
            >{{ option.label }}</option>
          </select>
          <button
            type="button"
            class="editor-music-preview"
            data-editor-music-preview
            :class="{ active: musicPreviewing }"
            :disabled="selectedMusic === 'none'"
            :aria-pressed="musicPreviewing"
            @click="emit('musicPreviewToggle')"
          >{{ webT(musicPreviewing ? 'editor.musicStop' : 'editor.musicPreview') }}</button>
        </span>
      </label>
    </section>
    <section class="editor-inspector-section editor-level-rules">
      <div class="editor-rule-title">
        <strong>{{ webT('editor.rules') }}</strong>
        <span
          class="editor-rule-mode"
          :class="`mode-${ruleMode}`"
          role="group"
          :aria-label="webT('editor.ruleMode')"
        >
          <span class="editor-rule-mode-thumb" />
          <button
            type="button"
            data-rule-mode="any"
            :aria-pressed="ruleMode === 'any'"
            @click="emit('ruleMode', 'any')"
          >{{ webT('editor.ruleAny') }}</button>
          <button
            type="button"
            data-rule-mode="all"
            :aria-pressed="ruleMode === 'all'"
            @click="emit('ruleMode', 'all')"
          >{{ webT('editor.ruleAll') }}</button>
        </span>
      </div>
      <div
        v-for="rule in rules.filter((item) => item.available)"
        :key="rule.kind"
        class="editor-rule-row"
      >
        <span>{{ webT(labelKeys[rule.kind]) }}</span>
        <button
          type="button"
          class="editor-rule-toggle"
          :class="{ active: rule.enabled }"
          :aria-pressed="rule.enabled"
          @click="emit('rule', rule.kind, !rule.enabled)"
        >
          {{ webT(rule.enabled ? 'editor.enabled' : 'editor.disabled') }}
        </button>
      </div>
      <label class="editor-rule-row editor-rule-limit">
        <span>{{ webT('editor.maxMoves') }}</span>
        <input
          type="number"
          min="1"
          step="1"
          :value="limit('max-moves') ?? ''"
          :placeholder="webT('editor.unlimited')"
          @change="emit('maxMoves', numberValue($event))"
        >
      </label>
      <label class="editor-rule-row editor-rule-limit">
        <span>{{ webT('editor.maxTime') }}</span>
        <input
          type="number"
          min="1"
          step="1"
          :value="limit('max-time-seconds') ?? ''"
          :placeholder="webT('editor.unlimited')"
          @change="emit('maxTime', numberValue($event))"
        >
      </label>
    </section>
  </aside>
</template>

<style scoped>
.editor-music-control {
  display:grid;
  grid-template-columns:minmax(0, 1fr) auto;
  gap:7px;
}
.editor-music-control select {
  min-width:0;
}
.editor-music-preview {
  min-width:58px;
  padding:6px 9px;
  border:1px solid var(--line);
  border-radius:6px;
  background:var(--panel2);
  color:inherit;
  font:inherit;
  cursor:pointer;
}
.editor-music-preview:hover:not(:disabled),
.editor-music-preview.active {
  background:var(--bc-active);
}
.editor-music-preview:disabled {
  opacity:0.45;
  cursor:default;
}
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
