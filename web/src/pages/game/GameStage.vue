<script setup lang="ts">
import AppIcon from "../../shared/icons/AppIcon.vue";
import ReplayPanel from "./ReplayPanel.vue";

defineProps<{ showProductStats: boolean }>();
</script>

<template>
  <section class="game-stage" data-game-stage>
    <div class="game-canvas-layer">
      <canvas id="game" />
      <div
        v-if="showProductStats"
        class="product-game-statistics"
        data-product-stats
      />
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
    <ReplayPanel />
  </section>
</template>

<style scoped>
.product-game-statistics {
  position: absolute;
  left: 12px;
  top: 52px;
  z-index: 6;
  min-height: 32px;
  padding: 7px 10px;
  border: 1px solid #ffffff29;
  border-radius: 999px;
  background: #06100abd;
  color: #dce8de;
  font-size: 0.72rem;
  font-variant-numeric: tabular-nums;
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
