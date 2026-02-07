/**
 * LeaderboardService.js
 * Manages leaderboards for global, local, and category-specific rankings
 */

import { dataManager } from "./DataManager.js";
import { indexedDBService } from "./IndexedDBService.js";
import { config } from "../utils/Config.js";

class LeaderboardService {
  constructor() {
    this.leaderboards = {};
    this.categories = [
      "total_workouts",
      "total_minutes",
      "longest_streak",
      "calories_burned",
      "fastest_workout",
      "most_consistent",
      "exercises_completed",
    ];
    this.init();
  }

  async init() {
    try {
      await this.generateLeaderboards();

      if (config.isDebugMode()) {
        console.log("🏆 LeaderboardService initialized");
      }
    } catch (error) {
      console.error("LeaderboardService initialization failed:", error);
    }
  }

  /**
   * Generate leaderboards from user data
   */
  async generateLeaderboards() {
    try {
      const user = dataManager.getCurrentUser();
      const logs = dataManager.getLogs();

      // Calculate user stats
      const userStats = this.calculateUserStats(user, logs);

      // Generate each category leaderboard
      this.leaderboards = {
        total_workouts: this.createLeaderboard(
          "total_workouts",
          "Total Workouts",
          logs.length,
          userStats.totalWorkouts,
          "💪"
        ),
        total_minutes: this.createLeaderboard(
          "total_minutes",
          "Total Minutes",
          Math.round(userStats.totalMinutes / 60),
          Math.round(userStats.totalMinutes / 60),
          "⏱️"
        ),
        longest_streak: this.createLeaderboard(
          "longest_streak",
          "Longest Streak",
          user.streak_days || 0,
          user.streak_days || 0,
          "🔥"
        ),
        calories_burned: this.createLeaderboard(
          "calories_burned",
          "Calories Burned",
          Math.round(userStats.caloriesBurned),
          Math.round(userStats.caloriesBurned),
          "🔥"
        ),
        fastest_workout: this.createLeaderboard(
          "fastest_workout",
          "Fastest Workout",
          userStats.fastestWorkout,
          userStats.fastestWorkout,
          "⚡"
        ),
        most_consistent: this.createLeaderboard(
          "most_consistent",
          "Most Consistent",
          userStats.consistency,
          userStats.consistency,
          "📈"
        ),
        exercises_completed: this.createLeaderboard(
          "exercises_completed",
          "Exercises Completed",
          userStats.exercisesCompleted,
          userStats.exercisesCompleted,
          "🏋️"
        ),
      };

      if (config.isDebugMode()) {
        console.log("📊 Leaderboards generated");
      }
    } catch (error) {
      console.error("Leaderboard generation error:", error);
    }
  }

  /**
   * Create leaderboard entry
   */
  createLeaderboard(id, name, value, userValue, icon) {
    const entries = this.generateLeaderboardEntries(id, value, userValue);
    const userRank = entries.findIndex((e) => e.isUser) + 1;

    return {
      id,
      name,
      icon,
      userValue,
      userRank,
      entries,
      totalEntries: entries.length,
      percentile: ((entries.length - userRank + 1) / entries.length) * 100,
    };
  }

  /**
   * Generate leaderboard entries with simulated competitors
   */
  generateLeaderboardEntries(categoryId, userValue, userValue2) {
    const user = dataManager.getCurrentUser();

    // Generate realistic competitor data
    const competitors = [
      {
        rank: 1,
        name: "Champion Master",
        value: Math.round(userValue * 1.5),
        badge: "👑",
        isUser: false,
      },
      {
        rank: 2,
        name: "Elite Warrior",
        value: Math.round(userValue * 1.3),
        badge: "⭐",
        isUser: false,
      },
      {
        rank: 3,
        name: "Pro Trainer",
        value: Math.round(userValue * 1.15),
        badge: "🏆",
        isUser: false,
      },
      {
        rank: 4,
        name: "Power User",
        value: Math.round(userValue * 1.08),
        badge: "💪",
        isUser: false,
      },
      {
        rank: 5,
        name: user.name,
        value: userValue,
        badge: "🎯",
        isUser: true,
      },
      {
        rank: 6,
        name: "Fitness Enthusiast",
        value: Math.round(userValue * 0.9),
        badge: "🌱",
        isUser: false,
      },
      {
        rank: 7,
        name: "Dedicated Athlete",
        value: Math.round(userValue * 0.8),
        badge: "💯",
        isUser: false,
      },
      {
        rank: 8,
        name: "Fitness Starter",
        value: Math.round(userValue * 0.7),
        badge: "🚀",
        isUser: false,
      },
      {
        rank: 9,
        name: "New Champion",
        value: Math.round(userValue * 0.6),
        badge: "⚡",
        isUser: false,
      },
      {
        rank: 10,
        name: "Rising Star",
        value: Math.round(userValue * 0.5),
        badge: "🌟",
        isUser: false,
      },
    ];

    return competitors;
  }

  /**
   * Calculate user statistics
   */
  calculateUserStats(user, logs) {
    const totalMinutes = logs.reduce(
      (acc, log) => acc + (log.duration_real || 20 * 60),
      0
    );

    const caloriesBurned = logs.reduce((acc, log) => {
      // Estimate: ~5 cal/min for moderate intensity
      const duration = (log.duration_real || 20 * 60) / 60;
      return acc + duration * 5;
    }, 0);

    const fastestWorkout = logs.length > 0
      ? Math.min(...logs.map((log) => log.duration_real || 20 * 60)) / 60
      : 0;

    const exercisesCompleted = logs.reduce(
      (acc, log) => acc + (log.exercises_count || 5),
      0
    );

    const lastLogsPerWeek = logs.slice(-7).length;
    const consistency = Math.min(100, lastLogsPerWeek * 14); // 100 = perfect 7 workouts/week

    return {
      totalWorkouts: logs.length,
      totalMinutes,
      caloriesBurned,
      fastestWorkout: Math.round(fastestWorkout),
      exercisesCompleted,
      consistency,
      streak: user.streak_days || 0,
    };
  }

