<script setup lang="ts">
import ReplayPanel from "./ReplayPanel.vue";

defineProps<{
  showReplayPanel: boolean;
}>();
</script>

<template>
  <section class="game-stage" data-game-stage>
    <div class="game-canvas-layer">
      <canvas id="game" />
      <div class="result-overlay" data-result-overlay hidden>
        <div class="result-card" data-result-card>
          <div data-result-card-content />
        </div>
      </div>
    </div>
    <ReplayPanel v-if="showReplayPanel" />
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
