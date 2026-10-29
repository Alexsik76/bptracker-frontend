<script setup lang="ts" generic="T extends string">
defineProps<{
  options: { value: T; label: string }[];
  modelValue: T;
  label: string;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: T): void;
}>();
</script>

<template>
  <div class="seg" role="group" :aria-label="label">
    <button
      v-for="opt in options"
      :key="opt.value"
      type="button"
      :aria-pressed="opt.value === modelValue"
      @click="emit('update:modelValue', opt.value)"
    >
      <svg v-if="opt.value === modelValue" class="i i-s" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M5 12l5 5 9-10" />
      </svg>
      {{ opt.label }}
    </button>
  </div>
</template>

<style scoped>
.seg {
  display: inline-flex;
  height: var(--bpt-h-control);
  border: 1px solid var(--md-sys-color-outline);
  border-radius: var(--bpt-radius-full);
  overflow: hidden;
}

.seg button {
  display: inline-flex;
  align-items: center;
  gap: var(--bpt-sp-2);
  padding: 0 var(--bpt-sp-4);
  border: 0;
  border-left: 1px solid var(--md-sys-color-outline);
  background: transparent;
  color: var(--md-sys-color-on-surface);
  font-size: var(--bpt-fs-cell);
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
}

.seg button:first-child {
  border-left: 0;
}

.seg button:hover {
  background: var(--bpt-state-hover);
}

.seg button[aria-pressed='true'] {
  background: var(--md-sys-color-secondary-container);
  color: var(--md-sys-color-on-secondary-container);
}

.seg button:focus-visible {
  outline-offset: -2px;
}
</style>
