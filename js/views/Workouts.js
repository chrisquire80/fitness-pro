import { dataManager } from '../services/DataManager.js';

export default function Workouts() {
    const workouts = dataManager.getWorkouts();
    const templates = dataManager.getTemplates();
    const exercises = dataManager.getExercises();

    // ── Global handlers ──────────────────────────────────────

    window.startWorkout = (workoutId) => {
        window.location.hash = `#/active?id=${workoutId}`;
    };

    window.saveAsTemplate = (workoutId) => {
        const workout = dataManager.getWorkoutById(workoutId);
        if (!workout) return;
        const name = prompt('Nome del template:', workout.name);
        if (!name) return;
        dataManager.saveWorkoutAsTemplate(workoutId, name);
        window.location.hash = '#/workouts'; // re-render
    };

    window.useTemplate = (templateId) => {
        const created = dataManager.createWorkoutFromTemplate(templateId);
        if (created) {
            window.location.hash = `#/active?id=${created.id}`;
        }
    };

    window.deleteTemplate = (templateId) => {
        if (confirm('Eliminare questo template?')) {
            dataManager.deleteTemplate(templateId);
            window.location.hash = '#/workouts'; // re-render
        }
    };

    // ── Template builder state ───────────────────────────────

    window.openTemplateBuilder = () => {
        const overlay = document.getElementById('template-builder-overlay');
        if (overlay) overlay.classList.add('active');
    };

    window.closeTemplateBuilder = () => {
        const overlay = document.getElementById('template-builder-overlay');
        if (overlay) overlay.classList.remove('active');
    };

    window._templateExercises = window._templateExercises || [];

    window.addExerciseToTemplate = (exerciseId) => {
        const ex = exercises.find(e => e.id === exerciseId);
        if (!ex) return;
        window._templateExercises.push({
            exercise_id: ex.id,
            name: ex.name,
            sets: 3,
            reps: 12,
            rest_seconds: 60
        });
        renderTemplateExerciseList();
    };

    window.removeExerciseFromTemplate = (index) => {
        window._templateExercises.splice(index, 1);
        renderTemplateExerciseList();
    };

    window.saveNewTemplate = () => {
        const nameEl = document.getElementById('new-template-name');
        const name = nameEl ? nameEl.value.trim() : '';
        if (!name) { alert('Inserisci un nome per il template.'); return; }
        if (window._templateExercises.length === 0) { alert('Aggiungi almeno un esercizio.'); return; }

        dataManager.saveTemplate({
            name: name,
            type: 'Custom',
            estimated_duration: window._templateExercises.length * 8,
            difficulty_label: 'Media',
            equipment_label: 'Nessun attrezzo',
            exercises: window._templateExercises.map(ex => ({
                exercise_id: ex.exercise_id,
                sets: ex.sets,
                reps: ex.reps,
                rest_seconds: ex.rest_seconds,
            }))
        });

        window._templateExercises = [];
        window.closeTemplateBuilder();
        window.location.hash = '#/workouts'; // re-render
    };

    function renderTemplateExerciseList() {
        const listEl = document.getElementById('template-exercise-list');
        if (!listEl) return;
        listEl.innerHTML = window._templateExercises.map((ex, idx) => `
            <div class="template-ex-item">
                <span class="template-ex-name">${ex.name}</span>
                <span class="template-ex-meta">${ex.sets}x${ex.reps} | ${ex.rest_seconds}s</span>
                <button class="btn-icon" onclick="window.removeExerciseFromTemplate(${idx})"><i class="fas fa-trash"></i></button>
            </div>
        `).join('') || '<p class="text-muted">Nessun esercizio aggiunto.</p>';
    }

    // Group exercises by muscle group for the picker
    const muscleGroups = {};
    exercises.forEach(ex => {
        const group = ex.muscle_group || 'Altro';
        if (!muscleGroups[group]) muscleGroups[group] = [];
        muscleGroups[group].push(ex);
    });

    return `
        <div class="workouts-page">
            <div class="workouts-header">
                <h2>I tuoi Allenamenti</h2>
                <button class="btn btn-primary btn-sm" onclick="window.openTemplateBuilder()">
                    <i class="fas fa-plus"></i> Nuovo Template
                </button>
            </div>

            <!-- Templates section -->
            ${templates.length > 0 ? `
            <div class="section-label">
                <i class="fas fa-bookmark"></i> I tuoi Template
            </div>
            <div class="templates-grid">
                ${templates.map(t => `
                    <div class="card template-card">
                        <div class="template-badge">TEMPLATE</div>
                        <h3>${t.name}</h3>
                        <div class="workout-meta">
                            <span><i class="far fa-clock"></i> ~${t.estimated_duration || 30} min</span>
                            <span><i class="fas fa-dumbbell"></i> ${t.exercises.length} esercizi</span>
                        </div>
                        <div class="template-actions">
                            <button class="btn btn-primary btn-sm" onclick="window.useTemplate('${t.id}')">
                                <i class="fas fa-play"></i> Avvia
                            </button>
                            <button class="btn btn-outline btn-sm btn-icon-only" onclick="window.deleteTemplate('${t.id}')">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                `).join('')}
            </div>
            ` : ''}

            <div class="section-label">
                <i class="fas fa-fire"></i> Allenamenti Disponibili
            </div>
            <div class="workouts-grid">
                ${workouts.map(w => `
                    <div class="card workout-card">
                        <div class="workout-info">
                            <h3>${w.name}</h3>
                            <div class="workout-meta">
                                <span><i class="far fa-clock"></i> ${w.estimated_duration} min</span>
                                <span><i class="fas fa-bolt"></i> ${w.type}</span>
                                <span><i class="fas fa-signal"></i> ${w.difficulty_label || ''}</span>
                            </div>
                        </div>
                        <div class="workout-actions">
                            <button class="btn btn-primary btn-sm" onclick="window.startWorkout('${w.id}')">
                                <i class="fas fa-play"></i> Avvia
                            </button>
                            <button class="btn btn-outline btn-sm" onclick="window.saveAsTemplate('${w.id}')">
                                <i class="fas fa-bookmark"></i> Salva
                            </button>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>

        <!-- Template Builder Overlay -->
        <div id="template-builder-overlay" class="template-builder-overlay">
            <div class="template-builder">
                <div class="builder-header">
                    <h3><i class="fas fa-hammer"></i> Crea Template</h3>
                    <button class="btn-icon" onclick="window.closeTemplateBuilder()"><i class="fas fa-times"></i></button>
                </div>

                <div class="builder-body">
                    <label class="form-label">Nome Template</label>
                    <input type="text" id="new-template-name" class="form-input" placeholder="Es: Push Day, Leg Day...">

                    <label class="form-label" style="margin-top: var(--spacing-md)">Esercizi</label>
                    <div id="template-exercise-list" class="template-exercise-list">
                        <p class="text-muted">Nessun esercizio aggiunto.</p>
                    </div>

                    <label class="form-label" style="margin-top: var(--spacing-md)">Aggiungi Esercizio</label>
                    <div class="exercise-picker">
                        ${Object.entries(muscleGroups).map(([group, exs]) => `
                            <div class="exercise-group">
                                <div class="exercise-group-label">${group}</div>
                                ${exs.map(ex => `
                                    <button class="exercise-pick-btn" onclick="window.addExerciseToTemplate('${ex.id}')">
                                        <span>${ex.name}</span>
                                        <i class="fas fa-plus"></i>
                                    </button>
                                `).join('')}
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div class="builder-footer">
                    <button class="btn btn-outline" onclick="window.closeTemplateBuilder()">Annulla</button>
                    <button class="btn btn-primary" onclick="window.saveNewTemplate()">
                        <i class="fas fa-save"></i> Salva Template
                    </button>
                </div>
            </div>
        </div>

        <style>
            .workouts-page { padding-bottom: var(--spacing-xl); }
            .workouts-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: var(--spacing-md);
            }
            .section-label {
                display: flex;
                align-items: center;
                gap: var(--spacing-sm);
                font-size: 0.85rem;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 1px;
                color: var(--text-secondary);
                margin: var(--spacing-lg) 0 var(--spacing-sm);
            }
            .workouts-grid, .templates-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
                gap: var(--spacing-md);
            }
            .workout-card, .template-card {
                display: flex;
                flex-direction: column;
                justify-content: space-between;
                min-height: 180px;
                background: linear-gradient(145deg, var(--bg-card), var(--bg-secondary));
            }
            .template-card {
                border-left: 3px solid var(--accent-primary);
            }
            .template-badge {
                display: inline-block;
                font-size: 0.65rem;
                font-weight: 700;
                letter-spacing: 1.5px;
                color: var(--accent-primary);
                margin-bottom: var(--spacing-xs);
            }
            .workout-info h3, .template-card h3 {
                margin-bottom: var(--spacing-xs);
                color: var(--text-primary);
            }
            .workout-meta {
                display: flex;
                gap: var(--spacing-md);
                color: var(--text-secondary);
                font-size: 0.85rem;
                margin-bottom: var(--spacing-md);
                flex-wrap: wrap;
            }
            .workout-actions, .template-actions {
                display: flex;
                gap: var(--spacing-sm);
            }
            .btn-sm { padding: 0.5rem 1rem; font-size: 0.9rem; }
            .btn-outline {
                background: transparent;
                border: 1px solid var(--text-secondary);
                color: var(--text-primary);
            }
            .btn-icon-only { padding: 0.5rem 0.7rem; }
            .btn-icon { background: none; border: none; color: var(--text-secondary); cursor: pointer; font-size: 1rem; }
            .btn-icon:hover { color: var(--text-primary); }

            /* Template Builder */
            .template-builder-overlay {
                display: none;
                position: fixed;
                inset: 0;
                background: rgba(0,0,0,0.85);
                backdrop-filter: blur(8px);
                z-index: 9999;
                justify-content: center;
                align-items: flex-start;
                padding: var(--spacing-lg);
                overflow-y: auto;
            }
            .template-builder-overlay.active { display: flex; }
            .template-builder {
                background: var(--bg-card);
                border-radius: var(--radius-lg);
                width: 100%;
                max-width: 600px;
                max-height: 90vh;
                display: flex;
                flex-direction: column;
            }
            .builder-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: var(--spacing-md) var(--spacing-lg);
                border-bottom: 1px solid rgba(255,255,255,0.05);
            }
            .builder-header h3 { margin: 0; }
            .builder-body {
                padding: var(--spacing-lg);
                overflow-y: auto;
                flex: 1;
            }
            .builder-footer {
                display: flex;
                gap: var(--spacing-md);
                justify-content: flex-end;
                padding: var(--spacing-md) var(--spacing-lg);
                border-top: 1px solid rgba(255,255,255,0.05);
            }
            .form-label {
                display: block;
                font-size: 0.85rem;
                font-weight: 600;
                color: var(--text-secondary);
                margin-bottom: var(--spacing-xs);
            }
            .form-input {
                width: 100%;
                padding: 0.6rem 0.8rem;
                background: var(--bg-primary);
                border: 1px solid rgba(255,255,255,0.1);
                border-radius: var(--radius-md);
                color: var(--text-primary);
                font-size: 1rem;
            }
            .form-input:focus { outline: none; border-color: var(--accent-primary); }
            .template-exercise-list {
                background: var(--bg-primary);
                border-radius: var(--radius-md);
                padding: var(--spacing-sm);
                min-height: 60px;
            }
            .template-ex-item {
                display: flex;
                align-items: center;
                gap: var(--spacing-sm);
                padding: var(--spacing-xs) var(--spacing-sm);
                border-bottom: 1px solid rgba(255,255,255,0.05);
            }
            .template-ex-item:last-child { border-bottom: none; }
            .template-ex-name { flex: 1; font-weight: 500; }
            .template-ex-meta { font-size: 0.8rem; color: var(--text-secondary); }
            .text-muted { color: var(--text-secondary); font-size: 0.85rem; text-align: center; padding: var(--spacing-sm); }
            .exercise-picker {
                max-height: 250px;
                overflow-y: auto;
                background: var(--bg-primary);
                border-radius: var(--radius-md);
                padding: var(--spacing-xs);
            }
            .exercise-group-label {
                font-size: 0.75rem;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 1px;
                color: var(--accent-primary);
                padding: var(--spacing-xs) var(--spacing-sm);
                margin-top: var(--spacing-xs);
            }
            .exercise-pick-btn {
                display: flex;
                justify-content: space-between;
                align-items: center;
                width: 100%;
                padding: var(--spacing-xs) var(--spacing-sm);
                background: none;
                border: none;
                color: var(--text-primary);
                cursor: pointer;
                border-radius: var(--radius-sm);
                font-size: 0.9rem;
            }
            .exercise-pick-btn:hover { background: rgba(139,92,246,0.1); }
            .exercise-pick-btn i { color: var(--accent-primary); font-size: 0.8rem; }
        </style>
    `;
}
