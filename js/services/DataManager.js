/**
 * DataManager.js
 * Centralized Data Access Layer for Fitness App.
 * Enforces the ER Schema and handles LocalStorage persistence.
 * Updated: Cache-busting v2
 */

import { analytics } from "./Analytics.js";
import { config } from "../utils/Config.js";

class DataManager {
  constructor() {
    this.STORAGE_KEYS = {
      USERS: `${config.get("storage.prefix")}users`,
      EXERCISES: `${config.get("storage.prefix")}exercises`,
      WORKOUTS: `${config.get("storage.prefix")}workouts`,
      WORKOUT_LOGS: `${config.get("storage.prefix")}logs`,
      PROGRESS: `${config.get("storage.prefix")}progress`,
    };
    this.isInitialized = false;
    this.init();
  }

  /**
   * Error handler for data operations
   */
  _handleError(operation, error) {
    const errorMessage = `DataManager Error in ${operation}: ${error.message}`;

    if (config.isDebugMode()) {
      console.error(errorMessage, error);
    } else {
      console.warn(errorMessage);
    }

    // Track errors in analytics (without sensitive data)
    if (config.isFeatureEnabled("analytics")) {
      analytics.logEvent("datamanager_error", {
        operation,
        error_type: error.name,
        environment: config.getEnvironment(),
      });
    }

    return null;
  }

  /**
   * Validate data before saving
   */
  _validateData(data, type) {
    if (!data) return false;

    switch (type) {
      case "exercise":
        return data.id && data.name && data.muscle_group;
      case "workout":
        return data.id && data.name && Array.isArray(data.exercises);
      case "user":
        return data.name || data.age || data.goal;
      case "log":
        return data.workout_id && data.date;
      default:
        return true;
    }
  }

  init() {
    try {
      // Check if localStorage is available
      if (typeof Storage === "undefined") {
        throw new Error("LocalStorage not supported");
      }

      // Check storage quota if available
      if ("storage" in navigator && "estimate" in navigator.storage) {
        navigator.storage.estimate().then((estimate) => {
          const usedMB = (estimate.usage / (1024 * 1024)).toFixed(2);
          const quotaMB = (estimate.quota / (1024 * 1024)).toFixed(2);

          if (config.isDebugMode()) {
            console.log(`Storage used: ${usedMB}MB / ${quotaMB}MB`);
          }

          // Warn if storage is getting full (>80%)
          if (estimate.usage / estimate.quota > 0.8) {
            console.warn(
              "Storage quota is getting full. Consider cleaning up old data.",
            );
          }
        });
      }

      // Migrate from old storage keys if needed
      this._migrateStorage();

      // Seed initial data if empty
      if (!localStorage.getItem(this.STORAGE_KEYS.EXERCISES)) {
        this.seedExercises();
      }
      if (!localStorage.getItem(this.STORAGE_KEYS.WORKOUTS)) {
        this.seedWorkouts();
      }

      this.isInitialized = true;

      // Validate data integrity after initialization - with delay to ensure everything is ready
      setTimeout(() => {
        this._validateStoredData();
      }, 100);

      if (config.isDebugMode()) {
        console.log("DataManager initialized successfully");
      }
    } catch (error) {
      this._handleError("init", error);
      throw error; // Re-throw to indicate initialization failure
    }
  }

  // --- SEEDING (Default Content) ---

  seedExercises() {
    const exercises = [
      {
        id: "ex_001",
        name: "Push Ups (Piegamenti)",
        video_id: "IODxDxX7oi4", // YouTube ID
        muscle_group: "Pettorali",
        equipment: "Corpo Libero",
        difficulty: 1,
        instructions:
          "Mani larghezza spalle, corpo teso, scendi fino a toccare col petto.",
      },
      {
        id: "ex_002",
        name: "Squat",
        video_id: "aclHkVaku9U", // Placeholder ID
        muscle_group: "Gambe",
        equipment: "Corpo Libero",
        difficulty: 1,
        instructions:
          "Piedi larghezza spalle, scendi come se ti sedessi su una sedia.",
      },
      {
        id: "ex_003",
        name: "Plank",
        video_id: "pSHjTRCQxIw", // Placeholder ID
        muscle_group: "Addome",
        equipment: "Corpo Libero",
        difficulty: 2,
        instructions: "Mantieni la posizione sui gomiti, corpo in linea retta.",
      },
    ];
    this._save(this.STORAGE_KEYS.EXERCISES, exercises);
  }

