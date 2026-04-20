import { CONFIG } from '../config.js';

export class ApiClient {
    async _fetch(url, options = {}) {
        return fetch(url, { credentials: 'include', ...options });
    }

    // Auth methods
    async checkMe() {
        try {
            const response = await this._fetch(`${CONFIG.API_BASE_URL}/auth/me`);
            if (!response.ok) return null;
            return await response.json();
        } catch (error) {
            return null;
        }
    }

    async logout() {
        await this._fetch(`${CONFIG.API_BASE_URL}/auth/logout`, { method: 'POST' });
    }

    async registerPasskeyBegin(email) {
        const response = await this._fetch(`${CONFIG.API_BASE_URL}/auth/passkey/register/begin`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });
        if (!response.ok) throw new Error('Не вдалося розпочати реєстрацію');
        return await response.json();
    }

    async registerPasskeyComplete(attestationResponse) {
        const response = await this._fetch(`${CONFIG.API_BASE_URL}/auth/passkey/register/complete`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(attestationResponse)
        });
        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(err.errorMessage || 'Помилка реєстрації ключа');
        }
        return await response.json();
    }

    async loginPasskeyBegin() {
        const response = await this._fetch(`${CONFIG.API_BASE_URL}/auth/login/begin`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({})
        });
        if (!response.ok) throw new Error('Не вдалося розпочати вхід');
        return await response.json();
    }

    async loginPasskeyComplete(assertionResponse) {
        const response = await this._fetch(`${CONFIG.API_BASE_URL}/auth/login/complete`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(assertionResponse)
        });
        if (!response.ok) throw new Error('Помилка входу');
        return await response.json();
    }

    async requestMagicLink(email) {
        const response = await this._fetch(`${CONFIG.API_BASE_URL}/auth/magic-link/request`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });
        if (!response.ok) throw new Error('Не вдалося надіслати посилання');
        return true;
    }

    // Measurements and other methods
    async getMeasurements() {
        try {
            const response = await this._fetch(`${CONFIG.API_BASE_URL}/measurements`);
            if (!response.ok) return [];
            return await response.json();
        } catch (error) {
            console.error('Network error fetching measurements:', error);
            return [];
        }
    }

    async addMeasurement(data) {
        try {
            const response = await this._fetch(`${CONFIG.API_BASE_URL}/measurements`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (!response.ok) throw new Error('Помилка при збереженні');
            return await response.json();
        } catch (error) {
            console.error('Error adding measurement:', error);
            throw error;
        }
    }

    async deleteMeasurement(id) {
        try {
            const response = await this._fetch(`${CONFIG.API_BASE_URL}/measurements/${id}`, {
                method: 'DELETE'
            });
            if (!response.ok) throw new Error('Помилка при видаленні');
            return true;
        } catch (error) {
            console.error('Error deleting measurement:', error);
            throw error;
        }
    }

    async getActiveSchema() {
        try {
            const response = await this._fetch(`${CONFIG.API_BASE_URL}/schemas/active`);
            if (response.status === 404) return null;
            if (!response.ok) return null;
            return await response.json();
        } catch (error) {
            return null;
        }
    }

    async analyzeImage(file) {
        const formData = new FormData();
        formData.append('image', file);
        const response = await this._fetch(`${CONFIG.API_BASE_URL}/measurements/analyze`, {
            method: 'POST',
            body: formData
        });
        if (!response.ok) {
            if (response.status === 429) throw new Error('Забагато запитів до AI. Спробуйте за хвилину.');
            const err = await response.json().catch(() => ({}));
            throw new Error(err.error || 'Не вдалося розпізнати зображення');
        }
        return await response.json();
    }

    async getSettings() {
        const response = await this._fetch(`${CONFIG.API_BASE_URL}/settings`);
        if (!response.ok) throw new Error('Не вдалося завантажити налаштування');
        return await response.json();
    }

    async patchSettings(data) {
        const response = await this._fetch(`${CONFIG.API_BASE_URL}/settings`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(err.error || 'Не вдалося зберегти налаштування');
        }
        return await response.json();
    }

    async requestEmailExport() {
        const response = await this._fetch(`${CONFIG.API_BASE_URL}/export/csv`, { method: 'POST' });
        if (response.status === 429) throw new Error('Зачекайте 10 хвилин між експортами');
        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(err.error || 'Помилка експорту');
        }
        return await response.json();
    }
}
