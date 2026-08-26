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
