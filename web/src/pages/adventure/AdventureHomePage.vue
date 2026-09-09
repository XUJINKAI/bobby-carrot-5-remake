<script setup lang="ts">
import type { ImageManager } from "@bobby/engine";
import type { AdventureHomeView } from "./types.js";
import OriginalFlightScene from "../../shared/original-scenes/OriginalFlightScene.vue";
import OriginalStarfield from "../../shared/original-scenes/OriginalStarfield.vue";
import AdventureViewport from "./AdventureViewport.vue";
import AppIcon from "../../shared/icons/AppIcon.vue";

defineProps<{ view: AdventureHomeView; images: ImageManager }>();
const emit = defineEmits<{ navigate: [path: string] }>();
</script>

<template>
  <AdventureViewport>
    <div class="adventure-home">
      <OriginalStarfield class="adventure-home-starfield" :images="images" />
      <div class="adventure-home-hero" aria-hidden="true">
        <OriginalFlightScene :images="images" :show-stars="false" />
      </div>
      <nav class="adventure-menu" aria-label="冒险模式">
        <a
          class="adventure-menu-card primary"
          :href="'/adventure/play/' + view.resumeLevelId"
          @click.prevent="emit('navigate', '/adventure/play/' + view.resumeLevelId)"
        >
          <strong>继续冒险</strong>
          <span>{{ view.resumeLevelId.toUpperCase() }} · {{ view.resumeChapterTitle }}</span>
          <AppIcon name="next" />
        </a>
        <a
          class="adventure-menu-card"
          href="/adventure/chapters"
          @click.prevent="emit('navigate', '/adventure/chapters')"
        >
          <strong>章节选择</strong>
          <span>选择章节与已解锁关卡</span>
          <AppIcon name="next" />
        </a>
        <a
          class="adventure-menu-card"
          href="/adventure/beaver-shop"
          @click.prevent="emit('navigate', '/adventure/beaver-shop')"
        >
          <strong>海狸商店</strong>
          <span>购买冒险模式全局物品</span>
          <AppIcon name="next" />
        </a>
        <a
          class="adventure-menu-card"
          href="/adventure/night-train"
          @click.prevent="emit('navigate', '/adventure/night-train')"
        >
          <strong>夜间列车</strong>
          <span>Dream Machine · Cloud 9</span>
          <AppIcon name="next" />
        </a>
      </nav>
      <section class="adventure-wallet" aria-label="冒险钱包">
        <span><small>BONUS COIN</small><strong>{{ view.bonusCoins }}</strong></span>
        <span><small>GOLDEN CARROT</small><strong>{{ view.goldenCarrots }}</strong></span>
      </section>
    </div>
  </AdventureViewport>
</template>

<style scoped>
.adventure-home {
  position: relative;
  height: 100%;
  min-height: 0;
  overflow: hidden;
  background: #143678;
  color: #f5f8ff;
}

.adventure-home-starfield {
  position: absolute;
  inset: 0;
  z-index: 0;
}

.adventure-home-hero {
  position: absolute;
  inset: 0;
  z-index: 1;
  overflow: hidden;
  pointer-events: none;
}

.adventure-home-hero :deep(.original-flight-scene) {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  min-height: 0;
}

.adventure-home-hero :deep(.flight-title) {
  top: 5%;
  left: 50%;
  width: min(62%, 350px);
}

.adventure-home-hero :deep(.flight-bobby) {
  top: 24%;
  bottom: auto;
  left: 50%;
  width: min(31%, 145px);
}

.adventure-menu {
  position: relative;
  z-index: 2;
  width: min(378px, calc(100% - 28px));
  margin: 0 auto;
  padding-top: min(44vh, 320px);
  display: grid;
  gap: 9px;
}

.adventure-menu-card {
  min-height: 68px;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 4px 12px;
  align-content: center;
  padding: 11px 15px;
  border: var(--bc-control-border-width) solid var(--bc-panel-border);
  border-radius: var(--bc-control-radius);
  background: color-mix(in srgb, var(--bc-panel) 92%, transparent);
  color: var(--bc-text);
  text-decoration: none;
  box-shadow: var(--bc-panel-shadow);
  transition: transform 120ms ease, border-color 120ms ease, background 120ms ease;
}

.adventure-menu-card:hover {
  transform: translateY(-1px);
  border-color: var(--bc-text-muted);
  background: var(--bc-control-hover);
}

.adventure-menu-card.primary {
  border-color: var(--bc-highlight);
  background: var(--bc-active);
}

.adventure-menu-card strong {
  font-size: 0.92rem;
}

.adventure-menu-card span {
  color: var(--bc-text-muted);
  font-size: 0.68rem;
}

.adventure-menu-card.primary span {
  color: var(--bc-text);
}

.adventure-menu-card :deep(.app-icon) {
  grid-column: 2;
  grid-row: 1 / span 2;
  align-self: center;
  color: var(--bc-highlight);
  font-size: 1.12rem;
}

.adventure-wallet {
  position: absolute;
  z-index: 2;
  left: 50%;
  bottom: 13px;
  width: min(300px, calc(100% - 32px));
  transform: translateX(-50%);
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1px;
  border: 1px solid rgb(255 255 255 / 10%);
  border-radius: 9px;
  overflow: hidden;
  background: rgb(255 255 255 / 8%);
  text-align: center;
}

.adventure-wallet span {
  display: grid;
  gap: 2px;
  padding: 7px 4px;
  background: rgb(7 17 34 / 88%);
}

.adventure-wallet small {
  color: #8196b2;
  font-size: 0.5rem;
  letter-spacing: 0.05em;
}

.adventure-wallet strong {
  font-size: 0.9rem;
}

@media (max-height: 650px) {
  .adventure-menu {
    padding-top: 220px;
    gap: 6px;
  }
  .adventure-menu-card {
    min-height: 58px;
  }
}
</style>
