export default function Profile() {
    // Helper to save data
    window.saveProfile = (e) => {
        e.preventDefault();
        const data = {
            name: document.getElementById('p-name').value,
            age: document.getElementById('p-age').value,
            weight: document.getElementById('p-weight').value,
            goal: document.getElementById('p-goal').value
        };
        localStorage.setItem('fitness_profile', JSON.stringify(data));
        alert('Profilo salvato con successo!');
    };

    window.deleteAccount = () => {
        if (confirm("Sei sicuro? Questa azione è irreversibile. Tutti i tuoi progressi verranno persi.")) {
            localStorage.clear();
            alert("Account eliminato. Arrivederci!");
            window.location.reload();
        }
    };

    // Load existing data
    const saved = JSON.parse(localStorage.getItem('fitness_profile')) || {};

    return `
        <h2>Il tuo Profilo</h2>
        <div class="card profile-card">
            <form onsubmit="window.saveProfile(event)">
                <div class="form-group">
                    <label>Nome</label>
                    <input type="text" id="p-name" value="${saved.name || ''}" placeholder="Il tuo nome">
                </div>
                <div class="form-group">
                    <label>Età</label>
                    <input type="number" id="p-age" value="${saved.age || ''}" placeholder="Anni">
                </div>
                <div class="form-group">
                    <label>Peso (kg)</label>
                    <input type="number" id="p-weight" value="${saved.weight || ''}" placeholder="Kg">
                </div>
                <div class="form-group">
                    <label>Obiettivo</label>
                    <select id="p-goal">
                        <option value="lose" ${saved.goal === 'lose' ? 'selected' : ''}>Perdita Peso</option>
                        <option value="muscle" ${saved.goal === 'muscle' ? 'selected' : ''}>Aumento Massa</option>
                        <option value="endurance" ${saved.goal === 'endurance' ? 'selected' : ''}>Resistenza</option>
                    </select>
                </div>
                <button type="submit" class="btn btn-primary">Salva Modifiche</button>
            </form>
            
            <div class="danger-zone">
                <hr>
                <h3>Zona Pericolo</h3>
                <p>Vuoi cancellare tutti i tuoi dati?</p>
                <button class="btn btn-danger" onclick="window.deleteAccount()">Elimina Account (GDPR)</button>
            </div>
        </div>

        <style>
            .profile-card {
                max-width: 600px;
                margin: 0 auto;
            }
            .form-group {
                margin-bottom: var(--spacing-md);
            }
            label {
                display: block;
                margin-bottom: var(--spacing-xs);
                color: var(--text-secondary);
            }
            input, select {
                width: 100%;
                padding: 0.75rem;
                background-color: var(--bg-primary);
                border: 1px solid rgba(255,255,255,0.1);
                border-radius: var(--radius-sm);
                color: var(--text-primary);
                font-family: inherit;
            }
            input:focus, select:focus {
                outline: none;
                border-color: var(--accent-primary);
            }
            .danger-zone {
                margin-top: var(--spacing-xl);
                padding-top: var(--spacing-lg);
                text-align: center;
            }
            .danger-zone h3 { color: #ef4444; font-size: 1rem; margin-bottom: 0.5rem; }
            .danger-zone p { font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 1rem; }
            .btn-danger {
                background: rgba(239, 68, 68, 0.1);
                color: #ef4444;
                border: 1px solid #ef4444;
                width: 100%;
            }

        </style>
    `;
}
