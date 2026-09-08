<script setup lang="ts">
import type { ShellAction } from "./shellBridge.js";
import AppIcon from "../shared/icons/AppIcon.vue";

const props = defineProps<{ action: ShellAction; overflow?: boolean }>();
const emit = defineEmits<{ action: [id: string]; navigate: [path: string] }>();
function activate(event?: MouseEvent): void {
  if (props.action.disabled) return;
  if (props.action.href) {
    if (props.action.external) return;
    event?.preventDefault();
    emit("navigate", props.action.href);
    return;
  }
  emit("action", props.action.id);
}
</script>

<template>
  <a
    v-if="action.href"
    :id="action.id"
    :href="action.href"
    class="shell-action"
    :class="[
      `collapse-${action.collapse ?? 'keep'}`,
      { 'in-overflow': overflow },
    ]"
    :title="action.title ?? action.label"
    :aria-label="action.title ?? action.label ?? action.id"
    :aria-pressed="action.pressed"
    :aria-disabled="action.disabled"
    :target="action.external ? '_blank' : undefined"
    :rel="action.external ? 'noreferrer' : undefined"
    @click="activate($event)"
  >
    <span v-if="action.icon" class="shell-action-icon">
      <AppIcon :name="action.icon" />
    </span>
    <AppIcon v-if="action.cornerIcon" class="shell-action-corner-icon" :name="action.cornerIcon" weight="regular" />
    <span v-if="action.label" class="shell-action-label">{{ action.label }}</span>
    <span v-if="action.badge" class="shell-action-badge" :class="action.badge.className" :title="action.badge.title">{{ action.badge.label }}</span>
    <span v-if="action.tip" class="shell-action-tip" role="status">{{ action.tip }}</span>
  </a>
  <button
    v-else
    :id="action.id"
    type="button"
    class="shell-action"
    :class="[
      `collapse-${action.collapse ?? 'keep'}`,
      { 'in-overflow': overflow },
    ]"
    :title="action.title ?? action.label"
    :aria-label="action.title ?? action.label ?? action.id"
    :aria-pressed="action.pressed"
    :disabled="action.disabled"
    @click="activate($event)"
  >
    <span v-if="action.icon" class="shell-action-icon">
      <AppIcon :name="action.icon" />
    </span>
    <AppIcon v-if="action.cornerIcon" class="shell-action-corner-icon" :name="action.cornerIcon" weight="regular" />
    <span v-if="action.label" class="shell-action-label">{{ action.label }}</span>
    <span v-if="action.badge" class="shell-action-badge" :class="action.badge.className" :title="action.badge.title">{{ action.badge.label }}</span>
    <span v-if="action.tip" class="shell-action-tip" role="status">{{ action.tip }}</span>
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
  border: var(--bc-control-border-width) solid var(--bc-panel-border);
  border-radius: var(--bc-control-radius);
  background: var(--bc-control);
  color: var(--bc-text);
  font-weight: 700;
  text-decoration: none;
  white-space: nowrap;
}

.shell-action:hover {
  background: var(--bc-control-hover);
}

.shell-action[aria-pressed="true"] {
  background: var(--bc-control-selected);
  color: var(--bc-control-selected-text);
}

.shell-action:disabled,
.shell-action[aria-disabled="true"] {
  cursor: default;
  opacity: 0.45;
  pointer-events: none;
}

.shell-action-icon {
  display: grid;
  min-width: 18px;
  place-items: center;
  font-size: 18px;
}

.shell-action-corner-icon {
  position: absolute;
  top: -5px;
  right: -5px;
  width: 15px;
  height: 15px;
  padding: 1px;
  border-radius: 3px;
  background: var(--bc-panel);
}

.shell-action-badge {
  position: absolute;
  top: -10px;
  right: -8px;
  z-index: 2;
  font-size: 0.6rem;
}

.shell-action-tip {
  position: absolute;
  top: calc(100% + 10px);
  right: 0;
  z-index: 50;
  width: max-content;
  max-width: min(230px, calc(100vw - 24px));
  padding: 7px 10px;
  border: var(--bc-panel-border-width) solid var(--bc-panel-border);
  border-radius: var(--bc-control-radius);
  background: var(--bc-panel);
  color: var(--bc-text);
  box-shadow: var(--bc-panel-shadow);
  font-size: 0.7rem;
  font-weight: 600;
  line-height: 1.35;
  pointer-events: none;
}

.shell-action-tip::before {
  position: absolute;
  right: 13px;
  bottom: 100%;
  border: 6px solid transparent;
  border-bottom-color: var(--bc-panel-border);
  content: "";
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
