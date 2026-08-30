<script setup lang="ts">
import type { ShellAction } from "./shellBridge.js";

const props = defineProps<{ action: ShellAction; overflow?: boolean }>();
const emit = defineEmits<{ action: [id: string]; navigate: [path: string] }>();
const icons: Record<string, string> = {
  back: "←", edit: "✎", erase: "⌫", help: "?", info: "ⓘ", inspector: "⌕", menu: "☰",
  music: "♫", palette: "▦", place: "＋", play: "▶", redo: "↷", restart: "↻",
  select: "↖", settings: "⚙", share: "↗", stop: "■", undo: "↶",
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

<style scoped>
.shell-action {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-height: 34px;
  padding: 6px 10px;
  border: 2px solid var(--bc-panel-border);
  border-radius: 5px;
  background: #07518f;
  color: #fff;
  font-weight: 700;
  white-space: nowrap;
}

.shell-action:hover,
.shell-action[aria-pressed="true"] {
  background: var(--bc-active);
}

.shell-action:disabled {
  cursor: default;
  opacity: 0.45;
}

.shell-action-icon {
  min-width: 1em;
  font-size: 1rem;
  line-height: 1;
  text-align: center;
}

.shell-action-badge {
  position: absolute;
  top: -10px;
  right: -8px;
  z-index: 2;
  font-size: 0.6rem;
}

@media (max-width: 700px) {
  .shell-action-label {
    display: none;
  }

  .shell-action {
    min-width: 32px;
    min-height: 32px;
    padding: 5px 7px;
  }

  :global(.shell-overflow-menu) .shell-action-label,
  :global(.app-bottom-bar) .shell-action-label {
    display: inline;
  }
}
</style>
