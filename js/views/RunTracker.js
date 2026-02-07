import { dataManager } from "../services/DataManager.js";
import { analytics } from "../services/Analytics.js";
import { stateManager } from "../utils/StateManager.js";

/**
 * RunTracker.js
 * GPS-based run tracking with real-time distance, pace, and route visualization
 */

// Run state management
let runState = {
  isRunning: false,
  isPaused: false,
  watchId: null,
  startTime: null,
  pausedTime: 0,
  lastPauseTime: null,
  positions: [],
  totalDistance: 0,
  currentPace: 0,
  avgPace: 0,
  maxSpeed: 0,
  elevation: {
    gain: 0,
    loss: 0,
    current: null,
    previous: null,
  },
  splits: [], // km splits
  lastSplitDistance: 0,
};

// Timer interval reference
let timerInterval = null;

/**
 * Calculate distance between two coordinates using Haversine formula
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg) {
  return deg * (Math.PI / 180);
}

/**
 * Format time in MM:SS or HH:MM:SS
 */
function formatTime(seconds) {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hrs > 0) {
    return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

/**
 * Format pace in min/km
 */
function formatPace(paceMinPerKm) {
  if (!paceMinPerKm || !isFinite(paceMinPerKm) || paceMinPerKm > 99) {
    return "--:--";
  }
  const mins = Math.floor(paceMinPerKm);
  const secs = Math.round((paceMinPerKm - mins) * 60);
  return `${mins}'${secs.toString().padStart(2, "0")}"`;
}

/**
 * Get elapsed time in seconds
 */
function getElapsedTime() {
  if (!runState.startTime) return 0;

  let elapsed = 0;
  if (runState.isPaused && runState.lastPauseTime) {
    elapsed = (runState.lastPauseTime - runState.startTime) / 1000;
  } else {
    elapsed = (Date.now() - runState.startTime) / 1000;
  }

  return elapsed - runState.pausedTime / 1000;
}

/**
 * Update UI elements
 */
function updateUI() {
  const timeEl = document.getElementById("run-time");
  const distanceEl = document.getElementById("run-distance");
  const paceEl = document.getElementById("run-pace");
  const avgPaceEl = document.getElementById("run-avg-pace");
  const elevationEl = document.getElementById("run-elevation");
  const splitsEl = document.getElementById("splits-list");

  if (timeEl) {
    timeEl.textContent = formatTime(getElapsedTime());
  }

  if (distanceEl) {
    distanceEl.textContent = runState.totalDistance.toFixed(2);
  }

  if (paceEl) {
    paceEl.textContent = formatPace(runState.currentPace);
  }

  if (avgPaceEl) {
    avgPaceEl.textContent = formatPace(runState.avgPace);
  }

  if (elevationEl) {
    elevationEl.textContent = `↑${Math.round(runState.elevation.gain)}m ↓${Math.round(runState.elevation.loss)}m`;
  }

  if (splitsEl && runState.splits.length > 0) {
    splitsEl.innerHTML = runState.splits
      .map(
        (split, i) => `
            <div class="split-item">
                <span class="split-km">Km ${i + 1}</span>
                <span class="split-time">${formatPace(split.pace)}</span>
            </div>
        `,
      )
      .join("");
  }
}

/**
 * Handle new GPS position
 */
function handlePosition(position) {
  if (!runState.isRunning || runState.isPaused) return;

  const { latitude, longitude, altitude, accuracy, speed } = position.coords;
  const timestamp = position.timestamp;

  // Filter out low accuracy readings
  if (accuracy > 30) {
    console.log("Skipping low accuracy position:", accuracy);
    return;
  }

  const newPosition = {
    lat: latitude,
    lon: longitude,
    alt: altitude,
    accuracy,
    speed,
    timestamp,
  };

  // Calculate distance from last position
  if (runState.positions.length > 0) {
    const lastPos = runState.positions[runState.positions.length - 1];
    const distance = calculateDistance(
      lastPos.lat,
      lastPos.lon,
      newPosition.lat,
      newPosition.lon,
    );

    // Filter out GPS jitter (unrealistic movements)
    const timeDiff = (timestamp - lastPos.timestamp) / 1000;
    const calculatedSpeed = distance / (timeDiff / 3600); // km/h

    if (calculatedSpeed < 50) {
      // Max realistic running speed
      runState.totalDistance += distance;

      // Calculate current pace
      if (timeDiff > 0 && distance > 0) {
        runState.currentPace = timeDiff / 60 / distance; // min/km
      }

      // Update max speed
      if (speed && speed > runState.maxSpeed) {
        runState.maxSpeed = speed;
      }

      // Handle elevation
      if (altitude !== null && runState.elevation.previous !== null) {
        const elevDiff = altitude - runState.elevation.previous;
        if (elevDiff > 0) {
          runState.elevation.gain += elevDiff;
        } else {
          runState.elevation.loss += Math.abs(elevDiff);
        }
      }

      // Check for km split
      const currentKm = Math.floor(runState.totalDistance);
      const lastSplitKm = Math.floor(runState.lastSplitDistance);

      if (currentKm > lastSplitKm && currentKm > 0) {
        const splitTime = getElapsedTime();
        const prevSplitTime =
          runState.splits.length > 0
            ? runState.splits.reduce((sum, s) => sum + s.time, 0)
            : 0;
        const splitDuration = splitTime - prevSplitTime;

        runState.splits.push({
          km: currentKm,
          time: splitDuration,
          pace: splitDuration / 60, // Convert to min/km
        });

        runState.lastSplitDistance = currentKm;

        // Vibrate on split
        if (navigator.vibrate) {
          navigator.vibrate([200, 100, 200]);
        }
      }
    }
  }

  // Update elevation tracking
  if (altitude !== null) {
    runState.elevation.previous = runState.elevation.current;
    runState.elevation.current = altitude;
  }

  runState.positions.push(newPosition);

  // Calculate average pace
  const elapsed = getElapsedTime();
  if (elapsed > 0 && runState.totalDistance > 0) {
    runState.avgPace = elapsed / 60 / runState.totalDistance;
  }

  updateUI();
  drawRoute();
}

/**
 * Handle GPS error
 */
function handlePositionError(error) {
  console.error("GPS Error:", error);

  let message = "Errore GPS: ";
  switch (error.code) {
    case error.PERMISSION_DENIED:
      message += "Permesso negato. Abilita la geolocalizzazione.";
      break;
    case error.POSITION_UNAVAILABLE:
      message += "Posizione non disponibile.";
      break;
    case error.TIMEOUT:
      message += "Timeout. Riprova.";
      break;
    default:
      message += "Errore sconosciuto.";
  }

  const statusEl = document.getElementById("gps-status");
  if (statusEl) {
    statusEl.textContent = message;
    statusEl.classList.add("error");
  }
}

/**
 * Draw route on canvas
 */
function drawRoute() {
  const canvas = document.getElementById("route-canvas");
  if (!canvas || runState.positions.length < 2) return;

  const ctx = canvas.getContext("2d");
  const rect = canvas.getBoundingClientRect();

  // Set canvas size
  canvas.width = rect.width * window.devicePixelRatio;
  canvas.height = rect.height * window.devicePixelRatio;
  ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

  // Clear canvas
  ctx.clearRect(0, 0, rect.width, rect.height);

  // Calculate bounds
  const lats = runState.positions.map((p) => p.lat);
  const lons = runState.positions.map((p) => p.lon);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLon = Math.min(...lons);
  const maxLon = Math.max(...lons);

  const padding = 20;
  const width = rect.width - 2 * padding;
  const height = rect.height - 2 * padding;

  // Scaling functions
  const latRange = maxLat - minLat || 0.001;
  const lonRange = maxLon - minLon || 0.001;
  const scale = Math.min(width / lonRange, height / latRange);

  const scaleX = (lon) => padding + (lon - minLon) * scale;
  const scaleY = (lat) => rect.height - padding - (lat - minLat) * scale;

  // Draw route
  ctx.beginPath();
  ctx.strokeStyle = "#8b5cf6";
  ctx.lineWidth = 3;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  runState.positions.forEach((pos, i) => {
    const x = scaleX(pos.lon);
    const y = scaleY(pos.lat);

    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  });

  ctx.stroke();

  // Draw start point
  const start = runState.positions[0];
  ctx.beginPath();
  ctx.fillStyle = "#10b981";
  ctx.arc(scaleX(start.lon), scaleY(start.lat), 6, 0, Math.PI * 2);
  ctx.fill();

  // Draw current position
  const current = runState.positions[runState.positions.length - 1];
  ctx.beginPath();
  ctx.fillStyle = "#ef4444";
  ctx.arc(scaleX(current.lon), scaleY(current.lat), 6, 0, Math.PI * 2);
  ctx.fill();
}

/**
 * Start run tracking
 */
window.startRun = async () => {
  if (!navigator.geolocation) {
    alert("La geolocalizzazione non è supportata dal tuo browser.");
    return;
  }

  // Check/request permission
  try {
    const permission = await navigator.permissions.query({
      name: "geolocation",
    });
    if (permission.state === "denied") {
      alert("Permesso GPS negato. Abilitalo nelle impostazioni del browser.");
      return;
    }
  } catch (e) {
    // Some browsers don't support permissions API
    console.log("Permissions API not supported, proceeding anyway");
  }

  // Reset state
  runState = {
    isRunning: true,
    isPaused: false,
    watchId: null,
    startTime: Date.now(),
    pausedTime: 0,
    lastPauseTime: null,
    positions: [],
    totalDistance: 0,
    currentPace: 0,
    avgPace: 0,
    maxSpeed: 0,
    elevation: { gain: 0, loss: 0, current: null, previous: null },
    splits: [],
    lastSplitDistance: 0,
  };

  // Update UI
  const startBtn = document.getElementById("start-btn");
  const pauseBtn = document.getElementById("pause-btn");
  const stopBtn = document.getElementById("stop-btn");
  const statusEl = document.getElementById("gps-status");

  if (startBtn) startBtn.style.display = "none";
  if (pauseBtn) pauseBtn.style.display = "inline-flex";
  if (stopBtn) stopBtn.style.display = "inline-flex";
  if (statusEl) {
    statusEl.textContent = "Acquisendo GPS...";
    statusEl.classList.remove("error");
  }

  // Start GPS tracking
  runState.watchId = navigator.geolocation.watchPosition(
    handlePosition,
    handlePositionError,
    {
      enableHighAccuracy: true,
      maximumAge: 0,
      timeout: 10000,
    },
  );

  // Start timer
  timerInterval = setInterval(updateUI, 1000);

  // Track analytics
  analytics.logEvent("run_started", {
    timestamp: new Date().toISOString(),
  });

  // Keep screen awake if possible
  if ("wakeLock" in navigator) {
    try {
      window.wakeLock = await navigator.wakeLock.request("screen");
    } catch (e) {
      console.log("Wake lock not available:", e);
    }
  }

  if (statusEl) {
    setTimeout(() => {
      if (runState.isRunning) {
        statusEl.textContent = "GPS attivo";
      }
    }, 3000);
  }
};

/**
 * Pause/Resume run
 */
window.togglePauseRun = () => {
  if (!runState.isRunning) return;

  const pauseBtn = document.getElementById("pause-btn");

  if (runState.isPaused) {
    // Resume
    runState.isPaused = false;
    runState.pausedTime += Date.now() - runState.lastPauseTime;
    runState.lastPauseTime = null;

    if (pauseBtn) {
      pauseBtn.innerHTML = '<i class="fas fa-pause"></i> Pausa';
      pauseBtn.classList.remove("btn-resume");
    }

    analytics.logEvent("run_resumed");
  } else {
    // Pause
    runState.isPaused = true;
    runState.lastPauseTime = Date.now();

    if (pauseBtn) {
      pauseBtn.innerHTML = '<i class="fas fa-play"></i> Riprendi';
      pauseBtn.classList.add("btn-resume");
    }

    analytics.logEvent("run_paused");
  }
};

/**
 * Stop and save run
 */
window.stopRun = () => {
  if (!runState.isRunning) return;

  const confirmed = confirm("Vuoi terminare la corsa?");
  if (!confirmed) return;

  // Stop GPS tracking
  if (runState.watchId !== null) {
    navigator.geolocation.clearWatch(runState.watchId);
  }

  // Stop timer
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }

  // Release wake lock
  if (window.wakeLock) {
    window.wakeLock.release();
    window.wakeLock = null;
  }

  // Calculate final stats
  const duration = getElapsedTime();
  const calories = Math.round(runState.totalDistance * 60); // Rough estimate

  // Save run data
  const runData = {
    id: "run_" + Date.now(),
    date: new Date().toISOString().split("T")[0],
    type: "run",
    duration_real: Math.round(duration),
    distance: runState.totalDistance,
    avgPace: runState.avgPace,
    maxSpeed: runState.maxSpeed,
    elevation: {
      gain: runState.elevation.gain,
      loss: runState.elevation.loss,
    },
    splits: runState.splits,
    calories: calories,
    positions:
      runState.positions.length > 100
        ? runState.positions.filter(
            (_, i) => i % Math.ceil(runState.positions.length / 100) === 0,
          )
        : runState.positions,
  };

  dataManager.saveLog(runData);

  // Track analytics
  analytics.logEvent("run_completed", {
    distance_km: runState.totalDistance.toFixed(2),
    duration_seconds: Math.round(duration),
    avg_pace: formatPace(runState.avgPace),
  });

  // Show summary
  showRunSummary(runData);

  // Reset state
  runState.isRunning = false;

  // Update UI
  const startBtn = document.getElementById("start-btn");
  const pauseBtn = document.getElementById("pause-btn");
  const stopBtn = document.getElementById("stop-btn");

  if (startBtn) startBtn.style.display = "inline-flex";
  if (pauseBtn) pauseBtn.style.display = "none";
  if (stopBtn) stopBtn.style.display = "none";
};

