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
}

.period-btn {
  padding: 4px 9px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 500;
  color: var(--color-text-muted);
  background: transparent;
  border: none;
  cursor: pointer;
  transition: all 0.15s;

  &.active {
    background: rgba(255, 255, 255, 0.15);
    color: var(--color-text);
  }

  &:hover:not(.active) {
    color: var(--color-text);
  }
}

@media (prefers-color-scheme: light) {
  .period-btn.active {
    background: rgba(0, 0, 0, 0.12);
  }
}
</style>
