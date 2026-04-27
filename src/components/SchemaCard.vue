<script setup lang="ts">
import { computed } from 'vue';
import type { TreatmentSchema, MedicationEntry } from '../types/api';

const props = defineProps<{
  schema: TreatmentSchema;
}>();

const TIME_LABELS: Record<string, string> = {
  Morning: 'Ранок',
  Afternoon: 'День',
  Evening: 'Вечір',
  Night: 'Ніч',
};

interface TimeBlock {
  label: string;
  unconditional: MedicationEntry[];
  conditional: { condition: string; meds: MedicationEntry[] }[];
}

const blocks = computed((): TimeBlock[] => {
  const doc = props.schema.scheduleDocument;
  if (!doc) return [];

  const order = ['Morning', 'Afternoon', 'Evening', 'Night'];
  const keys = Object.keys(doc).sort(
    (a, b) =>
      (order.indexOf(a) === -1 ? 99 : order.indexOf(a)) -
      (order.indexOf(b) === -1 ? 99 : order.indexOf(b)),
  );

  return keys.map((key) => {
    const meds: MedicationEntry[] = doc[key];
    const unconditional = meds.filter((m) => !m.Condition || m.Condition.toLowerCase() === 'none');
    const condMap = new Map<string, MedicationEntry[]>();
    meds
      .filter((m) => m.Condition && m.Condition.toLowerCase() !== 'none')
      .forEach((m) => {
        const c = m.Condition!.trim();
        if (!condMap.has(c)) condMap.set(c, []);
        condMap.get(c)!.push(m);
      });

    return {
      label: TIME_LABELS[key] ?? key,
      unconditional,
      conditional: Array.from(condMap.entries()).map(([condition, meds]) => ({ condition, meds })),
    };
  });
});
</script>

<template>
  <div class="schema-card">
    <div class="schema-header">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="M9 11l3 3L22 4"></path>
        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
      </svg>
      <h2>Схема лікування</h2>
      <span class="schema-id">{{ schema.id }}</span>
    </div>

    <div v-if="!blocks.length" class="empty">Розклад не заповнено</div>

    <div class="blocks">
      <div v-for="block in blocks" :key="block.label" class="time-block">
        <div class="time-label">
          <span class="dot"></span>
          {{ block.label }}
        </div>

        <div class="meds">
          <!-- Unconditional meds -->
          <div v-for="med in block.unconditional" :key="med.Medicine" class="med-row">
            <span class="med-name">{{ med.Medicine }}</span>
            <span class="arrow">→</span>
            <span class="med-amount">{{ med.Amount }}</span>
          </div>

          <!-- Conditional groups -->
          <div v-for="group in block.conditional" :key="group.condition" class="cond-group">
            <div class="cond-label">При {{ group.condition }}:</div>
            <div v-for="med in group.meds" :key="med.Medicine" class="med-row cond-med">
              <span class="med-name">{{ med.Medicine }}</span>
              <span class="arrow">→</span>
              <span class="med-amount">{{ med.Amount }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.schema-card {
  background: var(--color-surface);
  border-radius: var(--radius-xl);
  padding: var(--space-4);
  box-shadow: var(--shadow-sm);
  border-left: 3px solid var(--color-primary);
}

.schema-header {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-bottom: var(--space-4);
  padding-bottom: var(--space-3);
  border-bottom: 1px solid var(--color-border);
  color: var(--color-primary);

  & h2 {
    font-size: var(--text-base);
    font-weight: 700;
    color: var(--color-text);
    flex: 1;
  }

  & .schema-id {
    font-size: var(--text-xs);
    color: var(--color-text-muted);
    background: var(--color-bg);
    padding: 2px var(--space-2);
    border-radius: var(--radius-sm);
  }
}

.empty {
  color: var(--color-text-muted);
  font-size: var(--text-sm);
  padding: var(--space-4) 0;
}

.blocks {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);

  @media (min-width: 640px) {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
  }

  @media (min-width: 900px) {
    grid-template-columns: repeat(4, 1fr);
  }
}

.time-block {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.time-label {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-weight: 700;
  font-size: var(--text-sm);
  color: var(--color-primary);
  text-transform: uppercase;
  letter-spacing: 0.05em;

  & .dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--color-primary);
    flex-shrink: 0;
  }
}

.meds {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding-left: var(--space-4);
}

.med-row {
  display: flex;
  align-items: baseline;
  gap: var(--space-2);
  flex-wrap: wrap;

  & .med-name {
    font-size: var(--text-base);
    font-weight: 500;
    color: var(--color-text);
  }

  & .arrow {
    color: var(--color-border);
    font-size: var(--text-sm);
  }

  & .med-amount {
    font-size: var(--text-base);
    font-weight: 700;
    color: var(--color-primary);
  }
}

.cond-group {
  background: var(--color-bg);
  border-radius: var(--radius-md);
  padding: var(--space-2) var(--space-3);
  border-left: 2px solid var(--color-border);

  & .cond-label {
    font-size: var(--text-xs);
    font-weight: 600;
    color: var(--color-text-muted);
    margin-bottom: var(--space-2);
  }

  & .cond-med {
    padding-left: var(--space-2);
  }
}
</style>
