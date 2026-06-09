<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import type { TreatmentSchema, MedicationEntry, SchemaScheduleDto } from '../types/api';
import { useSchemaStore } from '../stores/schemas';

const props = defineProps<{
  schema?: TreatmentSchema;
}>();

const emit = defineEmits<{
  saved: [];
  cancel: [];
}>();

const { t } = useI18n();
const schemaStore = useSchemaStore();

const AMOUNT_PRESETS = ['0.5', '1', '2'];
const SECTION_KEYS = ['Morning', 'Day', 'Evening'] as const;
type SectionKey = (typeof SECTION_KEYS)[number];

interface MedRow {
  Medicine: string;
  Amount: string;
  customAmount: string;
  useCustomAmount: boolean;
  Condition: string;
}

function emptyRow(): MedRow {
  return { Medicine: '', Amount: '1', customAmount: '', useCustomAmount: false, Condition: '' };
}

function sectionI18nKey(key: SectionKey): string {
  const map: Record<SectionKey, string> = {
    Morning: 'schema.morning',
    Day: 'schema.day',
    Evening: 'schema.evening',
  };
  return map[key];
}

function initRows(key: SectionKey): MedRow[] {
  if (!props.schema?.scheduleDocument) return [];
  const meds: MedicationEntry[] = props.schema.scheduleDocument[key] ?? [];
  return meds.map((m) => {
    const isPreset = AMOUNT_PRESETS.includes(m.Amount);
    return {
      Medicine: m.Medicine,
      Amount: isPreset ? m.Amount : 'other',
      customAmount: isPreset ? '' : m.Amount,
      useCustomAmount: !isPreset,
      Condition: m.Condition === 'None' ? '' : m.Condition,
    };
  });
}

const sections = ref<Record<SectionKey, MedRow[]>>({
  Morning: initRows('Morning'),
  Day: initRows('Day'),
  Evening: initRows('Evening'),
});

const doctor = ref(props.schema?.doctor ?? '');
const prescribedOn = ref(
  props.schema?.prescribedOn ?? new Date().toISOString().slice(0, 10),
);
const setActive = ref(schemaStore.items.length === 0);
const saving = ref(false);

const isEditing = computed(() => !!props.schema);

const uniqueDoctors = computed(() =>
  [...new Set(schemaStore.items.map((s) => s.doctor).filter(Boolean) as string[])],
);

function addRow(key: SectionKey) {
  sections.value[key].push(emptyRow());
}

function removeRow(key: SectionKey, index: number) {
  sections.value[key].splice(index, 1);
}

function onAmountChange(row: MedRow) {
  row.useCustomAmount = row.Amount === 'other';
  if (!row.useCustomAmount) row.customAmount = '';
}

function buildSchedule(): SchemaScheduleDto {
  const schedule: SchemaScheduleDto = {};
  for (const key of SECTION_KEYS) {
    const valid = sections.value[key]
      .filter((r) => r.Medicine.trim())
      .map((r): MedicationEntry => ({
        Medicine: r.Medicine.trim(),
        Amount: (r.useCustomAmount ? r.customAmount : r.Amount).trim() || '1',
        Condition: r.Condition.trim() || 'None',
      }));
    if (valid.length) schedule[key] = valid;
  }
  return schedule;
}

