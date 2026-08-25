<script setup lang="ts">
defineProps<{ musicEnabled: boolean }>();
const emit = defineEmits<{
  toggleMusic: [];
  settings: [];
  help: [];
}>();
</script>

<template>
  <header class="app-topbar home-topbar">
    <a class="app-brand" href="/" aria-current="page">
      <img :src="'/assets/art/hd/icon.png'" alt="">
      Bobby Carrot 5 Remake
    </a>
    <div class="app-context-actions" />
    <div class="app-actions">
      <button
        type="button"
        title="音乐"
        aria-label="音乐"
        @click="emit('toggleMusic')"
      >
        {{ musicEnabled ? "♫" : "♪̸" }}
      </button>
      <button type="button" title="设置" aria-label="设置" @click="emit('settings')">
        ⚙
      </button>
      <button type="button" title="帮助" aria-label="帮助" @click="emit('help')">
        ?
      </button>
    </div>
  </header>
</template>
