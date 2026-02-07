import { leaderboardService } from "../services/LeaderboardService.js";

export default async function Leaderboards() {
  const allLeaderboards = leaderboardService.getAllLeaderboards();
  const summary = leaderboardService.getPerformanceSummary();
  const bestCategory = leaderboardService.getUserBestCategory();
  const badges = leaderboardService.getBadgesForRanks();
  const tips = leaderboardService.getProgressionTips();

  let selectedCategory = allLeaderboards[0]?.id || "total_workouts";

  window.selectCategory = (categoryId) => {
    selectedCategory = categoryId;
    const leaderboard = leaderboardService.getLeaderboard(categoryId);
    const leaderboardDiv = document.getElementById("leaderboard-display");
    if (leaderboardDiv && leaderboard) {
      leaderboardDiv.innerHTML = renderLeaderboardContent(leaderboard);
    }
  };

  const renderLeaderboardContent = (leaderboard) => `
    <div class="leaderboard-content">
      <div class="leaderboard-header">
        <h3>${leaderboard.icon} ${leaderboard.name}</h3>
        <div class="user-rank-badge">
          <span class="rank-number">🏅 Rank #${leaderboard.userRank}/${leaderboard.totalEntries}</span>
          <span class="rank-percentile">${Math.round(leaderboard.percentile)}°</span>
        </div>
      </div>

      <div class="leaderboard-entries">
        ${leaderboard.entries
          .map(
            (entry, index) => `
          <div class="leaderboard-entry ${entry.isUser ? "user-entry" : ""} rank-${index + 1}">
            <div class="entry-rank">
              ${
                index === 0
                  ? "🥇"
                  : index === 1
                    ? "🥈"
                    : index === 2
                      ? "🥉"
                      : `#${index + 1}`
              }
            </div>
            <div class="entry-info">
              <div class="entry-name">
                <span>${entry.badge} ${entry.name}</span>
                ${entry.isUser ? '<span class="user-label">(You)</span>' : ""}
              </div>
              <div class="entry-value">${entry.value.toLocaleString()}</div>
            </div>
          </div>
        `
          )
          .join("")}
      </div>
    </div>
  `;

  const getSelectedLeaderboard = () =>
    leaderboardService.getLeaderboard(selectedCategory);

  return `
    <div class="leaderboards-page">
      <h1>🏆 Leaderboards</h1>

      <!-- User Performance Summary -->
      <div class="performance-summary card">
        <h3>📊 Tuo Rendimento</h3>
        <div class="summary-grid">
          <div class="summary-item">
            <span class="summary-label">Ranking Medio</span>
            <span class="summary-value">#${summary.averageRank}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">Categoria Migliore</span>
            <span class="summary-value">
              ${bestCategory ? `${bestCategory.icon} ${bestCategory.name}` : "N/A"}
            </span>
          </div>
          <div class="summary-item">
            <span class="summary-label">Allenamenti Totali</span>
            <span class="summary-value">${summary.stats.totalWorkouts}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">Ore Allenamento</span>
            <span class="summary-value">${Math.round(summary.stats.totalMinutes / 60)}</span>
          </div>
        </div>
      </div>

      <!-- Leaderboard Badges -->
      ${
        badges.length > 0
          ? `
        <div class="leaderboard-badges card">
          <h3>🏅 I Tuoi Risultati</h3>
          <div class="badges-grid">
            ${badges
              .map(
                (badge) => `
              <div class="badge-card">
                <span class="badge-icon">${badge.icon}</span>
                <span class="badge-label">${badge.label}</span>
              </div>
            `
              )
              .join("")}
          </div>
        </div>
      `
          : ""
      }

      <!-- Category Selection -->
      <div class="category-selector card">
        <h3>🎯 Scegli una Categoria</h3>
        <div class="category-buttons">
          ${allLeaderboards
            .map(
              (lb) => `
            <button
              class="category-btn ${selectedCategory === lb.id ? "active" : ""}"
              onclick="window.selectCategory('${lb.id}')"
            >
              ${lb.icon} ${lb.name}
            </button>
          `
            )
            .join("")}
        </div>
      </div>

      <!-- Leaderboard Display -->
      <div id="leaderboard-display" class="leaderboard-card card">
        ${renderLeaderboardContent(getSelectedLeaderboard())}
      </div>

      <!-- Progression Tips -->
      ${
        tips.length > 0
          ? `
        <div class="progression-tips card">
          <h3>💡 Suggerimenti per Migliorare</h3>
          <div class="tips-grid">
            ${tips
              .map(
                (tip) => `
              <div class="tip-card">
                <span class="tip-icon">${tip.icon}</span>
                <h4>${tip.title}</h4>
                <p>${tip.description}</p>
              </div>
            `
              )
              .join("")}
          </div>
        </div>
      `
          : ""
      }

      <!-- Top Performers Section -->
      <div class="top-performers card">
        <h3>⭐ Top Performer nelle Tue Categorie</h3>
        <div class="performers-list">
          ${summary.topCategories
            .map(
              (cat, index) => `
            <div class="performer-item">
              <div class="performer-rank">
                ${index === 0 ? "🥇" : index === 1 ? "🥈" : "🥉"}
              </div>
              <div class="performer-info">
                <span class="performer-category">${cat.icon} ${cat.name}</span>
                <span class="performer-rank-detail">Rank #${cat.rank}</span>
              </div>
              <div class="performer-improvement">
                ${this.getImprovementPath(cat.rank)}
              </div>
            </div>
          `
            )
            .join("")}
        </div>
      </div>

      <!-- How Leaderboards Work -->
      <div class="leaderboard-info card">
        <h3>ℹ️ Come Funzionano i Leaderboard</h3>
        <div class="info-content">
          <p><strong>🏆 Competitive Ranking:</strong> Confronta i tuoi risultati con altri utenti in 7 categorie diverse.</p>
          <p><strong>📊 Multiple Categories:</strong> Dai workout totali ai minuti allenamento, alle calorie bruciate.</p>
          <p><strong>🎯 Personal Goals:</strong> Lavora per migliorare il tuo ranking e ottenere badge esclusivi.</p>
          <p><strong>🚀 Progression Tracking:</strong> Ricevi suggerimenti personalizzati per migliorare in ogni categoria.</p>
        </div>
      </div>

      <style>
        .leaderboards-page {
          padding: var(--spacing-md);
        }

        .leaderboards-page h1 {
          margin-bottom: var(--spacing-lg);
          color: var(--accent-primary);
        }

        /* Performance Summary */
        .performance-summary {
          background: linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(59, 130, 246, 0.1));
          border: 2px solid var(--accent-primary);
          padding: var(--spacing-lg);
          margin-bottom: var(--spacing-lg);
        }

        .summary-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: var(--spacing-md);
          margin-top: var(--spacing-md);
        }

        .summary-item {
          text-align: center;
          background: rgba(139, 92, 246, 0.1);
          padding: var(--spacing-md);
          border-radius: var(--radius-md);
        }

        .summary-label {
          display: block;
          font-size: 0.8rem;
          color: var(--text-secondary);
          margin-bottom: 6px;
          text-transform: uppercase;
        }

        .summary-value {
          display: block;
          font-size: 1.5rem;
          font-weight: bold;
          color: var(--accent-primary);
        }

        /* Leaderboard Badges */
        .leaderboard-badges {
          margin-bottom: var(--spacing-lg);
        }

        .badges-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
          gap: var(--spacing-md);
          margin-top: var(--spacing-md);
        }

        .badge-card {
          background: linear-gradient(135deg, rgba(245, 158, 11, 0.1), rgba(16, 185, 129, 0.1));
          border: 2px solid #f59e0b;
          border-radius: var(--radius-md);
          padding: var(--spacing-md);
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--spacing-sm);
        }

        .badge-icon {
          font-size: 2rem;
        }

        .badge-label {
          font-size: 0.75rem;
          color: var(--text-secondary);
          line-height: 1.2;
        }

        /* Category Selector */
        .category-selector {
          margin-bottom: var(--spacing-lg);
        }

        .category-buttons {
          display: flex;
          flex-wrap: wrap;
          gap: var(--spacing-sm);
          margin-top: var(--spacing-md);
        }

        .category-btn {
          padding: 0.5rem 1rem;
          border: 2px solid rgba(139, 92, 246, 0.3);
          background: transparent;
          color: var(--text-primary);
          border-radius: 20px;
          cursor: pointer;
          transition: all 0.3s ease;
          font-weight: 500;
          font-size: 0.85rem;
        }

        .category-btn:hover {
          border-color: var(--accent-primary);
          background: rgba(139, 92, 246, 0.1);
        }

        .category-btn.active {
          background: var(--accent-primary);
          color: white;
          border-color: var(--accent-primary);
        }

        /* Leaderboard Display */
        .leaderboard-card {
          margin-bottom: var(--spacing-lg);
        }

        .leaderboard-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-bottom: var(--spacing-md);
          border-bottom: 2px solid rgba(139, 92, 246, 0.2);
          margin-bottom: var(--spacing-lg);
        }

        .leaderboard-header h3 {
          margin: 0;
          color: var(--accent-primary);
        }

        .user-rank-badge {
          display: flex;
          gap: var(--spacing-sm);
          align-items: center;
        }

        .rank-number {
          background: rgba(139, 92, 246, 0.2);
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 0.85rem;
          font-weight: bold;
          color: var(--accent-primary);
        }

        .rank-percentile {
          background: rgba(16, 185, 129, 0.2);
          color: #10b981;
          padding: 6px 12px;
          border-radius: 20px;
          font-weight: bold;
          font-size: 0.85rem;
        }

        /* Leaderboard Entries */
        .leaderboard-entries {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-sm);
        }

        .leaderboard-entry {
          display: flex;
          align-items: center;
          gap: var(--spacing-md);
          padding: var(--spacing-md);
          background: rgba(139, 92, 246, 0.05);
          border-radius: var(--radius-md);
          border-left: 4px solid rgba(139, 92, 246, 0.3);
          transition: all 0.3s ease;
        }

        .leaderboard-entry.rank-1 {
          border-left-color: #fbbf24;
          background: rgba(251, 191, 36, 0.1);
        }

        .leaderboard-entry.rank-2 {
          border-left-color: #d1d5db;
          background: rgba(209, 213, 219, 0.1);
        }

        .leaderboard-entry.rank-3 {
          border-left-color: #f97316;
          background: rgba(249, 115, 22, 0.1);
        }

        .leaderboard-entry.user-entry {
          border-left-color: var(--accent-primary);
          background: rgba(139, 92, 246, 0.15);
          font-weight: 600;
        }

        .entry-rank {
          font-size: 1.5rem;
          width: 40px;
          text-align: center;
        }

        .entry-info {
          flex: 1;
        }

        .entry-name {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 4px;
        }

        .user-label {
          background: var(--accent-primary);
          color: white;
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 0.7rem;
          font-weight: bold;
        }

        .entry-value {
          font-size: 0.9rem;
          color: var(--accent-primary);
          font-weight: bold;
        }

        /* Progression Tips */
        .progression-tips {
          margin-bottom: var(--spacing-lg);
        }

        .tips-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: var(--spacing-md);
          margin-top: var(--spacing-md);
        }

        .tip-card {
          background: linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(59, 130, 246, 0.1));
          padding: var(--spacing-md);
          border-radius: var(--radius-md);
          border: 1px solid rgba(139, 92, 246, 0.2);
          display: flex;
          flex-direction: column;
          gap: var(--spacing-sm);
        }

        .tip-icon {
          font-size: 1.8rem;
        }

        .tip-card h4 {
          margin: 0;
          color: var(--accent-primary);
        }

        .tip-card p {
          margin: 0;
          font-size: 0.9rem;
          color: var(--text-secondary);
          line-height: 1.5;
        }

        /* Top Performers */
        .top-performers {
          margin-bottom: var(--spacing-lg);
        }

        .performers-list {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-md);
          margin-top: var(--spacing-md);
        }

        .performer-item {
          display: flex;
          align-items: center;
          gap: var(--spacing-md);
          padding: var(--spacing-md);
          background: rgba(139, 92, 246, 0.05);
          border-radius: var(--radius-md);
          border-left: 4px solid var(--accent-primary);
        }

        .performer-rank {
          font-size: 1.8rem;
          width: 40px;
          text-align: center;
        }

        .performer-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .performer-category {
          font-weight: bold;
          color: var(--text-primary);
        }

        .performer-rank-detail {
          font-size: 0.85rem;
          color: var(--text-secondary);
        }

        .performer-improvement {
          padding: 4px 8px;
          background: rgba(59, 130, 246, 0.2);
          color: #3b82f6;
          border-radius: 6px;
          font-size: 0.8rem;
          font-weight: bold;
        }

        /* Leaderboard Info */
        .leaderboard-info {
          background: rgba(59, 130, 246, 0.1);
          border-left: 4px solid #3b82f6;
        }

        .info-content {
          margin-top: var(--spacing-md);
          display: flex;
          flex-direction: column;
          gap: var(--spacing-sm);
        }

        .info-content p {
          margin: 0;
          line-height: 1.6;
          font-size: 0.95rem;
        }

        @media (max-width: 640px) {
          .summary-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .category-buttons {
            flex-direction: column;
          }

          .category-btn {
            width: 100%;
          }

          .leaderboard-header {
            flex-direction: column;
            align-items: flex-start;
            gap: var(--spacing-sm);
          }
        }
      </style>
    </div>
  `;
}

// Helper function to get improvement path
function getImprovementPath(rank) {
  if (rank === 1) return "🥇 Primo!";
  if (rank <= 3) return "🏅 Top 3";
  if (rank <= 5) return "⭐ Top 5";
  if (rank <= 10) return "📈 Top 10";
  return "🚀 Salita";
}
