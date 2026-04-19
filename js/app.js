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
            this.ui.onSync = async () => {
                try {
                    await this.ui.setSyncLoading(true);
                    const result = await this.api.syncGoogleSheets();
                    this.ui.showStatus(result);
                } catch (error) {
                    this.ui.showStatus('Помилка синхронізації', true);
                } finally {
                    await this.ui.setSyncLoading(false);
                }
            };
            
            this._initEventListeners();
            this._initScanListeners();
            this.refresh();
            this._checkSharedImage();
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

    _initScanListeners() {
        const scanBtn = document.getElementById('scan-btn');
        const scanInput = document.getElementById('scan-input');
        if (!scanBtn || !scanInput) return;

        scanBtn.addEventListener('click', () => scanInput.click());
        scanInput.addEventListener('change', async (e) => {
            const file = e.target.files?.[0];
            if (file) await this._analyzeAndFill(file);
            scanInput.value = '';
        });
    }

    async _analyzeAndFill(file) {
        this.ui.setScanLoading(true);
        try {
            const result = await this.api.analyzeImage(file);
            document.querySelector('[name="sys"]').value = result.sys;
            document.querySelector('[name="dia"]').value = result.dia;
            document.querySelector('[name="pulse"]').value = result.pulse;
            this.ui.showStatus('Дані розпізнано! Перевірте і збережіть.');
        } catch (err) {
            this.ui.showStatus(err.message || 'Помилка розпізнавання', true);
        } finally {
            this.ui.setScanLoading(false);
        }
    }

    async _checkSharedImage() {
        if (!location.search.includes('shared=1')) return;
        history.replaceState({}, '', location.pathname);
        try {
            const cache = await caches.open('share-target-v1');
            const response = await cache.match('/shared-image');
            if (!response) return;
            const blob = await response.blob();
            await cache.delete('/shared-image');
            const file = new File([blob], 'shared.jpg', { type: blob.type || 'image/jpeg' });
            this.ui.showModal();
            await this._analyzeAndFill(file);
        } catch (err) {
            console.error('Share target error:', err);
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

document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
});
