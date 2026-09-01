<script setup lang="ts">
import type { ImageManager } from "@bobby/engine";
import OriginalStarfield from "./OriginalStarfield.vue";
import SpriteFrame from "./SpriteFrame.vue";

withDefaults(
  defineProps<{
    images: ImageManager;
    compact?: boolean;
    showTitle?: boolean;
    showStars?: boolean;
    starBigProbability?: number;
    starSmallProbability?: number;
    starScrollSpeed?: number;
    starSparkleMinDelayMs?: number;
    starSparkleMaxDelayMs?: number;
    starSparkleBurstMin?: number;
    starSparkleBurstMax?: number;
    starSparkleFrameMs?: number;
    starAnimated?: boolean;
  }>(),
  {
    compact: false,
    showTitle: true,
    showStars: true,
  },
);
</script>

<template>
  <section class="original-flight-scene" :class="{ compact }">
    <OriginalStarfield
      v-if="showStars"
      class="flight-stars"
      :images="images"
      :big-star-probability="starBigProbability"
      :small-star-probability="starSmallProbability"
      :scroll-speed="starScrollSpeed"
      :sparkle-min-delay-ms="starSparkleMinDelayMs"
      :sparkle-max-delay-ms="starSparkleMaxDelayMs"
      :sparkle-burst-min="starSparkleBurstMin"
      :sparkle-burst-max="starSparkleBurstMax"
      :sparkle-frame-ms="starSparkleFrameMs"
      :animated="starAnimated"
    />
    <div v-if="showTitle" class="flight-title">
      <SpriteFrame :images="images" asset="original-title" />
    </div>
    <div class="flight-bobby" aria-hidden="true">
      <SpriteFrame :images="images" asset="bobby-kite" :columns="4" :frame="1" />
    </div>
  </section>
</template>

<style scoped>
.original-flight-scene {
  position: relative;
  min-height: 330px;
  overflow: hidden;
  isolation: isolate;
}

.flight-stars {
  position: absolute;
  inset: 0;
  z-index: 0;
}

.flight-title {
  position: absolute;
  z-index: 2;
  top: 2%;
  left: 50%;
  width: min(88%, 560px);
  max-height: 56%;
  transform: translateX(-50%);
}

.flight-bobby {
  position: absolute;
  z-index: 3;
  left: 50%;
  bottom: 3%;
  width: min(44%, 250px);
  transform: translateX(-50%);
  animation:
    flight-enter 900ms cubic-bezier(0.2, 0.85, 0.3, 1.1) both,
    flight-bob 3.4s ease-in-out 900ms infinite;
}

.original-flight-scene.compact {
  min-height: 280px;
}

.original-flight-scene.compact .flight-title {
  width: min(92%, 430px);
}

.original-flight-scene.compact .flight-bobby {
  width: min(46%, 210px);
  bottom: 2%;
}

@keyframes flight-enter {
  from {
    opacity: 0;
    transform: translate(-120%, 34%);
  }
  72% {
    opacity: 1;
    transform: translate(-45%, -3%);
  }
  to {
    opacity: 1;
    transform: translate(-50%, 0);
  }
}

@keyframes flight-bob {
  0%,
  100% {
    transform: translate(-50%, 0);
  }
  50% {
    transform: translate(-50%, -7px);
  }
}
</style>
