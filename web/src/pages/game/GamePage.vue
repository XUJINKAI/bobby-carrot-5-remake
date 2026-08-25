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
