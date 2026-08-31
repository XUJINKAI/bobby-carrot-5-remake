<template>
  <div class="embed-feature-preview" aria-hidden="true">
    <div class="embed-browser-bar">
      <span></span><span></span><span></span>
      <div>your-site.example/article</div>
    </div>
    <div class="embed-browser-page">
      <div class="embed-copy">
        <i></i><i></i><i></i>
      </div>
      <div class="embed-game-card">
        <div class="embed-game-grid">
          <i v-for="index in 35" :key="index" :class="{ accent: [10, 17, 18, 24].includes(index) }"></i>
        </div>
        <strong>BC5R</strong>
      </div>
      <pre><code>&lt;div id="bc5r-map"&gt;&lt;/div&gt;
&lt;script src="/embed/v1/bc5r.js"&gt;&lt;/script&gt;</code></pre>
    </div>
  </div>
</template>

<style scoped>
.embed-feature-preview {
  overflow: hidden;
  border: 1px solid rgb(255 255 255 / 14%);
  border-radius: 16px;
  background: #f5f7f9;
  box-shadow: 0 22px 60px rgb(0 11 38 / 34%);
}

.embed-browser-bar {
  height: 38px;
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 0 12px;
  background: #1a222b;
}

.embed-browser-bar > span {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #536170;
}

.embed-browser-bar > div {
  min-width: 0;
  flex: 1;
  margin-left: 6px;
  overflow: hidden;
  padding: 5px 9px;
  border-radius: 6px;
  background: #28333e;
  color: #9eabb7;
  font-size: 0.58rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.embed-browser-page {
  min-height: 270px;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 42%;
  grid-template-rows: 1fr auto;
  gap: 16px 22px;
  padding: 24px;
  color: #28323d;
}

.embed-copy {
  display: grid;
  align-content: start;
  gap: 9px;
  padding-top: 8px;
}

.embed-copy i {
  height: 8px;
  border-radius: 999px;
  background: #d6dce1;
}

.embed-copy i:nth-child(1) {
  width: 76%;
  height: 18px;
  background: #8b99a6;
}

.embed-copy i:nth-child(3) {
  width: 64%;
}

.embed-game-card {
  position: relative;
  align-self: start;
  aspect-ratio: 5 / 6;
  overflow: hidden;
  border-radius: 10px;
  background: #143678;
  box-shadow: 0 10px 28px rgb(12 30 57 / 22%);
}

.embed-game-grid {
  position: absolute;
  inset: 18% 12% 14%;
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  grid-template-rows: repeat(7, 1fr);
  gap: 1px;
}

.embed-game-grid i {
  background: #6c8458;
}

.embed-game-grid i.accent {
  background: #e7ca5b;
}

.embed-game-card strong {
  position: absolute;
  left: 10px;
  bottom: 7px;
  color: #fff;
  font-size: 0.6rem;
  letter-spacing: 0.14em;
}

.embed-browser-page pre {
  grid-column: 1 / -1;
  margin: 0;
  overflow: hidden;
  padding: 11px 13px;
  border-radius: 8px;
  background: #202832;
  color: #c6d3df;
  font-size: 0.58rem;
  line-height: 1.55;
  white-space: pre-wrap;
}

@media (max-width: 560px) {
  .embed-browser-page {
    min-height: 230px;
    padding: 18px;
  }
}
</style>