/**
 * Show run summary modal
 */
function showRunSummary(runData) {
  const summaryHtml = `
        <div class="run-summary-modal">
            <div class="summary-header">
                <i class="fas fa-trophy"></i>
                <h2>Corsa Completata!</h2>
            </div>
            <div class="summary-stats">
                <div class="summary-stat main">
                    <span class="value">${runData.distance.toFixed(2)}</span>
                    <span class="label">km</span>
                </div>
                <div class="summary-row">
                    <div class="summary-stat">
                        <span class="label">Tempo</span>
                        <span class="value">${formatTime(runData.duration_real)}</span>
                    </div>
                    <div class="summary-stat">
                        <span class="label">Passo Medio</span>
                        <span class="value">${formatPace(runData.avgPace)}</span>
                    </div>
                </div>
                <div class="summary-row">
                    <div class="summary-stat">
                        <span class="label">Calorie</span>
                        <span class="value">${runData.calories}</span>
                    </div>
                    <div class="summary-stat">
                        <span class="label">Dislivello</span>
                        <span class="value">↑${Math.round(runData.elevation.gain)}m</span>
                    </div>
                </div>
            </div>
            <button class="btn btn-primary" onclick="this.closest('.run-summary-modal').remove()">
                Chiudi
            </button>
        </div>
    `;

  const overlay = document.createElement("div");
  overlay.className = "summary-overlay";
  overlay.innerHTML = summaryHtml;
  document.body.appendChild(overlay);

  setTimeout(() => overlay.classList.add("visible"), 10);
}

