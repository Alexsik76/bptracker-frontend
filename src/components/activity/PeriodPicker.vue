<script setup lang="ts">
import SegmentedControl from '../ui/SegmentedControl.vue';
import { PERIOD_OPTIONS, type PeriodKey } from '../../composables/useActivityQuery';

defineProps<{
  period: PeriodKey;
  from?: string;
  to?: string;
}>();

const emit = defineEmits<{
  (e: 'update:period', value: PeriodKey): void;
  (e: 'update:from', value: string): void;
  (e: 'update:to', value: string): void;
}>();
</script>

<template>
  <div class="period-picker">
    <SegmentedControl
      :options="PERIOD_OPTIONS"
      :model-value="period"
      label="Period"
      @update:model-value="emit('update:period', $event)"
    />

    <template v-if="period === 'custom'">
      <div class="field date-field">
        <label class="label" for="period-from">From</label>
        <input
          id="period-from"
          type="date"
          class="input mono"
          :value="from || ''"
          :max="to || undefined"
          @change="emit('update:from', ($event.target as HTMLInputElement).value)"
        />
      </div>
      <div class="field date-field">
        <label class="label" for="period-to">To</label>
        <input
          id="period-to"
          type="date"
          class="input mono"
          :value="to || ''"
          :min="from || undefined"
          @change="emit('update:to', ($event.target as HTMLInputElement).value)"
        />
      </div>
    </template>
  </div>
</template>

<style scoped>
.period-picker {
  display: flex;
  align-items: flex-end;
  gap: var(--bpt-sp-3);
  flex-wrap: wrap;
}

.date-field {
  width: 168px;
}
</style>
