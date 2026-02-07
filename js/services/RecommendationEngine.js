/**
 * RecommendationEngine.js
 * Smart workout recommendation algorithm based on user profile and performance
 * Considers fitness level, goals, time, preferences, and variety
 */

import { dataManager } from "./DataManager.js";
import { config } from "../utils/Config.js";

class RecommendationEngine {
  constructor() {
    this.isInitialized = false;
    this.lastRecommendedId = null;
    this.init();
  }

  async init() {
    try {
      this.isInitialized = true;
      if (config.isDebugMode()) {
        console.log("🧠 RecommendationEngine initialized");
      }
    } catch (error) {
      console.error("RecommendationEngine initialization failed:", error);
    }
  }

  /**
   * Get smart recommendation based on user profile and history
   */
  getRecommendation(options = {}) {
    try {
      const user = dataManager.getCurrentUser();
      const workouts = dataManager.getWorkouts();
      const logs = dataManager.getLogs();

      if (!workouts || workouts.length === 0) {
        return null;
      }

      // Score each workout based on multiple factors
      const scoredWorkouts = workouts.map((workout) => ({
        ...workout,
        score: this.calculateWorkoutScore(workout, user, logs, options),
      }));

      // Sort by score and get the best one
      const sorted = scoredWorkouts.sort((a, b) => b.score - a.score);

      const recommended = sorted[0];
      this.lastRecommendedId = recommended.id;

      if (config.isDebugMode()) {
        console.log("🎯 Recommended workout:", recommended.name, `(score: ${recommended.score.toFixed(2)})`);
      }

      return recommended;
    } catch (error) {
      console.error("Error getting recommendation:", error);
      return null;
    }
  }

  /**
   * Calculate score for a workout based on multiple factors
   */
  calculateWorkoutScore(workout, user, logs, options = {}) {
    let score = 0;

    // Factor 1: User Preference (Goal alignment) - 30 points
    score += this.scoreGoalAlignment(workout, user) * 30;

    // Factor 2: Difficulty Progression - 20 points
    score += this.scoreDifficultyProgression(workout, user, logs) * 20;

    // Factor 3: Time Availability - 15 points
    const availableTime = options.timeAvailable || 45; // minutes
    score += this.scoreTimeMatch(workout, availableTime) * 15;

    // Factor 4: Frequency (Variety) - 15 points
    score += this.scoreFrequency(workout, logs) * 15;

    // Factor 5: Equipment Availability - 10 points
    const availableEquipment = options.equipment || [];
    score += this.scoreEquipmentMatch(workout, availableEquipment) * 10;

    // Factor 6: Premium Status - 10 points
    score += (workout.is_premium ? 0 : 1) * 10;

    // Factor 7: Recency (avoid same as last time) - 5 points
    score += (workout.id !== this.lastRecommendedId ? 1 : 0) * 5;

    return Math.max(0, score);
  }

  /**
   * Score based on user's fitness goal
   * 0-1 scale
   */
  scoreGoalAlignment(workout, user) {
    if (!user || !user.goal) return 0.5; // neutral score

    const goalMap = {
      lose: ["Full Body", "Cardio", "HIIT"], // for weight loss
      muscle: ["Upper Body", "Lower Body", "Full Body"], // for muscle gain
      endurance: ["Cardio", "Running", "Full Body"], // for endurance
      gain: ["Upper Body", "Lower Body", "Full Body"], // alias for muscle
      maintain: ["Full Body", "Cardio", "Strength"], // maintenance
    };

    const targetCategories = goalMap[user.goal] || [];
    const workoutFocus = workout.focus_label || workout.type || "";

    // Perfect match gets 1.0, partial match gets 0.7, no match gets 0.3
    if (targetCategories.includes(workoutFocus)) return 1.0;
    if (targetCategories.some((cat) => workoutFocus.includes(cat))) return 0.7;
    return 0.3;
  }

  /**
   * Score based on fitness level progression
   * Avoids staying at same difficulty, encourages progression
   * 0-1 scale
   */
  scoreDifficultyProgression(workout, user, logs) {
    if (!logs || logs.length === 0) return 0.7; // new users get neutral score

    // Get average difficulty of recent workouts
    const recentLogs = logs.slice(-5); // last 5 workouts
    const avgDifficulty = this.getAverageDifficulty(recentLogs);

    const currentDifficulty = this.difficultyToNumber(workout.difficulty_label);

    // Slightly favor progression but don't punish current level
    if (currentDifficulty > avgDifficulty) return 1.0; // progression
    if (currentDifficulty === avgDifficulty) return 0.7; // same level (ok)
    return 0.4; // regression (not ideal)
  }

  /**
   * Score based on time match
   * 0-1 scale
   */
  scoreTimeMatch(workout, availableTime) {
    const duration = workout.estimated_duration || 30;

    // Perfect if within 80-120% of available time
    if (duration >= availableTime * 0.8 && duration <= availableTime * 1.2) {
      return 1.0;
    }

    // Good if within 60-150%
    if (duration >= availableTime * 0.6 && duration <= availableTime * 1.5) {
      return 0.8;
    }

    // Acceptable otherwise
    return 0.5;
  }