  seedWorkouts() {
    const workouts = [
      {
        id: "wk_001",
        name: "Brucia Grassi in 20 Minuti",
        estimated_duration: 20,
        difficulty_label: "Media", // Human readable
        equipment_label: "Nessun attrezzo",
        thumbnail_url:
          "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=500&q=80", // Unsplash Placeholder
        focus_label: "Full Body",
        type: "Full Body",
        is_premium: false,
        exercises: [
          {
            exercise_id: "ex_002",
            order: 1,
            sets: 3,
            reps: "12",
            rest_seconds: 60,
          },
          {
            exercise_id: "ex_001",
            order: 2,
            sets: 3,
            reps: "10",
            rest_seconds: 60,
          },
          {
            exercise_id: "ex_003",
            order: 3,
            sets: 3,
            reps: "30s",
            rest_seconds: 45,
          },
        ],
      },
    ];
    this._save(this.STORAGE_KEYS.WORKOUTS, workouts);
  }

  // --- DATA ACCESS METHODS ---

  // Generic Helper with error handling
  _get(key) {
    try {
      const item = localStorage.getItem(key);
      if (!item) return [];

      const data = JSON.parse(item);

      // Validate data structure
      if (!Array.isArray(data)) {
        console.warn(`Expected array for key ${key}, got ${typeof data}`);
        return [];
      }

      return data;
    } catch (error) {
      this._handleError(`_get(${key})`, error);
      return [];
    }
  }

  _save(key, data) {
    try {
      if (!data) {
        console.warn(`Attempting to save empty data for key: ${key}`);
        return false;
      }

      // Check data size limits
      const dataString = JSON.stringify(data);
      const sizeKB = new Blob([dataString]).size / 1024;
      const maxSizeKB = config.get("limits.maxDataSize", 1024); // 1MB default

      if (sizeKB > maxSizeKB) {
        console.warn(
          `Data size (${sizeKB.toFixed(2)}KB) exceeds limit (${maxSizeKB}KB) for key: ${key}`,
        );
        return false;
      }

      localStorage.setItem(key, dataString);

      if (config.isDebugMode()) {
        console.log(`Saved ${sizeKB.toFixed(2)}KB to ${key}`);
      }

      return true;
    } catch (error) {
      if (error.name === "QuotaExceededError") {
        console.error("Storage quota exceeded. Please free up space.");
        // Could trigger cleanup here
        this._cleanupOldData();
      }
      this._handleError(`_save(${key})`, error);
      return false;
    }
  }

  // Exercises
  getExercises() {
    try {
      return this._get(this.STORAGE_KEYS.EXERCISES);
    } catch (error) {
      this._handleError("getExercises", error);
      return [];
    }
  }

  getExerciseById(id) {
    try {
      if (!id) {
        console.warn("getExerciseById called without id");
        return null;
      }
      const exercises = this.getExercises();
      return exercises.find((e) => e.id === id) || null;
    } catch (error) {
      this._handleError("getExerciseById", error);
      return null;
    }
  }

  addExercise(exercise) {
    try {
      if (!this._validateData(exercise, "exercise")) {
        console.error("Invalid exercise data:", exercise);
        return false;
      }

      const exercises = this.getExercises();
      // Check for duplicate ID
      if (exercises.find((e) => e.id === exercise.id)) {
        console.warn(`Exercise with ID ${exercise.id} already exists`);
        return false;
      }

      exercises.push(exercise);

      // Track custom exercise creation
      analytics.logEvent("custom_exercise_created", {
        exercise_name: exercise.name,
        muscle_group: exercise.muscle_group,
        equipment: exercise.equipment,
      });

      return this._save(this.STORAGE_KEYS.EXERCISES, exercises);
    } catch (error) {
      this._handleError("addExercise", error);
      return false;
    }
  }

  // Workouts
  getWorkouts() {
    try {
      return this._get(this.STORAGE_KEYS.WORKOUTS);
    } catch (error) {
      this._handleError("getWorkouts", error);
      return [];
    }
  }

