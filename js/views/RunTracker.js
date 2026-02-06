export default function RunTracker() {
    window.startRun = () => {
        alert("GPS Tracking avviato. Corri forte! 🏃‍♂️");
        // Integration with Mapbox GL JS will go here
    };

    return `
        <div class="run-tracker-page">
            <h1>Corsa all'Aperto 🏃‍♂️</h1>
            <p class="subtitle">Traccia il tuo percorso GPS e monitora distanza e velocità.</p>

            <div id="map-container" class="card map-preview">
                <div class="map-placeholder">
                    <i class="fas fa-map-marked-alt"></i>
                    <p>Mappa GPS (Mapbox)</p>
                </div>
            </div>

            <div class="run-stats">
                <div class="card stat-card">
                    <span class="label">Km Totali</span>
                    <span class="value">0.00</span>
                </div>
                <div class="card stat-card">
                    <span class="label">Tempo</span>
                    <span class="value">00:00</span>
                </div>
            </div>

            <button class="btn btn-primary full-width" onclick="window.startRun()">
                AVVIA CORSA <i class="fas fa-play"></i>
            </button>
        </div>

        <style>
            .map-preview {
                height: 250px;
                margin: var(--spacing-lg) 0;
                display: flex;
                align-items: center;
                justify-content: center;
                background: var(--bg-secondary);
                position: relative;
                overflow: hidden;
            }
            .map-placeholder { text-align: center; color: var(--text-secondary); }
            .map-placeholder i { font-size: 3rem; margin-bottom: 1rem; }
            
            .run-stats {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: var(--spacing-md);
                margin-bottom: var(--spacing-lg);
            }
            .stat-card { text-align: center; }
            .stat-card .label { font-size: 0.8rem; color: var(--text-secondary); }
            .stat-card .value { font-size: 1.8rem; font-weight: 700; display: block; }
            .full-width { width: 100%; border-radius: 50px; padding: 1.2rem; }
        </style>
    `;
}
