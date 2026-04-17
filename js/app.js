import { ApiClient } from './api.js';
import { UIManager } from './ui.js';
import { ChartManager } from './chartManager.js';

class App {
    constructor() {
        try {
            console.log('App initializing...');
            this.api = new ApiClient();
            this.ui = new UIManager();
            this.chart = new ChartManager('bp-chart');
            
            // Set up delete handler
            this.ui.onDelete = async (id) => {
                if (confirm('Ви впевнені, що хочете видалити цей замір?')) {
                    try {
                        await this.api.deleteMeasurement(id);
                        this.ui.showStatus('Замір успішно видалено!');
                        await this.refresh();
                    } catch (error) {
                        this.ui.showStatus('Помилка при видаленні', true);
                    }
                }
            };
            
            this._initEventListeners();
            this.refresh();
            console.log('App initialized successfully');
        } catch (e) {
            console.error('Critical app initialization error:', e);
        }
    }

    async refresh() {
        try {
            const [measurements, schema] = await Promise.all([
                this.api.getMeasurements(),
                this.api.getActiveSchema()
            ]);
            
            this.ui.renderMeasurements(measurements);
            this.chart.update(measurements);
            this.ui.renderSchema(schema);
        } catch (error) {
            console.warn('Refresh failed:', error);
            this.ui.showStatus('Помилка оновлення даних', true);
        }
    }

    async handleFormSubmit(e) {
        e.preventDefault();
        console.log('Form submitted');
        
        const formData = new FormData(e.target);
        const sysVal = formData.get('sys');
        const diaVal = formData.get('dia');
        const pulseVal = formData.get('pulse');

        if (!sysVal && !diaVal && !pulseVal) {
            console.log('Empty form, closing modal');
            this.ui.hideModal();
            return;
        }

        if (!sysVal || !diaVal || !pulseVal) {
            this.ui.showStatus('Будь ласка, заповніть усі поля', true);
            return;
        }

        const data = {
            sys: parseInt(sysVal),
            dia: parseInt(diaVal),
            pulse: parseInt(pulseVal)
        };

        try {
            console.log('Sending data to API:', data);
            await this.api.addMeasurement(data);
            console.log('Data saved');
            this.ui.hideModal();
            e.target.reset();
            this.ui.showStatus('Замір успішно збережено!');
            await this.refresh();
        } catch (error) {
            console.error('Save failed:', error);
            this.ui.showStatus('Помилка при збереженні', true);
            // Навіть при помилці краще закрити вікно, якщо користувач ввів дані, 
            // але ми вже показали статус помилки. 
            // Або залишити - залежить від юзеркейсу. Залишимо відкритим для виправлення.
        }
    }

    _initEventListeners() {
        const addBtn = document.getElementById('add-btn');
        const closeModalBtn = document.getElementById('close-modal');
        const form = document.getElementById('bp-form');
        const modal = document.getElementById('modal');

        if (addBtn) {
            addBtn.addEventListener('click', () => {
                console.log('Add button clicked');
                this.ui.showModal();
            });
        }

        if (closeModalBtn) {
            closeModalBtn.addEventListener('click', () => {
                console.log('Cancel button clicked');
                this.ui.hideModal();
                if (form) form.reset();
            });
        }

        if (form) {
            form.addEventListener('submit', (e) => this.handleFormSubmit(e));
        }
        
        window.addEventListener('click', (e) => {
            if (e.target === modal) {
                console.log('Backdrop clicked');
                this.ui.hideModal();
                if (form) form.reset();
            }
        });

        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal && modal.style.display !== 'none') {
                console.log('Escape pressed');
                this.ui.hideModal();
                if (form) form.reset();
            }
        });
    }
}

// Використовуємо DOMContentLoaded замість onload для швидшого спрацювання
document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
});
