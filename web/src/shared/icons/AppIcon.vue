<script setup lang="ts">
import type { Component } from "vue";
import {
  PhArrowClockwise,
  PhArrowCounterClockwise,
  PhArrowLeft,
  PhArrowRight,
  PhArrowSquareOut,
  PhArrowUUpLeft,
  PhArrowUUpRight,
  PhCheck,
  PhClipboard,
  PhCopy,
  PhCaretDown,
  PhCursor,
  PhDiamond,
  PhDotsSixVertical,
  PhEraser,
  PhFastForward,
  PhSlidersHorizontal,
  PhGithubLogo,
  PhInfo,
  PhJoystick,
  PhList,
  PhLock,
  PhMagnifyingGlass,
  PhMinus,
  PhPaintRoller,
  PhPalette,
  PhPencilSimple,
  PhPlay,
  PhPlus,
  PhQuestion,
  PhRecord,
  PhRewind,
  PhScissors,
  PhShareNetwork,
  PhShuffle,
  PhSkipBack,
  PhSkipForward,
  PhSpeakerSimpleHigh,
  PhSpeakerSimpleX,
  PhStar,
  PhStop,
  PhTrash,
  PhWarning,
  PhWarningOctagon,
  PhX,
} from "@phosphor-icons/vue/compact";
import type { AppIconName, AppIconWeight } from "./types.js";

withDefaults(defineProps<{
  name: AppIconName;
  size?: number | string;
  weight?: AppIconWeight;
}>(), {
  size: "1em",
  weight: "bold",
});

/** 业务层只依赖稳定语义名，第三方图标替换集中在这一张表完成。 */
const icons: Record<AppIconName, Component> = {
  back: PhArrowLeft,
  check: PhCheck,
  close: PhX,
  copy: PhCopy,
  cut: PhScissors,
  delete: PhTrash,
  dropdown: PhCaretDown,
  drag: PhDotsSixVertical,
  edit: PhPencilSimple,
  "edit-map": PhPencilSimple,
  erase: PhEraser,
  error: PhWarningOctagon,
  external: PhArrowSquareOut,
  fill: PhPaintRoller,
  "fast-forward": PhFastForward,
  github: PhGithubLogo,
  help: PhQuestion,
  info: PhInfo,
  inspector: PhMagnifyingGlass,
  joystick: PhJoystick,
  lock: PhLock,
  menu: PhList,
  minus: PhMinus,
  music: PhSpeakerSimpleHigh,
  next: PhArrowRight,
  "next-track": PhSkipForward,
  palette: PhPalette,
  paste: PhClipboard,
  place: PhPlus,
  play: PhPlay,
  "previous-track": PhSkipBack,
  redo: PhArrowUUpRight,
  record: PhRecord,
  "replay-beginning": PhArrowCounterClockwise,
  "replay-end": PhArrowClockwise,
  rewind: PhRewind,
  restart: PhArrowCounterClockwise,
  select: PhCursor,
  settings: PhSlidersHorizontal,
  share: PhShareNetwork,
  shape: PhDiamond,
  shuffle: PhShuffle,
  "sound-off": PhSpeakerSimpleX,
  "sound-on": PhSpeakerSimpleHigh,
  star: PhStar,
  stop: PhStop,
  undo: PhArrowUUpLeft,
  warning: PhWarning,
};
</script>

<template>
  <component
    :is="icons[name]"
    class="app-icon"
    :size="size"
    :weight="weight"
    aria-hidden="true"
  />
</template>

<style scoped>
.app-icon {
  display: block;
  flex: 0 0 auto;
}
</style>
