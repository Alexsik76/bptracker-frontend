import { ApiClient } from './api.js';
import { UIManager } from './ui.js';
import { ChartManager } from './chartManager.js';
import { AuthManager } from './auth.js';

class App {
    constructor() {
        try {
            this.api = new ApiClient();
            this.ui = new UIManager();
            this.chart = new ChartManager('bp-chart');
            this.auth = new AuthManager(this.api);
            this._settings = null;
            this._lastAnalysis = null;

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
            this.ui.onLogout = () => this.auth.logout();
            this.ui.onOpenSettings = () => this.ui.showSettingsModal(this.auth.user, this._settings);
            this.ui.onExport = () => this._handleExport();

            this._initEventListeners();
            this._initScanListeners();
            this._initAuthListeners();
            this._initSettingsListeners();

            this.initApp();
        } catch (e) {
            console.error('Critical app initialization error:', e);
        }
    }

    async initApp() {
        const user = await this.auth.init();
        if (user) {
            this.ui.showAuthSection(false);
            this.ui.updateUserUI(user);
            await Promise.all([this.refresh(), this._loadSettings()]);
            this._checkSharedImage();
        } else {
            this.ui.showAuthSection(true);
        }
    }

    async _loadSettings() {
        try {
            this._settings = await this.api.getSettings();
            this.ui.updateExportButton(this._settings);
        } catch {
            // settings are optional — silently ignore
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
            const email = emailInput?.value;
            if (!email) {
                this.ui.showStatus('Введіть email для посилання', true);
                return;
            }
            try {
                await this.auth.requestMagicLink(email);
                this.ui.showStatus('Посилання надіслано на email!');
            } catch (error) {
                this.ui.showStatus('Не вдалося надіслати посилання', true);
            }
        });
    }

    _initSettingsListeners() {
        const form = document.getElementById('settings-form');
        form?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const data = this.ui.getSettingsFormData();
            try {
                this.ui.setSettingsSaving(true);
                this._settings = await this.api.patchSettings(data);
                this.ui.updateExportButton(this._settings);
                this.ui.hideSettingsModal();
                this.ui.showStatus('Налаштування збережено');
            } catch (error) {
                this.ui.showStatus(error.message || 'Помилка збереження', true);
            } finally {
                this.ui.setSettingsSaving(false);
            }
        });
    }

    async _handleExport() {
        if (!this._settings?.exportEmail) {
            this.ui.showStatus('Вкажіть email у налаштуваннях', true);
            this.ui.showSettingsModal(this.auth.user, this._settings);
            return;
        }
        try {
            this.ui.setExportLoading(true);
            const result = await this.api.requestEmailExport();
            this.ui.showStatus(`Експорт надіслано на ${result.email}`);
        } catch (error) {
            this.ui.showStatus(error.message || 'Помилка експорту', true);
        } finally {
            this.ui.setExportLoading(false);
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
            if (this._lastAnalysis) {
                const fd = new FormData();
                fd.append('sys', data.sys);
                fd.append('dia', data.dia);
                fd.append('pulse', data.pulse);
                fd.append('geminiSys', this._lastAnalysis.result.sys);
                fd.append('geminiDia', this._lastAnalysis.result.dia);
                fd.append('geminiPulse', this._lastAnalysis.result.pulse);
                fd.append('image', this._lastAnalysis.file);

                console.log('Sending data to API with photo');
                await this.api.addMeasurementWithPhoto(fd);
            } else {
                console.log('Sending data to API:', data);
                await this.api.addMeasurement(data);
            }
            
            console.log('Data saved');
            this.ui.hideModal();
            e.target.reset();
            this._lastAnalysis = null;
            this.ui.showStatus('Замір успішно збережено!');
            await this.refresh();
        } catch (error) {
            console.error('Save failed:', error);
            this.ui.showStatus(error.message || 'Помилка при збереженні', true);
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

    async _preprocessImage(file) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                const maxDim = 1024;
                let width = img.width;
                let height = img.height;

                if (width > maxDim || height > maxDim) {
                    if (width > height) {
                        height *= maxDim / width;
                        width = maxDim;
                    } else {
                        width *= maxDim / height;
                        height = maxDim;
                    }
                }

                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                canvas.toBlob((blob) => {
                    resolve(new File([blob], file.name, { type: 'image/jpeg' }));
                }, 'image/jpeg', 0.85);
            };
            img.onerror = reject;
            img.src = URL.createObjectURL(file);
        });
    }

    async _analyzeAndFill(file) {
        this.ui.showScanOverlay();
        try {
            const processedFile = await this._preprocessImage(file);
            const result = await this.api.analyzeImage(processedFile);
            this._lastAnalysis = { file: processedFile, result };
            document.querySelector('[name="sys"]').value = result.sys;
            document.querySelector('[name="dia"]').value = result.dia;
            document.querySelector('[name="pulse"]').value = result.pulse;
            this.ui.showStatus('Дані розпізнано! Перевірте і збережіть.');
        } catch (err) {
            console.error('Preprocessing/Analysis error:', err);
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
                this._lastAnalysis = null;
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
                this._lastAnalysis = null;
            }
        });

        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal && modal.style.display !== 'none') {
                console.log('Escape pressed');
                this.ui.hideModal();
                if (form) form.reset();
                this._lastAnalysis = null;
            }
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
});
