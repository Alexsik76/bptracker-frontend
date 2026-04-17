import { CONFIG } from '../config.js';

export class ApiClient {
    async getMeasurements() {
        try {
            const response = await fetch(`${CONFIG.API_BASE_URL}/measurements`);
            if (!response.ok) return [];
            return await response.json();
        } catch (error) {
            console.error('Network error fetching measurements:', error);
            return [];
        }
    }

    async addMeasurement(data) {
        try {
            const response = await fetch(`${CONFIG.API_BASE_URL}/measurements`, {
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
            const response = await fetch(`${CONFIG.API_BASE_URL}/measurements/${id}`, {
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
            const response = await fetch(`${CONFIG.API_BASE_URL}/schemas/active`);
            if (response.status === 404) return null;
            if (!response.ok) return null;
            return await response.json();
        } catch (error) {
            // Тихо ігноруємо помилки мережі для схеми, щоб не забивати лог
            return null;
        }
    }
}
