import { ApiClient } from './api.js';
import { UIManager } from './ui.js';
import { ChartManager } from './chartManager.js';
import { AuthManager } from './auth.js';

class App {
    constructor() {
        try {
            console.log('App initializing...');
            this.api = new ApiClient();
            this.ui = new UIManager();
            this.chart = new ChartManager('bp-chart');
            this.auth = new AuthManager(this.api);
            
            // Set up handlers
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
            this.ui.onLogout = () => this.auth.logout();
            
            this._initEventListeners();
            this._initScanListeners();
            this._initAuthListeners();
            
            this.initApp();
            
            console.log('App initialized successfully');
        } catch (e) {
            console.error('Critical app initialization error:', e);
        }
    }

    async initApp() {
        const user = await this.auth.init();
        if (user) {
            this.ui.showAuthSection(false);
            this.ui.updateUserUI(user);
            await this.refresh();
            this._checkSharedImage();
        } else {
            this.ui.showAuthSection(true);
        }
    }

    async refresh() {
        if (!this.auth.user) return;
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
            if (error.message?.includes('401')) {
                this.auth.logout();
            } else {
                this.ui.showStatus('Помилка оновлення даних', true);
            }
        }
    }

    async _initAuthListeners() {
        const authForm = document.getElementById('auth-form');
        const magicLinkBtn = document.getElementById('magic-link-btn');
        const emailInput = document.getElementById('auth-email');

        authForm?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = emailInput.value;
            if (!email) return;

            try {
                this.ui.setAuthLoading(true);
                // Try login first
                try {
                    await this.auth.login();
                } catch (err) {
                    console.log('Login failed, trying registration...', err);
                    // If login failed (e.g. no keys), try register
                    await this.auth.register(email);
                }
                
                await this.initApp();
                this.ui.showStatus('Успішний вхід!');
            } catch (error) {
                console.error('Auth error:', error);
                this.ui.showStatus('Помилка автентифікації', true);
            } finally {
                this.ui.setAuthLoading(false);
            }
        });

        magicLinkBtn?.addEventListener('click', async () => {
            const email = emailInput.value;
            if (!email) {
                this.ui.showStatus('Введіть email для посилання', true);
                return;
            }

            try {
                await this.auth.requestMagicLink(email);
                this.ui.showStatus('Посилання надіслано! Перевірте консоль бекенду.');
            } catch (error) {
                this.ui.showStatus('Не вдалося надіслати посилання', true);
            }
        });
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
        const captureBtn = document.getElementById('camera-capture-btn');
        const cameraCloseBtn = document.getElementById('camera-close-btn');

        scanBtn?.addEventListener('click', () => {
            if (navigator.mediaDevices?.getUserMedia) {
                this._openCamera();
            } else {
                scanInput?.click();
            }
        });

        scanInput?.addEventListener('change', async (e) => {
            const file = e.target.files?.[0];
            if (file) await this._analyzeAndFill(file);
            scanInput.value = '';
        });

        captureBtn?.addEventListener('click', () => this._captureAndAnalyze());
        cameraCloseBtn?.addEventListener('click', () => this._closeCamera());
    }

    async _openCamera() {
        try {
            this._cameraStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
            });
            const track = this._cameraStream.getVideoTracks()[0];
            try { await track.applyConstraints({ advanced: [{ torch: false }] }); } catch {}
            document.getElementById('camera-video').srcObject = this._cameraStream;
            this.ui.showCameraModal();
        } catch {
            document.getElementById('scan-input')?.click();
        }
    }

    _closeCamera() {
        this._cameraStream?.getTracks().forEach(t => t.stop());
        this._cameraStream = null;
        document.getElementById('camera-video').srcObject = null;
        this.ui.hideCameraModal();
    }

    _captureAndAnalyze() {
        const video = document.getElementById('camera-video');
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext('2d').drawImage(video, 0, 0);
        this._closeCamera();
        canvas.toBlob(async (blob) => {
            const file = new File([blob], 'capture.jpg', { type: 'image/jpeg' });
            this.ui.showModal();
            await this._analyzeAndFill(file);
        }, 'image/jpeg', 0.9);
    }

    async _analyzeAndFill(file) {
        this.ui.showScanOverlay();
        try {
            const result = await this.api.analyzeImage(file);
            document.querySelector('[name="sys"]').value = result.sys;
            document.querySelector('[name="dia"]').value = result.dia;
            document.querySelector('[name="pulse"]').value = result.pulse;
            this.ui.showStatus('Дані розпізнано! Перевірте і збережіть.');
        } catch (err) {
            this.ui.showStatus(err.message || 'Помилка розпізнавання', true);
        } finally {
            this.ui.hideScanOverlay();
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