  getWorkoutById(id) {
    try {
      if (!id) {
        console.warn("getWorkoutById called without id");
        return null;
      }

      const workouts = this.getWorkouts();
      const workout = workouts.find((w) => w.id === id);

      if (!workout) return null;

      // Create a copy to avoid modifying original data
      const workoutCopy = { ...workout };

      // Hydrate exercises with details from the catalog
      const allExercises = this.getExercises();
      if (workoutCopy.exercises && Array.isArray(workoutCopy.exercises)) {
        workoutCopy.exercises = workoutCopy.exercises.map((we) => {
          const details = allExercises.find((e) => e.id === we.exercise_id);
          if (!details) {
            console.warn(`Exercise not found: ${we.exercise_id}`);
          }
          return { ...we, details: details || null };
        });
      }

      return workoutCopy;
    } catch (error) {
      this._handleError("getWorkoutById", error);
      return null;
    }
  }

  addWorkout(workout) {
    try {
      if (!this._validateData(workout, "workout")) {
        console.error("Invalid workout data:", workout);
        return false;
      }

      const workouts = this.getWorkouts();
      // Check for duplicate ID
      if (workouts.find((w) => w.id === workout.id)) {
        console.warn(`Workout with ID ${workout.id} already exists`);
        return false;
      }

      workouts.push(workout);

      // Track custom workout creation
      analytics.logEvent("custom_workout_created", {
        workout_name: workout.name,
        workout_type: workout.type,
        estimated_duration: workout.estimated_duration,
        exercises_count: workout.exercises ? workout.exercises.length : 0,
      });

      return this._save(this.STORAGE_KEYS.WORKOUTS, workouts);
    } catch (error) {
      this._handleError("addWorkout", error);
      return false;
    }
  }

  // Users (Handling the current Single User for now)
  getCurrentUser() {
    try {
      const userString = localStorage.getItem("fitness_profile");
      if (!userString) return {};
      return JSON.parse(userString);
    } catch (error) {
      this._handleError("getCurrentUser", error);
      return {};
    }
  }

  saveUser(user) {
    try {
      if (!this._validateData(user, "user")) {
        console.error("Invalid user data:", user);
        return false;
      }

      const existingUser = this.getCurrentUser();
      const isNewUser = !existingUser.name;

      localStorage.setItem("fitness_profile", JSON.stringify(user));

      // Track user profile events
      if (isNewUser && user.name) {
        analytics.logEvent("user_profile_created", {
          user_goal: user.goal,
          user_age: user.age,
          user_fitness_level: user.fitness_level,
        });
      } else if (existingUser.goal !== user.goal) {
        analytics.logEvent("user_goal_changed", {
          old_goal: existingUser.goal,
          new_goal: user.goal,
        });
      }

      return true;
    } catch (error) {
      this._handleError("saveUser", error);
      return false;
    }
  }

  // Logs
  getLogs() {
    try {
      // Check both new and legacy keys for compatibility
      let logs = this._get(this.STORAGE_KEYS.WORKOUT_LOGS);
      if (logs.length === 0) {
        // Try legacy key
        const legacyLogs = this._get("fitness_history");
        if (legacyLogs.length > 0) {
          // Migrate legacy data
          this._save(this.STORAGE_KEYS.WORKOUT_LOGS, legacyLogs);
          logs = legacyLogs;
        }
      }
      return logs;
    } catch (error) {
      this._handleError("getLogs", error);
      return [];
    }
  }

  saveLog(log) {
    try {
      if (!this._validateData(log, "log")) {
        console.error("Invalid log data:", log);
        return false;
      }

      const logs = this.getLogs();

      // Generate unique ID if not provided
      if (!log.id) {
        log.id =
          "log_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
      }

      // Add timestamp if not provided
      if (!log.created_at) {
        log.created_at = new Date().toISOString();
      }

      logs.push(log);

      if (!this._save(this.STORAGE_KEYS.WORKOUT_LOGS, logs)) {
        return false;
      }

      // Analytics tracking for workout completion
      if (log.workout_id && log.duration_real) {
        analytics.logWorkoutComplete(
          log.workout_id,
          log.duration_real,
          log.exercises ? log.exercises.length : 0,
        );
      }

      // Also Update User Stats
      this._updateUserStats(logs);
      return true;
    } catch (error) {
      this._handleError("saveLog", error);
      return false;
    }
  }

