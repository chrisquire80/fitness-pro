import { audioGuide } from '../utils/AudioGuide.js';
import { dataManager } from '../services/DataManager.js';
import { analytics } from '../services/Analytics.js';

export default function ActiveWorkout() {

    // Get workoutId from URL parameters or default to first available
    const hashParams = new URLSearchParams(window.location.hash.split('?')[1] || '');
    const urlWorkoutId = hashParams.get('id');

    // Get all available workouts to determine default
    const allWorkouts = dataManager.getWorkouts();
    const defaultWorkoutId = allWorkouts.length > 0 ? allWorkouts[0].id : 'wk_001';

    const workoutId = urlWorkoutId || defaultWorkoutId;
    const workout = dataManager.getWorkoutById(workoutId);

    // Initialize session stats if starting fresh
    if (!window.sessionStats || window.sessionStats.workoutId !== workoutId) {
        window.sessionStats = {
            workoutId: workoutId,
            sets: 0,
            reps: 0,
            duration: 0,
            currentExIndex: 0,
            startedAt: Date.now(),
            setLogs: [] // Track individual set data for strength curves
        };
    }

    const currentExIndex = window.sessionStats.currentExIndex;
    const currentEx = workout ? workout.exercises[currentExIndex] : null;
    const exDetails = currentEx ? currentEx.details : {};
    const restSeconds = currentEx ? (currentEx.rest_seconds || 60) : 60;
    const totalSets = currentEx ? (currentEx.sets || 3) : 3;

    // ── Rest Timer Logic ──────────────────────────────────────
    window._restTimerInterval = window._restTimerInterval || null;
    window._restTimeLeft = window._restTimeLeft ?? 0;

    window.startRestTimer = (seconds) => {
        window._restTimeLeft = seconds;
        const overlay = document.getElementById('rest-timer-overlay');
        const circle = document.getElementById('rest-timer-circle');
        const display = document.getElementById('rest-timer-display');
        const totalTime = seconds;

        if (overlay) overlay.classList.add('active');

        if (window._restTimerInterval) clearInterval(window._restTimerInterval);

        window._restTimerInterval = setInterval(() => {
            window._restTimeLeft--;
            if (display) display.textContent = window._restTimeLeft;

            // Update circular progress
            if (circle) {
                const progress = window._restTimeLeft / totalTime;
                const circumference = 2 * Math.PI * 54;
                circle.style.strokeDashoffset = circumference * (1 - progress);
            }

            if (window._restTimeLeft <= 3 && window._restTimeLeft > 0) {
                // Vibrate on last 3 seconds
                if (navigator.vibrate) navigator.vibrate(100);
            }

            if (window._restTimeLeft <= 0) {
                window.stopRestTimer();
                audioGuide.speak("Recupero terminato. Prossimo set!");
                if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
            }
        }, 1000);
    };

    window.stopRestTimer = () => {
        if (window._restTimerInterval) {
            clearInterval(window._restTimerInterval);
            window._restTimerInterval = null;
        }
        window._restTimeLeft = 0;
        const overlay = document.getElementById('rest-timer-overlay');
        if (overlay) overlay.classList.remove('active');
    };

    window.skipRestTimer = () => {
        window.stopRestTimer();
    };

    window.addRestTime = (extraSeconds) => {
        window._restTimeLeft += extraSeconds;
        const display = document.getElementById('rest-timer-display');
        if (display) display.textContent = window._restTimeLeft;
    };

    // ── Set completion + auto rest timer ──────────────────────
    window.handleNextSet = () => {
        window.sessionStats.sets++;
        const plannedReps = currentEx ? currentEx.reps : 12;
        const reps = parseInt(plannedReps) || 0;
        window.sessionStats.reps += reps;

        // Log set data for strength progression
        window.sessionStats.setLogs.push({
            exercise_id: currentEx?.details?.id || 'unknown',
            exercise_name: exDetails.name || 'Unknown',
            set_number: window.sessionStats.sets,
            reps: reps,
            timestamp: Date.now()
        });

        // Update set display
        const setDisplay = document.getElementById('set-display');
        const currentSetNum = Math.min(window.sessionStats.sets + 1, totalSets);
        if (setDisplay) setDisplay.innerText = `${currentSetNum} / ${totalSets}`;

        // Check if all sets for this exercise are done
        if (window.sessionStats.sets >= totalSets * (currentExIndex + 1)) {
            // Move to next exercise
            if (currentExIndex + 1 < (workout ? workout.exercises.length : 1)) {
                window.sessionStats.currentExIndex++;
                audioGuide.speak("Esercizio completato! Recupera e preparati per il prossimo.");
                window.startRestTimer(restSeconds);
                // Re-render after rest
                setTimeout(() => { window.location.hash = `#/active?id=${workoutId}`; }, (restSeconds + 1) * 1000);
                return;
            } else {
                // All exercises done
                audioGuide.speak("Tutti gli esercizi completati! Ottimo lavoro!");
                window.finishWorkout();
                return;
            }
        }

        audioGuide.speak(`Set ${window.sessionStats.sets} completato.`);
        // Start rest timer automatically
        window.startRestTimer(restSeconds);
    };

    window.finishWorkout = () => {
        // Clean up timers
        window.stopRestTimer();
        if (window.activeTimerInterval) clearInterval(window.activeTimerInterval);

        const elapsed = Math.round((Date.now() - window.sessionStats.startedAt) / 1000);

        const workoutLog = {
            date: new Date().toISOString().split('T')[0],
            sets: window.sessionStats.sets,
            reps: window.sessionStats.reps,
            calories: window.sessionStats.sets * 50,
            type: workout ? workout.type : "Generic",
            workout_id: workoutId,
            duration_real: elapsed,
            set_logs: window.sessionStats.setLogs
        };

        dataManager.saveLog(workoutLog);
        analytics.logWorkoutComplete(workoutLog.workout_id, workoutLog.duration_real, window.sessionStats.sets);

        audioGuide.speak("Allenamento terminato. Ottimo lavoro!");
        window.sessionStats = null;
        window.location.hash = '#/';
    };

    // Initialize timer after render
    setTimeout(() => {
        analytics.logWorkoutStart(workoutId, workout ? workout.name : 'Unknown');
        const timerEl = document.getElementById('workout-timer');

        if (timerEl) {
            let seconds = Math.round((Date.now() - window.sessionStats.startedAt) / 1000);
            if (window.activeTimerInterval) clearInterval(window.activeTimerInterval);

            window.activeTimerInterval = setInterval(() => {
                seconds++;
                const hrs = Math.floor(seconds / 3600);
                const mins = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
                const secs = (seconds % 60).toString().padStart(2, '0');
                timerEl.textContent = hrs > 0 ? `${hrs}:${mins}:${secs}` : `${mins}:${secs}`;
            }, 1000);
        }
    }, 100);

    const exerciseProgress = workout ? workout.exercises.map((ex, idx) => {
        const done = idx < currentExIndex;
        const active = idx === currentExIndex;
        return `<div class="ex-pip ${done ? 'done' : ''} ${active ? 'active' : ''}" title="${ex.details?.name || ''}"></div>`;
    }).join('') : '';

    return `
        <div class="active-workout-container">
            <div class="header-split">
                <h2>${workout ? workout.name : 'Allenamento'}</h2>
                <div id="workout-timer" class="timer-display">00:00</div>
            </div>

            <!-- Exercise progress pips -->
            <div class="exercise-progress-bar">${exerciseProgress}</div>

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
                        <span class="val" id="set-display">${Math.min(window.sessionStats.sets + 1, totalSets)} / ${totalSets}</span>
                    </div>
                    <div class="stat-box">
                        <span class="label">REPS</span>
                        <span class="val">${currentEx ? currentEx.reps : '-'}</span>
                    </div>
                    <div class="stat-box">
                        <span class="label">RECUPERO</span>
                        <span class="val">${restSeconds}s</span>
                    </div>
                </div>
            </div>

            <div class="controls">
                <button class="btn btn-outline" onclick="window.finishWorkout()">
                    <i class="fas fa-stop"></i> Termina
                </button>
                <button class="btn btn-primary" onclick="window.handleNextSet()">
                    <i class="fas fa-check"></i> Set Completato
                </button>
            </div>

            <!-- Rest Timer Overlay -->
            <div id="rest-timer-overlay" class="rest-timer-overlay">
                <div class="rest-timer-content">
                    <h3>Recupero</h3>
                    <div class="rest-timer-circle-wrap">
                        <svg width="140" height="140" viewBox="0 0 120 120">
                            <circle cx="60" cy="60" r="54" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="8"/>
                            <circle id="rest-timer-circle" cx="60" cy="60" r="54" fill="none" stroke="var(--accent-primary)" stroke-width="8"
                                stroke-dasharray="${2 * Math.PI * 54}" stroke-dashoffset="0"
                                stroke-linecap="round" transform="rotate(-90 60 60)" style="transition: stroke-dashoffset 1s linear;"/>
                        </svg>
                        <span id="rest-timer-display" class="rest-timer-number">${restSeconds}</span>
                    </div>
                    <div class="rest-timer-actions">
                        <button class="btn btn-sm" onclick="window.addRestTime(15)">+15s</button>
                        <button class="btn btn-primary btn-sm" onclick="window.skipRestTimer()">Salta <i class="fas fa-forward"></i></button>
                        <button class="btn btn-sm" onclick="window.addRestTime(30)">+30s</button>
                    </div>
                </div>
            </div>

            <!-- Music Player -->
            <div class="card music-player">
                <div class="music-info">
                    <i class="fab fa-spotify"></i>
                    <div class="track-details">
                        <span class="track-name" id="track-name">Spotify Connected</span>
                        <span class="artist-name">Tocca per controllare la musica</span>
                    </div>
                </div>
                <div class="music-controls">
                    <button onclick="alert('Spotify: Prev Track')"><i class="fas fa-step-backward"></i></button>
                    <button class="play-btn" onclick="alert('Spotify: Play/Pause')"><i class="fas fa-play"></i></button>
                    <button onclick="alert('Spotify: Next Track')"><i class="fas fa-step-forward"></i></button>
                </div>
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
            .exercise-progress-bar {
                display: flex;
                gap: 4px;
                margin-bottom: var(--spacing-md);
                padding: 0 var(--spacing-xs);
            }
            .ex-pip {
                flex: 1;
                height: 4px;
                background: rgba(255,255,255,0.1);
                border-radius: 2px;
                transition: background 0.3s;
            }
            .ex-pip.done { background: var(--accent-primary); }
            .ex-pip.active { background: var(--accent-primary); animation: pulse-pip 1.5s infinite; }
            @keyframes pulse-pip { 0%,100% { opacity:1; } 50% { opacity:0.5; } }

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
                padding-bottom: 56.25%;
                height: 0;
                overflow: hidden;
                border-radius: var(--radius-md);
                margin-bottom: var(--spacing-md);
                background: #000;
                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.5);
            }
            .video-container iframe {
                position: absolute;
                top: 0; left: 0; width: 100%; height: 100%;
            }
            .exercise-stats {
                display: flex;
                justify-content: space-around;
                margin-top: var(--spacing-md);
            }
            .stat-box { display: flex; flex-direction: column; }
            .stat-box .label { font-size: 0.8rem; color: var(--text-secondary); }
            .stat-box .val { font-size: 1.5rem; font-weight: 600; }
            .controls {
                display: flex;
                gap: var(--spacing-md);
                margin-top: var(--spacing-xl);
            }
            .controls .btn { flex: 1; }
            .btn-outline {
                background: transparent;
                border: 1px solid var(--text-secondary);
                color: var(--text-primary);
            }

            /* ── Rest Timer Overlay ────────────────────── */
            .rest-timer-overlay {
                display: none;
                position: fixed;
                inset: 0;
                background: rgba(0,0,0,0.85);
                backdrop-filter: blur(8px);
                z-index: 9999;
                justify-content: center;
                align-items: center;
            }
            .rest-timer-overlay.active {
                display: flex;
            }
            .rest-timer-content {
                text-align: center;
                color: white;
            }
            .rest-timer-content h3 {
                font-size: 1.2rem;
                text-transform: uppercase;
                letter-spacing: 2px;
                margin-bottom: var(--spacing-md);
                color: var(--text-secondary);
            }
            .rest-timer-circle-wrap {
                position: relative;
                display: inline-block;
                margin-bottom: var(--spacing-lg);
            }
            .rest-timer-number {
                position: absolute;
                top: 50%; left: 50%;
                transform: translate(-50%, -50%);
                font-size: 3rem;
                font-weight: 700;
                font-family: monospace;
                color: white;
            }
            .rest-timer-actions {
                display: flex;
                gap: var(--spacing-md);
                justify-content: center;
            }
            .rest-timer-actions .btn {
                min-width: 70px;
            }

            /* Music Player */
            .music-player {
                margin-top: var(--spacing-lg);
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: var(--spacing-sm) var(--spacing-md);
                background: linear-gradient(135deg, #1db954, #191414);
                border: none;
            }
            .music-info { display: flex; align-items: center; gap: 10px; }
            .music-info i { font-size: 1.5rem; color: #fff; }
            .track-details { display: flex; flex-direction: column; }
            .track-name { font-weight: bold; font-size: 0.9rem; }
            .artist-name { font-size: 0.75rem; opacity: 0.8; }
            .music-controls { display: flex; gap: 15px; }
            .music-controls button { background: none; border: none; color: white; cursor: pointer; font-size: 1.1rem; }
            .music-controls .play-btn { font-size: 1.4rem; }
        </style>
    `;
}
