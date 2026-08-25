<script setup lang="ts">
import type { AppMode, ShellContextAction } from "./shellBridge.js";
import ModeSelector from "./ModeSelector.vue";

defineProps<{
  mode: AppMode;
  contextActions: ShellContextAction[];
  musicEnabled: boolean;
}>();
const emit = defineEmits<{
  navigate: [path: string];
  toggleMusic: [];
  settings: [];
  help: [];
  contextAction: [action: string];
}>();
</script>

<template>
  <header class="app-topbar">
    <a class="app-brand" href="/" @click.prevent="emit('navigate', '/')">
      <img :src="'/assets/art/hd/icon.png'" alt="">
      Bobby Carrot 5 Remake
    </a>
    <ModeSelector :mode="mode" @navigate="emit('navigate', $event)" />
    <div class="app-context-actions">
      <template v-for="item in contextActions" :key="item.id ?? item.label">
        <button
          v-if="item.id"
          type="button"
          :class="item.className"
          :title="item.title"
          @click="emit('contextAction', item.id)"
        >
          {{ item.label }}
        </button>
        <span v-else :class="item.className" :title="item.title">
          {{ item.label }}
        </span>
      </template>
    </div>
    <div class="app-actions">
      <button
        type="button"
        title="音乐"
        aria-label="音乐"
        @click="emit('toggleMusic')"
      >
        {{ musicEnabled ? "♫" : "♪̸" }}
      </button>
      <button
        type="button"
        title="设置"
        aria-label="设置"
        @click="emit('settings')"
      >⚙</button>
      <button
        type="button"
        title="帮助"
        aria-label="帮助"
        @click="emit('help')"
      >?</button>
    </div>
  </header>
</template>