  /**
   * getWeeklyStats()
   * Calculates totals for the last 7 days.
   */
  getWeeklyStats() {
    try {
      const logs = this.getLogs();
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);

      const recent = logs.filter(
        (l) => new Date(l.date || l.created_at) >= weekAgo,
      );

      return {
        total_workouts: recent.length,
        total_sets: recent.reduce((sum, l) => sum + (l.sets || 0), 0),
        total_calories: recent.reduce((sum, l) => sum + (l.calories || 0), 0),
        total_minutes: Math.round(
          recent.reduce((sum, l) => sum + (l.duration_real || 0), 0) / 60,
        ),
      };
    } catch (error) {
      this._handleError("getWeeklyStats", error);
      return {
        total_workouts: 0,
        total_sets: 0,
        total_calories: 0,
        total_minutes: 0,
      };
    }
  }

  _updateUserStats(logs) {
    try {
      const user = this.getCurrentUser();
      const previousStreak = user.streak_days || 0;

      user.total_xp = (user.total_xp || 0) + 100; // Mock XP
      user.streak_days = this._calculateStreak(logs);
      user.total_workouts = logs.length;
      user.last_workout = new Date().toISOString();

      // Track streak milestones
      if (
        user.streak_days > previousStreak &&
        [3, 7, 14, 30, 60, 100].includes(user.streak_days)
      ) {
        analytics.logEvent("streak_milestone", {
          streak_days: user.streak_days,
          user_goal: user.goal,
        });
      }

      this.saveUser(user);
    } catch (error) {
      this._handleError("_updateUserStats", error);
    }
  }

  _calculateStreak(logs) {
    try {
      if (!logs || logs.length === 0) return 0;

      // Get unique dates and sort them in descending order
      const uniqueDates = [
        ...new Set(
          logs
            .map((l) => {
              // Handle different date formats
              const date = l.date || l.created_at;
              if (!date) return null;
              return new Date(date).toDateString();
            })
            .filter(Boolean),
        ),
      ].sort((a, b) => new Date(b) - new Date(a));

      if (uniqueDates.length === 0) return 0;

      // Calculate streak from today backwards
      const today = new Date().toDateString();
      let streak = 0;
      let currentDate = new Date();

      // Check if today has a workout
      if (uniqueDates.includes(today)) {
        streak = 1;
      } else {
        // Check if yesterday has a workout (streak might continue)
        currentDate.setDate(currentDate.getDate() - 1);
        if (!uniqueDates.includes(currentDate.toDateString())) {
          return 0; // No workout yesterday, streak is broken
        }
        streak = 1;
      }

      // Count consecutive days backwards
      for (let i = 1; i < uniqueDates.length; i++) {
        currentDate.setDate(currentDate.getDate() - 1);
        if (uniqueDates.includes(currentDate.toDateString())) {
          streak++;
        } else {
          break;
        }
      }

      return streak;
    } catch (error) {
      this._handleError("_calculateStreak", error);
      return 0;
    }
  }

  // Utility method to clear all data (for testing or reset)
  clearAllData() {
    try {
      Object.values(this.STORAGE_KEYS).forEach((key) => {
        localStorage.removeItem(key);
      });
      localStorage.removeItem("fitness_profile"); // Legacy key
      localStorage.removeItem("fitness_history"); // Legacy key
      return true;
    } catch (error) {
      this._handleError("clearAllData", error);
      return false;
    }
  }

  // Export data for backup
  exportData() {
    try {
      const data = {};
      Object.entries(this.STORAGE_KEYS).forEach(([name, key]) => {
        data[name.toLowerCase()] = this._get(key);
      });
      data.user = this.getCurrentUser();

      // Track data export
      analytics.logEvent("data_exported", {
        export_timestamp: new Date().toISOString(),
        total_workouts: data.workout_logs ? data.workout_logs.length : 0,
      });

      return data;
    } catch (error) {
      this._handleError("exportData", error);
      return null;
    }
  }

  /**
   * Migrate from old storage keys to new ones
   */
  _migrateStorage() {
    const migrations = [
      { old: "fitness_profile", new: `${config.get("storage.prefix")}profile` },
      { old: "fitness_history", new: this.STORAGE_KEYS.WORKOUT_LOGS },
      { old: "fitness_exercises", new: this.STORAGE_KEYS.EXERCISES },
      { old: "fitness_workouts", new: this.STORAGE_KEYS.WORKOUTS },
    ];

    migrations.forEach(({ old, new: newKey }) => {
      const oldData = localStorage.getItem(old);
      if (oldData && !localStorage.getItem(newKey)) {
        try {
          localStorage.setItem(newKey, oldData);
          localStorage.removeItem(old);
          if (config.isDebugMode()) {
            console.log(`Migrated ${old} → ${newKey}`);
          }
        } catch (error) {
          console.warn(`Migration failed for ${old}:`, error);
        }
      }
    });
  }

  /**
   * Validate stored data integrity
   */
  _validateStoredData() {
    if (!this.isInitialized) {
      console.warn("Skipping validation - DataManager not fully initialized");
      return;
    }

    const validations = [
      {
        key: this.STORAGE_KEYS.EXERCISES,
        validator: this._validateExercises.bind(this),
      },
      {
        key: this.STORAGE_KEYS.WORKOUTS,
        validator: this._validateWorkouts.bind(this),
      },
      {
        key: this.STORAGE_KEYS.WORKOUT_LOGS,
        validator: this._validateLogs.bind(this),
      },
    ];

    validations.forEach(({ key, validator }) => {
      try {
        // Direct localStorage access to avoid _get initialization check
        const item = localStorage.getItem(key);
        if (!item) return;

        const data = JSON.parse(item);
        if (!Array.isArray(data)) return;

        if (data.length > 0 && !validator(data)) {
          console.warn(`Data validation failed for ${key}`);
        }
      } catch (error) {
        console.warn(`Validation error for ${key}:`, error);
      }
    });
  }

  /**
   * Validate exercises data structure
   */
  _validateExercises(exercises) {
    return exercises.every(
      (exercise) => exercise.id && exercise.name && exercise.muscle_group,
    );
  }

  /**
   * Validate workouts data structure
   */
  _validateWorkouts(workouts) {
    return workouts.every(
      (workout) =>
        workout.id && workout.name && Array.isArray(workout.exercises),
    );
  }

  /**
   * Validate logs data structure
   */
  _validateLogs(logs) {
    return logs.every(
      (log) => log.id && log.workout_id && (log.date || log.created_at),
    );
  }

  /**
   * Cleanup old data to free up storage space
   */
  _cleanupOldData() {
    try {
      const logs = this.getLogs();
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 365); // Keep last year

      const recentLogs = logs.filter((log) => {
        const logDate = new Date(log.date || log.created_at);
        return logDate >= cutoffDate;
      });

      if (recentLogs.length < logs.length) {
        this._save(this.STORAGE_KEYS.WORKOUT_LOGS, recentLogs);
        console.log(
          `Cleaned up ${logs.length - recentLogs.length} old workout logs`,
        );
      }
    } catch (error) {
      console.warn("Cleanup failed:", error);
    }
  }

  /**
   * Get storage usage statistics
   */
  getStorageStats() {
    try {
      const stats = {};
      Object.entries(this.STORAGE_KEYS).forEach(([name, key]) => {
        const data = localStorage.getItem(key);
        stats[name.toLowerCase()] = {
          size: data ? new Blob([data]).size : 0,
          items: data ? JSON.parse(data).length : 0,
        };
      });

      const totalSize = Object.values(stats).reduce(
        (sum, stat) => sum + stat.size,
        0,
      );

      return {
        ...stats,
        total_size: totalSize,
        total_size_mb: (totalSize / (1024 * 1024)).toFixed(2),
      };
    } catch (error) {
      this._handleError("getStorageStats", error);
      return {};
    }
  }

  /**
   * Reset all data (use with caution)
   */
  resetAllData() {
    try {
      Object.values(this.STORAGE_KEYS).forEach((key) => {
        localStorage.removeItem(key);
      });

      // Also remove legacy keys
      [
        "fitness_profile",
        "fitness_history",
        "fitness_exercises",
        "fitness_workouts",
      ].forEach((key) => {
        localStorage.removeItem(key);
      });

      // Re-seed basic data
      this.seedExercises();
      this.seedWorkouts();

      if (config.isFeatureEnabled("analytics")) {
        analytics.logEvent("data_reset", {
          timestamp: new Date().toISOString(),
        });
      }

      return true;
    } catch (error) {
      this._handleError("resetAllData", error);
      return false;
    }
  }
}

export const dataManager = new DataManager();
