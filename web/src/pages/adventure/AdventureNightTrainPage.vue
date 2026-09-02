<script setup lang="ts">
import type { ImageManager } from "@bobby/engine";
import NightTrainScene from "../../shared/original-scenes/NightTrainScene.vue";
import AdventureViewport from "./AdventureViewport.vue";

defineProps<{
  images: ImageManager;
  map1: boolean;
  map2: boolean;
}>();
const emit = defineEmits<{ navigate: [path: string] }>();
</script>

<template>
  <AdventureViewport>
    <div class="night-train-page">
      <NightTrainScene :images="images" class="night-train-hero" />
      <nav class="night-train-menu" aria-label="夜间列车">
        <a
          href="/adventure/night-train/dream-machine"
          @click.prevent="emit('navigate', '/adventure/night-train/dream-machine')"
        >
          <strong>DREAM MACHINE</strong><span>→</span>
        </a>
        <a
          href="/adventure/night-train/cloud-9"
          @click.prevent="emit('navigate', '/adventure/night-train/cloud-9')"
        >
          <strong>CLOUD 9</strong><span>→</span>
        </a>
        <div v-if="map1" class="night-train-map-row">
          <strong>MAP I</strong><span>AUTHOR EXTRA</span>
        </div>
        <div v-if="map2" class="night-train-map-row">
          <strong>MAP II</strong><span>AUTHOR EXTRA</span>
        </div>
      </nav>
    </div>
  </AdventureViewport>
</template>

<style scoped>
.night-train-page {
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: #143678;
  color: #f4f7ff;
}

.night-train-hero {
  flex: 0 0 auto;
  margin-top: 9%;
}

.night-train-menu {
  width: min(430px, calc(100% - 28px));
  margin: 22px auto 0;
  display: grid;
  gap: 9px;
}

.night-train-menu a,
.night-train-map-row {
  min-height: 62px;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 12px;
  padding: 11px 16px;
  border: 1px solid rgb(255 255 255 / 16%);
  border-radius: 9px;
  background: rgb(8 42 85 / 90%);
  color: inherit;
  text-decoration: none;
  box-shadow: 0 7px 18px rgb(0 0 0 / 20%);
}

.night-train-menu a:hover {
  background: rgb(13 60 113 / 94%);
}

.night-train-map-row {
  background: rgb(55 45 20 / 88%);
  border-color: rgb(247 212 95 / 34%);
}

.night-train-map-row span {
  color: #d9bd68;
  font-size: 0.64rem;
}

.night-train-menu strong {
  font-size: 0.9rem;
  letter-spacing: 0.05em;
}
</style>
