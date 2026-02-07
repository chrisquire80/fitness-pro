import { videoService } from "../services/VideoService.js";
import { config } from "../utils/Config.js";

export default function VideoPlayer(video, options = {}) {
  if (!video) {
    return `
      <div class="video-player-container">
        <div class="video-placeholder">
          <div class="placeholder-content">
            <i class="fas fa-video" style="font-size: 3rem; margin-bottom: 1rem;"></i>
            <p>Video non disponibile</p>
          </div>
        </div>
      </div>
    `;
  }

  const embedUrl = videoService.getEmbedUrl(video);
  const duration = videoService.formatDuration(video.duration);
  const allowFullscreen = options.allowFullscreen !== false;
  const autoplay = options.autoplay ? 1 : 0;

  // Attach video tracking to window
  window.trackVideoProgress = (videoId, currentTime, duration) => {
    videoService.trackPlaybackProgress(videoId, currentTime, duration);
  };

  window.markVideoWatched = async (videoId) => {
    const video = videoService.getVideoById(videoId);
    if (video) {
      await videoService.markAsWatched(videoId, video.duration);
      if (config.isDebugMode()) {
        console.log(`✅ Video ${videoId} marked as watched`);
      }
    }
  };

  return `
    <div class="video-player-container">
      <!-- Video Player -->
      <div class="video-wrapper">
        <iframe
          class="video-iframe"
          src="${embedUrl}?autoplay=${autoplay}&controls=1"
          title="${video.title}"
          ${allowFullscreen ? 'allowfullscreen' : ''}
          loading="lazy"
          style="border: none; border-radius: 8px; width: 100%; aspect-ratio: 16 / 9;">
        </iframe>
      </div>

      <!-- Video Info -->
      <div class="video-info card">
        <div class="video-header">
          <div>
            <h3>${video.title}</h3>
            <div class="video-meta">
              <span class="meta-item">
                <i class="fas fa-play-circle"></i> ${duration}
              </span>
              <span class="meta-item">
                <i class="fas fa-user"></i> ${video.instructor || "Instructor"}
              </span>
              <span class="meta-item difficulty-badge difficulty-${video.difficulty}">
                ${video.difficulty ? video.difficulty.charAt(0).toUpperCase() + video.difficulty.slice(1) : "Unknown"}
              </span>
            </div>
          </div>
          <div class="video-actions">
            <button class="btn-icon" title="Add to favorites" onclick="window.addToFavorites('${video.id}')">
              <i class="far fa-heart"></i>
            </button>
            <button class="btn-icon" title="Share" onclick="window.shareVideo('${video.id}')">
              <i class="fas fa-share-alt"></i>
            </button>
          </div>
        </div>

        <!-- Description -->
        <div class="video-description">
          <p>${video.description}</p>
        </div>

        <!-- Focus Areas -->
        ${
          video.focus && video.focus.length > 0
            ? `
          <div class="video-tags">
            <h4>Focus Areas:</h4>
            <div class="tags-list">
              ${video.focus
                .map(
                  (focus) => `
                <span class="tag">${focus}</span>
              `
                )
                .join("")}
            </div>
          </div>
        `
            : ""
        }

        <!-- Stats -->
        <div class="video-stats">
          <div class="stat">
            <span class="stat-label">Language</span>
            <span class="stat-value">${video.language?.toUpperCase() || "EN"}</span>
          </div>
          <div class="stat">
            <span class="stat-label">Source</span>
            <span class="stat-value">${video.source ? video.source.charAt(0).toUpperCase() + video.source.slice(1) : "External"}</span>
          </div>
        </div>
      </div>

      <style>
        .video-player-container {
          width: 100%;
          margin-bottom: var(--spacing-lg);
        }

        .video-wrapper {
          position: relative;
          width: 100%;
          margin-bottom: var(--spacing-md);
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        }

        .video-iframe {
          width: 100%;
          aspect-ratio: 16 / 9;
          display: block;
        }

        .video-placeholder {
          width: 100%;
          aspect-ratio: 16 / 9;
          background: linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(59, 130, 246, 0.1));
          border: 2px dashed var(--accent-primary);
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-secondary);
        }

        .placeholder-content {
          text-align: center;
        }

        .video-info {
          padding: var(--spacing-md);
          border: 1px solid rgba(139, 92, 246, 0.2);
        }

        .video-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: var(--spacing-md);
          gap: var(--spacing-md);
        }

        .video-header h3 {
          margin: 0 0 var(--spacing-sm) 0;
          font-size: 1.3rem;
          color: var(--text-primary);
        }

        .video-meta {
          display: flex;
          gap: var(--spacing-md);
          flex-wrap: wrap;
          font-size: 0.85rem;
          color: var(--text-secondary);
        }

        .meta-item {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .difficulty-badge {
          padding: 4px 8px;
          border-radius: 4px;
          font-weight: 600;
          font-size: 0.75rem;
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

        .video-actions {
          display: flex;
          gap: var(--spacing-sm);
        }

        .btn-icon {
          background: rgba(139, 92, 246, 0.1);
          border: none;
          color: var(--accent-primary);
          width: 40px;
          height: 40px;
          border-radius: 50%;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
          font-size: 1rem;
        }

        .btn-icon:hover {
          background: var(--accent-primary);
          color: white;
          transform: scale(1.1);
        }

        .video-description {
          margin-bottom: var(--spacing-md);
          padding-bottom: var(--spacing-md);
          border-bottom: 1px solid rgba(139, 92, 246, 0.1);
        }

        .video-description p {
          margin: 0;
          line-height: 1.6;
          color: var(--text-secondary);
          font-size: 0.95rem;
        }

        .video-tags {
          margin-bottom: var(--spacing-md);
        }

        .video-tags h4 {
          margin: 0 0 var(--spacing-sm) 0;
          font-size: 0.9rem;
          color: var(--text-secondary);
          text-transform: uppercase;
        }

        .tags-list {
          display: flex;
          flex-wrap: wrap;
          gap: var(--spacing-sm);
        }

        .tag {
          background: rgba(139, 92, 246, 0.2);
          color: var(--accent-primary);
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 0.8rem;
          font-weight: 600;
        }

        .video-stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
          gap: var(--spacing-md);
          padding-top: var(--spacing-md);
          border-top: 1px solid rgba(139, 92, 246, 0.1);
        }

        .stat {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .stat-label {
          font-size: 0.75rem;
          color: var(--text-secondary);
          text-transform: uppercase;
          font-weight: 600;
        }

        .stat-value {
          font-size: 1rem;
          font-weight: bold;
          color: var(--accent-primary);
        }

        @media (max-width: 640px) {
          .video-header {
            flex-direction: column;
            align-items: stretch;
          }

          .video-actions {
            justify-content: flex-end;
          }

          .video-meta {
            font-size: 0.75rem;
            gap: var(--spacing-sm);
          }
        }
      </style>
    </div>
  `;
}
