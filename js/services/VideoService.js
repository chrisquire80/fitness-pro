/**
 * VideoService.js
 * Manages workout and exercise video content
 * Supports YouTube, Vimeo, and local video integration with progress tracking
 */

import { indexedDBService } from "./IndexedDBService.js";
import { config } from "../utils/Config.js";
import { stateManager } from "../utils/StateManager.js";

class VideoService {
  constructor() {
    this.videoLibrary = {};
    this.playbackProgress = {};
    this.isInitialized = false;
    this.init();
  }

  async init() {
    try {
      await this.loadVideoLibrary();
      this.isInitialized = true;

      if (config.isDebugMode()) {
        console.log("🎥 VideoService initialized");
      }
    } catch (error) {
      console.error("VideoService initialization failed:", error);
    }
  }

  /**
   * Load video library from storage
   */
  async loadVideoLibrary() {
    try {
      // Try to load from IndexedDB first
      const videos = await indexedDBService.getAll("videos");

      if (videos && videos.length > 0) {
        videos.forEach((video) => {
          this.videoLibrary[video.id] = video;
        });
      } else {
        // Initialize with sample video library
        this.videoLibrary = this.initializeVideoLibrary();

        // Store in IndexedDB if available
        for (const video of Object.values(this.videoLibrary)) {
          await indexedDBService.put("videos", video);
        }
      }

      if (config.isDebugMode()) {
        console.log(`📚 Loaded ${Object.keys(this.videoLibrary).length} videos`);
      }
    } catch (error) {
      console.error("Error loading video library:", error);
      this.videoLibrary = this.initializeVideoLibrary();
    }
  }

  /**
   * Initialize default video library
   */
  initializeVideoLibrary() {
    return {
      vid_001: {
        id: "vid_001",
        title: "Full Body Workout - Beginner",
        type: "tutorial",
        source: "youtube",
        url: "https://www.youtube.com/embed/dQw4w9WgXcQ",
        thumbnail: "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
        duration: 1800,
        description: "Complete full body workout for beginners with no equipment needed",
        difficulty: "beginner",
        focus: ["Full Body"],
        instructor: "Alex Trainer",
        language: "en",
        createdAt: new Date().toISOString(),
      },
      vid_002: {
        id: "vid_002",
        title: "Upper Body Strength Training",
        type: "tutorial",
        source: "youtube",
        url: "https://www.youtube.com/embed/9VIvAqqfwn0",
        thumbnail: "https://img.youtube.com/vi/9VIvAqqfwn0/maxresdefault.jpg",
        duration: 2400,
        description: "Advanced upper body workout focusing on strength and muscle gain",
        difficulty: "advanced",
        focus: ["Upper Body"],
        instructor: "Coach Mike",
        language: "en",
        createdAt: new Date().toISOString(),
      },
      vid_003: {
        id: "vid_003",
        title: "HIIT Cardio Blast",
        type: "tutorial",
        source: "youtube",
        url: "https://www.youtube.com/embed/BHrxMlAqWwo",
        thumbnail: "https://img.youtube.com/vi/BHrxMlAqWwo/maxresdefault.jpg",
        duration: 1200,
        description: "High-intensity interval training for maximum calorie burn",
        difficulty: "intermediate",
        focus: ["Cardio", "Full Body"],
        instructor: "Fitness Plus",
        language: "en",
        createdAt: new Date().toISOString(),
      },
      vid_004: {
        id: "vid_004",
        title: "Yoga per la Flessibilità",
        type: "tutorial",
        source: "youtube",
        url: "https://www.youtube.com/embed/g_tea8ZNNjw",
        thumbnail: "https://img.youtube.com/vi/g_tea8ZNNjw/maxresdefault.jpg",
        duration: 1500,
        description: "Sessione completa di yoga per migliorare flessibilità e rilassamento",
        difficulty: "beginner",
        focus: ["Stretching"],
        instructor: "Yoga Master",
        language: "it",
        createdAt: new Date().toISOString(),
      },
      vid_005: {
        id: "vid_005",
        title: "Lower Body Blast",
        type: "tutorial",
        source: "youtube",
        url: "https://www.youtube.com/embed/FVD9UdxvQs4",
        thumbnail: "https://img.youtube.com/vi/FVD9UdxvQs4/maxresdefault.jpg",
        duration: 2100,
        description: "Intense lower body workout for legs and glutes",
        difficulty: "intermediate",
        focus: ["Lower Body"],
        instructor: "Elena Fitness",
        language: "en",
        createdAt: new Date().toISOString(),
      },
    };
  }

