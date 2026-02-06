import { dataManager } from '../services/DataManager.js';

export default function Workouts() {
    const workouts = dataManager.getWorkouts();

    return `
        <h2>I tuoi Allenamenti</h2>
        <div class="workouts-grid">
            ${workouts.map(w => `
                <div class="card workout-card">
                    <div class="workout-info">
                        <h3>${w.name}</h3>
                        <div class="workout-meta">
                            <span><i class="far fa-clock"></i> ${w.estimated_duration} min</span>
                            <span><i class="fas fa-bolt"></i> ${w.type}</span>
                        </div>
                    </div>
                    <button class="btn btn-primary btn-sm" onclick="window.location.hash='#/active'">Avvia</button>
                </div>
            `).join('')}
        </div>

        <style>
            .workouts-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
                gap: var(--spacing-md);
                margin-top: var(--spacing-md);
            }
            .workout-card {
                display: flex;
                flex-direction: column;
                justify-content: space-between;
                min-height: 180px;
                background: linear-gradient(145deg, var(--bg-card), var(--bg-secondary));
            }
            .workout-info h3 {
                margin-bottom: var(--spacing-xs);
                color: var(--text-primary);
            }
            .workout-meta {
                display: flex;
                gap: var(--spacing-md);
                color: var(--text-secondary);
                font-size: 0.9rem;
                margin-bottom: var(--spacing-md);
            }
            .btn-sm {
                padding: 0.5rem 1rem;
                font-size: 0.9rem;
                align-self: flex-start;
            }
        </style>
    `;
}
