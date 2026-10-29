<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { AI_SETTING_KEYS } from '../../services/adminSettings';
import { useAdminSettings } from '../../composables/useAdminSettings';
import SettingField from './SettingField.vue';

const { settings, loading, error, load, replace } = useAdminSettings();

const otherSettings = computed(() =>
  settings.value.filter((s) => !(AI_SETTING_KEYS as readonly string[]).includes(s.key))
);

onMounted(load);
</script>

<template>
  <p v-if="loading" class="state muted">Loading data...</p>
  <div v-else-if="error" class="state error">
    {{ error }}
    <button type="button" class="btn btn-outlined btn-sm" @click="load">Retry</button>
  </div>
  <p v-else-if="otherSettings.length === 0" class="state muted">No other parameters are registered on the server</p>

  <div v-else class="params-list">
    <SettingField v-for="s in otherSettings" :key="s.key" :setting="s" @update="replace" />
  </div>
</template>

<style scoped>
.params-list {
  display: flex;
  flex-direction: column;
  gap: var(--bpt-sp-3);
}

.state {
  padding: var(--bpt-sp-6);
  text-align: center;
}

.state.error {
  color: var(--md-sys-color-error);
}
</style>
