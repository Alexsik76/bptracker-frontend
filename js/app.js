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
            this.ui.showStatus('Error updating data', true);
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
            this.ui.showStatus('Measurement saved successfully!');
            await this.refresh();
        } catch (error) {
            this.ui.showStatus('Error saving measurement', true);
        }
    }

    _initEventListeners() {
        const addBtn = document.getElementById('add-btn');
        const closeModalBtn = document.getElementById('close-modal');
        const form = document.getElementById('bp-form');
        const modal = document.getElementById('modal');

        if (addBtn) addBtn.onclick = () => this.ui.showModal();
        if (closeModalBtn) closeModalBtn.onclick = () => this.ui.hideModal();
        if (form) form.onsubmit = (e) => this.handleFormSubmit(e);
        
        window.onclick = (e) => {
            if (e.target === modal) this.ui.hideModal();
        };
    }
}

window.onload = () => new App();
