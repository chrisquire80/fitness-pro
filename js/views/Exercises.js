import { dataManager } from '../services/DataManager.js';

export default function Exercises() {
    const exercises = dataManager.getExercises();

    // Get unique muscle groups for filtering
    const muscleGroups = [...new Set(exercises.map(ex => ex.muscle_group))];

    // Difficulty badge colors
    const getDifficultyColor = (level) => {
        switch (parseInt(level)) {
            case 1: return '#10b981'; // Green
            case 2: return '#f59e0b'; // Yellow
            case 3: return '#ef4444'; // Red
            default: return '#8b5cf6';
        }
    };

    const getDifficultyLabel = (level) => {
        switch (parseInt(level)) {
            case 1: return 'Facile';
            case 2: return 'Medio';
            case 3: return 'Difficile';
            default: return 'N/A';
        }
    };

    // Muscle group icons
    const getMuscleIcon = (group) => {
        const icons = {
            'Pettorali': 'fa-hand-rock',
            'Gambe': 'fa-shoe-prints',
            'Addome': 'fa-circle-notch',
            'Schiena': 'fa-arrows-alt-v',
            'Braccia': 'fa-fist-raised',
            'Spalle': 'fa-child',
            'Cardio': 'fa-heartbeat',
            'Full Body': 'fa-running'
        };
        return icons[group] || 'fa-dumbbell';
    };

    // Attach modal handlers to window
    window.openExerciseDetail = (exerciseId) => {
        const ex = exercises.find(e => e.id === exerciseId);
        if (!ex) return;

        const modal = document.getElementById('exercise-modal');
        const content = document.getElementById('exercise-modal-content');

        if (modal && content) {
            content.innerHTML = `
                <div class="modal-header">
                    <h2>${ex.name}</h2>
                    <button class="modal-close" onclick="closeExerciseModal()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    ${ex.video_id ? `
                        <div class="video-container">
                            <iframe 
                                src="https://www.youtube-nocookie.com/embed/${ex.video_id}?rel=0" 
                                title="${ex.name}" 
                                frameborder="0" 
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                                allowfullscreen>
                            </iframe>
                        </div>
                    ` : `
                        <div class="no-video">
                            <i class="fas fa-video-slash"></i>
                            <p>Video non disponibile</p>
                        </div>
                    `}
                    
                    <div class="exercise-info-grid">
                        <div class="info-item">
                            <span class="info-label"><i class="fas fa-bullseye"></i> Muscolo</span>
                            <span class="info-value">${ex.muscle_group}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label"><i class="fas fa-signal"></i> Difficoltà</span>
                            <span class="info-value difficulty-badge" style="background: ${getDifficultyColor(ex.difficulty)}">${getDifficultyLabel(ex.difficulty)}</span>
                        </div>
                        ${ex.equipment ? `
                            <div class="info-item">
                                <span class="info-label"><i class="fas fa-toolbox"></i> Attrezzatura</span>
                                <span class="info-value">${ex.equipment}</span>
                            </div>
                        ` : ''}
                    </div>

                    ${ex.description ? `
                        <div class="exercise-description">
                            <h4>Descrizione</h4>
                            <p>${ex.description}</p>
                        </div>
                    ` : ''}

                    ${ex.instructions ? `
                        <div class="exercise-instructions">
                            <h4>Come Eseguirlo</h4>
                            <ol>
                                ${(Array.isArray(ex.instructions) ? ex.instructions : [ex.instructions]).map(step => `<li>${step}</li>`).join('')}
                            </ol>
                        </div>
                    ` : ''}

                    <button class="btn btn-primary start-exercise-btn" onclick="startExerciseWorkout('${ex.id}')">
                        <i class="fas fa-play"></i> Inizia Allenamento
                    </button>
                </div>
            `;
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    };

    window.closeExerciseModal = () => {
        const modal = document.getElementById('exercise-modal');
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }
    };

    window.startExerciseWorkout = (exerciseId) => {
        closeExerciseModal();
        // Navigate to active workout with exercise
        window.location.hash = `#/active?exercise=${exerciseId}`;
    };

    window.filterExercises = (muscleGroup) => {
        const cards = document.querySelectorAll('.exercise-card');
        const pills = document.querySelectorAll('.filter-pill');

        pills.forEach(p => p.classList.remove('active'));
        event.target.classList.add('active');

        cards.forEach(card => {
            if (muscleGroup === 'all' || card.dataset.muscle === muscleGroup) {
                card.style.display = 'flex';
            } else {
                card.style.display = 'none';
            }
        });
    };

    return `
        <div class="exercises-page">
            <div class="page-header">
                <h1><i class="fas fa-dumbbell"></i> Libreria Esercizi</h1>
                <p class="subtitle">${exercises.length} esercizi disponibili</p>
            </div>

            <!-- Filter Pills -->
            <div class="filter-section">
                <div class="filter-pills">
                    <button class="filter-pill active" onclick="filterExercises('all')">Tutti</button>
                    ${muscleGroups.map(group => `
                        <button class="filter-pill" onclick="filterExercises('${group}')">${group}</button>
                    `).join('')}
                </div>
            </div>

            <!-- Exercises Grid -->
            <div class="exercises-grid">
                ${exercises.map(ex => `
                    <div class="card exercise-card" data-muscle="${ex.muscle_group}" onclick="openExerciseDetail('${ex.id}')">
                        <div class="ex-icon">
                            <i class="fas ${getMuscleIcon(ex.muscle_group)}"></i>
                        </div>
                        <div class="ex-content">
                            <h4>${ex.name}</h4>
                            <p class="ex-muscle">${ex.muscle_group}</p>
                        </div>
                        <div class="ex-difficulty" style="background: ${getDifficultyColor(ex.difficulty)}">
                            ${getDifficultyLabel(ex.difficulty)}
                        </div>
                        <div class="ex-arrow">
                            <i class="fas fa-chevron-right"></i>
                        </div>
                    </div>
                `).join('')}
            </div>

            <!-- Exercise Detail Modal -->
            <div id="exercise-modal" class="modal-overlay" onclick="if(event.target === this) closeExerciseModal()">
                <div id="exercise-modal-content" class="modal-content"></div>
            </div>
        </div>

        <style>
            .exercises-page { padding-bottom: 100px; }

            .page-header {
                margin-bottom: var(--spacing-lg);
            }
            .page-header h1 {
                display: flex;
                align-items: center;
                gap: var(--spacing-sm);
                margin-bottom: var(--spacing-xs);
            }
            .page-header .subtitle {
                color: var(--text-secondary);
                font-size: 0.9rem;
            }

            /* Filter Pills */
            .filter-section {
                margin-bottom: var(--spacing-lg);
            }
            .filter-pills {
                display: flex;
                gap: var(--spacing-sm);
                overflow-x: auto;
                padding-bottom: var(--spacing-sm);
                scrollbar-width: none;
            }
            .filter-pills::-webkit-scrollbar { display: none; }
            .filter-pill {
                white-space: nowrap;
                background: var(--bg-card);
                border: 1px solid transparent;
                color: var(--text-secondary);
                padding: 0.5rem 1rem;
                border-radius: 50px;
                cursor: pointer;
                transition: all 0.2s;
                font-size: 0.85rem;
            }
            .filter-pill:hover {
                background: rgba(139, 92, 246, 0.1);
                color: var(--accent-primary);
            }
            .filter-pill.active {
                background: var(--accent-primary);
                color: white;
                border-color: var(--accent-primary);
            }

            /* Exercises Grid */
            .exercises-grid {
                display: flex;
                flex-direction: column;
                gap: var(--spacing-sm);
            }
            .exercise-card {
                display: flex;
                align-items: center;
                gap: var(--spacing-md);
                padding: var(--spacing-md);
                cursor: pointer;
                transition: all 0.2s;
                border: 1px solid transparent;
            }
            .exercise-card:hover {
                border-color: var(--accent-primary);
                transform: translateX(4px);
            }
            .exercise-card:active {
                transform: scale(0.98);
            }

            .ex-icon {
                width: 48px;
                height: 48px;
                background: linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(6, 182, 212, 0.2));
                color: var(--accent-primary);
                border-radius: var(--radius-md);
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 1.2rem;
                flex-shrink: 0;
            }

            .ex-content {
                flex: 1;
                min-width: 0;
            }
            .ex-content h4 {
                margin: 0 0 4px 0;
                font-size: 1rem;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }
            .ex-muscle {
                color: var(--text-secondary);
                font-size: 0.8rem;
                margin: 0;
            }

            .ex-difficulty {
                padding: 4px 10px;
                border-radius: 12px;
                font-size: 0.7rem;
                font-weight: 600;
                color: white;
                text-transform: uppercase;
            }

            .ex-arrow {
                color: var(--text-secondary);
                font-size: 0.9rem;
            }

            /* Modal Styles */
            .modal-overlay {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.8);
                display: flex;
                align-items: flex-end;
                justify-content: center;
                z-index: 1000;
                opacity: 0;
                pointer-events: none;
                transition: opacity 0.3s;
            }
            .modal-overlay.active {
                opacity: 1;
                pointer-events: auto;
            }

            .modal-content {
                background: var(--bg-primary);
                width: 100%;
                max-width: 600px;
                max-height: 90vh;
                border-radius: var(--radius-lg) var(--radius-lg) 0 0;
                overflow-y: auto;
                transform: translateY(100%);
                transition: transform 0.3s ease-out;
            }
            .modal-overlay.active .modal-content {
                transform: translateY(0);
            }

            .modal-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: var(--spacing-lg);
                border-bottom: 1px solid rgba(255,255,255,0.1);
                position: sticky;
                top: 0;
                background: var(--bg-primary);
                z-index: 10;
            }
            .modal-header h2 {
                margin: 0;
                font-size: 1.3rem;
            }
            .modal-close {
                background: rgba(255,255,255,0.1);
                border: none;
                color: var(--text-primary);
                width: 36px;
                height: 36px;
                border-radius: 50%;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .modal-body {
                padding: var(--spacing-lg);
            }

            .video-container {
                position: relative;
                padding-bottom: 56.25%;
                height: 0;
                overflow: hidden;
                border-radius: var(--radius-md);
                margin-bottom: var(--spacing-lg);
                background: #000;
            }
            .video-container iframe {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
            }

            .no-video {
                background: var(--bg-card);
                padding: var(--spacing-xl);
                text-align: center;
                border-radius: var(--radius-md);
                margin-bottom: var(--spacing-lg);
                color: var(--text-secondary);
            }
            .no-video i {
                font-size: 2rem;
                margin-bottom: var(--spacing-sm);
                opacity: 0.5;
            }

            .exercise-info-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
                gap: var(--spacing-md);
                margin-bottom: var(--spacing-lg);
            }
            .info-item {
                background: var(--bg-card);
                padding: var(--spacing-md);
                border-radius: var(--radius-md);
                text-align: center;
            }
            .info-label {
                display: block;
                font-size: 0.75rem;
                color: var(--text-secondary);
                margin-bottom: var(--spacing-xs);
            }
            .info-value {
                font-weight: 600;
                font-size: 0.9rem;
            }
            .difficulty-badge {
                display: inline-block;
                padding: 4px 12px;
                border-radius: 12px;
                color: white;
                font-size: 0.8rem;
            }

            .exercise-description,
            .exercise-instructions {
                margin-bottom: var(--spacing-lg);
            }
            .exercise-description h4,
            .exercise-instructions h4 {
                margin-bottom: var(--spacing-sm);
                color: var(--accent-primary);
            }
            .exercise-instructions ol {
                padding-left: 1.2rem;
                line-height: 1.8;
            }
            .exercise-instructions li {
                margin-bottom: var(--spacing-xs);
            }

            .start-exercise-btn {
                width: 100%;
                padding: 1rem;
                font-size: 1rem;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: var(--spacing-sm);
            }
        </style>
    `;
}

