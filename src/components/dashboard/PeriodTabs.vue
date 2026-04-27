<script setup lang="ts">
interface Props {
  modelValue: 7 | 30 | 90 | 365;
}
defineProps<Props>();
defineEmits<{ 'update:modelValue': [value: 7 | 30 | 90 | 365] }>();

const periods = [
  { label: '7д', value: 7 },
  { label: '30д', value: 30 },
  { label: '3м', value: 90 },
  { label: 'Рік', value: 365 },
] as const;
</script>

<template>
  <div class="period-tabs">
    <button
      v-for="p in periods"
      :key="p.value"
      :class="['period-btn', { active: modelValue === p.value }]"
      @click="$emit('update:modelValue', p.value)"
    >
      {{ p.label }}
    </button>
  </div>
</template>

<style scoped>
.period-tabs {
  display: flex;
  gap: 2px;
  background: var(--color-bg);
  padding: 3px;
  border-radius: var(--radius-md);
}

.period-btn {
  padding: var(--space-1) var(--space-3);
  border-radius: calc(var(--radius-md) - 2px);
  font-size: var(--text-xs);
  font-weight: 500;
  color: var(--color-text-muted);
  transition: all 0.15s;

  &.active {
    background: var(--color-surface);
    color: var(--color-text);
    box-shadow: var(--shadow-sm);
  }

  &:hover:not(.active) {
    color: var(--color-text);
  }
}
</style>
