<script setup lang="ts">
import type { EditorMap } from "@bobby/editor";
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
  importMap: [level: EditorMap];
}>();
</script>

<template>
  <div class="home-page">
    <div class="home-sky-brand" aria-hidden="true">
      <span class="home-star star-one">★</span>
      <h1>BOBBY CARROT <strong>5</strong><span>REMAKE</span></h1>
      <span class="home-moon">☾</span>
      <span class="home-star star-two">★</span>
    </div>
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

<style scoped>
.home-page {
  width: min(1180px, calc(100% - 32px));
  margin: 0 auto;
}

.home-sky-brand {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 150px;
  overflow: hidden;
  padding-top: 20px;
}

.home-sky-brand::before,
.home-sky-brand::after {
  content: "";
  position: absolute;
  width: 180px;
  height: 45px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 42px 2px 0 #fff, 84px -5px 0 #dff8ff;
  opacity: 0.9;
}

.home-sky-brand::before {
  left: -100px;
  bottom: 12px;
}

.home-sky-brand::after {
  right: -80px;
  top: 34px;
}

.home-sky-brand h1 {
  position: relative;
  z-index: 1;
  margin: 0;
  color: #ff7a00;
  font-size: clamp(2rem, 5vw, 4.6rem);
  font-style: italic;
  letter-spacing: -0.07em;
  line-height: 0.78;
  text-align: center;
  text-shadow:
    -3px -3px 0 #fff,
    3px -3px 0 #fff,
    -3px 3px 0 #fff,
    3px 3px 0 #fff,
    7px 7px 0 #002882;
}

.home-sky-brand h1 strong {
  color: var(--bc-highlight);
  font-size: 1.45em;
}

.home-sky-brand h1 span {
  display: block;
  margin-top: 0.28em;
  color: #fff;
  font-size: 0.34em;
  letter-spacing: 0.28em;
  text-shadow: 3px 3px 0 #002882;
}

.home-star,
.home-moon {
  position: absolute;
  z-index: 1;
  color: var(--bc-highlight);
  text-shadow: 3px 3px 0 #002882;
}

.home-star {
  font-size: 1.7rem;
}

.star-one {
  left: 12%;
  top: 28px;
}

.star-two {
  right: 16%;
  bottom: 20px;
}

.home-moon {
  right: 8%;
  top: 8px;
  font-size: 3.6rem;
}

.home-hero {
  min-height: calc(100dvh - 252px);
  display: grid;
  grid-template-columns: minmax(0, 1.35fr) minmax(300px, 0.65fr);
  gap: clamp(24px, 4vw, 54px);
  align-items: center;
  padding: 42px 0;
}

.home-import-feedback {
  min-height: 1.4em;
  margin: 12px 2px 0;
  color: var(--muted);
  font-size: 0.8rem;
}

@media (max-width: 760px) {
  .home-page {
    width: min(100% - 20px, 1180px);
  }

  .home-hero {
    grid-template-columns: 1fr;
    align-content: start;
    padding: 24px 0 42px;
  }
}
</style>
