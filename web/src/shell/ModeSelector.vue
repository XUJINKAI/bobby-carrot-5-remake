<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import type { AppMode } from "./shellBridge.js";

const props = defineProps<{ mode: AppMode }>();
const emit = defineEmits<{ navigate: [path: string] }>();
const root = ref<HTMLDetailsElement | null>(null);
const open = ref(false);
const modes = [
  { mode: "adventure", label: "冒险模式", href: "/adventure" },
  { mode: "explore", label: "自由探索模式", href: "/explore" },
  { mode: "editor", label: "编辑器模式", href: "/edit" },
] as const;
const selectedMode = computed(() =>
  props.mode === "custom" ? "explore" : props.mode,
);
const current = computed(() =>
  modes.find((item) => item.mode === selectedMode.value),
);

function navigate(path: string): void {
  open.value = false;
  emit("navigate", path);
}

function dismissOutside(event: PointerEvent): void {
  const target = event.target as Node | null;
  if (open.value && (!target || !root.value?.contains(target))) {
    open.value = false;
  }
}

onMounted(() => document.addEventListener("pointerdown", dismissOutside));
onBeforeUnmount(() =>
  document.removeEventListener("pointerdown", dismissOutside),
);
</script>

<template>
  <details v-if="current" ref="root" class="mode-selector" :open="open">
    <summary @click.prevent="open = !open">{{ current.label }}</summary>
    <nav aria-label="切换模式">
      <a
        v-for="item in modes"
        :key="item.mode"
        :href="item.href"
        :class="{ active: selectedMode === item.mode }"
        @click.prevent="navigate(item.href)"
      >
        <span aria-hidden="true">
          {{ selectedMode === item.mode ? "✓" : "" }}
        </span>
        {{ item.label }}
      </a>
    </nav>
  </details>
</template>
