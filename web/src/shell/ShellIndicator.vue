<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import AppIcon from "../shared/icons/AppIcon.vue";
import type { ShellIndicator } from "./shellBridge.js";

const props = defineProps<{ indicator: ShellIndicator }>();
const root = ref<HTMLElement | null>(null);
const button = ref<HTMLButtonElement | null>(null);
const hovered = ref(false);
const pinned = ref(false);
const focused = ref(false);
const visible = computed(() => hovered.value || pinned.value || focused.value);

function onPointerEnter(event: PointerEvent): void {
  if (event.pointerType === "mouse") hovered.value = true;
}

function onPointerLeave(event: PointerEvent): void {
  if (event.pointerType === "mouse") hovered.value = false;
}

function onFocus(): void {
  if (button.value?.matches(":focus-visible")) focused.value = true;
}

function onClick(): void {
  pinned.value = !pinned.value;
}

function hidePersistent(): void {
  pinned.value = false;
  focused.value = false;
}

function onDocumentPointerDown(event: PointerEvent): void {
  if (!root.value?.contains(event.target as Node)) pinned.value = false;
}

onMounted(() => {
  document.addEventListener("pointerdown", onDocumentPointerDown);
});
onBeforeUnmount(() => {
  document.removeEventListener("pointerdown", onDocumentPointerDown);
});
</script>

<template>
  <span
    ref="root"
    class="shell-indicator"
    @pointerenter="onPointerEnter"
    @pointerleave="onPointerLeave"
  >
    <button
      :id="indicator.id"
      ref="button"
      type="button"
      class="shell-indicator-button"
      :class="`tone-${indicator.tone ?? 'muted'}`"
      :aria-label="indicator.label"
      :aria-describedby="visible ? `${indicator.id}-tooltip` : undefined"
      @focus="onFocus"
      @blur="focused = false"
      @click="onClick"
      @keydown.esc.prevent="hidePersistent"
    >
      <AppIcon :name="indicator.icon" :size="21" />
    </button>
    <span
      v-if="visible"
      :id="`${indicator.id}-tooltip`"
      class="shell-indicator-tooltip"
      :class="{ 'has-details': indicator.details?.length }"
      role="tooltip"
    >
      <span v-if="indicator.details?.length" class="shell-indicator-details">
        <span
          v-for="detail in indicator.details"
          :key="detail.id"
          class="shell-indicator-detail"
          :class="{ 'shell-indicator-detail-note': detail.kind === 'note' }"
          :data-indicator-detail="detail.id"
        >
          <strong>{{ detail.label }}</strong>
          <span class="shell-indicator-detail-value">{{ detail.text }}</span>
        </span>
      </span>
      <template v-else>{{ indicator.label }}</template>
    </span>
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

.shell-indicator-tooltip.has-details {
  width: min(400px, calc(100vw - 24px));
  max-height: min(420px, calc(100vh - 96px));
  overflow-y: auto;
  pointer-events: auto;
}

.shell-indicator-details {
  display: grid;
  gap: 8px;
}

.shell-indicator-detail {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 8px;
  align-items: baseline;
}

.shell-indicator-detail strong {
  color: var(--bc-text-muted);
  white-space: nowrap;
}

.shell-indicator-detail-value {
  min-width: 0;
  overflow-wrap: anywhere;
}

.shell-indicator-detail-note {
  display: block;
  padding-top: 8px;
  border-top: 1px solid var(--bc-panel-border);
}

.shell-indicator-detail-note strong,
.shell-indicator-detail-note .shell-indicator-detail-value {
  display: block;
}

.shell-indicator-detail-note .shell-indicator-detail-value {
  margin-top: 4px;
  white-space: pre-wrap;
}
</style>
