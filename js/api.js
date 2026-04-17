import { CONFIG } from '../config.js';

export class ApiClient {
    async getMeasurements() {
        try {
            const response = await fetch(`${CONFIG.API_BASE_URL}/measurements`);
            if (!response.ok) throw new Error('Помилка при завантаженні замірів');
            return await response.json();
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    async addMeasurement(data) {
        try {
            const response = await fetch(`${CONFIG.API_BASE_URL}/measurements`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (!response.ok) throw new Error('Помилка при збереженні заміру');
            return await response.json();
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    async getActiveSchema() {
        try {
            const response = await fetch(`${CONFIG.API_BASE_URL}/schemas/active`);
            if (response.status === 404) return null;
            if (!response.ok) throw new Error('Помилка при завантаженні схеми лікування');
            return await response.json();
        } catch (error) {
            console.error(error);
            return null;
        }
    }
}
