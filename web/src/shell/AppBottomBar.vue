<script setup lang="ts">
import type { ShellConfig } from "./shellBridge.js";
import ShellActionButton from "./ShellActionButton.vue";

defineProps<{ config: NonNullable<ShellConfig["bottomBar"]> }>();
const emit = defineEmits<{ navigate: [path: string]; action: [id: string] }>();

function navigateInfo(event: MouseEvent, href: string, external?: boolean): void {
  if (external) return;
  event.preventDefault();
  emit("navigate", href);
}
</script>

<template>
  <footer class="app-bottom-bar">
    <div class="shell-bottom-leading">
      <ShellActionButton v-for="item in config.leading ?? []" :key="item.id" :action="item" @action="emit('action', $event)" @navigate="emit('navigate', $event)" />
    </div>
    <div class="shell-bottom-info">
      <template v-for="(item, index) in config.info ?? []" :key="`${item.text}-${index}`">
        <span v-if="index" aria-hidden="true">·</span>
        <a
          v-if="item.href"
          :href="item.href"
          :target="item.external ? '_blank' : undefined"
          :rel="item.external ? 'noreferrer' : undefined"
          @click="navigateInfo($event, item.href, item.external)"
        >{{ item.text }}</a>
        <span v-else>{{ item.text }}</span>
      </template>
    </div>
    <div class="shell-bottom-trailing">
      <ShellActionButton v-for="item in config.trailing ?? []" :key="item.id" :action="item" @action="emit('action', $event)" @navigate="emit('navigate', $event)" />
    </div>
  </footer>
</template>

<style>
.app-bottom-bar {
  min-height: 44px;
  display: grid;
  grid-template-columns: minmax(0, auto) minmax(0, 1fr) minmax(0, auto);
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 6px 14px max(6px, env(safe-area-inset-bottom));
  border-top: var(--bc-shell-border-width) solid var(--bc-panel-border);
  background: var(--bc-panel);
  color: var(--bc-text-muted);
  font-size: 0.76rem;
  z-index: 20;
}

.shell-bottom-leading,
.shell-bottom-info,
.shell-bottom-trailing {
  display: flex;
  align-items: center;
  gap: 7px;
  min-width: 0;
}

.shell-bottom-info {
  justify-content: center;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.shell-bottom-info a {
  color: inherit;
}

.shell-bottom-trailing {
  justify-content: flex-end;
}

@media (max-width: 700px) {
  .app-bottom-bar {
    grid-template-columns: auto minmax(0, 1fr) auto;
  }

  .app-bottom-bar > span {
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  .shell-bottom-info {
    justify-content: flex-start;
  }
}
</style>
