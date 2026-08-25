<script setup lang="ts">
import type { HomeViewState } from "./types.js";
import HomeDemo from "./HomeDemo.vue";
import HomeModeMenu from "./HomeModeMenu.vue";
import ProjectIntro from "./ProjectIntro.vue";

defineProps<{ state: HomeViewState; lastLevelId: string }>();
const emit = defineEmits<{
  ready: [canvas: HTMLCanvasElement];
  navigate: [path: string];
  restart: [];
  random: [];
  importMap: [file: File];
}>();
</script>

<template>
  <div class="home-page">
    <section class="home-hero" aria-label="开始游戏">
      <HomeDemo
        :state="state"
        @ready="emit('ready', $event)"
        @restart="emit('restart')"
        @adventure="emit('navigate', '/adventure')"
      />
      <HomeModeMenu
        @navigate="emit('navigate', $event)"
        @import-map="emit('importMap', $event)"
      >
        <p class="home-import-feedback" aria-live="polite">
          {{ state.importFeedback }}
        </p>
      </HomeModeMenu>
    </section>
    <ProjectIntro :last-level-id="lastLevelId" @random="emit('random')" />
  </div>
</template>
