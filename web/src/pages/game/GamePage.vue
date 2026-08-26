<script setup lang="ts">
import type { GamePageMode } from "./mountGamePage.js";
import GameStage from "./GameStage.vue";

defineProps<{ mode: GamePageMode }>();
</script>

<template>
  <div
    v-if="mode === 'adventure'"
    class="adventure-desktop adventure-game-desktop"
  >
    <div class="adventure-phone adventure-game-phone">
      <div class="adventure-phone-inner">
        <div class="game-page original-adventure-game">
          <GameStage :show-product-stats="false" />
        </div>
      </div>
    </div>
  </div>
  <div v-else class="game-page">
    <GameStage :show-product-stats="true" />
  </div>
</template>

<style>
.game-page,
.game-page .game-stage {
  width: 100%;
  height: 100%;
  min-height: 0;
}

.game-page {
  display: block;
}

.original-adventure-game {
  height: 100%;
  min-height: 0;
}

.original-adventure-game .game-stage {
  min-height: 0;
  flex: 1;
  overflow: hidden;
}

.original-adventure-game #game {
  width: 100%;
  height: 100%;
  display: block;
}

.adventure-game-desktop .debug-panel {
  display: none !important;
}

.adventure-game-phone {
  width: min(100vw, calc(100dvh * 0.625));
  height: 100dvh;
}

@media (max-width: 680px) {
  .adventure-game-phone {
    width: 100vw;
    height: 100dvh;
  }
}
</style>
