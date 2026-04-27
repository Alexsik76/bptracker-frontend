<script setup lang="ts">
import { onMounted, onUnmounted, watch } from 'vue';
import { ref } from 'vue';
import {
  Chart,
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Legend,
  Tooltip,
} from 'chart.js';

Chart.register(LineController, LineElement, PointElement, LinearScale, CategoryScale, Legend, Tooltip);
import type { Measurement } from '../types/api';

const props = defineProps<{
  data: Measurement[];
}>();

const chartRef = ref<HTMLCanvasElement | null>(null);
let chart: Chart | null = null;

// Custom plugin: draws horizontal reference lines for BP thresholds
const refLinesPlugin = {
  id: 'bpRefLines',
  afterDraw(ch: any) {
    const ctx = ch.ctx as CanvasRenderingContext2D;
    const yAxis = ch.scales['y'];
    const xAxis = ch.scales['x'];
    if (!yAxis || !xAxis) return;

    const drawLine = (value: number, color: string) => {
      const y = yAxis.getPixelForValue(value);
      if (y < yAxis.top || y > yAxis.bottom) return;
      ctx.save();
      ctx.setLineDash([5, 5]);
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(xAxis.left, y);
      ctx.lineTo(xAxis.right, y);
      ctx.stroke();
      ctx.restore();
    };

    drawLine(140, 'rgba(239,68,68,0.4)');   // hypertension II threshold
    drawLine(120, 'rgba(245,158,11,0.4)');   // elevated threshold
  },
};

onMounted(() => {
  if (!chartRef.value) return;

  chart = new Chart(chartRef.value, {
    type: 'line',
    plugins: [refLinesPlugin as any],
    data: {
      datasets: [
        {
          label: 'СИС',
          data: [],
          borderColor: '#1d4ed8',
          backgroundColor: '#1d4ed8',
          tension: 0.3,
          yAxisID: 'y',
          pointRadius: 3,
          pointHoverRadius: 5,
        },
        {
          label: 'ДІА',
          data: [],
          borderColor: '#60a5fa',
          backgroundColor: '#60a5fa',
          tension: 0.3,
          yAxisID: 'y',
          pointRadius: 3,
          pointHoverRadius: 5,
        },
        {
          label: 'Пульс',
          data: [],
          borderColor: '#10b981',
          backgroundColor: '#10b981',
          tension: 0.3,
          yAxisID: 'y1',
          borderDash: [5, 5],
          pointRadius: 2,
          pointHoverRadius: 4,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: {
          position: 'top',
          labels: {
            boxWidth: 20,
            boxHeight: 2,
            padding: 16,
            font: { size: 11 },
            usePointStyle: false,
          },
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: {
            font: { size: 10 },
            maxRotation: 0,
            maxTicksLimit: 10,
          },
        },
        y: {
          type: 'linear',
          display: true,
          position: 'left',
          min: 40,
          max: 200,
          ticks: { font: { size: 10 } },
          grid: {
            color: 'rgba(128,128,128,0.08)',
          },
        },
        y1: {
          type: 'linear',
          display: true,
          position: 'right',
          min: 40,
          max: 150,
          grid: { drawOnChartArea: false },
          ticks: { font: { size: 10 } },
        },
      },
    },
  });

  updateChart();
});

onUnmounted(() => {
  chart?.destroy();
  chart = null;
});

// No deep: true — measurements arrive as a new array reference from the store,
// so a shallow watch on the array reference is sufficient.
watch(() => props.data, updateChart);

function buildLabel(m: Measurement, prev: Measurement | undefined): string | string[] {
  const d = new Date(m.recordedAt);
  const dayStr = d.toLocaleDateString('uk-UA', { day: '2-digit', month: '2-digit' });
  const timeStr = d.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' });

  if (!prev) return [dayStr, timeStr];

  const prevDay = new Date(prev.recordedAt).toLocaleDateString('uk-UA', { day: '2-digit', month: '2-digit' });
  // Same day: show only time to avoid duplicate date labels
  return prevDay === dayStr ? timeStr : [dayStr, timeStr];
}

function updateChart() {
  if (!chart) return;

  const sorted = [...props.data]
    .sort((a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime())
    .slice(-100);

  const labels = sorted.map((m, i) => buildLabel(m, sorted[i - 1]));

  chart.data.labels = labels;
  chart.data.datasets[0]!.data = sorted.map(m => m.sys);
  chart.data.datasets[1]!.data = sorted.map(m => m.dia);
  chart.data.datasets[2]!.data = sorted.map(m => m.pulse);
  chart.update();
}
</script>

<template>
  <div class="chart-container">
    <canvas ref="chartRef"></canvas>
  </div>
</template>

<style scoped>
.chart-container {
  height: 260px;
  width: 100%;
}
</style>
