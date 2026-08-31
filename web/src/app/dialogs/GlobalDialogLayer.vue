<script setup lang="ts">
import type { HelpDescriptor } from "../../shell/shellBridge.js";
import HelpDialog from "./HelpDialog.vue";

defineProps<{ help: HelpDescriptor }>();
const emit = defineEmits<{ close: [] }>();
</script>

<template>
  <div class="global-dialog-layer" data-dialog-layer @click.self="emit('close')">
    <HelpDialog :descriptor="help" @close="emit('close')" />
  </div>
</template>

<style>
.global-dialog-layer {
  position: fixed;
  inset: 0;
  z-index: 50;
  display: grid;
  place-items: center;
  padding: 20px;
  background: rgb(2 5 3 / 64%);
}

.global-dialog {
  width: min(430px, 100%);
  max-height: min(76vh, 620px);
  overflow: auto;
  border: var(--bc-panel-border-width) solid var(--bc-panel-border);
  border-radius: var(--bc-panel-radius);
  background: var(--bc-panel);
  color: var(--bc-text);
  box-shadow: var(--bc-panel-shadow);
}

.global-dialog > header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 16px;
  border-bottom: 1px solid var(--bc-panel-border);
}

.global-dialog > header button {
  border: 0;
  background: transparent;
  color: inherit;
  font-size: 1.4rem;
}

.global-dialog > div {
  display: grid;
  gap: 14px;
  padding: 16px;
}

.global-dialog h3,
.global-dialog p {
  margin: 0;
}
</style>
