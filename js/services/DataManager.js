/**
 * DataManager.js
 * Centralized Data Access Layer for Fitness App.
 * Enforces the ER Schema and handles LocalStorage persistence.
 */

class DataManager {
  constructor() {
    this.STORAGE_KEYS = {
      USERS: "fitness_users",
      EXERCISES: "fitness_exercises",
      WORKOUTS: "fitness_workouts",
      WORKOUT_LOGS: "fitness_logs",
      PROGRESS: "fitness_progress",
    };
    this.init();
  }

  /**
   * Error handler for data operations
   */
  _handleError(operation, error) {
    console.error(`DataManager Error in ${operation}:`, error);
    // In production, you might want to send this to an error tracking service
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
        console.error("LocalStorage not supported");
        return;
      }

      // Seed initial data if empty
      if (!localStorage.getItem(this.STORAGE_KEYS.EXERCISES)) {
        this.seedExercises();
      }
      if (!localStorage.getItem(this.STORAGE_KEYS.WORKOUTS)) {
        this.seedWorkouts();
      }
    } catch (error) {
      this._handleError("init", error);
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
      return JSON.parse(item);
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
      localStorage.setItem(key, JSON.stringify(data));
      return true;
    } catch (error) {
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

      localStorage.setItem("fitness_profile", JSON.stringify(user));
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

      const recent = logs.filter((l) => new Date(l.date || l.created_at) >= weekAgo);

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
      return { total_workouts: 0, total_sets: 0, total_calories: 0, total_minutes: 0 };
    }
  }

  _updateUserStats(logs) {
    try {
      const user = this.getCurrentUser();
      user.total_xp = (user.total_xp || 0) + 100; // Mock XP
      user.streak_days = this._calculateStreak(logs);
      user.total_workouts = logs.length;
      user.last_workout = new Date().toISOString();
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
      return data;
    } catch (error) {
      this._handleError("exportData", error);
      return null;
    }
  }
}

export const dataManager = new DataManager();