  /**
   * Get leaderboard by category
   */
  getLeaderboard(categoryId) {
    return this.leaderboards[categoryId] || null;
  }

  /**
   * Get all leaderboards
   */
  getAllLeaderboards() {
    return Object.values(this.leaderboards);
  }

  /**
   * Get user rank in specific category
   */
  getUserRank(categoryId) {
    const leaderboard = this.getLeaderboard(categoryId);
    if (!leaderboard) return null;

    return {
      rank: leaderboard.userRank,
      total: leaderboard.totalEntries,
      percentile: leaderboard.percentile,
      value: leaderboard.userValue,
    };
  }

  /**
   * Get user's best category
   */
  getUserBestCategory() {
    let bestCategory = null;
    let bestPercentile = 0;

    for (const [categoryId, leaderboard] of Object.entries(this.leaderboards)) {
      if (leaderboard.percentile > bestPercentile) {
        bestPercentile = leaderboard.percentile;
        bestCategory = {
          category: categoryId,
          name: leaderboard.name,
          rank: leaderboard.userRank,
          percentile: leaderboard.percentile,
          icon: leaderboard.icon,
        };
      }
    }

    return bestCategory;
  }

  /**
   * Get user's performance summary
   */
  getPerformanceSummary() {
    const user = dataManager.getCurrentUser();
    const logs = dataManager.getLogs();
    const stats = this.calculateUserStats(user, logs);

    const topCategories = Object.entries(this.leaderboards)
      .map(([id, lb]) => ({
        category: id,
        name: lb.name,
        rank: lb.userRank,
        icon: lb.icon,
      }))
      .sort((a, b) => a.rank - b.rank)
      .slice(0, 3);

    return {
      stats,
      topCategories,
      averageRank: Math.round(
        Object.values(this.leaderboards).reduce((acc, lb) => acc + lb.userRank, 0) /
          Object.values(this.leaderboards).length
      ),
    };
  }

  /**
   * Get leaderboard badges based on rank
   */
  getBadgesForRanks() {
    const badges = [];

    for (const [categoryId, leaderboard] of Object.entries(this.leaderboards)) {
      if (leaderboard.userRank === 1) {
        badges.push({
          type: "first",
          category: leaderboard.name,
          icon: "🥇",
          label: `1st Place in ${leaderboard.name}`,
        });
      } else if (leaderboard.userRank === 2) {
        badges.push({
          type: "second",
          category: leaderboard.name,
          icon: "🥈",
          label: `2nd Place in ${leaderboard.name}`,
        });
      } else if (leaderboard.userRank === 3) {
        badges.push({
          type: "third",
          category: leaderboard.name,
          icon: "🥉",
          label: `3rd Place in ${leaderboard.name}`,
        });
      } else if (leaderboard.userRank <= 5) {
        badges.push({
          type: "top5",
          category: leaderboard.name,
          icon: "⭐",
          label: `Top 5 in ${leaderboard.name}`,
        });
      }
    }

    return badges;
  }

  /**
   * Get comparison with specific rank
   */
  getComparisonWithRank(categoryId, targetRank) {
    const leaderboard = this.getLeaderboard(categoryId);
    if (!leaderboard) return null;

    const userEntry = leaderboard.entries.find((e) => e.isUser);
    const targetEntry = leaderboard.entries[targetRank - 1];

    if (!userEntry || !targetEntry) return null;

    const difference = targetEntry.value - userEntry.value;
    const percentageDifference = ((difference / userEntry.value) * 100).toFixed(1);

    return {
      userValue: userEntry.value,
      targetValue: targetEntry.value,
      difference,
      percentageDifference,
      targetName: targetEntry.name,
    };
  }

  /**
   * Get progression tips based on ranking
   */
  getProgressionTips() {
    const summary = this.getPerformanceSummary();
    const tips = [];

    // If average rank > 5, suggest improvement areas
    if (summary.averageRank > 5) {
      tips.push({
        icon: "📈",
        title: "Aumenta la Frequenza",
        description: "Aggiungi 1-2 allenamenti a settimana per migliorare il ranking",
      });
    }

    // If total minutes low, suggest longer sessions
    if (summary.stats.totalMinutes < 300) {
      tips.push({
        icon: "⏱️",
        title: "Estendi le Sessioni",
        description: "Prova sessioni più lunghe (45-60 min) per più risultati",
      });
    }

    // If consistency low, suggest routine
    if (summary.stats.consistency < 50) {
      tips.push({
        icon: "🎯",
        title: "Crea una Routine",
        description: "Scegli giorni fissi per gli allenamenti (es: Lun, Mer, Ven)",
      });
    }

    return tips;
  }

  /**
   * Refresh leaderboards (call after new workout)
   */
  async refreshLeaderboards() {
    await this.generateLeaderboards();

    if (config.isDebugMode()) {
      console.log("🔄 Leaderboards refreshed");
    }
  }
}

// Export singleton
export const leaderboardService = new LeaderboardService();
