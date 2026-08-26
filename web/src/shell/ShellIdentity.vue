<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";
import type { ShellIdentity } from "./shellBridge.js";

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
      <span v-if="identity.contextName && identity.contextNameVisible !== false" class="shell-context-name">{{ identity.contextName }}</span>
    </summary>
    <nav aria-label="产品导航">
      <a v-for="item in identity.menu" :key="item.href" :href="item.href" :class="{ active: item.active }" @click.prevent="navigate(item.href)">{{ item.label }}</a>
    </nav>
  </details>
  <a v-else class="shell-identity" :href="identity.href ?? '/'" @click.prevent="navigate(identity.href ?? '/')">
    <img :src="identity.icon" alt="">
    <span v-if="identity.productName && identity.productNameVisible !== false" class="shell-product-name">{{ identity.productName }}</span>
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
  color: #fff;
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

.shell-identity.has-menu summary::after {
  content: "▾";
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
  border-left: 2px solid #ffffff55;
  color: var(--bc-text-muted);
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
  border: 3px solid var(--bc-panel-border);
  border-radius: 6px;
  background: var(--bc-panel);
  box-shadow: 6px 6px 0 #001b5b88;
}

.shell-identity nav a {
  padding: 9px 11px;
  color: #fff;
  text-decoration: none;
}

.shell-identity nav a:hover,
.shell-identity nav a.active {
  background: var(--bc-active);
}

@media (max-width: 900px) {
  .shell-product-name {
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
