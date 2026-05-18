<script setup lang="ts">
import { reactive } from 'vue';
import { useI18n } from 'vue-i18n';
import type { FieldConfig } from '../utils/ocrFields';

const props = defineProps<{
  initialSys: number;
  initialDia: number;
  initialPulse: number;
  fieldConfigs: FieldConfig[];
}>();

const emit = defineEmits<{
  submit: [data: { sys: number; dia: number; pulse: number }];
  cancel: [];
  fallback: [];
  'focus-change': [field: string | null];
}>();

const { t } = useI18n();

const form = reactive({
  sys: props.initialSys,
  dia: props.initialDia,
  pulse: props.initialPulse,
});

function handleSubmit() {
  const { sys, dia, pulse } = form;
  if (sys < 40 || sys > 300) return;
  if (dia < 20 || dia > 200) return;
  if (pulse < 30 || pulse > 250) return;
  emit('submit', { sys, dia, pulse });
}
</script>

<template>
  <form class="rev-fields" @submit.prevent="handleSubmit">
    <div v-for="f in props.fieldConfigs" :key="f.key" class="rev-field">
      <div class="field-label-row">
        <span class="field-dot" :style="{ background: f.color }" />
        <span class="field-label-text">{{ t(f.labelKey) }}</span>
        <span v-if="f.subLabelKey" class="field-sublabel">{{ t(f.subLabelKey) }}</span>
      </div>
      <div class="field-input-wrap">
        <input
          v-model.number="form[f.key]"
          type="number"
          :min="f.min"
          :max="f.max"
          class="field-val-input"
          inputmode="numeric"
          @focus="emit('focus-change', f.key)"
          @blur="emit('focus-change', null)"
        />
        <span class="field-unit">{{ t(f.unitKey) }}</span>
      </div>
    </div>

    <div class="rev-actions">
      <button type="button" class="rev-btn rev-btn--cancel" @click="emit('cancel')">
        {{ t('common.cancel') }}
      </button>
      <button type="submit" class="rev-btn rev-btn--save">
        {{ t('common.save') }}
      </button>
    </div>
  </form>

  <button class="fallback-link" @click="emit('fallback')">
    {{ t('localOcr.fallbackBtn') }}
  </button>
</template>

<style scoped>
.rev-fields {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.rev-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field-label-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.field-dot {
  width: 7px;
  height: 7px;
  border-radius: 4px;
  opacity: 0.85;
  flex-shrink: 0;
}

.field-label-text {
  font-size: 13px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.55);
}

.field-sublabel {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.35);
}

.field-input-wrap {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  padding: 10px 16px;
  background: #15151c;
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 14px;
}

.field-val-input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  font-size: 22px;
  font-weight: 700;
  color: #fff;
  font-variant-numeric: tabular-nums;
  min-width: 0;
  appearance: textfield;
  -moz-appearance: textfield;

  &::-webkit-outer-spin-button,
  &::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
}

.field-unit {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.35);
  white-space: nowrap;
  margin-left: 8px;
  flex-shrink: 0;
}

.rev-actions {
  display: flex;
  gap: 10px;
  margin-top: 4px;
}

.rev-btn {
  padding: 15px 20px;
  border-radius: 14px;
  font-size: 15px;
  cursor: pointer;
}

.rev-btn--cancel {
  flex: 1;
  background: #15151c;
  border: 1px solid rgba(255, 255, 255, 0.06);
  color: #fff;
  font-weight: 600;
}

.rev-btn--save {
  flex: 1.4;
  background: #a39bff;
  color: #1a1530;
  font-weight: 700;
  box-shadow: 0 6px 18px rgba(163, 155, 255, 0.25);
}

.fallback-link {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.55);
  text-decoration: underline;
  text-decoration-color: rgba(255, 255, 255, 0.35);
  text-align: center;
}
</style>
