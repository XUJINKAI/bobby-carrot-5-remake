<script setup lang="ts">
import type { EditorMap } from "@bobby/editor";
import type { ImageManager } from "@bobby/engine";
import { onBeforeUnmount, onMounted, ref } from "vue";
import { getWebTheme, type WebTheme } from "../../theme/webTheme.js";
import type { HomeViewState } from "./types.js";
import OriginalFlightScene from "../../shared/original-scenes/OriginalFlightScene.vue";
import OriginalStarfield from "../../shared/original-scenes/OriginalStarfield.vue";
import HomeDemo from "./HomeDemo.vue";
import HomeModeMenu from "./HomeModeMenu.vue";
import ProjectIntro from "./ProjectIntro.vue";

defineProps<{ state: HomeViewState; images: ImageManager }>();
const emit = defineEmits<{
  ready: [canvas: HTMLCanvasElement];
  navigate: [path: string];
  restart: [];
  importMap: [level: EditorMap];
}>();

const page = ref<HTMLElement | null>(null);
const theme = ref<WebTheme>(getWebTheme());
let scrollRegion: HTMLElement | null = null;
let fadeFrame = 0;

function updateTheme(event: Event): void {
  theme.value = (event as CustomEvent<WebTheme>).detail;
}

function updateStarfieldFade(): void {
  fadeFrame = 0;
  if (!page.value || !scrollRegion) return;
  const fadeDistance = Math.max(1, scrollRegion.clientHeight * 0.72);
  const progress = Math.min(1, Math.max(0, scrollRegion.scrollTop / fadeDistance));
  page.value.style.setProperty("--home-starfield-opacity", String(1 - progress));
}

function scheduleStarfieldFade(): void {
  if (fadeFrame !== 0) return;
  fadeFrame = requestAnimationFrame(updateStarfieldFade);
}

onMounted(() => {
  scrollRegion = page.value?.closest<HTMLElement>(".app-scroll-region") ?? null;
  scrollRegion?.addEventListener("scroll", scheduleStarfieldFade, { passive: true });
  window.addEventListener("resize", scheduleStarfieldFade, { passive: true });
  window.addEventListener("web-theme-change", updateTheme);
  updateStarfieldFade();
});

onBeforeUnmount(() => {
  scrollRegion?.removeEventListener("scroll", scheduleStarfieldFade);
  window.removeEventListener("resize", scheduleStarfieldFade);
  window.removeEventListener("web-theme-change", updateTheme);
  cancelAnimationFrame(fadeFrame);
  scrollRegion = null;
});
</script>

<template>
  <div ref="page" class="home-page">
    <OriginalStarfield
      v-if="theme !== 'fc'"
      class="home-page-starfield"
      :images="images"
    />
    <div class="home-page-content">
      <section class="home-hero" aria-label="开始游戏">
        <div class="home-hero-left">
          <div class="home-sky-brand" aria-hidden="true">
            <OriginalFlightScene :images="images" :show-stars="false" />
          </div>
          <div class="home-mode-layer">
            <HomeModeMenu
              @navigate="emit('navigate', $event)"
              @import-map="emit('importMap', $event)"
            >
              <p class="home-import-feedback" aria-live="polite">
                {{ state.importFeedback }}
              </p>
            </HomeModeMenu>
          </div>
        </div>
        <div class="home-demo-column">
          <HomeDemo
            :state="state"
            @ready="emit('ready', $event)"
            @restart="emit('restart')"
            @adventure="emit('navigate', '/adventure')"
          />
        </div>
      </section>
      <ProjectIntro :images="images" />
    </div>
  </div>
</template>

<style scoped>
.home-page {
  --home-starfield-opacity: 1;

  position: relative;
  min-height: 100%;
  overflow: clip;
  background: #143778;
  color: var(--bc-text);
}

.home-page-starfield {
  position: fixed;
  inset: 0;
  z-index: 0;
  width: 100vw;
  height: 100vh;
  opacity: var(--home-starfield-opacity);
  will-change: opacity;
}

.home-page-content {
  position: relative;
  z-index: 1;
}

.home-hero {
  --home-hero-left-top: 12px;
  --home-hero-right-top: 70px;
  --home-title-top: 40px;
  --home-title-width: min(60%, 300px);
  --home-bobby-top: 180px;
  --home-bobby-width: min(30%, 140px);
  --home-mode-top: 310px;

  width: min(900px, calc(100% - 48px));
  min-height: calc(100dvh - 58px);
  margin: 0 auto;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 378px;
  gap: 34px;
  align-items: stretch;
  padding: 0;
}

.home-hero-left {
  position: relative;
  min-width: 0;
  min-height: 100%;
}

.home-sky-brand {
  position: absolute;
  inset: var(--home-hero-left-top) 0 0;
  z-index: 0;
  overflow: hidden;
  pointer-events: none;
}

.home-sky-brand :deep(.original-flight-scene) {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  min-height: 0;
  overflow: hidden;
}

.home-sky-brand :deep(.flight-title) {
  top: var(--home-title-top);
  left: 50%;
  width: var(--home-title-width);
  max-height: none;
}

.home-sky-brand :deep(.flight-bobby) {
  top: var(--home-bobby-top);
  bottom: auto;
  left: 50%;
  width: var(--home-bobby-width);
}

.home-mode-layer {
  position: relative;
  z-index: 1;
  width: min(430px, 100%);
  margin-inline: auto;
  padding-top: calc(var(--home-hero-left-top) + var(--home-mode-top));
}

.home-demo-column {
  min-width: 0;
  display: grid;
  place-items: start center;
  padding-top: var(--home-hero-right-top);
}

.home-import-feedback {
  min-height: 1.3em;
  margin: 8px 2px 0;
  color: var(--bc-text-muted);
  font-size: 0.78rem;
}

@media (max-width: 900px) {
  .home-hero {
    --home-hero-left-top: 0px;
    --home-hero-right-top: 0px;
    --home-title-width: min(60%, 350px);
    --home-bobby-top: 220px;
    --home-bobby-width: min(30%, 140px);
    --home-mode-top: 320px;

    width: min(100% - 28px, 720px);
    min-height: auto;
    grid-template-columns: 1fr;
    gap: 44px;
  }

  .home-hero-left {
    min-height: 620px;
  }

  .home-mode-layer {
    width: min(430px, 100%);
  }
}

@media (max-width: 520px) {
  .home-hero {
    --home-title-width: min(58%, 280px);
    --home-bobby-top: 170px;
    --home-bobby-width: min(30%, 120px);
    --home-mode-top: 270px;

    width: min(100% - 18px, 720px);
  }

  .home-hero-left {
    min-height: 570px;
  }
}
</style>
