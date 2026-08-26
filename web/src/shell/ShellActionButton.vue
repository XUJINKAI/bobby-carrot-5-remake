<script setup lang="ts">
import type { ShellAction } from "./shellBridge.js";

const props = defineProps<{ action: ShellAction; overflow?: boolean }>();
const emit = defineEmits<{ action: [id: string]; navigate: [path: string] }>();
const icons: Record<string, string> = {
  back: "←", edit: "✎", help: "?", info: "ⓘ", inspector: "⌕", menu: "☰",
  music: "♫", palette: "▦", play: "▶", redo: "↷", restart: "↻",
  settings: "⚙", stop: "■", undo: "↶",
};

function activate(): void {
  if (props.action.disabled) return;
  if (props.action.href) emit("navigate", props.action.href);
  else emit("action", props.action.id);
}
</script>

<template>
  <button
    :id="action.id"
    type="button"
    class="shell-action"
    :class="[`collapse-${action.collapse ?? 'keep'}`, { 'in-overflow': overflow }]"
    :title="action.title ?? action.label"
    :aria-label="action.title ?? action.label ?? action.id"
    :aria-pressed="action.pressed"
    :disabled="action.disabled"
    @click="activate"
  >
    <span v-if="action.icon" class="shell-action-icon" aria-hidden="true">{{ icons[action.icon] }}</span>
    <span v-if="action.label" class="shell-action-label">{{ action.label }}</span>
    <span v-if="action.badge" class="shell-action-badge" :class="action.badge.className" :title="action.badge.title">{{ action.badge.label }}</span>
  </button>
</template>
