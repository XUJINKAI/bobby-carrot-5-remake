<script setup lang="ts">
import type { ShellConfig } from "./shellBridge.js";
import ShellActionButton from "./ShellActionButton.vue";

defineProps<{ config: NonNullable<ShellConfig["bottomBar"]> }>();
const emit = defineEmits<{ navigate: [path: string]; action: [id: string] }>();
</script>

<template>
  <footer class="app-bottom-bar">
    <div class="shell-bottom-leading">
      <ShellActionButton v-for="item in config.leading ?? []" :key="item.id" :action="item" @action="emit('action', $event)" @navigate="emit('navigate', $event)" />
    </div>
    <div class="shell-bottom-info">
      <template v-for="(item, index) in config.info ?? []" :key="`${item.text}-${index}`">
        <span v-if="index" aria-hidden="true">·</span>
        <a v-if="item.href" :href="item.href" @click.prevent="emit('navigate', item.href)">{{ item.text }}</a>
        <span v-else>{{ item.text }}</span>
      </template>
    </div>
    <div class="shell-bottom-trailing">
      <ShellActionButton v-for="item in config.trailing ?? []" :key="item.id" :action="item" @action="emit('action', $event)" @navigate="emit('navigate', $event)" />
    </div>
  </footer>
</template>
