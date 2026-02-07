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

    // Initialize Chart after render
    setTimeout(() => {
        const ctx = document.getElementById('weightChart');
        if (ctx && window.Chart) {
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
                    plugins: {
                        legend: { display: true }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            title: { display: true, text: 'Minuti' }
                        },
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
        </style>
    `;
}
