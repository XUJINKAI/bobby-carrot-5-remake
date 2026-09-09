<script setup lang="ts">
import AppIcon from "../../shared/icons/AppIcon.vue";
import ReplayPanel from "./ReplayPanel.vue";

defineProps<{
  showProductStats: boolean;
  showReplayPanel: boolean;
}>();
</script>

<template>
  <section class="game-stage" data-game-stage>
    <div class="game-canvas-layer">
      <canvas id="game" />
      <div
        v-if="showProductStats"
        class="product-game-statistics"
        data-product-stats
      >
        <span data-product-time />
        <span data-product-steps />
      </div>
      <div class="result-overlay" data-result-overlay hidden>
        <div class="result-card" data-result-card>
          <button
            class="icon-btn result-card-close"
            type="button"
            data-result="close"
            aria-label="关闭结果"
            title="关闭"
          >
            <AppIcon name="close" :size="16" />
          </button>
          <div data-result-card-content />
        </div>
      </div>
    </div>
    <ReplayPanel v-if="showReplayPanel" />
  </section>
</template>

<style scoped>
.product-game-statistics {
  position: absolute;
  left: 12px;
  top: 12px;
  z-index: 6;
  display: grid;
  gap: 2px;
  color: #dce8de;
  font-size: 22px;
  line-height: 1;
  font-variant-numeric: tabular-nums;
  opacity: 0.68;
  pointer-events: none;
}

.game-canvas-layer {
  overflow: hidden;
}

@media (min-width: 621px) {
  .game-stage.replay-panel-open .game-canvas-layer {
    left: 330px;
  }
}
</style>
