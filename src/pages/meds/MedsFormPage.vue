<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useSchemaStore } from '../../stores/schemas';
import RxSwitch from '../../components/meds/RxSwitch.vue';
import type { MedicationEntry, SchemaScheduleDto } from '../../types/api';

const router = useRouter();
const route = useRoute();
const schemaStore = useSchemaStore();

const isEditing = computed(() => route.name === 'meds-edit' || !!route.params.id);

function parseMedicine(raw: string): { name: string; strength: string } {
  const match = raw.match(/^(.*?)\s+(\d+(?:\.\d+)?\s*(?:mg|мг|mcg|мкг|ml|мл|g|г|ед|ED|tab|таб))$/i);
  if (match) {
    return { name: match[1], strength: match[2] };
  }
  return { name: raw, strength: '' };
}

interface MedRow {
  name: string;
  strength: string;
  dose: string;
}

const PERIOD_ORDER = ['Morning', 'Day', 'Evening'] as const;
type PeriodKey = typeof PERIOD_ORDER[number];

const PERIOD_LABELS: Record<PeriodKey, string> = {
  Morning: 'Ранок',
  Day: 'День',
  Evening: 'Вечір',
};

const doctor = ref('');
const prescribedOn = ref(new Date().toISOString().slice(0, 10));
const isActive = ref(false);

const schedule = ref<Record<PeriodKey, MedRow[]>>({
  Morning: [],
  Day: [],
  Evening: [],
});

const saving = ref(false);

const uniqueDoctors = computed(() => {
  return [...new Set(schemaStore.items.map((s) => s.doctor).filter(Boolean) as string[])];
});

onMounted(async () => {
  if (!schemaStore.items.length) {
    await schemaStore.fetchSchemas();
  }
  
  if (isEditing.value) {
    const rxId = route.params.id as string;
    const rx = schemaStore.items.find((s) => s.id === rxId);
    if (rx) {
      doctor.value = rx.doctor || '';
      prescribedOn.value = rx.prescribedOn || new Date().toISOString().slice(0, 10);
      isActive.value = rx.isActive;
      
      for (const key of PERIOD_ORDER) {
        const meds = rx.scheduleDocument?.[key];
        const medsArray = Array.isArray(meds) ? meds : [];
        schedule.value[key] = medsArray.map((m) => {
          const parsed = parseMedicine(m.Medicine);
          return {
            name: parsed.name,
            strength: parsed.strength,
            dose: m.Amount || '1.0',
          };
        });
      }
    } else {
      router.replace('/meds');
    }
  } else {
    isActive.value = schemaStore.items.length === 0;
  }
});

function addMed(period: PeriodKey) {
  schedule.value[period].push({ name: '', strength: '', dose: '1.0' });
}

function delMed(period: PeriodKey, index: number) {
  schedule.value[period].splice(index, 1);
}

const totalMedsCount = computed(() => {
  return Object.values(schedule.value).reduce((acc, list) => acc + list.length, 0);
});

const canSave = computed(() => {
  return doctor.value.trim() && totalMedsCount.value > 0;
});

function fmtShort(iso: string | null): string {
  if (!iso) return '—';
  const [y, m, d] = iso.split('-').map(Number);
  return `${String(d).padStart(2, '0')}.${String(m).padStart(2, '0')}.${y}`;
}

