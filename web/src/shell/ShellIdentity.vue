<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";
import type { ShellIdentity } from "./shellBridge.js";
import AppIcon from "../shared/icons/AppIcon.vue";

defineProps<{ identity: ShellIdentity }>();
const emit = defineEmits<{ navigate: [path: string] }>();
const root = ref<HTMLDetailsElement | null>(null);
const open = ref(false);

function navigate(path: string): void {
  open.value = false;
  emit("navigate", path);
}

function dismissOutside(event: PointerEvent): void {
  const target = event.target as Node | null;
  if (open.value && (!target || !root.value?.contains(target))) open.value = false;
}

onMounted(() => document.addEventListener("pointerdown", dismissOutside));
onBeforeUnmount(() => document.removeEventListener("pointerdown", dismissOutside));
</script>

<template>
  <details v-if="identity.menu?.length" ref="root" class="shell-identity has-menu" :open="open">
    <summary @click.prevent="open = !open">
      <img :src="identity.icon" alt="">
      <span v-if="identity.productName && identity.productNameVisible !== false" class="shell-product-name">{{ identity.productName }}</span>
      <span v-if="identity.statusText" class="shell-status-text">{{ identity.statusText }}</span>
      <span v-if="identity.contextName && identity.contextNameVisible !== false" class="shell-context-name">{{ identity.contextName }}</span>
      <AppIcon name="dropdown" />
    </summary>
    <nav aria-label="产品导航">
      <a v-for="item in identity.menu" :key="item.href" :href="item.href" :class="{ active: item.active }" @click.prevent="navigate(item.href)">{{ item.label }}</a>
    </nav>
  </details>
  <a v-else class="shell-identity" :href="identity.href ?? '/'" @click.prevent="navigate(identity.href ?? '/')">
    <img :src="identity.icon" alt="">
    <span v-if="identity.productName && identity.productNameVisible !== false" class="shell-product-name">{{ identity.productName }}</span>
    <span v-if="identity.statusText" class="shell-status-text">{{ identity.statusText }}</span>
    <span v-if="identity.contextName && identity.contextNameVisible !== false" class="shell-context-name">{{ identity.contextName }}</span>
  </a>
</template>

<style scoped>
.shell-identity,
.shell-identity summary {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  color: var(--bc-text);
  font-weight: 800;
  text-decoration: none;
  white-space: nowrap;
}

.shell-identity {
  position: relative;
}

.shell-identity summary {
  cursor: pointer;
  list-style: none;
}

.shell-identity summary::-webkit-details-marker {
  display: none;
}

.shell-identity.has-menu summary :deep(.app-icon) {
  color: var(--bc-text-muted);
  font-size: 0.7rem;
}

.shell-identity img {
  width: 32px;
  height: 32px;
  flex: 0 0 auto;
  object-fit: contain;
}

.shell-context-name {
  padding-left: 8px;
  border-left: 1px solid var(--bc-panel-border);
  color: var(--bc-text-muted);
}

.shell-status-text {
  color: red;
  font-size: 1.1rem;
  font-weight: 600;
  letter-spacing: 0.05em;
}

.shell-identity nav {
  position: absolute;
  top: calc(100% + 10px);
  left: 0;
  z-index: 40;
  display: grid;
  min-width: 190px;
  gap: 4px;
  padding: 6px;
  border: var(--bc-panel-border-width) solid var(--bc-panel-border);
  border-radius: var(--bc-panel-radius);
  background: var(--bc-panel);
  box-shadow: var(--bc-panel-shadow);
}

.shell-identity nav a {
  padding: 9px 11px;
  border-radius: var(--bc-control-radius);
  color: var(--bc-text);
  text-decoration: none;
}

.shell-identity nav a:hover {
  background: var(--bc-control-hover);
}

.shell-identity nav a.active {
  background: var(--bc-control-selected);
  color: var(--bc-control-selected-text);
}

@media (max-width: 900px) {
  .shell-product-name,
  .shell-status-text {
    display: none;
  }
}

@media (max-width: 700px) {
  .shell-context-name {
    display: none;
  }
}

@media (max-width: 430px) {
  .shell-identity.has-menu summary::after {
    display: none;
  }
}
</style>
