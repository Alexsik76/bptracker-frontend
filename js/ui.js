export class UIManager {
    constructor() {
        this.list = document.getElementById('measurements-list');
        this.modal = document.getElementById('modal');
        this.toast = document.getElementById('toast');
        this.toastMsg = document.getElementById('toast-message');
        this.schemaSection = document.getElementById('schema-section');
        this.schemaContent = document.getElementById('schema-content');
        this.syncBtn = document.getElementById('sync-btn');
        this.onSync = null;
        if (this.syncBtn) {
    this.syncBtn.addEventListener('click', () => {
        if (this.onSync) this.onSync();
    });
}
        this.onDelete = null; // Callback for delete action
    }

    renderMeasurements(measurements) {
        if (!this.list) return;
        const recent = [...measurements]
            .sort((a, b) => new Date(b.recordedAt) - new Date(a.recordedAt))
            .slice(0, 10);
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
        
        const titleEl = document.getElementById('schema-title');
        if (titleEl) {
            titleEl.textContent = `Схема: ${schema.id}`;
        }

        const doc = schema.scheduleDocument;
        let html = '';
        
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
            
            const unconditional = [];
            const conditionalGroups = {};

            meds.forEach(m => {
                const cond = m.Condition ? m.Condition.trim() : 'None';
                if (!cond || cond.toLowerCase() === 'none') {
                    unconditional.push(m);
                } else {
                    if (!conditionalGroups[cond]) {
                        conditionalGroups[cond] = [];
                    }
                    conditionalGroups[cond].push(m);
                }
            });
            
            html += `
                <div class="mb-6 last:mb-0 mt-6 pt-6 border-t border-gray-200 first:mt-0 first:pt-0 first:border-0">
                    <div class="text-blue-700 font-bold text-lg uppercase tracking-wide mb-4 flex items-center gap-2">
                        <span class="w-2 h-2 rounded-full bg-blue-500"></span>
                        ${displayTime}
                    </div>
                    <div class="space-y-3 pl-1">
            `;

            unconditional.forEach(m => {
                html += `
                        <div class="flex items-center text-lg">
                            <span class="text-gray-900 font-medium">${m.Medicine}</span>
                            <span class="mx-2 text-gray-300">➔</span>
                            <span class="text-blue-600 font-bold">${m.Amount}</span>
                        </div>
                `;
            });

            for (const [condition, groupMeds] of Object.entries(conditionalGroups)) {
                html += `
                        <div class="mt-2 bg-gray-50/50 p-3 rounded-lg border border-gray-100">
                            <div class="text-sm font-semibold text-gray-500 mb-2">При ${condition}:</div>
                            <div class="space-y-2 pl-3 border-l-2 border-blue-200">
                `;
                
                groupMeds.forEach(m => {
                    html += `
                                <div class="flex items-center text-lg">
                                    <span class="text-gray-900 font-medium">${m.Medicine}</span>
                                    <span class="mx-2 text-gray-300">➔</span>
                                    <span class="text-blue-600 font-bold">${m.Amount}</span>
                                </div>
                    `;
                });
                
                html += `
                            </div>
                        </div>
                `;
            }

            html += `
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


    showCameraModal() {
        const el = document.getElementById('camera-modal');
        if (el) el.style.display = 'flex';
    }

    hideCameraModal() {
        const el = document.getElementById('camera-modal');
        if (el) el.style.display = 'none';
    }

    showScanOverlay() {
        const el = document.getElementById('scan-overlay');
        if (el) el.style.display = 'flex';
        this._startDigitAnimation();
    }

    hideScanOverlay() {
        this._stopDigitAnimation();
        const el = document.getElementById('scan-overlay');
        if (el) el.style.display = 'none';
    }

    _startDigitAnimation() {
        const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
        const sys = document.getElementById('anim-sys');
        const dia = document.getElementById('anim-dia');
        const pulse = document.getElementById('anim-pulse');
        if (!sys) return;
        this._digitInterval = setInterval(() => {
            sys.textContent = rand(90, 180);
            dia.textContent = rand(55, 115);
            pulse.textContent = rand(55, 100);
        }, 80);
    }

    _stopDigitAnimation() {
        clearInterval(this._digitInterval);
        this._digitInterval = null;
        ['anim-sys', 'anim-dia', 'anim-pulse'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.textContent = '---';
        });
    }

    async setSyncLoading(isLoading) {
    if (!this.syncBtn) return;
    if (isLoading) {
        this.syncBtn.disabled = true;
        this._oldSyncHtml = this.syncBtn.innerHTML;
        this.syncBtn.innerHTML = '<span>Обробка...</span>';
    } else {
        this.syncBtn.disabled = false;
        this.syncBtn.innerHTML = this._oldSyncHtml || 'Синхронізувати з Таблицею';
    }
}
}
