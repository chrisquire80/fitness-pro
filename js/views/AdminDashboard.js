/**
 * AdminDashboard.js
 * Advanced Admin Dashboard for Fitness Pro App
 * Provides debugging tools, monitoring, and system management
 */

export default function AdminDashboard() {
  // Only show in debug mode (localhost or development environment)
  const isDebugMode =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1" ||
    window.fitnessApp?.config?.environment === "development";

  if (!isDebugMode) {
    return `
            <div class="admin-access-denied">
                <h2>🔒 Accesso Negato</h2>
                <p>Questa sezione è disponibile solo in modalità debug (localhost).</p>
                <p>Ambiente attuale: ${window.fitnessApp?.config?.environment || "sconosciuto"}</p>
            </div>
        `;
  }

  // Initialize dashboard data
  window.initAdminDashboard = () => {
    loadSystemStats();
    loadErrorStats();
    loadPerformanceMetrics();
    loadBackupStats();
    loadUserStats();
    loadAnalyticsStats();
    setupRealTimeUpdates();
  };

  window.loadSystemStats = () => {
    const stats = {
      appVersion: window.fitnessApp?.config?.app?.version || "Unknown",
      environment: window.fitnessApp?.config?.environment || "Unknown",
      uptime: performance.now(),
      memory: performance.memory
        ? {
            used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
            total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024),
            limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024),
          }
        : null,
      storage: getStorageUsage(),
      online: navigator.onLine,
    };

    document.getElementById("system-stats").innerHTML = `
            <div class="stat-grid">
                <div class="stat-card">
                    <h4>App Version</h4>
                    <div class="stat-value">${stats.appVersion}</div>
                </div>
                <div class="stat-card">
                    <h4>Environment</h4>
                    <div class="stat-value env-${stats.environment}">${stats.environment}</div>
                </div>
                <div class="stat-card">
                    <h4>Uptime</h4>
                    <div class="stat-value">${Math.round(stats.uptime / 1000)}s</div>
                </div>
                <div class="stat-card">
                    <h4>Memory Usage</h4>
                    <div class="stat-value">
                        ${stats.memory ? `${stats.memory.used}MB / ${stats.memory.limit}MB` : "N/A"}
                    </div>
                </div>
                <div class="stat-card">
                    <h4>Storage</h4>
                    <div class="stat-value">${stats.storage.used}KB</div>
                </div>
                <div class="stat-card ${stats.online ? "online" : "offline"}">
                    <h4>Network</h4>
                    <div class="stat-value">${stats.online ? "🟢 Online" : "🔴 Offline"}</div>
                </div>
            </div>
        `;
  };

  window.loadErrorStats = () => {
    const errorStats = window.errorHandler?.getErrorStats() || {
      totalErrors: 0,
      errorsByCategory: {},
      errorsByType: {},
    };

    const categoryChart = Object.entries(errorStats.errorsByCategory)
      .map(
        ([cat, count]) =>
          `<div class="error-bar"><span>${cat}</span><div class="bar" style="width: ${Math.min(count * 10, 100)}%">${count}</div></div>`,
      )
      .join("");

    document.getElementById("error-stats").innerHTML = `
            <div class="error-overview">
                <div class="error-total">
                    <h4>Total Errors</h4>
                    <div class="error-count ${errorStats.totalErrors > 10 ? "high" : errorStats.totalErrors > 5 ? "medium" : "low"}">${errorStats.totalErrors}</div>
                </div>
                <div class="error-categories">
                    <h4>By Category</h4>
                    <div class="error-chart">
                        ${categoryChart || '<p class="no-data">No errors recorded</p>'}
                    </div>
                </div>
            </div>
        `;
  };

  window.loadPerformanceMetrics = () => {
    const perfSummary = window.performanceMonitor?.getPerformanceSummary() || {
      metrics: {},
    };
    const recommendations =
      window.performanceMonitor?.getRecommendations() || [];

    document.getElementById("performance-metrics").innerHTML = `
            <div class="perf-overview">
                <div class="perf-metrics">
                    <div class="perf-card">
                        <h4>Long Tasks</h4>
                        <div class="perf-value">${perfSummary.metrics.longTasks?.count || 0}</div>
                        <div class="perf-subtitle">blocking tasks</div>
                    </div>
                    <div class="perf-card">
                        <h4>Memory</h4>
                        <div class="perf-value">${Math.round(perfSummary.metrics.memory?.current?.usage || 0)}%</div>
                        <div class="perf-subtitle">usage</div>
                    </div>
                    <div class="perf-card">
                        <h4>Interactions</h4>
                        <div class="perf-value">${perfSummary.metrics.interactions?.total || 0}</div>
                        <div class="perf-subtitle">total</div>
                    </div>
                    <div class="perf-card">
                        <h4>Network</h4>
                        <div class="perf-value">${Math.round(perfSummary.metrics.network?.successRate || 100)}%</div>
                        <div class="perf-subtitle">success rate</div>
                    </div>
                </div>
                <div class="perf-recommendations">
                    <h4>Recommendations</h4>
                    ${
                      recommendations.length > 0
                        ? recommendations
                            .map(
                              (rec) => `
                            <div class="recommendation ${rec.priority}">
                                <strong>${rec.title}</strong>
                                <p>${rec.description}</p>
                            </div>
                        `,
                            )
                            .join("")
                        : '<p class="no-data">No recommendations</p>'
                    }
                </div>
            </div>
        `;
  };

  window.loadBackupStats = () => {
    const backupStats = window.backupService?.getBackupStats() || {
      totalBackups: 0,
      latestBackup: null,
      totalSize: 0,
      autoSyncEnabled: false,
    };

    document.getElementById("backup-stats").innerHTML = `
            <div class="backup-overview">
                <div class="backup-card">
                    <h4>Total Backups</h4>
                    <div class="backup-value">${backupStats.totalBackups}</div>
                </div>
                <div class="backup-card">
                    <h4>Latest Backup</h4>
                    <div class="backup-value">
                        ${
                          backupStats.latestBackup
                            ? new Date(
                                backupStats.latestBackup,
                              ).toLocaleDateString()
                            : "Never"
                        }
                    </div>
                </div>
                <div class="backup-card">
                    <h4>Total Size</h4>
                    <div class="backup-value">${Math.round(backupStats.totalSize / 1024)}KB</div>
                </div>
                <div class="backup-card">
                    <h4>Auto Sync</h4>
                    <div class="backup-value ${backupStats.autoSyncEnabled ? "enabled" : "disabled"}">
                        ${backupStats.autoSyncEnabled ? "✅ On" : "❌ Off"}
                    </div>
                </div>
            </div>
        `;
  };

  window.loadUserStats = () => {
    const userProfile = window.fitnessApp?.getState("user.profile") || {};
    const workoutStats = window.fitnessApp?.getState("workout") || {};

    document.getElementById("user-stats").innerHTML = `
            <div class="user-overview">
                <div class="user-card">
                    <h4>User ID</h4>
                    <div class="user-value">${userProfile.id || "Guest"}</div>
                </div>
                <div class="user-card">
                    <h4>Total Workouts</h4>
                    <div class="user-value">${userProfile.stats?.totalWorkouts || 0}</div>
                </div>
                <div class="user-card">
                    <h4>Streak Days</h4>
                    <div class="user-value">${userProfile.stats?.streakDays || 0}</div>
                </div>
                <div class="user-card">
                    <h4>Current Level</h4>
                    <div class="user-value">${userProfile.stats?.level || 1}</div>
                </div>
                <div class="user-card">
                    <h4>Workout Active</h4>
                    <div class="user-value ${workoutStats.isActive ? "active" : "inactive"}">
                        ${workoutStats.isActive ? "🏃 Yes" : "⏸️ No"}
                    </div>
                </div>
            </div>
        `;
  };

  window.loadAnalyticsStats = () => {
    const prefix = window.fitnessApp?.config?.storage?.prefix || "fitness_";
    const historyKey = `${prefix}analytics_history`;
    const queueKey = `${prefix}analytics_queue`;
    let events = [];

    try {
      events = JSON.parse(localStorage.getItem(historyKey)) || [];
    } catch {
      events = [];
    }

    let queueSize = 0;
    try {
      queueSize = (JSON.parse(localStorage.getItem(queueKey)) || []).length;
    } catch {
      queueSize = 0;
    }

    const byName = {};
    const byPath = {};
    const bySession = {};
    let totalDuration = 0;
    let timingCount = 0;

    events.forEach((evt) => {
      byName[evt.name] = (byName[evt.name] || 0) + 1;
      const path = evt.params?.path || "/";
      byPath[path] = (byPath[path] || 0) + 1;
      const sessionId = evt.params?.session_id || "unknown";
      bySession[sessionId] = (bySession[sessionId] || 0) + 1;

      if (
        evt.name === "timing" &&
        typeof evt.params?.duration_ms === "number"
      ) {
        totalDuration += evt.params.duration_ms;
        timingCount += 1;
      }
    });

    const avgPageTimeMs =
      timingCount > 0 ? Math.round(totalDuration / timingCount) : 0;

    const funnel = {
      onboarding: byName.page_onboarding || 0,
      workouts: byName.page_workouts || 0,
      active: byName.page_active_workout || 0,
      complete: byName.workout_complete || 0,
    };

    const topEvents = Object.entries(byName)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(
        ([name, count]) =>
          `<div class="metric-line"><span>${name}</span><strong>${count}</strong></div>`,
      )
      .join("");

    const topPaths = Object.entries(byPath)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(
        ([path, count]) =>
          `<div class="metric-line"><span>${path}</span><strong>${count}</strong></div>`,
      )
      .join("");

    document.getElementById("analytics-stats").innerHTML = `
            <div class="stat-grid">
                <div class="stat-card">
                    <h4>Events</h4>
                    <div class="stat-value">${events.length}</div>
                </div>
                <div class="stat-card">
                    <h4>Sessions</h4>
                    <div class="stat-value">${Object.keys(bySession).length}</div>
                </div>
                <div class="stat-card">
                    <h4>Avg Page Time</h4>
                    <div class="stat-value">${avgPageTimeMs}ms</div>
                </div>
                <div class="stat-card">
                    <h4>Queue Size</h4>
                    <div class="stat-value">${queueSize}</div>
                </div>
            </div>
            <div class="analytics-lists">
                <div>
                    <h4>Top Events</h4>
                    ${topEvents || '<p class="no-data">No events</p>'}
                </div>
                <div>
                    <h4>Top Paths</h4>
                    ${topPaths || '<p class="no-data">No paths</p>'}
                </div>
                <div>
                    <h4>Funnel</h4>
                    <div class="metric-line"><span>Onboarding</span><strong>${funnel.onboarding}</strong></div>
                    <div class="metric-line"><span>Workouts</span><strong>${funnel.workouts}</strong></div>
                    <div class="metric-line"><span>Active Workout</span><strong>${funnel.active}</strong></div>
                    <div class="metric-line"><span>Complete</span><strong>${funnel.complete}</strong></div>
                </div>
            </div>
        `;
  };

  window.getStorageUsage = () => {
    let totalSize = 0;
    const details = {};

    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        const size = new Blob([localStorage[key]]).size;
        totalSize += size;
        if (key.startsWith("fitness_")) {
          details[key] = Math.round(size / 1024);
        }
      }
    }

    return {
      used: Math.round(totalSize / 1024),
      details,
    };
  };

  window.setupRealTimeUpdates = () => {
    // Update every 5 seconds
    setInterval(() => {
      if (document.getElementById("admin-dashboard")) {
        loadSystemStats();
        loadErrorStats();
        loadPerformanceMetrics();
        loadAnalyticsStats();
      }
    }, 5000);
  };

  // Action handlers
  window.clearErrors = () => {
    if (window.errorHandler) {
      window.errorHandler.clearErrors();
      loadErrorStats();
      alert("Error log cleared");
    }
  };

  window.clearStorage = () => {
    if (
      confirm(
        "Are you sure you want to clear all storage? This will reset the app.",
      )
    ) {
      localStorage.clear();
      location.reload();
    }
  };

  window.createBackup = async () => {
    try {
      const result = await window.fitnessApp.backup.create();
      alert(`Backup created: ${result.backupId}`);
      loadBackupStats();
    } catch (error) {
      alert(`Backup failed: ${error.message}`);
    }
  };

  window.exportLogs = () => {
    const logs = {
      errors: window.errorHandler?.getErrorStats() || {},
      performance: window.performanceMonitor?.exportData() || {},
      system: {
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
      },
    };

    const dataStr = JSON.stringify(logs, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `fitness-debug-${Date.now()}.json`;
    link.click();
  };

  window.runDiagnostics = () => {
    const diagnostics = [];

    // Memory check
    if (performance.memory) {
      const usage =
        performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit;
      if (usage > 0.8) {
        diagnostics.push("⚠️ High memory usage detected");
      }
    }

    // Error check
    const errorStats = window.errorHandler?.getErrorStats();
    if (errorStats?.totalErrors > 20) {
      diagnostics.push("⚠️ High error count detected");
    }

    // Storage check
    const storage = getStorageUsage();
    if (storage.used > 5000) {
      // 5MB
      diagnostics.push("⚠️ High storage usage detected");
    }

    // Performance check
    const perfSummary = window.performanceMonitor?.getPerformanceSummary();
    if (perfSummary?.metrics?.longTasks?.count > 10) {
      diagnostics.push("⚠️ Performance issues detected");
    }

    const resultDiv = document.getElementById("diagnostics-result");
    if (diagnostics.length === 0) {
      resultDiv.innerHTML =
        '<div class="diagnostic-ok">✅ All systems OK</div>';
    } else {
      resultDiv.innerHTML = `
                <div class="diagnostic-warnings">
                    ${diagnostics.map((d) => `<div class="diagnostic-item">${d}</div>`).join("")}
                </div>
            `;
    }
  };

  return `
        <div class="admin-dashboard" id="admin-dashboard">
            <div class="admin-header">
                <h1>🔧 Admin Dashboard</h1>
                <div class="admin-actions">
                    <button class="btn btn-sm" onclick="window.initAdminDashboard()">🔄 Refresh</button>
                    <button class="btn btn-sm" onclick="window.exportLogs()">📊 Export Logs</button>
                    <button class="btn btn-sm" onclick="window.runDiagnostics()">🔍 Run Diagnostics</button>
                </div>
            </div>

            <div class="admin-grid">
                <!-- System Stats -->
                <div class="admin-section">
                    <h3>System Status</h3>
                    <div id="system-stats"></div>
                </div>

                <!-- Error Stats -->
                <div class="admin-section">
                    <h3>Error Monitoring</h3>
                    <div id="error-stats"></div>
                    <div class="section-actions">
                        <button class="btn btn-sm btn-danger" onclick="window.clearErrors()">Clear Errors</button>
                    </div>
                </div>

                <!-- Performance Metrics -->
                <div class="admin-section">
                    <h3>Performance Metrics</h3>
                    <div id="performance-metrics"></div>
                </div>

                <!-- Analytics -->
                <div class="admin-section">
                    <h3>Analytics</h3>
                    <div id="analytics-stats"></div>
                </div>

                <!-- Backup Stats -->
                <div class="admin-section">
                    <h3>Backup System</h3>
                    <div id="backup-stats"></div>
                    <div class="section-actions">
                        <button class="btn btn-sm" onclick="window.createBackup()">Create Backup</button>
                    </div>
                </div>

                <!-- User Stats -->
                <div class="admin-section">
                    <h3>User Information</h3>
                    <div id="user-stats"></div>
                </div>

                <!-- Diagnostics -->
                <div class="admin-section">
                    <h3>Diagnostics</h3>
                    <div id="diagnostics-result">
                        <p>Click "Run Diagnostics" to check system health</p>
                    </div>
                </div>

                <!-- Quick Actions -->
                <div class="admin-section">
                    <h3>Quick Actions</h3>
                    <div class="action-grid">
                        <button class="action-btn" onclick="window.fitnessApp.router()">🔄 Refresh Router</button>
                        <button class="action-btn" onclick="window.fitnessApp.setState('app.isLoading', true)">⏳ Test Loading</button>
                        <button class="action-btn" onclick="window.fitnessApp.showNotification('info', 'Test', 'Test notification')">💬 Test Notification</button>
                        <button class="action-btn danger" onclick="window.clearStorage()">🗑️ Clear Storage</button>
                    </div>
                </div>

                <!-- Console -->
                <div class="admin-section full-width">
                    <h3>Debug Console</h3>
                    <div class="debug-console">
                        <div class="console-output" id="console-output">
                            <div class="console-line">Welcome to Fitness Pro Debug Console</div>
                            <div class="console-line">Available objects: window.fitnessApp, window.errorHandler, window.performanceMonitor</div>
                        </div>
                        <div class="console-input">
                            <input type="text" id="console-input" placeholder="Enter JavaScript command..."
                                   onkeypress="if(event.key==='Enter') window.executeConsoleCommand()">
                            <button onclick="window.executeConsoleCommand()">Execute</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <script>
            window.executeConsoleCommand = () => {
                const input = document.getElementById('console-input');
                const output = document.getElementById('console-output');
                const command = input.value.trim();

                if (!command) return;

                const commandLine = document.createElement('div');
                commandLine.className = 'console-line command';
                commandLine.textContent = '> ' + command;
                output.appendChild(commandLine);

                try {
                    const result = eval(command);
                    const resultLine = document.createElement('div');
                    resultLine.className = 'console-line result';
                    resultLine.textContent = typeof result === 'object' ? JSON.stringify(result, null, 2) : String(result);
                    output.appendChild(resultLine);
                } catch (error) {
                    const errorLine = document.createElement('div');
                    errorLine.className = 'console-line error';
                    errorLine.textContent = 'Error: ' + error.message;
                    output.appendChild(errorLine);
                }

                input.value = '';
                output.scrollTop = output.scrollHeight;
            };

            // Auto-initialize when view loads
            setTimeout(() => {
                if (document.getElementById('admin-dashboard')) {
                    window.initAdminDashboard();
                }
            }, 100);
        </script>

        <style>
            .admin-dashboard {
                padding: 1rem;
                background: var(--bg-primary);
                min-height: 100vh;
                font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
            }

            .admin-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 2rem;
                padding-bottom: 1rem;
                border-bottom: 2px solid var(--accent-primary);
            }

            .admin-header h1 {
                margin: 0;
                color: var(--accent-primary);
            }

            .admin-actions {
                display: flex;
                gap: 0.5rem;
            }

            .admin-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                gap: 1.5rem;
            }

            .admin-section {
                background: var(--bg-secondary);
                border-radius: var(--radius-md);
                padding: 1.5rem;
                border: 1px solid rgba(255,255,255,0.1);
            }

            .admin-section.full-width {
                grid-column: 1 / -1;
            }

            .admin-section h3 {
                margin: 0 0 1rem 0;
                color: var(--accent-secondary);
                font-size: 1.1rem;
            }

            .stat-grid, .user-overview, .backup-overview {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 1rem;
            }

            .stat-card, .user-card, .backup-card {
                background: var(--bg-card);
                padding: 1rem;
                border-radius: var(--radius-sm);
                text-align: center;
            }

            .stat-card h4, .user-card h4, .backup-card h4 {
                margin: 0 0 0.5rem 0;
                font-size: 0.8rem;
                color: var(--text-secondary);
                text-transform: uppercase;
            }

            .stat-value, .user-value, .backup-value {
                font-size: 1.2rem;
                font-weight: bold;
                color: var(--text-primary);
            }

            .env-development { color: #f59e0b; }
            .env-staging { color: #06b6d4; }
            .env-production { color: #10b981; }

            .online { border-left: 3px solid #10b981; }
            .offline { border-left: 3px solid #ef4444; }

            .error-overview {
                display: flex;
                flex-direction: column;
                gap: 1rem;
            }

            .error-total {
                text-align: center;
            }

            .error-count {
                font-size: 2rem;
                font-weight: bold;
            }

            .error-count.low { color: #10b981; }
            .error-count.medium { color: #f59e0b; }
            .error-count.high { color: #ef4444; }

            .error-chart {
                font-size: 0.85rem;
            }

            .error-bar {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 0.5rem;
            }

            .error-bar .bar {
                background: var(--accent-primary);
                height: 20px;
                min-width: 30px;
                border-radius: 4px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 0.8rem;
                color: white;
            }

            .perf-overview {
                display: flex;
                flex-direction: column;
                gap: 1rem;
            }

            .perf-metrics {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 1rem;
            }

            .perf-card {
                background: var(--bg-card);
                padding: 1rem;
                border-radius: var(--radius-sm);
                text-align: center;
            }

            .perf-card h4 {
                margin: 0 0 0.5rem 0;
                font-size: 0.8rem;
                color: var(--text-secondary);
            }

            .perf-value {
                font-size: 1.5rem;
                font-weight: bold;
                color: var(--accent-primary);
            }

            .perf-subtitle {
                font-size: 0.7rem;
                color: var(--text-secondary);
                margin-top: 0.25rem;
            }

            .analytics-lists {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 1rem;
                margin-top: 1rem;
            }

            .metric-line {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 0.4rem 0;
                border-bottom: 1px solid rgba(255,255,255,0.05);
                font-size: 0.85rem;
            }

            .recommendation {
                background: var(--bg-card);
                padding: 0.75rem;
                border-radius: var(--radius-sm);
                margin-bottom: 0.5rem;
                border-left: 3px solid var(--text-secondary);
            }

            .recommendation.high { border-left-color: #ef4444; }
            .recommendation.medium { border-left-color: #f59e0b; }

            .recommendation strong {
                display: block;
                margin-bottom: 0.25rem;
                color: var(--text-primary);
            }

            .recommendation p {
                margin: 0;
                font-size: 0.85rem;
                color: var(--text-secondary);
            }

            .enabled { color: #10b981; }
            .disabled { color: #ef4444; }
            .active { color: #10b981; }
            .inactive { color: #6b7280; }

            .section-actions, .action-grid {
                margin-top: 1rem;
                display: flex;
                gap: 0.5rem;
                flex-wrap: wrap;
            }

            .action-btn {
                flex: 1;
                min-width: 120px;
                padding: 0.75rem;
                background: var(--bg-card);
                border: 1px solid rgba(255,255,255,0.2);
                border-radius: var(--radius-sm);
                color: var(--text-primary);
                cursor: pointer;
                transition: all 0.2s;
                font-size: 0.85rem;
            }

            .action-btn:hover {
                background: var(--accent-primary);
                transform: translateY(-1px);
            }

            .action-btn.danger:hover {
                background: var(--danger);
            }

            .debug-console {
                background: #1a1a1a;
                border-radius: var(--radius-sm);
                overflow: hidden;
                border: 1px solid rgba(255,255,255,0.1);
            }

            .console-output {
                height: 200px;
                overflow-y: auto;
                padding: 1rem;
                font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
                font-size: 0.85rem;
            }

            .console-line {
                margin-bottom: 0.25rem;
                color: #e5e7eb;
            }

            .console-line.command {
                color: #60a5fa;
            }

            .console-line.result {
                color: #10b981;
            }

            .console-line.error {
                color: #ef4444;
            }

            .console-input {
                display: flex;
                border-top: 1px solid rgba(255,255,255,0.1);
            }

            .console-input input {
                flex: 1;
                background: transparent;
                border: none;
                padding: 0.75rem 1rem;
                color: white;
                font-family: inherit;
                font-size: 0.85rem;
            }

            .console-input input:focus {
                outline: none;
            }

            .console-input button {
                background: var(--accent-primary);
                border: none;
                padding: 0.75rem 1rem;
                color: white;
                cursor: pointer;
                font-size: 0.85rem;
            }

            .no-data {
                color: var(--text-secondary);
                font-style: italic;
                text-align: center;
                padding: 1rem;
            }

            .diagnostic-ok {
                color: #10b981;
                text-align: center;
                padding: 1rem;
                font-weight: bold;
            }

            .diagnostic-warnings {
                background: rgba(239, 68, 68, 0.1);
                border: 1px solid #ef4444;
                border-radius: var(--radius-sm);
                padding: 1rem;
            }

            .diagnostic-item {
                margin-bottom: 0.5rem;
                color: #fca5a5;
            }

            .admin-access-denied {
                text-align: center;
                padding: 4rem 2rem;
                color: var(--text-secondary);
            }

            @media (max-width: 768px) {
                .admin-grid {
                    grid-template-columns: 1fr;
                }

                .stat-grid, .user-overview, .backup-overview {
                    grid-template-columns: 1fr;
                }

                .perf-metrics {
                    grid-template-columns: 1fr;
                }

                .admin-header {
                    flex-direction: column;
                    gap: 1rem;
                    text-align: center;
                }

                .action-grid {
                    flex-direction: column;
                }

                .action-btn {
                    min-width: unset;
                }
            }
        </style>
    `;
}
