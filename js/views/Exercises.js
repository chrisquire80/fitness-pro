import { dataManager } from '../services/DataManager.js';

export default function Exercises() {
    const exercises = dataManager.getExercises();

    return `
        <h2>Libreria Esercizi</h2>
        <div class="exercises-grid">
            ${exercises.map(ex => `
                <div class="card exercise-card">
                    <div class="ex-icon">
                        <i class="fas fa-dumbbell"></i>
                    </div>
                    <div>
                        <h4>${ex.name}</h4>
                        <p class="ex-tags">${ex.muscle_group} • Difficoltà: ${ex.difficulty}</p>
                    </div>
                </div>
            `).join('')}
        </div>

        <style>
            .exercises-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
                gap: var(--spacing-md);
                margin-top: var(--spacing-md);
            }
            .exercise-card {
                display: flex;
                align-items: center;
                gap: var(--spacing-md);
            }
            .ex-icon {
                width: 50px;
                height: 50px;
                background-color: rgba(6, 182, 212, 0.1); /* Cyan tint */
                color: var(--accent-secondary);
                border-radius: var(--radius-sm);
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 1.5rem;
                font-weight: 700;
            }
            .ex-tags {
                color: var(--text-secondary);
                font-size: 0.85rem;
            }
        </style>
    `;
}
