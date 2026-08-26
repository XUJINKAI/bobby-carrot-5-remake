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
    <header>
      <div>
        <span class="eyebrow">WELCOME DEMO</span>
        <h1>先走两步</h1>
      </div>
      <button type="button" class="ghost-btn" @click="emit('restart')">
        重新开始
      </button>
    </header>
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
                ? "Engine 已完成这张语义地图。"
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
    <p>{{ state.demoStatus }}</p>
  </article>
</template>

<style scoped>
.home-demo-panel {
  padding: 18px;
  border: 4px solid var(--bc-panel-border);
  border-radius: 7px;
  background: var(--bc-panel);
  box-shadow: 8px 8px 0 #001b5b88;
}

.home-demo-panel > header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 14px;
}

.home-demo-panel h1 {
  margin: 3px 0 0;
}

.home-demo-stage {
  position: relative;
  min-height: 360px;
  height: min(52vh, 540px);
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.09);
  border-radius: 5px;
  background: #071e53;
}

.home-demo-stage .game-stage,
.home-demo-stage .game-canvas-layer {
  position: absolute;
  inset: 0;
}

.home-demo-panel > p {
  min-height: 1.4em;
  margin: 12px 2px 0;
  color: var(--muted);
  font-size: 0.8rem;
}

@media (max-width: 760px) {
  .home-demo-stage {
    min-height: 320px;
    height: 56vh;
  }
}
</style>