  /**
   * Get video by ID
   */
  getVideoById(videoId) {
    return this.videoLibrary[videoId] || null;
  }

  /**
   * Get videos by difficulty
   */
  getVideosByDifficulty(difficulty) {
    return Object.values(this.videoLibrary).filter(
      (v) => v.difficulty === difficulty
    );
  }

  /**
   * Get videos by focus area
   */
  getVideosByFocus(focus) {
    return Object.values(this.videoLibrary).filter((v) =>
      v.focus.includes(focus)
    );
  }

  /**
   * Get all available videos
   */
  getAllVideos() {
    return Object.values(this.videoLibrary);
  }

  /**
   * Link video to workout
   */
  async linkVideoToWorkout(workoutId, videoId) {
    try {
      const video = this.getVideoById(videoId);
      if (!video) {
        console.warn(`Video ${videoId} not found`);
        return false;
      }

      // Store the link
      const link = {
        id: `link_${workoutId}_${videoId}`,
        workoutId,
        videoId,
        linkedAt: new Date().toISOString(),
      };

      await indexedDBService.put("video_links", link);

      if (config.isDebugMode()) {
        console.log(`🔗 Linked video ${videoId} to workout ${workoutId}`);
      }

      return true;
    } catch (error) {
      console.error("Error linking video to workout:", error);
      return false;
    }
  }

  /**
   * Link video to exercise
   */
  async linkVideoToExercise(exerciseId, videoId) {
    try {
      const video = this.getVideoById(videoId);
      if (!video) {
        console.warn(`Video ${videoId} not found`);
        return false;
      }

      const link = {
        id: `link_ex_${exerciseId}_${videoId}`,
        exerciseId,
        videoId,
        linkedAt: new Date().toISOString(),
      };

      await indexedDBService.put("video_links", link);

      if (config.isDebugMode()) {
        console.log(`🔗 Linked video ${videoId} to exercise ${exerciseId}`);
      }

      return true;
    } catch (error) {
      console.error("Error linking video to exercise:", error);
      return false;
    }
  }

  /**
   * Get video linked to workout
   */
  async getWorkoutVideo(workoutId) {
    try {
      const links = await indexedDBService.query(
        "video_links",
        "workoutId",
        workoutId
      );

      if (links && links.length > 0) {
        return this.getVideoById(links[0].videoId);
      }

      return null;
    } catch (error) {
      console.error("Error getting workout video:", error);
      return null;
    }
  }

  /**
   * Track video playback progress
   */
  trackPlaybackProgress(videoId, currentTime, duration) {
    const progress = {
      videoId,
      currentTime,
      duration,
      percentage: (currentTime / duration) * 100,
      timestamp: new Date().toISOString(),
    };

    this.playbackProgress[videoId] = progress;
    stateManager.setState(`video.${videoId}.progress`, progress);

    if (config.isDebugMode() && currentTime % 30 === 0) {
      console.log(`▶️ Video ${videoId} progress: ${Math.round(progress.percentage)}%`);
    }

    return progress;
  }

