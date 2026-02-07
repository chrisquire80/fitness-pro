import { videoService } from "../services/VideoService.js";
import VideoPlayer from "../components/VideoPlayer.js";

export default async function VideoLibrary() {
  // Check if a specific video is being viewed
  const hashParams = new URLSearchParams(window.location.hash.split("?")[1] || "");
  const selectedVideoId = hashParams.get("vid");

  let selectedVideo = null;
  if (selectedVideoId) {
    selectedVideo = videoService.getVideoById(selectedVideoId);
  }

  const allVideos = videoService.getAllVideos();
  const watchStats = await videoService.getWatchStats();

  // Filter and sort functionality
  let displayVideos = allVideos;
  const difficultyFilter = hashParams.get("difficulty");
  const focusFilter = hashParams.get("focus");
  const searchQuery = hashParams.get("search");

  if (difficultyFilter) {
    displayVideos = displayVideos.filter(
      (v) => v.difficulty === difficultyFilter
    );
  }

  if (focusFilter) {
    displayVideos = displayVideos.filter((v) => v.focus.includes(focusFilter));
  }

  if (searchQuery) {
    displayVideos = videoService.searchVideos(searchQuery);
  }

  // Get unique focus areas
  const allFocusAreas = new Set();
  allVideos.forEach((v) => {
    v.focus.forEach((f) => allFocusAreas.add(f));
  });

  // Attach helper functions to window
  window.applyFilter = (type, value) => {
    const params = new URLSearchParams();
    if (type === "difficulty" && value) params.append("difficulty", value);
    if (type === "focus" && value) params.append("focus", value);
    if (window.currentSearch) params.append("search", window.currentSearch);
    window.location.hash = `#/videos${
      params.toString() ? "?" + params.toString() : ""
    }`;
  };

  window.clearFilters = () => {
    window.location.hash = "#/videos";
  };

  window.selectVideo = (videoId) => {
    window.location.hash = `#/videos?vid=${videoId}`;
  };

  window.performSearch = () => {
    const query = document.getElementById("video-search")?.value || "";
    window.currentSearch = query;
    if (query) {
      window.location.hash = `#/videos?search=${encodeURIComponent(query)}`;
    } else {
      window.location.hash = "#/videos";
    }
  };

  return `
    <div class="video-library-container">
      <h1>🎥 Video Library</h1>

      <!-- Video Stats Banner -->
      <div class="video-stats-banner card">
        <div class="stat-box">
          <span class="stat-icon">🎬</span>
          <div>
            <span class="stat-number">${allVideos.length}</span>
            <span class="stat-label">Videos Available</span>
          </div>
        </div>
        <div class="stat-box">
          <span class="stat-icon">👁️</span>
          <div>
            <span class="stat-number">${watchStats.totalVideosWatched}</span>
            <span class="stat-label">Videos Watched</span>
          </div>
        </div>
        <div class="stat-box">
          <span class="stat-icon">⏱️</span>
          <div>
            <span class="stat-number">${Math.round(watchStats.totalWatchTime / 60)}</span>
            <span class="stat-label">Minutes Watched</span>
          </div>
        </div>
        <div class="stat-box">
          <span class="stat-icon">📊</span>
          <div>
            <span class="stat-number">${Math.round(watchStats.averageCompletion)}%</span>
            <span class="stat-label">Avg Completion</span>
          </div>
        </div>
      </div>

      ${
        selectedVideo
          ? `
        <!-- Video Player View -->
        <div class="video-player-section">
          ${VideoPlayer(selectedVideo, { autoplay: true })}
          <button class="btn btn-secondary" onclick="window.location.hash='#/videos'" style="margin-top: var(--spacing-md); width: 100%; max-width: 200px;">
            ← Back to Library
          </button>
        </div>
      `
          : `
        <!-- Video Browser View -->
        <div class="video-browser-section">
          <!-- Search Bar -->
          <div class="search-bar card">
            <input
              type="text"
              id="video-search"
              class="search-input"
              placeholder="🔍 Search videos..."
              onkeypress="if(event.key==='Enter') window.performSearch()"
            />
            <button class="btn btn-primary" onclick="window.performSearch()">
              Search
            </button>
          </div>

          <!-- Filters -->
          <div class="filters-section card">
            <div class="filter-group">
              <h4>Difficulty</h4>
              <div class="filter-buttons">
                <button class="filter-btn ${!difficultyFilter ? "active" : ""}" onclick="window.clearFilters()">
                  All
                </button>
                <button class="filter-btn ${difficultyFilter === "beginner" ? "active" : ""}" onclick="window.applyFilter('difficulty', 'beginner')">
                  Beginner
                </button>
                <button class="filter-btn ${difficultyFilter === "intermediate" ? "active" : ""}" onclick="window.applyFilter('difficulty', 'intermediate')">
                  Intermediate
                </button>
                <button class="filter-btn ${difficultyFilter === "advanced" ? "active" : ""}" onclick="window.applyFilter('difficulty', 'advanced')">
                  Advanced
                </button>
              </div>
            </div>

            <div class="filter-group">
              <h4>Focus Area</h4>
              <div class="filter-buttons">
                <button class="filter-btn ${!focusFilter ? "active" : ""}" onclick="window.applyFilter('focus', '')">
                  All
                </button>
                ${Array.from(allFocusAreas)
                  .map(
                    (focus) => `
                  <button class="filter-btn ${focusFilter === focus ? "active" : ""}" onclick="window.applyFilter('focus', '${focus}')">
                    ${focus}
                  </button>
                `
                  )
                  .join("")}
              </div>
            </div>
          </div>

          <!-- Video Grid -->
          ${
            displayVideos.length > 0
              ? `
            <div class="videos-grid">
              ${displayVideos
                .map(
                  (video) => `
                <div class="video-card" onclick="window.selectVideo('${video.id}')">
                  <div class="video-thumbnail">
                    <img
                      src="${video.thumbnail}"
                      alt="${video.title}"
                      onerror="this.src='https://via.placeholder.com/300x170?text=Video'"
                    />
                    <div class="video-overlay">
                      <div class="play-button">
                        <i class="fas fa-play"></i>
                      </div>
                      <div class="duration-badge">${videoService.formatDuration(video.duration)}</div>
                    </div>
                  </div>

                  <div class="video-card-content">
                    <h3>${video.title}</h3>
                    <p class="instructor">${video.instructor}</p>

                    <div class="video-card-meta">
                      <span class="difficulty-badge difficulty-${video.difficulty}">
                        ${video.difficulty.charAt(0).toUpperCase() + video.difficulty.slice(1)}
                      </span>
                      <span class="focus-badge">${video.focus[0]}</span>
                    </div>

                    <p class="description">${video.description.substring(0, 60)}...</p>
                  </div>
                </div>
              `
                )
                .join("")}
            </div>
          `
              : `
            <div class="empty-state">
              <i class="fas fa-search" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.5;"></i>
              <h3>No videos found</h3>
              <p>Try adjusting your filters or search terms</p>
              <button class="btn btn-primary" onclick="window.clearFilters()">Clear Filters</button>
            </div>
          `
          }
        </div>
      `
      }
    </div>

    <style>
      .video-library-container {
        padding: var(--spacing-md);
      }

      .video-library-container h1 {
        margin-bottom: var(--spacing-lg);
      }

      /* Stats Banner */
      .video-stats-banner {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
        gap: var(--spacing-md);
        margin-bottom: var(--spacing-lg);
        padding: var(--spacing-md);
      }

      .stat-box {
        display: flex;
        align-items: center;
        gap: var(--spacing-sm);
        padding: var(--spacing-sm);
        background: rgba(139, 92, 246, 0.1);
        border-radius: var(--radius-md);
      }

      .stat-icon {
        font-size: 1.8rem;
      }

      .stat-number {
        display: block;
        font-size: 1.3rem;
        font-weight: bold;
        color: var(--accent-primary);
      }

      .stat-label {
        display: block;
        font-size: 0.75rem;
        color: var(--text-secondary);
        text-transform: uppercase;
      }

      /* Search Bar */
      .search-bar {
        display: flex;
        gap: var(--spacing-sm);
        margin-bottom: var(--spacing-md);
        padding: var(--spacing-md);
      }

      .search-input {
        flex: 1;
        padding: var(--spacing-sm);
        border: 1px solid rgba(139, 92, 246, 0.3);
        background: var(--bg-primary);
        color: var(--text-primary);
        border-radius: var(--radius-md);
        font-size: 1rem;
      }

      .search-input:focus {
        outline: none;
        border-color: var(--accent-primary);
        box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
      }

      /* Filters */
      .filters-section {
        margin-bottom: var(--spacing-lg);
        padding: var(--spacing-md);
      }

      .filter-group {
        margin-bottom: var(--spacing-md);
      }

      .filter-group:last-child {
        margin-bottom: 0;
      }

      .filter-group h4 {
        margin: 0 0 var(--spacing-sm) 0;
        color: var(--text-secondary);
        text-transform: uppercase;
        font-size: 0.8rem;
      }

      .filter-buttons {
        display: flex;
        flex-wrap: wrap;
        gap: var(--spacing-sm);
      }

      .filter-btn {
        padding: 0.5rem 1rem;
        border: 1px solid rgba(139, 92, 246, 0.3);
        background: transparent;
        color: var(--text-primary);
        border-radius: 20px;
        cursor: pointer;
        transition: all 0.3s ease;
        font-size: 0.85rem;
        font-weight: 500;
      }

      .filter-btn:hover {
        border-color: var(--accent-primary);
        background: rgba(139, 92, 246, 0.1);
      }

      .filter-btn.active {
        background: var(--accent-primary);
        color: white;
        border-color: var(--accent-primary);
      }

      /* Video Grid */
      .videos-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: var(--spacing-md);
        margin-bottom: var(--spacing-lg);
      }

      .video-card {
        background: var(--bg-card);
        border-radius: var(--radius-md);
        overflow: hidden;
        cursor: pointer;
        transition: all 0.3s ease;
        border: 1px solid rgba(139, 92, 246, 0.1);
      }

      .video-card:hover {
        transform: translateY(-4px);
        box-shadow: 0 8px 16px rgba(139, 92, 246, 0.2);
        border-color: var(--accent-primary);
      }

      .video-thumbnail {
        position: relative;
        overflow: hidden;
        aspect-ratio: 16 / 9;
        background: #000;
      }

      .video-thumbnail img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        transition: transform 0.3s ease;
      }

      .video-card:hover .video-thumbnail img {
        transform: scale(1.05);
      }

      .video-overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0;
        transition: opacity 0.3s ease;
      }

      .video-card:hover .video-overlay {
        opacity: 1;
      }

      .play-button {
        width: 60px;
        height: 60px;
        background: var(--accent-secondary);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.5rem;
        color: #000;
      }

      .duration-badge {
        position: absolute;
        bottom: 8px;
        right: 8px;
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 0.75rem;
        font-weight: bold;
      }

      .video-card-content {
        padding: var(--spacing-md);
      }

      .video-card-content h3 {
        margin: 0 0 4px 0;
        font-size: 0.95rem;
        line-height: 1.2;
      }

      .instructor {
        margin: 0;
        font-size: 0.8rem;
        color: var(--text-secondary);
        margin-bottom: var(--spacing-sm);
      }

      .video-card-meta {
        display: flex;
        gap: var(--spacing-sm);
        margin-bottom: var(--spacing-sm);
        flex-wrap: wrap;
      }

      .difficulty-badge {
        padding: 2px 6px;
        border-radius: 3px;
        font-size: 0.7rem;
        font-weight: 600;
        text-transform: uppercase;
      }

      .difficulty-beginner {
        background: rgba(16, 185, 129, 0.2);
        color: #10b981;
      }

      .difficulty-intermediate {
        background: rgba(245, 158, 11, 0.2);
        color: #f59e0b;
      }

      .difficulty-advanced {
        background: rgba(239, 68, 68, 0.2);
        color: #ef4444;
      }

      .focus-badge {
        background: rgba(139, 92, 246, 0.2);
        color: var(--accent-primary);
        padding: 2px 6px;
        border-radius: 3px;
        font-size: 0.7rem;
        font-weight: 600;
      }

      .description {
        margin: 0;
        font-size: 0.75rem;
        color: var(--text-secondary);
        line-height: 1.3;
      }

      /* Empty State */
      .empty-state {
        text-align: center;
        padding: var(--spacing-lg);
        color: var(--text-secondary);
      }

      .empty-state h3 {
        margin: var(--spacing-md) 0 var(--spacing-sm) 0;
      }

      .empty-state p {
        margin: 0 0 var(--spacing-md) 0;
      }

      /* Video Player Section */
      .video-player-section {
        max-width: 1000px;
        margin: 0 auto;
      }

      @media (max-width: 768px) {
        .videos-grid {
          grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
        }

        .video-stats-banner {
          grid-template-columns: repeat(2, 1fr);
        }
      }
    </style>
  `;
}