async function handleSave() {
  if (!canSave.value) return;
  saving.value = true;
  
  const scheduleDto: SchemaScheduleDto = {};
  for (const key of PERIOD_ORDER) {
    const validRows = schedule.value[key]
      .filter((r) => r.name.trim())
      .map((r): MedicationEntry => {
        const fullMedName = r.strength.trim() ? `${r.name.trim()} ${r.strength.trim()}` : r.name.trim();
        return {
          Medicine: fullMedName,
          Amount: r.dose.trim() || '1.0',
          Condition: 'None',
        };
      });
    if (validRows.length > 0) {
      scheduleDto[key] = validRows;
    }
  }
  
  try {
    if (isEditing.value) {
      const rxId = route.params.id as string;
      await schemaStore.update(rxId, {
        doctor: doctor.value.trim(),
        prescribedOn: prescribedOn.value || undefined,
        schedule: scheduleDto,
      });
      const originalRx = schemaStore.items.find((s) => s.id === rxId);
      if (isActive.value && originalRx && !originalRx.isActive) {
        await schemaStore.activate(rxId);
      }
    } else {
      await schemaStore.create({
        doctor: doctor.value.trim(),
        prescribedOn: prescribedOn.value || undefined,
        schedule: scheduleDto,
        setActive: isActive.value,
      });
    }
    router.replace('/meds');
  } catch (err) {
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <div class="screen page">
    <header class="pagebar">
      <button class="iconbtn ghost" aria-label="Скасувати" @click="router.back()">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
      </button>
      <span class="pagebar-title">{{ isEditing ? 'Редагувати' : 'Нове призначення' }}</span>
      <span style="width: 38px" />
    </header>

    <div class="scroll">
      <div class="field">
        <label>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="7.5" r="3.5"/><path d="M5 20.5a7 7 0 0 1 14 0"/><path d="M12 11v2"/><path d="M10.5 12.5h3"/>
          </svg>
          Лікар
        </label>
        <input
          v-model="doctor"
          class="inp"
          placeholder="Прізвище лікаря"
          list="doctors-list"
        />
        <datalist id="doctors-list">
          <option v-for="d in uniqueDoctors" :key="d" :value="d" />
        </datalist>
      </div>

      <div class="field">
        <label>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="4.5" width="18" height="16" rx="2.5"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="8" y1="2.5" x2="8" y2="6"/><line x1="16" y1="2.5" x2="16" y2="6"/>
          </svg>
          Дата призначення
        </label>
        <div class="date-field">
          <span>{{ fmtShort(prescribedOn) }}</span>
          <input v-model="prescribedOn" type="date" />
        </div>
      </div>

      <button
        type="button"
        :class="['activate-toggle', isActive && 'on']"
        @click="isActive = !isActive"
      >
        <span class="at-text">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 3v9"/><path d="M6.4 6.4a8 8 0 1 0 11.2 0"/>
          </svg>
          Зробити активним
        </span>
        <RxSwitch :model-value="isActive" @update:model-value="isActive = $event" />
      </button>

      <section v-for="period in PERIOD_ORDER" :key="period" class="form-period">
        <div class="fp-head">
          <svg v-if="period === 'Morning'" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
            <path d="M17 18a5 5 0 0 0-10 0"/><line x1="2" y1="18" x2="22" y2="18"/>
            <line x1="12" y1="3" x2="12" y2="6"/><line x1="5" y1="6" x2="6.8" y2="7.8"/><line x1="19" y1="6" x2="17.2" y2="7.8"/>
            <polyline points="9 9 12 6 15 9"/>
          </svg>
          <svg v-else-if="period === 'Day'" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="4.2"/>
            <line x1="12" y1="2.5" x2="12" y2="5"/><line x1="12" y1="19" x2="12" y2="21.5"/>
            <line x1="2.5" y1="12" x2="5" y2="12"/><line x1="19" y1="12" x2="21.5" y2="12"/>
            <line x1="5.5" y1="5.5" x2="7.2" y2="7.2"/><line x1="16.8" y1="16.8" x2="18.5" y2="18.5"/>
            <line x1="18.5" y1="5.5" x2="16.8" y2="7.2"/><line x1="7.2" y1="16.8" x2="5.5" y2="18.5"/>
          </svg>
          <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z"/>
          </svg>
          <span>{{ PERIOD_LABELS[period] }}</span>
          <span v-if="schedule[period].length" class="fp-count">{{ schedule[period].length }}</span>
        </div>

        <div v-for="(m, i) in schedule[period]" :key="i" class="med-edit">
          <input
            v-model="m.name"
            class="inp name"
            placeholder="Назва"
          />
          <input
            v-model="m.strength"
            class="inp strength"
            placeholder="мг"
          />
          <input
            v-model="m.dose"
            class="inp dose"
            placeholder="1.0"
          />
          <button
            type="button"
            class="iconbtn danger"
            aria-label="Видалити"
            @click="delMed(period, i)"
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 6h18"/><path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
            </svg>
          </button>
        </div>

        <button type="button" class="add-row" @click="addMed(period)">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Додати препарат
        </button>
      </section>
      <div style="height: 12px" />
    </div>

    <div class="fab-bar two">
      <button class="btn-ghost" @click="router.back()">Скасувати</button>
      <button class="btn-primary" :disabled="!canSave || saving" @click="handleSave">
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
        Зберегти
      </button>
    </div>
  </div>
</template>

<style scoped>
.screen {
  display: flex;
  flex-direction: column;
  min-height: 100svh;
  background: var(--rx-body);
  font-family: 'Manrope', system-ui, sans-serif;
  color: var(--rx-text);
}

.pagebar {
  flex: none;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px;
  border-bottom: 1px solid var(--rx-line);
}

.pagebar-title {
  font-weight: 800;
  font-size: 17px;
  letter-spacing: -0.2px;
}

.iconbtn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  border-radius: 11px;
  color: var(--rx-dim);
  background: none;
  border: none;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}

.iconbtn.ghost:active {
  background: var(--rx-card2);
  color: var(--rx-text);
}

.iconbtn.danger {
  color: var(--rx-danger);
}

.iconbtn.danger:active {
  background: rgba(231, 107, 125, 0.14);
}

.scroll {
  flex: 1;
  overflow-y: auto;
  padding: 6px 18px 18px;
  &::-webkit-scrollbar { width: 0; }
}

.field {
  margin-bottom: 16px;
}

.field label {
  display: flex;
  align-items: center;
  gap: 7px;
  color: var(--rx-dim);
  font-size: 13px;
  font-weight: 700;
  margin: 8px 2px 9px;
  & svg {
    color: var(--rx-faint);
  }
}

.inp {
  width: 100%;
  background: var(--rx-card);
  border: 1.5px solid var(--rx-line);
  border-radius: 13px;
  padding: 14px 15px;
  font-size: 15.5px;
  font-weight: 600;
  color: var(--rx-text);
  outline: none;
  transition: border-color 0.15s;
  
  &::placeholder {
    color: var(--rx-faint);
    font-weight: 500;
  }
  
  &:focus {
    border-color: var(--rx-accent-bd);
  }
}

.date-field {
  position: relative;
  background: var(--rx-card);
  border: 1.5px solid var(--rx-line);
  border-radius: 13px;
  padding: 14px 15px;
  font-size: 15.5px;
  font-weight: 700;
  color: var(--rx-text);
  display: flex;
  align-items: center;
  
  & input {
    position: absolute;
    inset: 0;
    opacity: 0;
    width: 100%;
    height: 100%;
    cursor: pointer;
  }
}

.activate-toggle {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--rx-card);
  border: 1.5px solid var(--rx-line);
  border-radius: 13px;
  padding: 13px 14px;
  margin-bottom: 22px;
  transition: border-color 0.15s, background 0.15s;
  cursor: pointer;
  color: inherit;
}

