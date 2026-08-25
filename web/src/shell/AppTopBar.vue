<script setup lang="ts">
import type { AppMode, ShellContextAction } from "./shellBridge.js";
import ModeSelector from "./ModeSelector.vue";

const props = defineProps<{
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

function actionsAt(placement: "leading" | "center" | "trailing") {
  return props.contextActions.filter(
    (item) => (item.placement ?? "center") === placement,
  );
}
</script>

<template>
  <header class="app-topbar">
    <a class="app-brand" href="/" @click.prevent="emit('navigate', '/')">
      <img :src="'/assets/art/hd/icon.png'" alt="">
      Bobby Carrot 5 Remake
    </a>
    <ModeSelector :mode="mode" @navigate="emit('navigate', $event)" />
    <div class="app-leading-actions">
      <template v-for="item in actionsAt('leading')" :key="item.id ?? item.label">
        <div class="app-action-with-badge">
          <button
            v-if="item.id"
            :id="item.id"
            type="button"
            :class="item.className"
            :title="item.title"
            @click="emit('contextAction', item.id)"
          >{{ item.label }}</button>
          <span
            v-if="item.badge"
            class="app-action-badge"
            :class="item.badge.className"
            :title="item.badge.title"
          >{{ item.badge.label }}</span>
        </div>
      </template>
    </div>
    <div class="app-context-actions">
      <template v-for="item in actionsAt('center')" :key="item.id ?? item.label">
        <button
          v-if="item.id"
          :id="item.id"
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
    <div class="app-trailing-actions">
      <template v-for="item in actionsAt('trailing')" :key="item.id ?? item.label">
        <button
          v-if="item.id"
          :id="item.id"
          type="button"
          :class="item.className"
          :title="item.title"
          @click="emit('contextAction', item.id)"
        >{{ item.label }}</button>
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
