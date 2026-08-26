<template>
  <div class="adventure-desktop">
    <div class="adventure-phone">
      <div class="adventure-phone-inner">
        <slot />
      </div>
    </div>
  </div>
</template>

<style>
.adventure-desktop {
  min-height: 100dvh;
  display: grid;
  place-items: center;
  overflow: hidden;
  background: radial-gradient(
    circle at 50% 25%,
    #183767 0,
    #0a1834 50%,
    #050b18 100%
  );
}

.adventure-phone {
  width: min(100vw, calc(100dvh * 0.625));
  height: min(100dvh, calc(100vw / 0.625));
  aspect-ratio: 5 / 8;
  overflow: hidden;
  border-left: 1px solid rgba(255, 255, 255, 0.08);
  border-right: 1px solid rgba(255, 255, 255, 0.08);
  background: var(--bc-panel);
  box-shadow: 0 0 48px rgba(0, 0, 0, 0.65);
}

.adventure-phone-inner {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.chapter-stars {
  white-space: nowrap;
  letter-spacing: 0.08em;
  color: #f7d45f;
  text-shadow: 0 1px 2px #000;
}

@media (max-width: 680px) {
  .adventure-phone {
    width: 100vw;
    height: 100dvh;
    aspect-ratio: auto;
    border: 0;
  }
}
</style>
