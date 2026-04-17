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
        
        const sysVal = formData.get('sys');
        const diaVal = formData.get('dia');
        const pulseVal = formData.get('pulse');

        // If all fields are empty, just close the modal (treat as cancel)
        if (!sysVal && !diaVal && !pulseVal) {
            this.ui.hideModal();
            return;
        }

        // Basic validation for partial data
        if (!sysVal || !diaVal || !pulseVal) {
            this.ui.showStatus('Please fill all fields or clear all to cancel', true);
            return;
        }

        const data = {
            sys: parseInt(sysVal),
            dia: parseInt(diaVal),
            pulse: parseInt(pulseVal)
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

        if (addBtn) {
            addBtn.addEventListener('click', () => this.ui.showModal());
        }

        if (closeModalBtn) {
            closeModalBtn.addEventListener('click', () => {
                this.ui.hideModal();
                if (form) form.reset();
            });
        }

        if (form) {
            form.addEventListener('submit', (e) => this.handleFormSubmit(e));
        }
        
        window.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.ui.hideModal();
                if (form) form.reset();
            }
        });

        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !modal.classList.contains('hidden')) {
                this.ui.hideModal();
                if (form) form.reset();
            }
        });
    }
}

window.onload = () => new App();