async function submit() {
  const schedule = buildSchedule();
  saving.value = true;
  try {
    if (isEditing.value && props.schema) {
      await schemaStore.update(props.schema.id, {
        doctor: doctor.value,
        prescribedOn: prescribedOn.value || undefined,
        schedule,
      });
    } else {
      await schemaStore.create({
        doctor: doctor.value,
        prescribedOn: prescribedOn.value || undefined,
        schedule,
        setActive: setActive.value,
      });
    }
    emit('saved');
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <form class="schema-form" @submit.prevent="submit">
    <h3 class="form-title">
      {{ isEditing ? $t('schema.form.editTitle') : $t('schema.form.createTitle') }}
    </h3>

    <div class="field-row">
      <label class="field-label" for="sf-doctor">{{ $t('schema.form.doctor') }}</label>
      <input
        id="sf-doctor"
        v-model="doctor"
        list="sf-doctors-list"
        class="field-input"
        :placeholder="$t('schema.form.doctorPlaceholder')"
        required
      />
      <datalist id="sf-doctors-list">
        <option v-for="d in uniqueDoctors" :key="d" :value="d" />
      </datalist>
    </div>

    <div class="field-row">
      <label class="field-label" for="sf-date">{{ $t('schema.form.prescribedOn') }}</label>
      <input id="sf-date" v-model="prescribedOn" type="date" class="field-input" />
    </div>

    <div v-if="!isEditing" class="field-row field-row--inline">
      <label class="field-label" for="sf-active">{{ $t('schema.form.setActive') }}</label>
      <input id="sf-active" v-model="setActive" type="checkbox" class="field-checkbox" />
    </div>

    <div v-for="key in SECTION_KEYS" :key="key" class="section">
      <div class="section-header">
        <span class="section-dot" />
        {{ $t(sectionI18nKey(key)) }}
      </div>

      <div v-for="(row, idx) in sections[key]" :key="idx" class="med-row">
        <input
          v-model="row.Medicine"
          type="text"
          class="field-input med-name"
          :placeholder="$t('schema.form.medicinePlaceholder')"
        />

        <select v-model="row.Amount" class="field-select" @change="onAmountChange(row)">
          <option v-for="p in AMOUNT_PRESETS" :key="p" :value="p">{{ p }}</option>
          <option value="other">{{ $t('schema.form.amountOther') }}</option>
        </select>

        <input
          v-if="row.useCustomAmount"
          v-model="row.customAmount"
          type="text"
          class="field-input custom-amount"
          :placeholder="$t('schema.form.amountCustomPlaceholder')"
        />

        <input
          v-model="row.Condition"
          type="text"
          class="field-input condition"
          :placeholder="$t('schema.form.conditionPlaceholder')"
        />

        <button type="button" class="btn-remove" :aria-label="$t('common.delete')" @click="removeRow(key, idx)">
          ✕
        </button>
      </div>

      <button type="button" class="btn-add-row" @click="addRow(key)">
        + {{ $t('schema.form.addRow') }}
      </button>
    </div>

    <div class="form-actions">
      <button type="button" class="btn-cancel" @click="emit('cancel')">
        {{ $t('common.cancel') }}
      </button>
      <button type="submit" class="btn-save" :disabled="saving">
        {{ saving ? $t('common.wait') : $t('common.save') }}
      </button>
    </div>
  </form>
</template>

<style scoped>
.schema-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.form-title {
  font-size: var(--text-base);
  font-weight: 700;
  color: var(--color-text);
  margin: 0;
}

.field-row {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.field-row--inline {
  flex-direction: row;
  align-items: center;
  gap: var(--space-3);
}

.field-label {
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--color-text-muted);
}

.field-input {
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  background: var(--color-bg);
  color: var(--color-text);
  font-size: var(--text-sm);
  width: 100%;

  &:focus {
    outline: none;
    border-color: var(--color-primary);
  }
}

.field-select {
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  background: var(--color-bg);
  color: var(--color-text);
  font-size: var(--text-sm);
  cursor: pointer;

  &:focus {
    outline: none;
    border-color: var(--color-primary);
  }
}

.field-checkbox {
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: var(--color-primary);
}

.section {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding: var(--space-3);
  background: var(--color-bg);
  border-radius: var(--radius-md);
  border-left: 3px solid var(--color-primary);
}

.section-header {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--text-sm);
  font-weight: 700;
  color: var(--color-primary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: var(--space-1);
}

.section-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--color-primary);
  flex-shrink: 0;
}

.med-row {
  display: flex;
  gap: var(--space-2);
  align-items: center;
  flex-wrap: wrap;

  & .med-name {
    flex: 2;
    min-width: 100px;
  }

  & .field-select {
    flex: 0 0 auto;
  }

  & .custom-amount {
    flex: 1;
    min-width: 60px;
  }

  & .condition {
    flex: 1;
    min-width: 80px;
  }
}

.btn-remove {
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-sm);
  border: none;
  background: transparent;
  color: var(--color-text-muted);
  cursor: pointer;
  font-size: var(--text-sm);
  flex-shrink: 0;

  &:hover {
    color: var(--color-danger, #e53e3e);
    background: var(--color-bg);
  }
}

.btn-add-row {
  align-self: flex-start;
  padding: var(--space-1) var(--space-3);
  border-radius: var(--radius-md);
  border: 1px dashed var(--color-border);
  background: transparent;
  color: var(--color-primary);
  font-size: var(--text-sm);
  font-weight: 500;
  cursor: pointer;

  &:hover {
    border-color: var(--color-primary);
    background: var(--color-bg);
  }
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-3);
  padding-top: var(--space-2);
  border-top: 1px solid var(--color-border);
}

.btn-cancel {
  padding: var(--space-2) var(--space-5);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--color-text-muted);
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  cursor: pointer;

  &:hover {
    border-color: var(--color-text-muted);
  }
}

.btn-save {
  padding: var(--space-2) var(--space-5);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  font-weight: 600;
  background: var(--color-primary);
  color: white;
  border: none;
  cursor: pointer;

  &:hover:not(:disabled) {
    background: var(--color-primary-hover);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}
</style>
