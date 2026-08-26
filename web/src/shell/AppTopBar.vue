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

<style>
.app-topbar {
  min-height: 58px;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
  align-items: center;
  gap: 14px;
  padding: max(8px, env(safe-area-inset-top)) 14px 8px;
  border-bottom: 3px solid var(--bc-panel-border);
  background: var(--bc-panel);
  z-index: 20;
}

.shell-topbar-left,
.shell-topbar-center,
.shell-topbar-right {
  display: flex;
  align-items: center;
  gap: 7px;
  min-width: 0;
}

.shell-topbar-left {
  justify-content: flex-start;
}

.shell-topbar-center {
  justify-content: center;
}

.shell-topbar-right {
  justify-content: flex-end;
}

.shell-overflow {
  position: relative;
  display: none;
}

.shell-overflow summary {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  min-height: 34px;
  padding: 0;
  border: 2px solid var(--bc-panel-border);
  border-radius: 5px;
  background: #07518f;
  color: #fff;
  font-weight: 700;
  cursor: pointer;
  list-style: none;
}

.shell-overflow summary::-webkit-details-marker {
  display: none;
}

.shell-overflow summary:hover {
  background: var(--bc-active);
}

.shell-overflow-menu {
  position: absolute;
  top: calc(100% + 10px);
  right: 0;
  z-index: 40;
  display: grid;
  min-width: 190px;
  gap: 4px;
  padding: 6px;
  border: 3px solid var(--bc-panel-border);
  border-radius: 6px;
  background: var(--bc-panel);
  box-shadow: 6px 6px 0 #001b5b88;
}

.shell-overflow-menu .shell-action {
  width: 100%;
  justify-content: flex-start;
}

@media (max-width: 700px) {
  .app-topbar {
    grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
    min-height: 58px;
  }

  .shell-topbar-right > .collapse-overflow,
  .shell-topbar-center > .collapse-overflow,
  .shell-topbar-right > .collapse-hide,
  .shell-topbar-center > .collapse-hide {
    display: none;
  }

  .shell-overflow {
    display: block;
  }

  .shell-overflow-menu .shell-action-label {
    display: inline;
  }
}
</style>
