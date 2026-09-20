<script setup lang="ts">
import ReplayPanel from "./ReplayPanel.vue";

withDefaults(defineProps<{
  showReplayPanel: boolean;
  canvasId?: string;
  showBuiltinReplay?: boolean;
}>(), {
  canvasId: "game",
  showBuiltinReplay: true,
});
</script>

<template>
  <section class="game-stage" data-game-stage>
    <div class="game-canvas-layer">
      <canvas :id="canvasId" />
      <slot name="result">
        <div class="result-overlay" data-result-overlay hidden>
          <div class="result-card" data-result-card>
            <div data-result-card-content />
          </div>
        </div>
      </slot>
    </div>
    <ReplayPanel
      v-if="showReplayPanel"
      :show-builtin="showBuiltinReplay"
    />
  </section>
</template>

<style scoped>
.game-canvas-layer {
  overflow: hidden;
}

@media (min-width: 621px) {
  .game-stage.replay-panel-open .game-canvas-layer {
    left: 330px;
  }
}
</style>
