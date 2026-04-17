export class UIManager {
    constructor() {
        this.list = document.getElementById('measurements-list');
        this.modal = document.getElementById('modal');
        this.toast = document.getElementById('toast');
        this.toastMsg = document.getElementById('toast-message');
        this.schemaSection = document.getElementById('schema-section');
        this.schemaContent = document.getElementById('schema-content');
        this.onDelete = null; // Callback for delete action
    }

    renderMeasurements(measurements) {
        if (!this.list) return;
        this.list.innerHTML = (measurements || [])
            .map(m => `
                <tr class="border-b border-gray-50 hover:bg-gray-50 transition">
                    <td class="py-3 text-sm text-gray-600">${new Date(m.recordedAt).toLocaleString('uk-UA')}</td>
                    <td class="py-3 font-bold text-lg">${m.sys}/${m.dia} <span class="text-xs text-gray-400 font-normal">мм рт.ст.</span></td>
                    <td class="py-3 text-gray-500 font-medium text-right">${m.pulse} <span class="text-xs">уд/хв</span></td>
                    <td class="py-3 text-right">
                        <button class="text-red-400 hover:text-red-600 transition p-1 delete-btn" data-id="${m.id}" title="Видалити">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
                            </svg>
                        </button>
                    </td>
                </tr>
            `).join('');

        // Attach event listeners to delete buttons
        this.list.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.getAttribute('data-id');
                if (this.onDelete && id) {
                    this.onDelete(id);
                }
            });
        });
    }

    renderSchema(schema) {
        if (!schema || !this.schemaSection || !this.schemaContent) {
            if (this.schemaSection) this.schemaSection.style.display = 'none';
            return;
        }
        
        this.schemaSection.style.display = 'block';
        const doc = schema.scheduleDocument;
        let html = `<div class="text-xs text-blue-400 mb-2 uppercase tracking-wider font-bold border-b border-blue-50 pb-1">${schema.id}</div>`;
        
        const timeTranslations = {
            'Morning': 'Ранок',
            'Evening': 'Вечір',
            'Afternoon': 'День',
            'Night': 'Ніч'
        };

        const times = Object.keys(doc).sort().reverse(); 
        
        for (const time of times) {
            const meds = doc[time];
            const displayTime = timeTranslations[time] || time;
            html += `
                <div class="mb-4 last:mb-0">
                    <div class="flex items-center mb-2">
                        <span class="bg-blue-600 text-white px-2 py-0.5 rounded text-xs font-bold mr-2 shadow-sm">${displayTime}</span>
                        <div class="h-px bg-gray-100 flex-1"></div>
                    </div>
                    <div class="space-y-2 ml-2">
                        ${meds.map(m => `
                            <div class="flex flex-col">
                                <div class="flex justify-between items-baseline">
                                    <span class="font-semibold text-gray-800">${m.Medicine}</span>
                                    <span class="text-blue-600 font-bold bg-blue-50 px-2 rounded text-sm">${m.Amount}</span>
                                </div>
                                ${m.Condition && m.Condition !== 'None' ? 
                                    `<span class="text-xs text-orange-600 italic mt-0.5">⚠️ ${m.Condition}</span>` : ''}
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }
        this.schemaContent.innerHTML = html;
    }

    showModal() { 
        if (this.modal) {
            this.modal.style.setProperty('display', 'flex', 'important');
        }
    }

    hideModal() { 
        if (this.modal) {
            this.modal.style.setProperty('display', 'none', 'important');
        }
    }

    showStatus(message, isError = false) {
        if (!this.toast || !this.toastMsg) return;
        this.toastMsg.innerText = message;
        this.toast.classList.remove('translate-y-20', 'opacity-0', 'bg-red-600', 'bg-gray-900');
        this.toast.classList.add(isError ? 'bg-red-600' : 'bg-gray-900');
        
        setTimeout(() => {
            this.toast.classList.add('translate-y-20', 'opacity-0');
        }, 3000);
    }
}
