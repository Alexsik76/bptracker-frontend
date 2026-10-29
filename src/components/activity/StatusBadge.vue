<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{ status: number }>();

const kind = computed(() => {
  if (props.status >= 500) return 'err';
  if (props.status >= 400) return 'warn';
  return 'ok';
});

const glyph = computed(() => ({ ok: '✓', warn: '!', err: '×' })[kind.value]);
</script>

<template>
  <span class="badge status mono" :class="kind">{{ glyph }} {{ status }}</span>
</template>

<style scoped>
.status.ok {
  background: var(--md-extended-color-success-color-container);
  color: var(--md-extended-color-success-on-color-container);
}

.status.warn {
  background: var(--md-extended-color-warning-color-container);
  color: var(--md-extended-color-warning-on-color-container);
}

.status.err {
  background: var(--md-sys-color-error-container);
  color: var(--md-sys-color-on-error-container);
}
</style>
