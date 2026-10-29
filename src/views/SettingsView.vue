<script setup lang="ts">
import { computed } from 'vue';
import { useActivityQuery } from '../composables/useActivityQuery';
import SegmentedControl from '../components/ui/SegmentedControl.vue';
import SettingsAi from '../components/settings/SettingsAi.vue';
import SettingsParams from '../components/settings/SettingsParams.vue';
import RecipesPanel from '../components/settings/RecipesPanel.vue';

type SettingsTab = 'ai' | 'params' | 'recipes';

const TABS: { value: SettingsTab; label: string }[] = [
  { value: 'ai', label: 'AI models' },
  { value: 'params', label: 'Parameters' },
  { value: 'recipes', label: 'Nutrition recipes' },
];

const { str, patch } = useActivityQuery();

const tab = computed<SettingsTab>(() => {
  const t = str('tab');
  return TABS.some((o) => o.value === t) ? (t as SettingsTab) : 'ai';
});

function setTab(value: SettingsTab) {
  patch({ tab: value === 'ai' ? null : value });
}
</script>

<template>
  <div class="settings-view">
    <div class="view-header">
      <h1 class="view-title">Settings</h1>
    </div>

    <div class="settings-controls">
      <SegmentedControl :options="TABS" :model-value="tab" label="Settings section" @update:model-value="setTab" />
    </div>

    <SettingsAi v-if="tab === 'ai'" />
    <SettingsParams v-else-if="tab === 'params'" />
    <RecipesPanel v-else />
  </div>
</template>

<style scoped>
.settings-view {
  display: flex;
  flex-direction: column;
  gap: var(--bpt-sp-4);
  min-width: 0;
}

.view-title {
  font-size: var(--bpt-fs-title-page);
  line-height: var(--bpt-lh-title-page);
  font-weight: 500;
}

.settings-controls {
  display: flex;
  align-items: flex-end;
  gap: var(--bpt-sp-4);
  flex-wrap: wrap;
}
</style>
