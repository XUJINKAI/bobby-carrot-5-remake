<script setup lang="ts">
import type { HomeViewState } from "./types.js";

defineProps<{ state: HomeViewState }>();
const emit = defineEmits<{
  ready: [canvas: HTMLCanvasElement];
  restart: [];
  adventure: [];
}>();

function reportCanvas(element: unknown): void {
  if (element instanceof HTMLCanvasElement) emit("ready", element);
}
</script>

<template>
  <article class="home-demo-panel">
    <div class="home-demo-toolbar">
      <span>PLAYABLE DEMO</span>
      <button type="button" @click="emit('restart')">重新开始</button>
    </div>
    <div class="home-demo-stage">
      <section class="game-stage">
        <div class="game-canvas-layer">
          <canvas :ref="reportCanvas" />
        </div>
        <div v-if="state.demoResult" class="result-overlay">
          <div class="result-card">
            <h2>{{ state.demoResult === "complete" ? "Demo 完成" : "再试一次" }}</h2>
            <p>
              {{ state.demoResult === "complete"
                ? "从这里继续进入完整冒险。"
                : state.deathReason }}
            </p>
            <div class="result-actions">
              <button
                v-if="state.demoResult === 'complete'"
                class="primary-btn"
                @click="emit('adventure')"
              >
                开始冒险
              </button>
              <button class="ghost-btn" @click="emit('restart')">
                重新开始
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
    <p class="home-demo-status">{{ state.demoStatus }}</p>
  </article>
</template>

<style scoped>
.home-demo-panel {
  position: relative;
  width: min(100%, 420px);
  aspect-ratio: 5 / 8;
  display: grid;
  grid-template-rows: auto minmax(0, 1fr) auto;
  overflow: hidden;
  border: 1px solid rgb(255 255 255 / 20%);
  border-radius: 18px;
  background: #0f141a;
  box-shadow: 0 24px 72px rgb(0 10 40 / 42%);
}

.home-demo-toolbar {
  min-height: 46px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 0 14px;
  border-bottom: 1px solid rgb(255 255 255 / 9%);
  color: #9eacb9;
  font-size: 0.66rem;
  font-weight: 800;
  letter-spacing: 0.12em;
}

.home-demo-toolbar button {
  padding: 5px 8px;
  border: 0;
  border-radius: 8px;
  background: #202a35;
  color: #e8edf1;
  font-size: 0.7rem;
  letter-spacing: 0;
}

.home-demo-stage {
  position: relative;
  min-height: 0;
  overflow: hidden;
  background: #071e53;
}

.home-demo-stage .game-stage,
.home-demo-stage .game-canvas-layer {
  position: absolute;
  inset: 0;
}

.home-demo-status {
  min-height: 42px;
  margin: 0;
  display: flex;
  align-items: center;
  padding: 8px 14px;
  border-top: 1px solid rgb(255 255 255 / 9%);
  color: #9eacb9;
  font-size: 0.72rem;
  line-height: 1.35;
}

.result-card {
  border-radius: 14px;
}

@media (max-width: 900px) {
  .home-demo-panel {
    width: min(88vw, 410px);
  }
}
</style>
