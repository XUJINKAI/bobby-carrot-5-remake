<script setup lang="ts">
import { computed, ref } from "vue";
import type { ShellConfig } from "./shellBridge.js";
import ShellActionButton from "./ShellActionButton.vue";
import ShellIdentity from "./ShellIdentity.vue";

const props = defineProps<{ config: NonNullable<ShellConfig["topBar"]> }>();
const emit = defineEmits<{ navigate: [path: string]; action: [id: string] }>();
const overflowOpen = ref(false);
const overflowActions = computed(() =>
  [...(props.config.commands ?? []), ...(props.config.actions ?? [])].filter(
    (action) => action.collapse === "overflow",
  ),
);

function action(id: string): void {
  overflowOpen.value = false;
  emit("action", id);
}
</script>

<template>
  <header class="app-topbar">
    <div class="shell-topbar-left">
      <ShellIdentity v-if="config.identity" :identity="config.identity" @navigate="emit('navigate', $event)" />
      <ShellActionButton v-if="config.back" :action="config.back" @action="emit('action', $event)" @navigate="emit('navigate', $event)" />
    </div>
    <div class="shell-topbar-center">
      <ShellActionButton v-for="item in config.commands ?? []" :key="item.id" :action="item" @action="emit('action', $event)" @navigate="emit('navigate', $event)" />
    </div>
    <div class="shell-topbar-right">
      <ShellActionButton v-for="item in config.actions ?? []" :key="item.id" :action="item" @action="emit('action', $event)" @navigate="emit('navigate', $event)" />
      <details v-if="overflowActions.length" class="shell-overflow" :open="overflowOpen">
        <summary title="更多操作" aria-label="更多操作" @click.prevent="overflowOpen = !overflowOpen">☰</summary>
        <div class="shell-overflow-menu">
          <ShellActionButton v-for="item in overflowActions" :key="item.id" :action="item" overflow @action="action" @navigate="emit('navigate', $event)" />
        </div>
      </details>
    </div>
  </header>
</template>
