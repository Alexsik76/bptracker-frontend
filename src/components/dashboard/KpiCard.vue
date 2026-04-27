<script setup lang="ts">
withDefaults(
  defineProps<{
    label: string;
    value: string;
    sub?: string;
    accent?: string;
  }>(),
  { accent: undefined },
);
</script>

<template>
  <div class="stat-card">
    <div class="stat-label">{{ label }}</div>
    <div class="stat-value" :style="accent ? { color: accent } : {}">{{ value }}</div>
    <div v-if="sub" class="stat-sub">{{ sub }}</div>
  </div>
</template>

<style scoped>
.stat-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 16px;
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  box-shadow: var(--shadow-sm);
}

.stat-label {
  font-size: 10px;
  font-weight: 500;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-text-muted);
}

.stat-value {
  font-size: 22px;
  font-weight: 700;
  font-family: var(--font-mono);
  line-height: 1.1;
  color: var(--color-text);
}

.stat-sub {
  font-size: 11px;
  color: var(--color-text-muted);
}
</style>
