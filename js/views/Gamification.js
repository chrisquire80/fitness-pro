import { gamificationService } from "../services/GamificationService.js";

export default async function Gamification() {
  const stats = await gamificationService.getStatistics();
  const level = stats.level;
  const unlockedAchievements = gamificationService.getUnlockedAchievements();
  const dailyChallenges = await gamificationService.getCurrentChallenges("daily");
  const weeklyChallenges = await gamificationService.getCurrentChallenges("weekly");

  const getProgressBar = (progress) => {
    const filled = Math.round((progress / 100) * 20);
    return "█".repeat(filled) + "░".repeat(20 - filled);
  };

  return `
    <div class="gamification-page">
      <h1>🎮 Progressione & Risultati</h1>

      <!-- Level Progression Section -->
      <div class="level-section card">
        <div class="level-header">
          <div class="level-info">
            <h2>${level.name}</h2>
            <p>Livello ${level.level}</p>
          </div>
          <div class="level-badge">${level.level}</div>
        </div>

        <div class="level-stats">
          <div class="stat-item">
            <span class="stat-label">Punti Totali</span>
            <span class="stat-value">${stats.totalPoints}</span>
          </div>
          ${stats.nextLevel ? `
            <div class="stat-item">
              <span class="stat-label">Punti al Prossimo</span>
              <span class="stat-value">${stats.nextLevel.minPoints - stats.totalPoints}</span>
            </div>
          ` : ''}
        </div>

        ${stats.nextLevel ? `
          <div class="progress-section">
            <div class="progress-label">
              <span>Avanzamento</span>
              <span>${Math.round(stats.nextLevel?.progress || 0)}%</span>
            </div>
            <div class="progress-bar">
              <div class="progress-fill" style="width: ${Math.min(stats.nextLevel?.progress || 0, 100)}%"></div>
            </div>
            <p class="next-level">Prossimo: ${stats.nextLevel.name}</p>
          </div>
        ` : `
          <div class="progress-section">
            <p class="elite-message">🌟 Hai raggiunto il massimo livello!</p>
          </div>
        `}
      </div>

      <!-- Daily Challenges Section -->
      <div class="challenges-section">
        <h2>📅 Sfide Giornaliere</h2>
        <div class="challenges-grid">
          ${dailyChallenges.map(challenge => `
            <div class="challenge-card ${challenge.completed ? 'completed' : ''}">
              <div class="challenge-header">
                <span class="challenge-icon">${challenge.icon}</span>
                <span class="challenge-reward">+${challenge.reward} pts</span>
              </div>
              <h3>${challenge.name}</h3>
              <p class="challenge-description">${challenge.description}</p>

              <div class="challenge-progress">
                <div class="progress-text">
                  <span>${challenge.progress.current} / ${challenge.progress.target}</span>
                </div>
                <div class="progress-bar-small">
                  <div class="progress-fill" style="width: ${Math.min((challenge.progress.current / challenge.progress.target) * 100, 100)}%"></div>
                </div>
              </div>

              ${challenge.completed ? `
                <button class="btn btn-small btn-success" disabled>
                  ✅ Completata
                </button>
              ` : `
                <button class="btn btn-small btn-primary" disabled>
                  ${Math.round((challenge.progress.current / challenge.progress.target) * 100)}%
                </button>
              `}
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Weekly Challenges Section -->
      <div class="challenges-section">
        <h2>📊 Sfide Settimanali</h2>
        <div class="challenges-grid">
          ${weeklyChallenges.map(challenge => `
            <div class="challenge-card ${challenge.completed ? 'completed' : ''}">
              <div class="challenge-header">
                <span class="challenge-icon">${challenge.icon}</span>
                <span class="challenge-reward">+${challenge.reward} pts</span>
              </div>
              <h3>${challenge.name}</h3>
              <p class="challenge-description">${challenge.description}</p>

              <div class="challenge-progress">
                <div class="progress-text">
                  <span>${challenge.progress.current} / ${challenge.progress.target}</span>
                </div>
                <div class="progress-bar-small">
                  <div class="progress-fill" style="width: ${Math.min((challenge.progress.current / challenge.progress.target) * 100, 100)}%"></div>
                </div>
              </div>

              ${challenge.completed ? `
                <button class="btn btn-small btn-success" disabled>
                  ✅ Completata
                </button>
              ` : `
                <button class="btn btn-small btn-primary" disabled>
                  ${Math.round((challenge.progress.current / challenge.progress.target) * 100)}%
                </button>
              `}
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Achievements Section -->
      <div class="achievements-section">
        <h2>🏆 Risultati Sbloccati (${unlockedAchievements.length}/${stats.totalAchievements})</h2>

        ${unlockedAchievements.length > 0 ? `
          <div class="achievements-grid">
            ${unlockedAchievements.map(achievement => {
              const date = new Date(achievement.unlocked_date);
              const dateStr = date.toLocaleDateString('it-IT', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
              });

              return `
                <div class="achievement-card">
                  <div class="achievement-icon">${achievement.icon}</div>
                  <h3>${achievement.name}</h3>
                  <p>${achievement.description}</p>
                  <div class="achievement-footer">
                    <span class="achievement-points">+${achievement.points} pts</span>
                    <span class="achievement-date">${dateStr}</span>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        ` : `
          <p class="no-achievements">Completa sfide e allenamenti per sbloccare risultati!</p>
        `}
      </div>

      <!-- Statistics Section -->
      <div class="stats-overview card">
        <h2>📈 Statistiche</h2>
        <div class="stats-grid-2">
          <div class="stat-box">
            <span class="stat-icon">🎯</span>
            <span class="stat-label">Sfide Completate</span>
            <span class="stat-number">${stats.challengesCompleted}</span>
          </div>
          <div class="stat-box">
            <span class="stat-icon">🏆</span>
            <span class="stat-label">Risultati</span>
            <span class="stat-number">${stats.achievements}</span>
          </div>
          <div class="stat-box">
            <span class="stat-icon">💪</span>
            <span class="stat-label">Allenamenti</span>
            <span class="stat-number">${stats.stats.totalWorkouts}</span>
          </div>
          <div class="stat-box">
            <span class="stat-icon">⏱️</span>
            <span class="stat-label">Minuti</span>
            <span class="stat-number">${Math.round(stats.stats.totalMinutes)}</span>
          </div>
          <div class="stat-box">
            <span class="stat-icon">🔥</span>
            <span class="stat-label">Streak Attuale</span>
            <span class="stat-number">${stats.stats.currentStreak} giorni</span>
          </div>
          <div class="stat-box">
            <span class="stat-icon">📚</span>
            <span class="stat-label">Categorie</span>
            <span class="stat-number">${stats.stats.uniqueCategories}</span>
          </div>
        </div>
      </div>
    </div>

    <style>
      .gamification-page {
        padding: var(--spacing-md);
      }

      .gamification-page h1 {
        margin-bottom: var(--spacing-lg);
      }

      /* Level Section */
      .level-section {
        background: linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%);
        border: 2px solid var(--accent-primary);
        margin-bottom: var(--spacing-lg);
      }

      .level-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: var(--spacing-md);
      }

      .level-info h2 {
        margin: 0;
        font-size: 1.5rem;
        color: var(--accent-primary);
      }

      .level-info p {
        margin: 0;
        color: var(--text-secondary);
        font-size: 0.9rem;
      }

      .level-badge {
        width: 60px;
        height: 60px;
        border-radius: 50%;
        background: var(--accent-primary);
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.8rem;
        font-weight: bold;
      }

      .level-stats {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: var(--spacing-md);
        margin-bottom: var(--spacing-md);
      }

      .stat-item {
        display: flex;
        flex-direction: column;
        background: rgba(139, 92, 246, 0.1);
        padding: var(--spacing-sm);
        border-radius: var(--radius-md);
      }

      .stat-label {
        font-size: 0.8rem;
        color: var(--text-secondary);
        margin-bottom: 4px;
      }

      .stat-value {
        font-size: 1.5rem;
        font-weight: bold;
        color: var(--accent-primary);
      }

      .progress-section {
        margin-top: var(--spacing-md);
      }

      .progress-label {
        display: flex;
        justify-content: space-between;
        font-size: 0.85rem;
        margin-bottom: 8px;
        color: var(--text-secondary);
      }

      .progress-bar {
        height: 8px;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 4px;
        overflow: hidden;
        margin-bottom: 8px;
      }

      .progress-fill {
        height: 100%;
        background: linear-gradient(90deg, var(--accent-primary), var(--accent-secondary));
        transition: width 0.3s ease;
      }

      .next-level {
        font-size: 0.85rem;
        color: var(--text-secondary);
        margin: 0;
      }

      .elite-message {
        color: var(--accent-primary);
        font-weight: bold;
        text-align: center;
        padding: var(--spacing-md) 0;
        margin: 0;
      }

      /* Challenges Section */
      .challenges-section {
        margin-bottom: var(--spacing-lg);
      }

      .challenges-section h2 {
        margin-bottom: var(--spacing-md);
      }

      .challenges-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: var(--spacing-md);
      }

      .challenge-card {
        background: var(--bg-card);
        border: 2px solid rgba(139, 92, 246, 0.3);
        border-radius: var(--radius-md);
        padding: var(--spacing-md);
        transition: all 0.3s ease;
      }

      .challenge-card.completed {
        border-color: #10b981;
        background: rgba(16, 185, 129, 0.1);
      }

      .challenge-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: var(--spacing-sm);
      }

      .challenge-icon {
        font-size: 1.8rem;
      }

      .challenge-reward {
        background: var(--accent-primary);
        color: white;
        padding: 2px 8px;
        border-radius: 12px;
        font-size: 0.75rem;
        font-weight: bold;
      }

      .challenge-card h3 {
        margin: var(--spacing-xs) 0;
        font-size: 1rem;
      }

      .challenge-description {
        font-size: 0.8rem;
        color: var(--text-secondary);
        margin-bottom: var(--spacing-sm);
      }

      .challenge-progress {
        margin-bottom: var(--spacing-md);
      }

      .progress-text {
        display: flex;
        justify-content: space-between;
        font-size: 0.8rem;
        margin-bottom: 4px;
      }

      .progress-bar-small {
        height: 6px;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 3px;
        overflow: hidden;
      }

      /* Achievements Section */
      .achievements-section {
        margin-bottom: var(--spacing-lg);
      }

      .achievements-section h2 {
        margin-bottom: var(--spacing-md);
      }

      .achievements-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
        gap: var(--spacing-md);
      }

      .achievement-card {
        background: var(--bg-card);
        border: 2px solid var(--accent-primary);
        border-radius: var(--radius-md);
        padding: var(--spacing-md);
        text-align: center;
        transition: all 0.3s ease;
      }

      .achievement-card:hover {
        transform: translateY(-4px);
        box-shadow: 0 8px 16px rgba(139, 92, 246, 0.2);
      }

      .achievement-icon {
        font-size: 2.5rem;
        margin-bottom: var(--spacing-xs);
        display: block;
      }

      .achievement-card h3 {
        margin: var(--spacing-xs) 0;
        font-size: 0.95rem;
      }

      .achievement-card p {
        font-size: 0.75rem;
        color: var(--text-secondary);
        margin-bottom: var(--spacing-sm);
      }

      .achievement-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 0.75rem;
        padding-top: var(--spacing-xs);
        border-top: 1px solid rgba(139, 92, 246, 0.2);
      }

      .achievement-points {
        background: rgba(139, 92, 246, 0.2);
        color: var(--accent-primary);
        padding: 2px 6px;
        border-radius: 8px;
        font-weight: bold;
      }

      .achievement-date {
        color: var(--text-secondary);
      }

      .no-achievements {
        text-align: center;
        color: var(--text-secondary);
        padding: var(--spacing-lg);
      }

      /* Stats Overview */
      .stats-overview {
        margin-top: var(--spacing-lg);
      }

      .stats-grid-2 {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
        gap: var(--spacing-md);
      }

      .stat-box {
        background: rgba(139, 92, 246, 0.1);
        border-left: 4px solid var(--accent-primary);
        padding: var(--spacing-md);
        border-radius: var(--radius-md);
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
      }

      .stat-icon {
        font-size: 1.8rem;
        margin-bottom: var(--spacing-xs);
      }

      .stat-label {
        font-size: 0.75rem;
        color: var(--text-secondary);
        margin-bottom: 4px;
      }

      .stat-number {
        font-size: 1.3rem;
        font-weight: bold;
        color: var(--accent-primary);
      }

      .btn-small {
        padding: 0.4rem 0.8rem;
        font-size: 0.8rem;
        border: none;
        border-radius: var(--radius-sm);
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .btn-success {
        background: #10b981;
        color: white;
      }

      .btn-success:disabled {
        opacity: 0.7;
        cursor: default;
      }
    </style>
  `;
}
