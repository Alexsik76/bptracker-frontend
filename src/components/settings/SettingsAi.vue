<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import {
  adminSettingsApi,
  AI_SETTING_KEYS,
  AI_MODEL_KEYS,
  type AiTestResult,
  type GeminiModel,
} from '../../services/adminSettings';
import { useAdminSettings } from '../../composables/useAdminSettings';
import { errorMessage, formatDuration } from '../../utils/activityFormat';
import SettingField from './SettingField.vue';

const { settings, loading, error, load, replace } = useAdminSettings();

const models = ref<GeminiModel[] | null>(null);
const modelsError = ref<string | null>(null);

const testing = ref<Record<string, boolean>>({});
const results = ref<Record<string, AiTestResult | { error: string }>>({});

const aiSettings = computed(() =>
  AI_SETTING_KEYS.map((key) => settings.value.find((s) => s.key === key)).filter((s) => s !== undefined)
);

function isModelKey(key: string): boolean {
  return (AI_MODEL_KEYS as readonly string[]).includes(key);
}

async function loadModels() {
  modelsError.value = null;
  try {
    models.value = await adminSettingsApi.listAiModels();
  } catch (e) {
    // Falls back to free-text inputs
    models.value = null;
    modelsError.value = errorMessage(e);
  }
}

async function testConnection(key: string, model: string) {
  testing.value = { ...testing.value, [key]: true };
  try {
    results.value = { ...results.value, [key]: await adminSettingsApi.testAi(model || undefined) };
  } catch (e) {
    results.value = { ...results.value, [key]: { error: errorMessage(e) } };
  } finally {
    testing.value = { ...testing.value, [key]: false };
  }
}

function resultOf(key: string): AiTestResult | null {
  const r = results.value[key];
  return r && 'ok' in r ? r : null;
}

function failureOf(key: string): string {
  return results.value[key]?.error || 'Connection test failed';
}

onMounted(() => {
  load();
  loadModels();
});
</script>

<template>
  <p v-if="loading" class="state muted">Loading data...</p>
  <div v-else-if="error" class="state error">
    {{ error }}
    <button type="button" class="btn btn-outlined btn-sm" @click="load">Retry</button>
  </div>
  <p v-else-if="aiSettings.length === 0" class="state muted">No AI settings are registered on the server</p>

  <div v-else class="ai-list">
    <p v-if="modelsError" class="models-warning muted" role="status">
      Model list unavailable ({{ modelsError }}). Enter model names manually.
      <button type="button" class="btn btn-sm" @click="loadModels">Retry</button>
    </p>

    <SettingField
      v-for="s in aiSettings"
      :key="s.key"
      :setting="s"
      :models="isModelKey(s.key) ? models : null"
      @update="replace"
    >
      <template v-if="isModelKey(s.key)" #actions="{ draft, busy }">
        <button
          type="button"
          class="btn btn-tonal btn-sm"
          :disabled="busy || testing[s.key] || !draft"
          @click="testConnection(s.key, draft)"
        >
          {{ testing[s.key] ? 'Testing...' : 'Test connection' }}
        </button>
        <span v-if="resultOf(s.key)?.ok" class="badge b-ok mono" role="status">
          ✓ {{ formatDuration(resultOf(s.key)!.latency_ms) }}
        </span>
        <span v-else-if="results[s.key]" class="test-error" role="status">
          × {{ failureOf(s.key) }}
        </span>
      </template>
    </SettingField>
  </div>
</template>

<style scoped>
.ai-list {
  display: flex;
  flex-direction: column;
  gap: var(--bpt-sp-3);
}

.state {
  padding: var(--bpt-sp-6);
  text-align: center;
}

.state.error,
.test-error {
  color: var(--md-sys-color-error);
}

.test-error {
  font-size: var(--bpt-fs-cell);
  word-break: break-word;
}

.models-warning {
  display: flex;
  align-items: center;
  gap: var(--bpt-sp-2);
  font-size: var(--bpt-fs-cell);
}
</style>