  /**
   * Mark video as watched
   */
  async markAsWatched(videoId, watchedDuration) {
    try {
      const video = this.getVideoById(videoId);
      if (!video) return false;

      const watchRecord = {
        id: `watch_${videoId}_${Date.now()}`,
        videoId,
        watchedDuration,
        totalDuration: video.duration,
        completionPercentage: (watchedDuration / video.duration) * 100,
        watchedAt: new Date().toISOString(),
      };

      await indexedDBService.put("video_watches", watchRecord);

      if (config.isDebugMode()) {
        console.log(
          `✅ Marked video ${videoId} as watched (${Math.round(
            watchRecord.completionPercentage
          )}%)`
        );
      }

      return watchRecord;
    } catch (error) {
      console.error("Error marking video as watched:", error);
      return null;
    }
  }

  /**
   * Get video watch history
   */
  async getWatchHistory(videoId) {
    try {
      const watches = await indexedDBService.query(
        "video_watches",
        "videoId",
        videoId
      );

      return Array.isArray(watches) ? watches : [];
    } catch (error) {
      console.error("Error getting watch history:", error);
      return [];
    }
  }

  /**
   * Get total watch stats
   */
  async getWatchStats() {
    try {
      const watches = await indexedDBService.getAll("video_watches");

      if (!Array.isArray(watches) || watches.length === 0) {
        return {
          totalVideosWatched: 0,
          totalWatchTime: 0,
          averageCompletion: 0,
        };
      }

      const totalWatchTime = watches.reduce((acc, w) => acc + w.watchedDuration, 0);
      const averageCompletion =
        watches.reduce((acc, w) => acc + w.completionPercentage, 0) /
        watches.length;

      return {
        totalVideosWatched: new Set(watches.map((w) => w.videoId)).size,
        totalWatchTime: Math.round(totalWatchTime),
        averageCompletion: Math.round(averageCompletion),
        sessionCount: watches.length,
      };
    } catch (error) {
      console.error("Error getting watch stats:", error);
      return {
        totalVideosWatched: 0,
        totalWatchTime: 0,
        averageCompletion: 0,
      };
    }
  }

  /**
   * Search videos
   */
  searchVideos(query) {
    const lowerQuery = query.toLowerCase();

    return Object.values(this.videoLibrary).filter(
      (v) =>
        v.title.toLowerCase().includes(lowerQuery) ||
        v.description.toLowerCase().includes(lowerQuery) ||
        v.instructor.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Get video embed URL based on source
   */
  getEmbedUrl(video) {
    if (video.source === "youtube") {
      const videoId = video.url.split("v=").pop() || video.url.split("/").pop();
      return `https://www.youtube.com/embed/${videoId}?modestbranding=1&rel=0`;
    }

    if (video.source === "vimeo") {
      const videoId = video.url.split("/").pop();
      return `https://player.vimeo.com/video/${videoId}`;
    }

    return video.url;
  }

  /**
   * Format video duration
   */
  formatDuration(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }

    return `${minutes}m ${secs}s`;
  }

  /**
   * Add custom video
   */
  async addCustomVideo(videoData) {
    try {
      const videoId = `vid_custom_${Date.now()}`;

      const video = {
        id: videoId,
        ...videoData,
        createdAt: new Date().toISOString(),
      };

      this.videoLibrary[videoId] = video;
      await indexedDBService.put("videos", video);

      if (config.isDebugMode()) {
        console.log(`➕ Added custom video: ${video.title}`);
      }

      return video;
    } catch (error) {
      console.error("Error adding custom video:", error);
      return null;
    }
  }

  /**
   * Delete video
   */
  async deleteVideo(videoId) {
    try {
      delete this.videoLibrary[videoId];
      await indexedDBService.delete("videos", videoId);

      if (config.isDebugMode()) {
        console.log(`🗑️ Deleted video: ${videoId}`);
      }

      return true;
    } catch (error) {
      console.error("Error deleting video:", error);
      return false;
    }
  }
}

// Export singleton
export const videoService = new VideoService();
