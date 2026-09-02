<script setup lang="ts">
withDefaults(
  defineProps<{
    mode?: "auto" | "framed" | "fluid";
    aspectRatio?: string;
  }>(),
  {
    mode: "auto",
    aspectRatio: "2 / 3",
  },
);
</script>

<template>
  <div class="adventure-viewport" :class="`adventure-viewport-${mode}`">
    <div class="adventure-viewport-stage" :style="{ aspectRatio }">
      <div class="adventure-viewport-inner">
        <slot />
      </div>
    </div>
  </div>
</template>

<style>
.adventure-viewport {
  width: 100%;
  height: 100%;
  min-height: 0;
  display: grid;
  place-items: center;
  overflow: hidden;
  background:
    radial-gradient(ellipse at 50% 45%, rgb(25 58 115 / 72%) 0%, rgb(8 24 52 / 84%) 46%, rgb(2 6 14 / 96%) 78%, #000 100%);
}

.adventure-viewport-stage {
  width: auto;
  max-width: 100%;
  height: 100%;
  max-height: 100%;
  overflow: hidden;
  background: #143678;
  box-shadow: 0 0 54px rgb(0 0 0 / 72%);
}

.adventure-viewport-inner {
  width: 100%;
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.adventure-viewport-fluid .adventure-viewport-stage {
  width: 100%;
  height: 100%;
  max-width: none;
  aspect-ratio: auto !important;
  box-shadow: none;
}

.chapter-stars {
  white-space: nowrap;
  letter-spacing: 0.08em;
  color: #f7d45f;
  text-shadow: 0 1px 2px #000;
}

@media (max-width: 720px) and (orientation: portrait) {
  .adventure-viewport-auto .adventure-viewport-stage {
    width: 100%;
    height: 100%;
    max-width: none;
    aspect-ratio: auto !important;
    box-shadow: none;
  }
}
</style>