  /**
   * Score based on frequency of previous execution
   * Favors variety - workouts done less frequently score higher
   * 0-1 scale
   */
  scoreFrequency(workout, logs) {
    if (!logs || logs.length === 0) return 1.0; // new users get full score

    const workoutLogs = logs.filter((log) => log.workout_id === workout.id);

    if (workoutLogs.length === 0) return 1.0; // never done - full score

    // Get days since last execution
    const lastLog = workoutLogs[workoutLogs.length - 1];
    const daysSinceLast = Math.floor(
      (Date.now() - new Date(lastLog.date || lastLog.created_at).getTime()) / (1000 * 60 * 60 * 24)
    );

    // Score based on frequency:
    // More than 7 days: 1.0 (perfect)
    // 4-7 days: 0.8 (good)
    // 2-3 days: 0.6 (ok)
    // 1 day: 0.3 (avoid)
    // today: 0 (skip)

    if (daysSinceLast > 7) return 1.0;
    if (daysSinceLast > 3) return 0.8;
    if (daysSinceLast > 1) return 0.6;
    if (daysSinceLast > 0) return 0.3;
    return 0; // done today, skip
  }

  /**
   * Score based on equipment availability
   * 0-1 scale
   */
  scoreEquipmentMatch(workout, availableEquipment) {
    const requiredEquipment = (workout.equipment_label || "Nessun attrezzo").toLowerCase();

    // If no equipment needed, full score
    if (requiredEquipment === "nessun attrezzo" || requiredEquipment === "no attrezzi") {
      return 1.0;
    }

    // If available equipment is empty, assume all available
    if (availableEquipment.length === 0) return 0.9;

    // Check if required equipment is in available list
    const hasEquipment = availableEquipment.some((eq) =>
      requiredEquipment.includes(eq.toLowerCase())
    );

    return hasEquipment ? 1.0 : 0.4;
  }

  /**
   * Get average difficulty from logs
   */
  getAverageDifficulty(logs) {
    if (!logs || logs.length === 0) return 2; // medium difficulty

    const difficulties = logs
      .map((log) => {
        const workout = dataManager.getWorkoutById(log.workout_id);
        return this.difficultyToNumber(workout?.difficulty_label);
      })
      .filter((d) => d !== null);

    return difficulties.length > 0 ? difficulties.reduce((a, b) => a + b) / difficulties.length : 2;
  }

  /**
   * Convert difficulty label to number
   */
  difficultyToNumber(label) {
    const difficultyMap = {
      "principiante": 1,
      "beginner": 1,
      "facile": 1,
      "easy": 1,
      "intermedio": 2,
      "intermediate": 2,
      "media": 2,
      "medium": 2,
      "avanzato": 3,
      "advanced": 3,
      "difficile": 3,
      "hard": 3,
      "esperto": 4,
      "expert": 4,
      "elite": 4,
    };

    if (!label) return 2; // default to medium

    return difficultyMap[label.toLowerCase()] || 2;
  }

  /**
   * Get top N recommendations
   */
  getTopRecommendations(count = 3, options = {}) {
    try {
      const user = dataManager.getCurrentUser();
      const workouts = dataManager.getWorkouts();
      const logs = dataManager.getLogs();

      if (!workouts || workouts.length === 0) return [];

      const scoredWorkouts = workouts.map((workout) => ({
        ...workout,
        score: this.calculateWorkoutScore(workout, user, logs, options),
      }));

      return scoredWorkouts
        .sort((a, b) => b.score - a.score)
        .slice(0, count)
        .map(({ score, ...workout }) => ({ ...workout, recommendation_score: score }));
    } catch (error) {
      console.error("Error getting top recommendations:", error);
      return [];
    }
  }

  /**
   * Get workout recommendation for specific scenario
   */
  getContextualRecommendation(context = {}) {
    const {
      timeAvailable = 45,
      equipment = [],
      difficultyLevel = "any",
      focus = "any",
      goal = "any",
    } = context;

    try {
      const workouts = dataManager.getWorkouts().filter((w) => {
        // Filter by difficulty
        if (difficultyLevel !== "any") {
          const workoutDiff = this.difficultyToNumber(w.difficulty_label);
          const contextDiff = this.difficultyToNumber(difficultyLevel);
          if (Math.abs(workoutDiff - contextDiff) > 1) return false;
        }

        // Filter by focus area
        if (focus !== "any" && !(w.focus_label || "").toLowerCase().includes(focus.toLowerCase())) {
          return false;
        }

        // Filter by time
        if (timeAvailable && w.estimated_duration > timeAvailable * 1.5) {
          return false;
        }

        return true;
      });

      if (workouts.length === 0) {
        // Fallback if no matches
        return this.getRecommendation({ timeAvailable, equipment });
      }

      // Score filtered workouts
      const user = dataManager.getCurrentUser();
      const logs = dataManager.getLogs();

      const scoredWorkouts = workouts.map((workout) => ({
        ...workout,
        score: this.calculateWorkoutScore(workout, user, logs, { timeAvailable, equipment }),
      }));

      return scoredWorkouts.sort((a, b) => b.score - a.score)[0];
    } catch (error) {
      console.error("Error getting contextual recommendation:", error);
      return null;
    }
  }
}

// Export singleton
export const recommendationEngine = new RecommendationEngine();
