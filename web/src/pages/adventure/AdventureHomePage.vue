<script setup lang="ts">
import type { ImageManager } from "@bobby/engine";
import type { AdventureHomeView } from "./types.js";
import OriginalFlightScene from "../../shared/original-scenes/OriginalFlightScene.vue";
import OriginalStarfield from "../../shared/original-scenes/OriginalStarfield.vue";
import AdventureViewport from "./AdventureViewport.vue";
import AppIcon from "../../shared/icons/AppIcon.vue";
import { webT } from "../../i18n/webI18n.js";

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
      <nav class="adventure-menu" :aria-label="webT('adventure.homeAria')">
        <span class="eyebrow adventure-menu-eyebrow">{{ webT("adventure.homeTitle") }}</span>
        <a
          class="adventure-menu-card"
          :href="'/adventure/play/' + view.resumeLevelId"
          @click.prevent="emit('navigate', '/adventure/play/' + view.resumeLevelId)"
        >
          <strong>{{ webT("adventure.continue") }}</strong>
          <span class="adventure-resume-level">{{ webT("adventure.continueLevel", {
            id: view.resumeLevelId.toUpperCase(),
          }) }}</span>
          <AppIcon name="next" />
        </a>
        <a
          class="adventure-menu-card"
          href="/adventure/chapters"
          @click.prevent="emit('navigate', '/adventure/chapters')"
        >
          <strong>{{ webT("adventure.chapters") }}</strong>
          <span>{{ webT("adventure.chaptersDescription") }}</span>
          <AppIcon name="next" />
        </a>
        <a
          class="adventure-menu-card"
          href="/adventure/beaver-shop"
          @click.prevent="emit('navigate', '/adventure/beaver-shop')"
        >
          <strong>{{ webT("adventure.shop") }}</strong>
          <span>{{ webT("adventure.shopDescription", { coins: view.bonusCoins }) }}</span>
          <AppIcon name="next" />
        </a>
        <a
          class="adventure-menu-card"
          href="/adventure/night-train"
          @click.prevent="emit('navigate', '/adventure/night-train')"
        >
          <strong>{{ webT("adventure.nightTrain") }}</strong>
          <span>{{ webT("adventure.nightTrainDescription") }}</span>
          <AppIcon name="next" />
        </a>
      </nav>
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

.adventure-menu-eyebrow {
  justify-self: start;
  margin: 0 2px -2px;
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

.adventure-menu-card strong {
  font-size: 0.92rem;
}

.adventure-menu-card span {
  color: var(--bc-text-muted);
  font-size: 0.68rem;
}

.adventure-menu-card :deep(.app-icon) {
  grid-column: 2;
  grid-row: 1 / span 2;
  align-self: center;
  color: var(--bc-highlight);
  font-size: 1.12rem;
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
