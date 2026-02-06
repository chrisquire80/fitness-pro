import { audioGuide } from '../utils/AudioGuide.js';
import { dataManager } from '../services/DataManager.js';
import { analytics } from '../services/Analytics.js';

export default function ActiveWorkout() {

    // Mocking Route Params: Always load 'wk_001' for now
    // In a real router we would get ID from URL
    const workoutId = 'wk_001';
    const workout = dataManager.getWorkoutById(workoutId);

    // Initialize session stats if starting fresh
    if (!window.sessionStats || window.sessionStats.workoutId !== workoutId) {
        window.sessionStats = {
            workoutId: workoutId,
            sets: 0,
            reps: 0,
            duration: 0,
            currentExIndex: 0
        };
    }

    const currentExIndex = window.sessionStats.currentExIndex;
    // Safety check if workout exists
    const currentEx = workout ? workout.exercises[currentExIndex] : null;
    const exDetails = currentEx ? currentEx.details : {};

    // Attach helper functions to window for inline onclicks
    window.handleNextSet = () => {
        window.sessionStats.sets++;
        // Use scheduled reps
        const plannedReps = currentEx ? currentEx.reps : 12;
        window.sessionStats.reps += parseInt(plannedReps) || 0;

        audioGuide.speak("Set completato. Recupera 30 secondi.");

        // Simple logic to advance exercise if sets are done (Mock logic)
        // In real app we track sets per exercise
        // For prototype, let's just stay on same exercise or loop

        // Update UI
        const setDisplay = document.getElementById('set-display');
        if (setDisplay) setDisplay.innerText = `${window.sessionStats.sets} / ${currentEx ? currentEx.sets : 3}`;
    };

    window.finishWorkout = () => {
        const today = new Date().toISOString().split('T')[0];

        const workoutLog = {
            date: today,
            sets: window.sessionStats.sets,
            reps: window.sessionStats.reps,
            calories: window.sessionStats.sets * 50, // Mock cal calc
            type: workout ? workout.type : "Generic",
            workout_id: workoutId,
            duration_real: 1200 // Mock duration
        };

        dataManager.saveLog(workoutLog);
        analytics.logWorkoutComplete(workoutLog.workout_id, workoutLog.duration_real, window.sessionStats.sets);

        audioGuide.speak("Allenamento terminato. Ottimo lavoro!");
        window.location.hash = '#/';
    };

    // Initialize logic after partial render (hack for vanilla JS component-less structure)
    setTimeout(() => {
        analytics.logWorkoutStart(workoutId, workout ? workout.name : 'Unknown');
        const timerEl = document.getElementById('workout-timer');

        // Announce start only if just mounted
        // audioGuide.speak(`Inizia l'allenamento ${workout ? workout.name : ''}.`);

        if (timerEl) {
            let seconds = 0;
            // Clear any existing interval to prevent duplicates
            if (window.activeTimerInterval) clearInterval(window.activeTimerInterval);

            window.activeTimerInterval = setInterval(() => {
                seconds++;
                const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
                const secs = (seconds % 60).toString().padStart(2, '0');
                if (timerEl) timerEl.textContent = `${mins}:${secs}`;
            }, 1000);
        }
    }, 100);

    return `
        <div class="active-workout-container">
            <div class="header-split">
                <h2>${workout ? workout.name : 'Allenamento'}</h2>
                <div id="workout-timer" class="timer-display">00:00</div>
            </div>

            <div class="card current-exercise-card">
                <div class="exercise-header">
                    <span class="step-badge">Esercizio ${currentExIndex + 1}/${workout ? workout.exercises.length : 1}</span>
                    <h3>${exDetails.name || 'Caricamento...'}</h3>
                </div>

                <!-- YouTube Video Embed -->
                <div class="video-container">
                    <iframe 
                        width="100%" 
                        height="100%" 
                        src="https://www.youtube-nocookie.com/embed/${exDetails.video_id || ''}?controls=0&modestbranding=1&rel=0" 
                        title="Exercise Video" 
                        frameborder="0" 
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                        allowfullscreen>
                    </iframe>
                </div>

                <div class="exercise-stats">
                    <div class="stat-box">
                        <span class="label">SET</span>
                        <span class="val" id="set-display">1 / ${currentEx ? currentEx.sets : '-'}</span>
                    </div>
                    <div class="stat-box">
                        <span class="label">REPS</span>
                        <span class="val">${currentEx ? currentEx.reps : '-'}</span>
                    </div>
                    <div class="stat-box">
                        <span class="label">RECUPERO</span>
                        <span class="val">${currentEx ? currentEx.rest_seconds : '-'}s</span>
                    </div>
                </div>
            </div>

            <div class="controls">
                <button class="btn btn-outline" onclick="window.finishWorkout()">Termina</button>
                <button class="btn btn-primary" onclick="window.handleNextSet()">Prossimo Set</button>
            </div>
        </div>

        <style>
            .header-split {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: var(--spacing-md);
            }
            .timer-display {
                font-family: monospace;
                font-size: 1.5rem;
                color: var(--accent-primary);
                font-weight: 700;
                background: rgba(139, 92, 246, 0.1);
                padding: 0.5rem 1rem;
                border-radius: var(--radius-md);
            }
            .current-exercise-card {
                text-align: center;
                padding: var(--spacing-lg);
            }
            .step-badge {
                background-color: var(--bg-primary);
                padding: 0.25rem 0.75rem;
                border-radius: 20px;
                font-size: 0.8rem;
                color: var(--text-secondary);
                text-transform: uppercase;
                letter-spacing: 1px;
            }
            .exercise-header h3 {
                font-size: 2rem;
                margin: var(--spacing-sm) 0;
            }
            .video-container {
                position: relative;
                padding-bottom: 56.25%; /* 16:9 aspect ratio */
                height: 0;
                overflow: hidden;
                border-radius: var(--radius-md);
                margin-bottom: var(--spacing-md);
                background: #000;
                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.5);
            }
            .video-container iframe {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
            }
            .exercise-stats {
                display: flex;
                justify-content: space-around;
                margin-top: var(--spacing-md);
            }
            .stat-box {
                display: flex;
                flex-direction: column;
            }
            .stat-box .label {
                font-size: 0.8rem;
                color: var(--text-secondary);
            }
            .stat-box .val {
                font-size: 1.5rem;
                font-weight: 600;
            }
            .controls {
                display: flex;
                gap: var(--spacing-md);
                margin-top: var(--spacing-xl);
            }
            .controls .btn {
                flex: 1;
            }
            .btn-outline {
                background: transparent;
                border: 1px solid var(--text-secondary);
                color: var(--text-primary);
            }
        </style>
    `;
}
