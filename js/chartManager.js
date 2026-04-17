export class ChartManager {
    constructor(canvasId) {
        this.ctx = document.getElementById(canvasId).getContext('2d');
        this.chart = this._initChart();
    }

    update(measurements) {
        const sorted = [...measurements].sort((a, b) => new Date(a.recordedAt) - new Date(b.recordedAt));
        
        this.chart.data.labels = sorted.map(m => new Date(m.recordedAt).toLocaleDateString());
        this.chart.data.datasets[0].data = sorted.map(m => m.sys);
        this.chart.data.datasets[1].data = sorted.map(m => m.dia);
        this.chart.data.datasets[2].data = sorted.map(m => m.pulse);
        
        this.chart.update();
    }

    _initChart() {
        return new Chart(this.ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [
                    {
                        label: 'SYS',
                        borderColor: '#ef4444',
                        backgroundColor: '#ef4444',
                        data: [],
                        tension: 0.3
                    },
                    {
                        label: 'DIA',
                        borderColor: '#3b82f6',
                        backgroundColor: '#3b82f6',
                        data: [],
                        tension: 0.3
                    },
                    {
                        label: 'Pulse',
                        borderColor: '#10b981',
                        backgroundColor: '#10b981',
                        data: [],
                        borderDash: [5, 5],
                        tension: 0.3,
                        yAxisID: 'y1'
                    }
                ]
            },
            options: {
                responsive: true,
                interaction: { mode: 'index', intersect: false },
                scales: {
                    y: { type: 'linear', display: true, position: 'left', title: { display: true, text: 'Тиск (mmHg)' } },
                    y1: { type: 'linear', display: true, position: 'right', grid: { drawOnChartArea: false }, title: { display: true, text: 'Пульс (bpm)' } }
                }
            }
        });
    }
}