.activate-toggle.on {
  border-color: var(--rx-accent-bd);
  background: var(--rx-accent-bg);
}

.at-text {
  display: flex;
  align-items: center;
  gap: 9px;
  font-weight: 700;
  font-size: 15px;
  & svg {
    color: var(--rx-accent2);
  }
}

.form-period {
  margin-bottom: 18px;
}

.fp-head {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--rx-accent2);
  font-weight: 800;
  font-size: 13px;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  margin-bottom: 10px;
}

.fp-count {
  background: var(--rx-accent-bg);
  color: var(--rx-accent2);
  border-radius: 20px;
  padding: 0 8px;
  font-size: 12px;
}

.med-edit {
  display: flex;
  gap: 7px;
  align-items: center;
  margin-bottom: 8px;
}

.med-edit .name {
  flex: 1;
  min-width: 0;
  padding: 11px 12px;
}

.med-edit .strength {
  width: 64px;
  flex: none;
  padding: 11px 8px;
  text-align: center;
}

.med-edit .dose {
  width: 52px;
  flex: none;
  padding: 11px 6px;
  text-align: center;
  color: var(--rx-accent2);
  font-weight: 800;
}

.add-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
  padding: 11px;
  border: 1.5px dashed var(--rx-line2);
  border-radius: 12px;
  color: var(--rx-dim);
  font-weight: 700;
  font-size: 14px;
  background: none;
  cursor: pointer;
  
  &:active {
    background: var(--rx-card);
    color: var(--rx-text);
  }
}

.fab-bar {
  flex: none;
  padding: 12px 18px calc(12px + env(safe-area-inset-bottom));
  background: linear-gradient(180deg, transparent, var(--rx-body) 30%);
  border-top: 1px solid var(--rx-line);
  display: flex;
  gap: 10px;
}

.btn-primary {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 52px;
  border-radius: 15px;
  font-weight: 800;
  font-size: 15.5px;
  color: #0b0a1c;
  background: linear-gradient(160deg, var(--rx-accent2), var(--rx-accent));
  white-space: nowrap;
  box-shadow: 0 10px 26px rgba(141, 140, 245, 0.36);
  border: none;
  cursor: pointer;
  font-family: 'Manrope', system-ui, sans-serif;
  
  &:disabled {
    opacity: 0.4;
    box-shadow: none;
    cursor: not-allowed;
  }
}

.btn-ghost {
  flex: none;
  padding: 0 22px;
  height: 52px;
  border-radius: 15px;
  font-weight: 700;
  font-size: 15px;
  color: var(--rx-dim);
  background: var(--rx-card2);
  border: 1px solid var(--rx-line);
  cursor: pointer;
  font-family: 'Manrope', system-ui, sans-serif;
}
</style>
