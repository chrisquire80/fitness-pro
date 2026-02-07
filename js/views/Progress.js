import { dataManager } from '../services/DataManager.js';

export default function Progress() {
    const user = dataManager.getCurrentUser();
    const logs = dataManager.getLogs();

    // Calculate simple stats
    const totalWorkouts = logs.length;
    const totalMinutes = logs.reduce((acc, l) => acc + (l.duration_real ? l.duration_real / 60 : 20), 0); // Mock duration if missing

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
        </style>
    `;
}
