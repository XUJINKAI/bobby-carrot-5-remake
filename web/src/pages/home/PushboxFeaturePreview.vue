<script setup lang="ts">
const cells = [
  "wall", "wall", "wall", "wall", "wall", "wall", "wall",
  "wall", "floor", "floor", "goal", "floor", "floor", "wall",
  "wall", "floor", "crate", "floor", "crate-goal", "floor", "wall",
  "wall", "floor", "floor", "bobby", "floor", "goal", "wall",
  "wall", "floor", "crate", "floor", "floor", "floor", "wall",
  "wall", "wall", "wall", "wall", "wall", "wall", "wall",
] as const;
</script>

<template>
  <div class="pushbox-preview" aria-hidden="true">
    <div class="pushbox-editor-bar">
      <span></span><span></span><span></span>
      <b>MAP EDITOR</b>
    </div>
    <div class="pushbox-workspace">
      <div class="pushbox-palette">
        <i class="palette-tile floor"></i>
        <i class="palette-tile crate"></i>
        <i class="palette-tile goal"></i>
      </div>
      <div class="pushbox-board">
        <i
          v-for="(cell, index) in cells"
          :key="index"
          class="pushbox-cell"
          :class="cell"
        ></i>
      </div>
    </div>
  </div>
</template>

<style scoped>
.pushbox-preview {
  overflow: hidden;
  border: 1px solid rgb(255 255 255 / 14%);
  border-radius: 16px;
  background: #111922;
  box-shadow: 0 22px 60px rgb(0 11 38 / 34%);
}

.pushbox-editor-bar {
  height: 38px;
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 0 12px;
  border-bottom: 1px solid rgb(255 255 255 / 8%);
  color: #91a3b7;
  font-size: 0.6rem;
  letter-spacing: 0.12em;
}

.pushbox-editor-bar span {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #415264;
}

.pushbox-editor-bar b {
  margin-left: 5px;
}

.pushbox-workspace {
  min-height: 270px;
  display: grid;
  grid-template-columns: 62px minmax(0, 1fr);
}

.pushbox-palette {
  display: grid;
  align-content: start;
  gap: 10px;
  padding: 14px;
  border-right: 1px solid rgb(255 255 255 / 8%);
  background: #171f29;
}

.palette-tile {
  aspect-ratio: 1;
  border-radius: 7px;
  background: #243240;
}

.palette-tile.floor {
  background: #7f6847;
}

.palette-tile.crate {
  background: linear-gradient(135deg, #b67b3d 0 45%, #8d582d 45% 55%, #c58a47 55%);
}

.palette-tile.goal {
  border: 3px solid #d8e96c;
  background: transparent;
}

.pushbox-board {
  width: min(82%, 340px);
  aspect-ratio: 7 / 6;
  align-self: center;
  justify-self: center;
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  grid-template-rows: repeat(6, 1fr);
  border: 1px solid #3d4c5b;
  background: #27313a;
  box-shadow: 0 12px 30px rgb(0 0 0 / 30%);
}

.pushbox-cell {
  position: relative;
  min-width: 0;
  border: 1px solid rgb(0 0 0 / 14%);
  background: #766449;
}

.pushbox-cell.wall {
  background: linear-gradient(135deg, #4b5965, #303b45);
}

.pushbox-cell.goal::after,
.pushbox-cell.crate-goal::after {
  content: "";
  position: absolute;
  inset: 27%;
  border: 2px solid #e4ed79;
  border-radius: 50%;
}

.pushbox-cell.crate::before,
.pushbox-cell.crate-goal::before {
  content: "";
  position: absolute;
  inset: 13%;
  z-index: 1;
  border: 2px solid #e2a95f;
  background: linear-gradient(45deg, #9d632f 0 45%, #c88742 45% 55%, #995d2d 55%);
  box-shadow: inset 0 0 0 2px #75451f;
}

.pushbox-cell.bobby::before {
  content: "";
  position: absolute;
  inset: 18% 24% 16%;
  border-radius: 48% 48% 42% 42%;
  background: #f0eee7;
  box-shadow:
    -6px -10px 0 -3px #f0eee7,
    6px -10px 0 -3px #f0eee7,
    0 5px 0 3px #c4d0d5;
}

@media (max-width: 560px) {
  .pushbox-workspace {
    min-height: 220px;
    grid-template-columns: 48px minmax(0, 1fr);
  }

  .pushbox-palette {
    padding: 10px;
  }
}
</style>
