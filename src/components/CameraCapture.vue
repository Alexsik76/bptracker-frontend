<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';

const emit = defineEmits<{
  (e: 'capture', file: File): void;
  (e: 'cancel'): void;
}>();

const videoRef = ref<HTMLVideoElement | null>(null);
const stream = ref<MediaStream | null>(null);
const error = ref('');

onMounted(async () => {
  try {
    stream.value = await navigator.mediaDevices.getUserMedia({
      video: { 
        facingMode: 'environment', 
        width: { ideal: 1280 }, 
        height: { ideal: 720 } 
      }
    });
    if (videoRef.value) {
      videoRef.value.srcObject = stream.value;
    }
  } catch (err) {
    error.value = 'Не вдалося отримати доступ до камери. Перевірте дозволи.';
  }
});

onUnmounted(() => {
  stopCamera();
});

function stopCamera() {
  stream.value?.getTracks().forEach(t => t.stop());
  stream.value = null;
}

function capture() {
  if (!videoRef.value) return;

  const canvas = document.createElement('canvas');
  canvas.width = videoRef.value.videoWidth;
  canvas.height = videoRef.value.videoHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.drawImage(videoRef.value, 0, 0);
  canvas.toBlob((blob) => {
    if (blob) {
      const file = new File([blob], 'capture.jpg', { type: 'image/jpeg' });
      emit('capture', file);
    }
  }, 'image/jpeg', 0.9);
}
</script>

<template>
  <div class="camera-container">
    <div v-if="error" class="error-state">
      <p>{{ error }}</p>
      <button @click="emit('cancel')" class="btn secondary">Назад</button>
    </div>
    
    <div v-else class="video-wrapper">
      <video ref="videoRef" autoplay playsinline muted class="camera-video"></video>
      <div class="overlay">
        <div class="focus-box"></div>
        <p class="hint">Наведіть на екран тонометра</p>
      </div>
      
      <div class="controls">
        <button @click="emit('cancel')" class="control-btn cancel">Скасувати</button>
        <button @click="capture" class="capture-btn">
          <div class="inner-circle"></div>
        </button>
        <div class="spacer"></div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.camera-container {
  position: fixed;
  inset: 0;
  background: black;
  z-index: 100;
  display: flex;
  flex-direction: column;
}

.error-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: white;
  padding: var(--space-6);
  text-align: center;
  gap: var(--space-4);
}

.video-wrapper {
  position: relative;
  flex: 1;
  overflow: hidden;
}

.camera-video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

.focus-box {
  width: 280px;
  height: 200px;
  border: 2px solid white;
  border-radius: var(--radius-lg);
  box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.5);
}

.hint {
  color: white;
  margin-top: var(--space-4);
  font-size: var(--text-sm);
  background: rgba(0, 0, 0, 0.6);
  padding: var(--space-1) var(--space-3);
  border-radius: var(--radius-sm);
}

.controls {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: var(--space-8);
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.8));
}

.control-btn {
  color: white;
  font-size: var(--text-base);
}

.capture-btn {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
}

.inner-circle {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  border: 2px solid black;
}

.spacer {
  width: 80px;
}

.btn.secondary {
  border: 1px solid white;
  color: white;
  padding: var(--space-2) var(--space-6);
  border-radius: var(--radius-md);
}
</style>
