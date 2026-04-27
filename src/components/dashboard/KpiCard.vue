<script setup lang="ts">
interface Props {
  label: string
  value: string
  sub?: string
  accentColor?: string
  valueColor?: string
}
withDefaults(defineProps<Props>(), {
  accentColor: 'var(--color-border)',
  valueColor: 'var(--color-text)',
})
</script>

<template>
  <div class="kpi-card" :style="{ borderTopColor: accentColor }">
    <div class="kpi-label">{{ label }}</div>
    <div class="kpi-value" :style="{ color: valueColor }">
      <slot>{{ value }}</slot>
    </div>
    <div v-if="sub" class="kpi-sub">{{ sub }}</div>
  </div>
</template>

<style scoped>
.kpi-card {
  background: var(--color-surface);
  border-radius: var(--radius-xl);
  padding: var(--space-4);
  box-shadow: var(--shadow-sm);
  border-top: 3px solid var(--color-border);
}

.kpi-label {
  font-size: var(--text-xs);
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: var(--space-2);
}

.kpi-value {
  font-size: var(--text-2xl);
  font-weight: 700;
  margin-bottom: var(--space-1);
  line-height: 1.1;
}

.kpi-sub {
  font-size: var(--text-xs);
  color: var(--color-text-muted);
}
</style>
