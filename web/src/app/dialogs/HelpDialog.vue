<script setup lang="ts">
import type { HelpDescriptor } from "../../shell/shellBridge.js";

defineProps<{ descriptor: HelpDescriptor }>();
const emit = defineEmits<{ close: [] }>();
</script>

<template>
  <section class="global-dialog help-dialog" role="dialog" aria-label="帮助">
    <header>{{ descriptor.title }} <button type="button" aria-label="关闭" @click="emit('close')">×</button></header>
    <div>
      <section v-for="(section, index) in descriptor.sections" :key="section.title ?? index">
        <h3 v-if="section.title">{{ section.title }}</h3>
        <p v-for="line in section.lines" :key="line">{{ line }}</p>
      </section>
    </div>
  </section>
</template>
