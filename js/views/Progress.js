import { dataManager } from '../services/DataManager.js';

export default function Progress() {
    const user = dataManager.getCurrentUser();
    const logs = dataManager.getLogs();

    // Calculate simple stats
    const totalWorkouts = logs.length;
    const totalMinutes = logs.reduce((acc, l) => acc + (l.duration_real ? l.duration_real / 60 : 20), 0);

    // Advanced Analytics - Weekly Stats
    const getWeeklyStats = () => {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        const weekLogs = logs.filter(l => new Date(l.date || l.created_at) >= weekAgo);
        return {
            count: weekLogs.length,
            minutes: weekLogs.reduce((acc, l) => acc + (l.duration_real ? l.duration_real / 60 : 20), 0),
            avgDuration: weekLogs.length > 0 ? Math.round((weekLogs.reduce((acc, l) => acc + (l.duration_real ? l.duration_real / 60 : 20), 0) / weekLogs.length)) : 0
        };
    };

    // Monthly Stats
    const getMonthlyStats = () => {
        const monthAgo = new Date();
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        const monthLogs = logs.filter(l => new Date(l.date || l.created_at) >= monthAgo);
        return {
            count: monthLogs.length,
            minutes: monthLogs.reduce((acc, l) => acc + (l.duration_real ? l.duration_real / 60 : 20), 0),
            avgPerWeek: monthLogs.length > 0 ? Math.round(monthLogs.length / 4) : 0
        };
    };

    // Personal Records - Most sets completed
    const getPersonalRecords = () => {
        const exerciseStats = {};
        logs.forEach(log => {
            if (log.sets) {
                const type = log.type || 'Unknown';
                exerciseStats[type] = (exerciseStats[type] || 0) + (log.sets || 0);
            }
        });
        return Object.entries(exerciseStats)
            .map(([type, sets]) => ({ type, sets }))
            .sort((a, b) => b.sets - a.sets)
            .slice(0, 3);
    };

    // Comparison with previous period
    const getProgressComparison = () => {
        const today = new Date();
        const twoWeeksAgo = new Date(today);
        twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
        const oneWeekAgo = new Date(today);
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

        const currentWeek = logs.filter(l => new Date(l.date || l.created_at) >= oneWeekAgo);
        const previousWeek = logs.filter(l => {
            const d = new Date(l.date || l.created_at);
            return d >= twoWeeksAgo && d < oneWeekAgo;
        });

        const currentCount = currentWeek.length;
        const previousCount = previousWeek.length;
        const trend = previousCount > 0 ? ((currentCount - previousCount) / previousCount * 100).toFixed(1) : 0;

        return {
            current: currentCount,
            previous: previousCount,
            trend: parseFloat(trend),
            trendIcon: trend > 0 ? '📈' : trend < 0 ? '📉' : '➡️'
        };
    };

    const weeklyStats = getWeeklyStats();
    const monthlyStats = getMonthlyStats();
    const personalRecords = getPersonalRecords();
    const progressComparison = getProgressComparison();

    // Generate last 7 days of activity data
    const getLast7DaysData = () => {
        const days = [];
        const dataMap = {};

        // Initialize last 7 days
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            const shortDate = date.toLocaleDateString('it-IT', { month: 'short', day: 'numeric' });
            days.push(shortDate);
            dataMap[dateStr] = 0;
        }

        // Aggregate workout minutes by date
        logs.forEach(log => {
            const logDate = log.date || log.created_at?.split('T')[0];
            if (logDate && dataMap.hasOwnProperty(logDate)) {
                const minutes = log.duration_real ? log.duration_real / 60 : 20;
                dataMap[logDate] += Math.round(minutes);
            }
        });

        // Get values in same order as days
        const values = [];
        const dateKeys = Object.keys(dataMap);
        dateKeys.slice(-7).forEach(dateKey => {
            values.push(dataMap[dateKey]);
        });

        return { labels: days, data: values };
    };

    const chartData = getLast7DaysData();

    // ── Strength Progression Data ──────────────────────────────
    const getStrengthProgression = () => {
        // Group logs by workout type, ordered by date
        const typeMap = {};
        logs.forEach(log => {
            const type = log.type || 'Unknown';
            const date = log.date || log.created_at?.split('T')[0];
            if (!date) return;
            if (!typeMap[type]) typeMap[type] = [];
            typeMap[type].push({
                date,
                sets: log.sets || 0,
                reps: log.reps || 0,
                volume: (log.sets || 0) * (log.reps || 0), // total volume
                duration: log.duration_real ? Math.round(log.duration_real / 60) : 20,
            });
        });

        // Sort each type by date
        Object.values(typeMap).forEach(entries => entries.sort((a, b) => a.date.localeCompare(b.date)));
        return typeMap;
    };

    const strengthData = getStrengthProgression();
    const strengthTypes = Object.keys(strengthData);

    // Color palette for multiple lines
    const chartColors = ['#8b5cf6', '#06b6d4', '#f59e0b', '#ef4444', '#10b981', '#ec4899'];

    // ── Personal Records (Volume) ────────────────────────────
    const getVolumeRecords = () => {
        const records = {};
        logs.forEach(log => {
            const type = log.type || 'Unknown';
            const volume = (log.sets || 0) * (log.reps || 0);
            if (!records[type] || volume > records[type].volume) {
                records[type] = { volume, sets: log.sets || 0, reps: log.reps || 0, date: log.date };
            }
        });
        return Object.entries(records)
            .map(([type, data]) => ({ type, ...data }))
            .sort((a, b) => b.volume - a.volume)
            .slice(0, 5);
    };

    const volumeRecords = getVolumeRecords();

    // Initialize Charts after render
    setTimeout(() => {
        if (!window.Chart) return;

        // ── Activity Bar Chart ──────────────────────
        const ctx = document.getElementById('weightChart');
        if (ctx) {
            new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: chartData.labels,
                    datasets: [{
                        label: 'Minuti di allenamento',
                        data: chartData.data,
                        backgroundColor: '#8b5cf6',
                        borderRadius: 4
                    }]
                },
                options: {
                    responsive: true,
                    plugins: { legend: { display: true } },
                    scales: {
                        y: { beginAtZero: true, title: { display: true, text: 'Minuti' } },
                        x: { display: true }
                    }
                }
            });
        }

        // ── Volume Progression Line Chart ───────────
        const volCtx = document.getElementById('volumeChart');
        if (volCtx && strengthTypes.length > 0) {
            const datasets = strengthTypes.slice(0, 6).map((type, idx) => {
                const entries = strengthData[type];
                return {
                    label: type,
                    data: entries.map(e => e.volume),
                    borderColor: chartColors[idx % chartColors.length],
                    backgroundColor: chartColors[idx % chartColors.length] + '20',
                    tension: 0.3,
                    fill: false,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                };
            });

            // Use the longest type's dates as labels
            const longestType = strengthTypes.reduce((a, b) =>
                strengthData[a].length >= strengthData[b].length ? a : b
            );
            const labels = strengthData[longestType].map(e => {
                const d = new Date(e.date);
                return d.toLocaleDateString('it-IT', { month: 'short', day: 'numeric' });
            });

            new Chart(volCtx, {
                type: 'line',
                data: { labels, datasets },
                options: {
                    responsive: true,
                    plugins: {
                        legend: { display: true, position: 'bottom' },
                        tooltip: {
                            callbacks: {
                                label: (ctx) => `${ctx.dataset.label}: ${ctx.parsed.y} volume (set × reps)`
                            }
                        }
                    },
                    scales: {
                        y: { beginAtZero: true, title: { display: true, text: 'Volume (Set × Reps)' } },
                        x: { display: true }
                    }
                }
            });
        }

        // ── Sets Progression Line Chart ─────────────
        const setsCtx = document.getElementById('setsChart');
        if (setsCtx && strengthTypes.length > 0) {
            const datasets = strengthTypes.slice(0, 6).map((type, idx) => ({
                label: type,
                data: strengthData[type].map(e => e.sets),
                borderColor: chartColors[idx % chartColors.length],
                tension: 0.3,
                fill: false,
                pointRadius: 3,
            }));

            const longestType = strengthTypes.reduce((a, b) =>
                strengthData[a].length >= strengthData[b].length ? a : b
            );
            const labels = strengthData[longestType].map(e => {
                const d = new Date(e.date);
                return d.toLocaleDateString('it-IT', { month: 'short', day: 'numeric' });
            });

            new Chart(setsCtx, {
                type: 'line',
                data: { labels, datasets },
                options: {
                    responsive: true,
                    plugins: { legend: { display: true, position: 'bottom' } },
                    scales: {
                        y: { beginAtZero: true, title: { display: true, text: 'Set Totali' } },
                        x: { display: true }
                    }
                }
            });
        }
    }, 100);

    return `
        <div class="progress-page">
            <h1>I tuoi Progressi 📈</h1>
            
            <div class="stats-grid">
                <div class="stat-card">
                    <span class="label">Allenamenti</span>
                    <span class="value">${totalWorkouts}</span>
                </div>
                <div class="stat-card">
                    <span class="label">Minuti</span>
                    <span class="value">${Math.round(totalMinutes)}</span>
                </div>
                <div class="stat-card">
                    <span class="label">Streak</span>
                    <span class="value">🔥 ${user.streak_days || 0}</span>
                </div>
            </div>

            <div class="chart-container card">
                <h3>Allenamenti - Ultimi 7 Giorni</h3>
                <canvas id="weightChart"></canvas>
            </div>

            <!-- Strength Progression Section -->
            ${strengthTypes.length > 0 ? `
            <div class="strength-section">
                <h2><i class="fas fa-chart-line"></i> Progressione Forza</h2>
                <div class="chart-container card">
                    <h3>Volume nel Tempo (Set × Reps)</h3>
                    <canvas id="volumeChart"></canvas>
                </div>
                <div class="chart-container card">
                    <h3>Set Totali per Allenamento</h3>
                    <canvas id="setsChart"></canvas>
                </div>

                ${volumeRecords.length > 0 ? `
                <div class="records-section card">
                    <h3><i class="fas fa-medal"></i> Record Personali (Volume)</h3>
                    <div class="records-list">
                        ${volumeRecords.map((record, idx) => `
                            <div class="record-item">
                                <span class="record-rank">${['🥇','🥈','🥉','4°','5°'][idx]}</span>
                                <span class="record-type">${record.type}</span>
                                <div class="record-details">
                                    <span class="record-value">${record.volume} vol</span>
                                    <span class="record-sub">${record.sets}s × ${record.reps}r · ${record.date}</span>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                ` : ''}
            </div>
            ` : `
            <div class="card" style="text-align:center; padding: var(--spacing-lg); margin: var(--spacing-lg) 0;">
                <i class="fas fa-chart-line" style="font-size:2rem; color: var(--text-secondary); margin-bottom: var(--spacing-sm);"></i>
                <p style="color: var(--text-secondary);">Completa qualche allenamento per vedere i grafici di progressione!</p>
            </div>
            `}

            <!-- Advanced Analytics Section -->
            <div class="analytics-section">
                <h2>📊 Analisi Dettagliata</h2>

                <!-- Weekly vs Monthly Stats -->
                <div class="stats-comparison">
                    <div class="comparison-card">
                        <div class="comparison-header">
                            <h3>Questa Settimana</h3>
                            <span class="comparison-value">${weeklyStats.count} allenamenti</span>
                        </div>
                        <div class="comparison-details">
                            <p>${weeklyStats.minutes.toFixed(0)} minuti totali</p>
                            <p>Durata media: ${weeklyStats.avgDuration} min</p>
                        </div>
                    </div>

                    <div class="comparison-card">
                        <div class="comparison-header">
                            <h3>Questo Mese</h3>
                            <span class="comparison-value">${monthlyStats.count} allenamenti</span>
                        </div>
                        <div class="comparison-details">
                            <p>${monthlyStats.minutes.toFixed(0)} minuti totali</p>
                            <p>Media: ${monthlyStats.avgPerWeek} /settimana</p>
                        </div>
                    </div>

                    <div class="comparison-card">
                        <div class="comparison-header">
                            <h3>Trend Settimanale</h3>
                            <span class="comparison-value">${progressComparison.trendIcon} ${Math.abs(progressComparison.trend)}%</span>
                        </div>
                        <div class="comparison-details">
                            <p>Questa settimana: ${progressComparison.current}</p>
                            <p>Settimana precedente: ${progressComparison.previous}</p>
                        </div>
                    </div>
                </div>

                <!-- Personal Records -->
                ${personalRecords.length > 0 ? `
                <div class="records-section card">
                    <h3>🏆 Tuoi Migliori</h3>
                    <div class="records-list">
                        ${personalRecords.map((record, idx) => `
                            <div class="record-item">
                                <span class="record-rank">#${idx + 1}</span>
                                <span class="record-type">${record.type}</span>
                                <span class="record-value">${record.sets} set</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
                ` : ''}
            </div>

            <div class="history-list">
                <h3>Ultime Attività</h3>
                ${logs.slice(0, 5).reverse().map(log => `
                     <div class="history-item">
                        <div class="history-date">${log.date}</div>
                        <div class="history-details">${log.type} - ${log.sets} Sets</div>
                     </div>
                `).join('') || '<p style="color:var(--text-secondary)">Nessun allenamento recente.</p>'}
            </div>
        </div>

        <style>
            .stats-grid {
                display: grid;
                grid-template-columns: 1fr 1fr 1fr;
                gap: var(--spacing-sm);
                margin: var(--spacing-md) 0;
            }
            .stat-card {
                background: var(--bg-card);
                padding: var(--spacing-md);
                border-radius: var(--radius-md);
                text-align: center;
            }
            .stat-card .label { display: block; font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 5px; }
            .stat-card .value { font-size: 1.2rem; font-weight: bold; }
            .chart-container {
                padding: var(--spacing-md);
                margin-bottom: var(--spacing-lg);
            }
            .history-item {
                display: flex;
                justify-content: space-between;
                padding: var(--spacing-sm);
                border-bottom: 1px solid rgba(255,255,255,0.05);
            }

            /* Advanced Analytics Styles */
            .analytics-section { margin: var(--spacing-lg) 0; }
            .analytics-section h2 { margin-bottom: var(--spacing-md); }

            .stats-comparison {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: var(--spacing-md);
                margin-bottom: var(--spacing-lg);
            }

            .comparison-card {
                background: var(--bg-card);
                padding: var(--spacing-md);
                border-radius: var(--radius-md);
                border-left: 4px solid var(--accent-primary);
            }

            .comparison-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: var(--spacing-sm);
            }

            .comparison-header h3 { margin: 0; font-size: 0.95rem; }

            .comparison-value {
                font-weight: 700;
                color: var(--accent-primary);
                font-size: 1.1rem;
            }

            .comparison-details p {
                margin: 4px 0;
                font-size: 0.85rem;
                color: var(--text-secondary);
            }

            .records-section { margin: var(--spacing-lg) 0; }

            .records-list {
                display: flex;
                flex-direction: column;
                gap: var(--spacing-sm);
            }

            .record-item {
                display: flex;
                align-items: center;
                gap: var(--spacing-md);
                padding: var(--spacing-sm);
                background: rgba(139, 92, 246, 0.1);
                border-radius: var(--radius-md);
                border-left: 3px solid var(--accent-primary);
            }

            .record-rank {
                font-weight: 700;
                color: var(--accent-primary);
                font-size: 1.1rem;
                min-width: 35px;
            }

            .record-type {
                flex: 1;
                font-weight: 500;
            }

            .record-value {
                background: var(--accent-primary);
                color: white;
                padding: 2px 8px;
                border-radius: 12px;
                font-size: 0.8rem;
                font-weight: 600;
            }

            /* Strength Progression */
            .strength-section { margin: var(--spacing-lg) 0; }
            .strength-section h2 {
                margin-bottom: var(--spacing-md);
                display: flex;
                align-items: center;
                gap: var(--spacing-sm);
            }
            .strength-section .chart-container { margin-bottom: var(--spacing-md); }

            .record-details {
                display: flex;
                flex-direction: column;
                align-items: flex-end;
            }
            .record-sub {
                font-size: 0.7rem;
                color: var(--text-secondary);
                margin-top: 2px;
            }
        </style>
    `;
}
