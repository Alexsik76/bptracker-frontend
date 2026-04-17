export class UIManager {
    constructor() {
        this.list = document.getElementById('measurements-list');
        this.modal = document.getElementById('modal');
        this.toast = document.getElementById('toast');
        this.toastMsg = document.getElementById('toast-message');
        this.schemaSection = document.getElementById('schema-section');
        this.schemaContent = document.getElementById('schema-content');
    }

    renderMeasurements(measurements) {
        this.list.innerHTML = measurements
            .map(m => `
                <tr class="border-b border-gray-50 hover:bg-gray-50 transition">
                    <td class="py-3 text-sm text-gray-600">${new Date(m.recordedAt).toLocaleString()}</td>
                    <td class="py-3 font-bold text-lg">${m.sys}/${m.dia}</td>
                    <td class="py-3 text-gray-500 font-medium">${m.pulse} <span class="text-xs">bpm</span></td>
                </tr>
            `).join('');
    }

    renderSchema(schema) {
        if (!schema) {
            this.schemaSection.classList.add('hidden');
            return;
        }
        this.schemaSection.classList.remove('hidden');
        
        // Тут логіка форматування JSONB схеми
        const doc = schema.scheduleDocument;
        let html = '';
        for (const [time, meds] of Object.entries(doc)) {
            html += `<div class="mb-2"><span class="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-sm mr-2">${time}</span> ${meds}</div>`;
        }
        this.schemaContent.innerHTML = html;
    }

    showModal() { this.modal.classList.remove('hidden'); }
    hideModal() { this.modal.classList.add('hidden'); }

    showStatus(message, isError = false) {
        this.toastMsg.innerText = message;
        this.toast.classList.remove('translate-y-20', 'opacity-0');
        this.toast.classList.add(isError ? 'bg-red-600' : 'bg-gray-900');
        
        setTimeout(() => {
            this.toast.classList.add('translate-y-20', 'opacity-0');
        }, 3000);
    }
}