// Export pure functions for testing
export { calculateDistance, formatTime, formatPace, toRad };

export default function RunTracker() {
  // Reset UI state on mount
  setTimeout(() => {
    if (!runState.isRunning) {
      const pauseBtn = document.getElementById("pause-btn");
      const stopBtn = document.getElementById("stop-btn");
      if (pauseBtn) pauseBtn.style.display = "none";
      if (stopBtn) stopBtn.style.display = "none";
    }
  }, 100);

  return `
        <div class="run-tracker-page">
            <div class="run-header">
                <h1><i class="fas fa-running"></i> Corsa Outdoor</h1>
                <span id="gps-status" class="gps-status">GPS pronto</span>
            </div>

            <div class="route-container card">
                <canvas id="route-canvas" class="route-canvas"></canvas>
                <div class="route-placeholder" id="route-placeholder">
                    <i class="fas fa-map-marked-alt"></i>
                    <p>Il percorso apparirà qui</p>
                </div>
            </div>

            <div class="stats-panel">
                <div class="main-stat card">
                    <span class="stat-value" id="run-distance">0.00</span>
                    <span class="stat-unit">km</span>
                </div>

                <div class="stats-row">
                    <div class="stat-card card">
                        <span class="stat-label">Tempo</span>
                        <span class="stat-value" id="run-time">00:00</span>
                    </div>
                    <div class="stat-card card">
                        <span class="stat-label">Passo</span>
                        <span class="stat-value" id="run-pace">--:--</span>
                        <span class="stat-unit">/km</span>
                    </div>
                </div>

                <div class="stats-row">
                    <div class="stat-card card">
                        <span class="stat-label">Passo Medio</span>
                        <span class="stat-value" id="run-avg-pace">--:--</span>
                        <span class="stat-unit">/km</span>
                    </div>
                    <div class="stat-card card">
                        <span class="stat-label">Dislivello</span>
                        <span class="stat-value" id="run-elevation">↑0m ↓0m</span>
                    </div>
                </div>
            </div>

            <div class="splits-section">
                <h3>Splits</h3>
                <div id="splits-list" class="splits-list">
                    <p class="no-splits">I tuoi km appariranno qui</p>
                </div>
            </div>

            <div class="run-controls">
                <button id="start-btn" class="btn btn-primary btn-large" onclick="window.startRun()">
                    <i class="fas fa-play"></i> Inizia Corsa
                </button>
                <button id="pause-btn" class="btn btn-secondary btn-large" onclick="window.togglePauseRun()" style="display: none;">
                    <i class="fas fa-pause"></i> Pausa
                </button>
                <button id="stop-btn" class="btn btn-danger btn-large" onclick="window.stopRun()" style="display: none;">
                    <i class="fas fa-stop"></i> Termina
                </button>
            </div>
        </div>

        <style>
            .run-tracker-page {
                padding-bottom: 100px;
            }

            .run-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: var(--spacing-md);
            }

            .run-header h1 {
                font-size: 1.5rem;
                display: flex;
                align-items: center;
                gap: var(--spacing-sm);
            }

            .gps-status {
                font-size: 0.8rem;
                padding: 0.4rem 0.8rem;
                background: rgba(16, 185, 129, 0.2);
                color: #10b981;
                border-radius: 20px;
            }

            .gps-status.error {
                background: rgba(239, 68, 68, 0.2);
                color: #ef4444;
            }

            .route-container {
                height: 200px;
                position: relative;
                overflow: hidden;
                margin-bottom: var(--spacing-md);
            }

            .route-canvas {
                width: 100%;
                height: 100%;
                display: none;
            }

            .route-placeholder {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                color: var(--text-secondary);
            }

            .route-placeholder i {
                font-size: 3rem;
                margin-bottom: var(--spacing-sm);
                opacity: 0.5;
            }

            .stats-panel {
                margin-bottom: var(--spacing-lg);
            }

            .main-stat {
                text-align: center;
                padding: var(--spacing-lg);
                margin-bottom: var(--spacing-md);
            }

            .main-stat .stat-value {
                font-size: 4rem;
                font-weight: 700;
                color: var(--accent-primary);
                line-height: 1;
            }

            .main-stat .stat-unit {
                font-size: 1.5rem;
                color: var(--text-secondary);
                margin-left: 5px;
            }

            .stats-row {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: var(--spacing-md);
                margin-bottom: var(--spacing-md);
            }

            .stat-card {
                text-align: center;
                padding: var(--spacing-md);
            }

            .stat-label {
                display: block;
                font-size: 0.75rem;
                color: var(--text-secondary);
                text-transform: uppercase;
                letter-spacing: 1px;
                margin-bottom: var(--spacing-xs);
            }

            .stat-card .stat-value {
                font-size: 1.5rem;
                font-weight: 600;
                color: var(--text-primary);
            }

            .stat-card .stat-unit {
                font-size: 0.8rem;
                color: var(--text-secondary);
            }

            .splits-section {
                margin-bottom: var(--spacing-lg);
            }

            .splits-section h3 {
                font-size: 1rem;
                margin-bottom: var(--spacing-sm);
                color: var(--text-secondary);
            }

            .splits-list {
                background: var(--bg-card);
                border-radius: var(--radius-md);
                padding: var(--spacing-md);
            }

            .split-item {
                display: flex;
                justify-content: space-between;
                padding: var(--spacing-sm) 0;
                border-bottom: 1px solid rgba(255, 255, 255, 0.05);
            }

            .split-item:last-child {
                border-bottom: none;
            }

            .split-km {
                color: var(--text-secondary);
            }

            .split-time {
                font-weight: 600;
                color: var(--accent-primary);
            }

            .no-splits {
                text-align: center;
                color: var(--text-secondary);
                font-size: 0.9rem;
                margin: 0;
            }

            .run-controls {
                display: flex;
                gap: var(--spacing-md);
                position: fixed;
                bottom: 80px;
                left: var(--spacing-md);
                right: var(--spacing-md);
            }

            .btn-large {
                flex: 1;
                padding: 1rem;
                font-size: 1rem;
                font-weight: 600;
                border-radius: 50px;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                gap: var(--spacing-sm);
            }

            .btn-secondary {
                background: var(--bg-card);
                border: 1px solid rgba(255, 255, 255, 0.2);
            }

            .btn-resume {
                background: var(--accent-primary) !important;
                border-color: var(--accent-primary) !important;
            }

            .btn-danger {
                background: rgba(239, 68, 68, 0.2);
                border: 1px solid #ef4444;
                color: #ef4444;
            }

            /* Summary Modal */
            .summary-overlay {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.8);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 9999;
                opacity: 0;
                transition: opacity 0.3s ease;
            }

            .summary-overlay.visible {
                opacity: 1;
            }

            .run-summary-modal {
                background: var(--bg-card);
                border-radius: var(--radius-lg);
                padding: var(--spacing-xl);
                max-width: 350px;
                width: 90%;
                text-align: center;
                animation: slideUp 0.3s ease;
            }

            @keyframes slideUp {
                from {
                    transform: translateY(50px);
                    opacity: 0;
                }
                to {
                    transform: translateY(0);
                    opacity: 1;
                }
            }

            .summary-header {
                margin-bottom: var(--spacing-lg);
            }

            .summary-header i {
                font-size: 3rem;
                color: #fbbf24;
                margin-bottom: var(--spacing-sm);
            }

            .summary-header h2 {
                font-size: 1.5rem;
                margin: 0;
            }

            .summary-stats {
                margin-bottom: var(--spacing-lg);
            }

            .summary-stat.main {
                margin-bottom: var(--spacing-md);
            }

            .summary-stat.main .value {
                font-size: 3rem;
                font-weight: 700;
                color: var(--accent-primary);
            }

            .summary-stat.main .label {
                font-size: 1.2rem;
                color: var(--text-secondary);
            }

            .summary-row {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: var(--spacing-md);
                margin-bottom: var(--spacing-sm);
            }

            .summary-stat .label {
                display: block;
                font-size: 0.75rem;
                color: var(--text-secondary);
                text-transform: uppercase;
            }

            .summary-stat .value {
                font-size: 1.2rem;
                font-weight: 600;
                color: var(--text-primary);
            }

            .run-summary-modal .btn {
                width: 100%;
                margin-top: var(--spacing-md);
            }
        </style>
    `;
}
