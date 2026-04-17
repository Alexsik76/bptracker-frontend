import { ApiClient } from './api.js';
import { UIManager } from './ui.js';
import { ChartManager } from './chartManager.js';

class App {
    constructor() {
        this.api = new ApiClient();
        this.ui = new UIManager();
        this.chart = new ChartManager('bp-chart');
        
        this._initEventListeners();
        this.refresh();
    }

    async refresh() {
        try {
            const measurements = await this.api.getMeasurements();
            const schema = await this.api.getActiveSchema();
            
            this.ui.renderMeasurements(measurements);
            this.chart.update(measurements);
            this.ui.renderSchema(schema);
        } catch (error) {
            this.ui.showStatus('Помилка оновлення даних', true);
        }
    }

    async handleFormSubmit(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = {
            sys: parseInt(formData.get('sys')),
            dia: parseInt(formData.get('dia')),
            pulse: parseInt(formData.get('pulse'))
        };

        try {
            await this.api.addMeasurement(data);
            this.ui.hideModal();
            e.target.reset();
            this.ui.showStatus('Замір збережено успішно!');
            await this.refresh();
        } catch (error) {
            this.ui.showStatus('Помилка при збереженні', true);
        }
    }

    _initEventListeners() {
        document.getElementById('add-btn').onclick = () => this.ui.showModal();
        document.getElementById('close-modal').onclick = () => this.ui.hideModal();
        document.getElementById('bp-form').onsubmit = (e) => this.handleFormSubmit(e);
        
        // Закриття модалки при кліку поза нею
        window.onclick = (e) => {
            if (e.target === document.getElementById('modal')) this.ui.hideModal();
        };
    }
}

// Запуск програми
window.onload = () => new App();
