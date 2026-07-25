<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import type { FieldConfig } from '../utils/ocrFields';

const props = defineProps<{
  imageUrl: string | null;
  beamActive: boolean;
  beamY: number;
  beamOpacity: number;
  canHighlight: boolean;
  showZoomBadge: boolean;
  focusedField: string | null;
  fieldConfigs: FieldConfig[];
}>();

const { t } = useI18n();
const zoomOpen = ref(false);
</script>

<template>
  <div class="photo-wrap" @click="zoomOpen = true">
    <img v-if="props.imageUrl" :src="props.imageUrl" class="photo-img" alt="" />

    <!-- Beam overlay -->
    <div
      v-if="props.beamActive"
      class="beam-root"
      :style="{ opacity: props.beamOpacity }"
      aria-hidden="true"
    >
      <div class="beam-glow" :style="{ top: props.beamY + '%' }" />
      <div class="beam-line" :style="{ top: props.beamY + '%' }" />
    </div>

    <!-- Field highlights (appear after beam, driven by focused field) -->
    <template v-if="props.canHighlight">
      <div
        v-for="f in props.fieldConfigs"
        :key="f.key"
        class="field-highlight"
        :style="{
          left: f.highlightX + '%',
          top: f.highlightY + '%',
          borderColor: f.color,
          boxShadow: `0 0 24px ${f.color}44, inset 0 0 12px ${f.color}22`,
          opacity: props.focusedField === f.key ? 1 : 0,
        }"
        aria-hidden="true"
      />
    </template>

    <!-- Zoom badge (appears after beam) -->
    <div v-if="props.showZoomBadge" class="zoom-badge" aria-hidden="true">
      <svg
width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="15 3 21 3 21 9" />
        <polyline points="9 21 3 21 3 15" />
        <line x1="21" y1="3" x2="14" y2="10" />
        <line x1="3" y1="21" x2="10" y2="14" />
      </svg>
      {{ t('localOcr.tapToZoom') }}
    </div>
  </div>

  <!-- Fullscreen zoom overlay -->
  <Teleport to="body">
    <div v-if="zoomOpen" class="zoom-overlay" @click="zoomOpen = false">
      <img :src="props.imageUrl ?? undefined" class="zoom-img" alt="" />
      <p class="zoom-hint">{{ t('localOcr.tapToClose') }}</p>
    </div>
  </Teleport>
</template>

<style scoped>
.photo-wrap {
  position: relative;
  width: 100%;
  height: 33vh;
  border-radius: 18px;
  overflow: hidden;
  background: #000;
  box-shadow:
    0 6px 24px rgba(0, 0, 0, 0.4),
    inset 0 0 0 1px rgba(255, 255, 255, 0.04);
  cursor: pointer;
  flex-shrink: 0;
}

.photo-img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center center;
}

.beam-root {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.beam-line {
  position: absolute;
  left: 0;
  right: 0;
  height: 1.5px;
  transform: translateY(-50%);
  background: linear-gradient(90deg, transparent, #a39bff, transparent);
  box-shadow: 0 0 12px #a39bff;
}

.beam-glow {
  position: absolute;
  left: 0;
  right: 0;
  height: 60px;
  transform: translateY(-50%);
  background: linear-gradient(180deg, transparent 0%, rgba(163, 155, 255, 0.2) 50%, transparent 100%);
}

.field-highlight {
  position: absolute;
  width: 90px;
  height: 50px;
  transform: translate(-50%, -50%);
  border: 1.5px solid transparent;
  border-radius: 8px;
  pointer-events: none;
  transition: opacity 0.25s ease-out;
}

.zoom-badge {
  position: absolute;
  top: 10px;
  right: 10px;
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 5px 10px;
  background: rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(8px);
  border-radius: 14px;
  font-size: 11px;
  font-weight: 500;
  color: #fff;
  pointer-events: none;
  animation: fade-in 0.3s ease-out;
}

@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

.zoom-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: rgba(0, 0, 0, 0.92);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  cursor: pointer;
  animation: fade-in 0.2s ease-out;
}

.zoom-img {
  max-width: 92%;
  max-height: 75%;
  object-fit: contain;
  border-radius: 12px;
  transform: scale(1.4);
}

.zoom-hint {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.55);
  pointer-events: none;
}
</style>
