<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import Chart from 'chart.js/auto';
import type { Measurement } from '../types/api';

const props = defineProps<{
  data: Measurement[];
}>();

const chartRef = ref<HTMLCanvasElement | null>(null);
let chart: Chart | null = null;

onMounted(() => {
  if (chartRef.value) {
    chart = new Chart(chartRef.value, {
      type: 'line',
      data: {
        datasets: [
          {
            label: 'СИС',
            data: [],
            borderColor: '#2563eb',
            backgroundColor: '#2563eb',
            tension: 0.3,
            yAxisID: 'y',
          },
          {
            label: 'ДІА',
            data: [],
            borderColor: '#3b82f6',
            backgroundColor: '#3b82f6',
            tension: 0.3,
            yAxisID: 'y',
          },
          {
            label: 'Пульс',
            data: [],
            borderColor: '#10b981',
            backgroundColor: '#10b981',
            tension: 0.3,
            yAxisID: 'y1',
            borderDash: [5, 5],
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false,
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { font: { size: 10 } },
          },
          y: {
            type: 'linear',
            display: true,
            position: 'left',
            min: 40,
            max: 200,
            title: { display: true, text: 'Тиск' },
          },
          y1: {
            type: 'linear',
            display: true,
            position: 'right',
            min: 40,
            max: 150,
            grid: { drawOnChartArea: false },
            title: { display: true, text: 'Пульс' },
          },
        },
      },
    });
    updateChart();
  }
});

watch(() => props.data, updateChart, { deep: true });

function updateChart() {
  if (!chart) return;

  const sortedData = [...props.data]
    .sort((a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime())
    .slice(-30);

  const labels = sortedData.map(m => new Date(m.recordedAt).toLocaleDateString('uk-UA', { day: '2-digit', month: '2-digit' }));
  
  chart.data.labels = labels;
  chart.data.datasets[0]!.data = sortedData.map(m => m.sys);
  chart.data.datasets[1]!.data = sortedData.map(m => m.dia);
  chart.data.datasets[2]!.data = sortedData.map(m => m.pulse);
  
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
  height: 250px;
  width: 100%;
}
</style>
