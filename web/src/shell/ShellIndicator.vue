<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";
import AppIcon from "../shared/icons/AppIcon.vue";
import type { ShellIndicator } from "./shellBridge.js";

const props = defineProps<{ indicator: ShellIndicator }>();
const button = ref<HTMLButtonElement | null>(null);
const visible = ref(false);
let pointerType = "";

function onPointerDown(event: PointerEvent): void {
  pointerType = event.pointerType;
}

function onPointerEnter(event: PointerEvent): void {
  if (event.pointerType === "mouse") visible.value = true;
}

function onPointerLeave(event: PointerEvent): void {
  if (event.pointerType === "mouse") visible.value = false;
}

function onFocus(): void {
  if (button.value?.matches(":focus-visible")) visible.value = true;
}

function onClick(): void {
  if (pointerType === "mouse") return;
  visible.value = !visible.value;
}

function onKeyDown(): void {
  pointerType = "";
}

function onDocumentPointerDown(event: PointerEvent): void {
  if (!button.value?.contains(event.target as Node)) visible.value = false;
}

onMounted(() => {
  document.addEventListener("pointerdown", onDocumentPointerDown);
});
onBeforeUnmount(() => {
  document.removeEventListener("pointerdown", onDocumentPointerDown);
});
</script>

<template>
  <span class="shell-indicator">
    <button
      :id="indicator.id"
      ref="button"
      type="button"
      class="shell-indicator-button"
      :class="`tone-${indicator.tone ?? 'muted'}`"
      :aria-label="indicator.label"
      :aria-describedby="visible ? `${indicator.id}-tooltip` : undefined"
      @pointerdown="onPointerDown"
      @pointerenter="onPointerEnter"
      @pointerleave="onPointerLeave"
      @focus="onFocus"
      @blur="visible = false"
      @click="onClick"
      @keydown="onKeyDown"
      @keydown.esc="visible = false"
    >
      <AppIcon :name="indicator.icon" :size="21" />
    </button>
    <span
      v-if="visible"
      :id="`${indicator.id}-tooltip`"
      class="shell-indicator-tooltip"
      role="tooltip"
    >{{ indicator.label }}</span>
  </span>
</template>

<style scoped>
.shell-indicator {
  position: relative;
  display: inline-flex;
  align-items: center;
}

.shell-indicator-button {
  display: grid;
  width: 34px;
  height: 34px;
  place-items: center;
  padding: 0;
  border: 0;
  border-radius: var(--bc-control-radius);
  background: transparent;
  cursor: help;
}

.tone-success {
  color: #8cf2a0;
}

.tone-muted {
  color: #adb7c2;
}

.shell-indicator-button:focus-visible {
  outline: 2px solid currentColor;
  outline-offset: 2px;
}

.shell-indicator-tooltip {
  position: absolute;
  bottom: calc(100% + 8px);
  left: 0;
  z-index: 50;
  width: max-content;
  max-width: min(260px, calc(100vw - 24px));
  padding: 7px 10px;
  border: var(--bc-panel-border-width) solid var(--bc-panel-border);
  border-radius: var(--bc-control-radius);
  background: var(--bc-panel);
  color: var(--bc-text);
  box-shadow: var(--bc-panel-shadow);
  font-size: 0.72rem;
  line-height: 1.4;
  white-space: normal;
  pointer-events: none;
}
</style>
