<script setup lang="ts">
import { reactive, watch } from 'vue';

const props = defineProps<{
  initialData?: { sys: number; dia: number; pulse: number };
}>();

const emit = defineEmits<{
  (e: 'submit', data: { sys: number; dia: number; pulse: number }): void;
  (e: 'cancel'): void;
}>();

const form = reactive({
  sys: props.initialData?.sys ?? 120,
  dia: props.initialData?.dia ?? 80,
  pulse: props.initialData?.pulse ?? 70,
});

watch(
  () => props.initialData,
  (newVal) => {
    if (newVal) {
      form.sys = newVal.sys;
      form.dia = newVal.dia;
      form.pulse = newVal.pulse;
    }
  },
);

function handleSubmit() {
  if (validate()) {
    emit('submit', { ...form });
  }
}

function validate() {
  if (form.sys < 40 || form.sys > 300) return false;
  if (form.dia < 20 || form.dia > 200) return false;
  if (form.pulse < 30 || form.pulse > 250) return false;
  return true;
}
</script>

<template>
  <form class="form" @submit.prevent="handleSubmit">
    <div class="field">
      <label>
        Систолічний (верхній)
        <div class="input-wrapper">
          <input v-model.number="form.sys" type="number" min="40" max="300" required />
          <span class="unit">мм рт.ст.</span>
        </div>
      </label>
    </div>

    <div class="field">
      <label>
        Діастолічний (нижній)
        <div class="input-wrapper">
          <input v-model.number="form.dia" type="number" min="20" max="200" required />
          <span class="unit">мм рт.ст.</span>
        </div>
      </label>
    </div>

    <div class="field">
      <label>
        Пульс
        <div class="input-wrapper">
          <input v-model.number="form.pulse" type="number" min="30" max="250" required />
          <span class="unit">уд/хв</span>
        </div>
      </label>
    </div>

    <div class="actions">
      <button type="button" class="btn secondary" @click="emit('cancel')">Скасувати</button>
      <button type="submit" class="btn primary">Зберегти</button>
    </div>
  </form>
</template>

<style scoped>
.form {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

.field {
  & label {
    display: block;
    font-size: var(--text-sm);
    font-weight: 600;
    color: var(--color-text-muted);
    margin-bottom: var(--space-2);
  }
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;

  & input {
    width: 100%;
    padding: var(--space-4);
    padding-right: var(--space-16);
    background: var(--color-bg);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    font-size: var(--text-xl);
    font-weight: bold;
    outline: none;

    &:focus {
      border-color: var(--color-primary);
    }
  }

  & .unit {
    position: absolute;
    right: var(--space-4);
    font-size: var(--text-xs);
    color: var(--color-text-muted);
    font-weight: normal;
  }
}

.actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-4);
  margin-top: var(--space-4);
}

.btn {
  padding: var(--space-4);
  border-radius: var(--radius-lg);
  font-weight: bold;
  font-size: var(--text-base);

  &.primary {
    background: var(--color-primary);
    color: white;
  }

  &.secondary {
    background: var(--color-bg);
    color: var(--color-text);
  }
}
</style>
