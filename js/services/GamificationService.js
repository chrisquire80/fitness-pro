/**
 * GamificationService.js
 * Gamification system with achievements, badges, challenges, and progression
 * Tracks user progress, unlocks achievements, and manages challenge completion
 */

import { dataManager } from "./DataManager.js";
import { indexedDBService } from "./IndexedDBService.js";
import { config } from "../utils/Config.js";
import { stateManager } from "../utils/StateManager.js";

class GamificationService {
  constructor() {
    this.user = null;
    this.achievements = {};
    this.currentChallenges = {};
    this.badges = this.initializeBadges();
    this.challenges = this.initializeChallenges();
    this.init();
  }

  async init() {
    try {
      this.user = dataManager.getCurrentUser();
      await this.loadAchievements();

      if (config.isDebugMode()) {
        console.log("🎮 GamificationService initialized");
      }
    } catch (error) {
      console.error("GamificationService initialization failed:", error);
    }
  }

  /**
   * Initialize badge definitions
   */
  initializeBadges() {
    return {
      // Streak badges
      first_workout: {
        id: "first_workout",
        name: "🎬 First Step",
        description: "Complete your first workout",
        icon: "🎬",
        points: 10,
        condition: (stats) => stats.totalWorkouts >= 1,
      },
      week_warrior: {
        id: "week_warrior",
        name: "⚔️ Week Warrior",
        description: "Complete 7 workouts in a week",
        icon: "⚔️",
        points: 50,
        condition: (stats) => stats.weeklyCount >= 7,
      },
      month_master: {
        id: "month_master",
        name: "👑 Month Master",
        description: "Complete 25 workouts in a month",
        icon: "👑",
        points: 100,
        condition: (stats) => stats.monthlyCount >= 25,
      },

      // Consistency badges
      ten_day_streak: {
        id: "ten_day_streak",
        name: "🔥 10 Day Streak",
        description: "Maintain a 10-day workout streak",
        icon: "🔥",
        points: 75,
        condition: (stats) => stats.currentStreak >= 10,
      },
      thirty_day_streak: {
        id: "thirty_day_streak",
        name: "💪 30 Day Streak",
        description: "Maintain a 30-day workout streak",
        icon: "💪",
        points: 200,
        condition: (stats) => stats.currentStreak >= 30,
      },

      // Duration badges
      hundred_minutes: {
        id: "hundred_minutes",
        name: "⏱️ Century",
        description: "Complete 100 minutes of total workouts",
        icon: "⏱️",
        points: 60,
        condition: (stats) => stats.totalMinutes >= 100,
      },
      thousand_minutes: {
        id: "thousand_minutes",
        name: "🚀 Millennium",
        description: "Complete 1000 minutes of total workouts",
        icon: "🚀",
        points: 300,
        condition: (stats) => stats.totalMinutes >= 1000,
      },

      // Variety badges
      exercise_explorer: {
        id: "exercise_explorer",
        name: "🧭 Explorer",
        description: "Complete workouts from 5 different categories",
        icon: "🧭",
        points: 80,
        condition: (stats) => stats.uniqueCategories >= 5,
      },
      equipment_master: {
        id: "equipment_master",
        name: "🛠️ Equipment Master",
        description: "Complete workouts with 10 different equipment types",
        icon: "🛠️",
        points: 120,
        condition: (stats) => stats.uniqueEquipment >= 10,
      },

      // Intensity badges
      difficulty_climber: {
        id: "difficulty_climber",
        name: "📈 Climber",
        description: "Complete workouts of all difficulty levels",
        icon: "📈",
        points: 100,
        condition: (stats) => stats.allDifficultiesCompleted,
      },
      elite_workouts: {
        id: "elite_workouts",
        name: "⭐ Elite",
        description: "Complete 10 expert-level workouts",
        icon: "⭐",
        points: 150,
        condition: (stats) => stats.expertCount >= 10,
      },

      // Special achievements
      comeback_kid: {
        id: "comeback_kid",
        name: "🎯 Comeback Kid",
        description: "Return to workouts after 7+ days",
        icon: "🎯",
        points: 40,
        condition: () => true, // Manually triggered
      },
      perfect_week: {
        id: "perfect_week",
        name: "✨ Perfect Week",
        description: "Complete all planned workouts in a week",
        icon: "✨",
        points: 90,
        condition: () => true, // Manually triggered
      },
    };
  }

  /**
   * Initialize challenge definitions
   */
  initializeChallenges() {
    return {
      daily: [
        {
          id: "daily_workout",
          name: "Daily Workout",
          description: "Complete at least one workout today",
          icon: "💪",
          target: 1,
          period: "daily",
          reward: 20,
          condition: (stats) => stats.todayWorkouts >= this.target,
        },
        {
          id: "daily_minutes",
          name: "30 Minute Challenge",
          description: "Complete 30 minutes of workout today",
          icon: "⏱️",
          target: 30,
          period: "daily",
          reward: 30,
          condition: (stats) => stats.todayMinutes >= this.target,
        },
      ],
      weekly: [
        {
          id: "weekly_consistency",
          name: "Weekly Consistency",
          description: "Work out 5 days this week",
          icon: "📅",
          target: 5,
          period: "weekly",
          reward: 50,
          condition: (stats) => stats.weeklyCount >= this.target,
        },
        {
          id: "weekly_variety",
          name: "Variety Week",
          description: "Complete 3 different workout types this week",
          icon: "🎨",
          target: 3,
          period: "weekly",
          reward: 40,
          condition: (stats) => stats.weeklyTypes >= this.target,
        },
        {
          id: "weekly_duration",
          name: "Duration Master",
          description: "Accumulate 180 minutes this week",
          icon: "🕐",
          target: 180,
          period: "weekly",
          reward: 60,
          condition: (stats) => stats.weeklyMinutes >= this.target,
        },
      ],
      monthly: [
        {
          id: "monthly_warrior",
          name: "Monthly Warrior",
          description: "Complete 20 workouts this month",
          icon: "⚔️",
          target: 20,
          period: "monthly",
          reward: 100,
          condition: (stats) => stats.monthlyCount >= this.target,
        },
        {
          id: "monthly_marathon",
          name: "Monthly Marathon",
          description: "Accumulate 600 minutes this month",
          icon: "🏃",
          target: 600,
          period: "monthly",
          reward: 150,
          condition: (stats) => stats.monthlyMinutes >= this.target,
        },
      ],
    };
  }

  /**
   * Calculate user statistics for badge evaluation
   */
  async calculateStats() {
    const logs = dataManager.getLogs();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    const monthAgo = new Date(today);
    monthAgo.setMonth(monthAgo.getMonth() - 1);

    const todayLogs = logs.filter((l) => {
      const logDate = new Date(l.date || l.created_at);
      logDate.setHours(0, 0, 0, 0);
      return logDate.getTime() === today.getTime();
    });

    const weekLogs = logs.filter(
      (l) => new Date(l.date || l.created_at) >= weekAgo
    );
    const monthLogs = logs.filter(
      (l) => new Date(l.date || l.created_at) >= monthAgo
    );

    const getMinutes = (logArray) =>
      logArray.reduce((acc, l) => acc + (l.duration_real ? l.duration_real / 60 : 20), 0);

    const uniqueTypes = new Set(monthLogs.map((l) => l.type)).size;
    const uniqueEquipment = new Set(monthLogs.map((l) => l.equipment)).size;
    const expertLogs = monthLogs.filter((l) => l.difficulty === "advanced" || l.difficulty === "expert").length;

    const difficulties = new Set(monthLogs.map((l) => l.difficulty));
    const allDifficultiesCompleted = difficulties.size >= 3;

    return {
      totalWorkouts: logs.length,
      totalMinutes: getMinutes(logs),
      todayWorkouts: todayLogs.length,
      todayMinutes: getMinutes(todayLogs),
      weeklyCount: weekLogs.length,
      weeklyMinutes: getMinutes(weekLogs),
      weeklyTypes: new Set(weekLogs.map((l) => l.type)).size,
      monthlyCount: monthLogs.length,
      monthlyMinutes: getMinutes(monthLogs),
      currentStreak: this.user?.streak_days || 0,
      uniqueCategories: uniqueTypes,
      uniqueEquipment: uniqueEquipment,
      allDifficultiesCompleted: allDifficultiesCompleted,
      expertCount: expertLogs,
    };
  }

  /**
   * Check and unlock new achievements
   */
  async checkAndUnlockAchievements() {
    const stats = await this.calculateStats();
    const unlockedAchievements = [];

    for (const [badgeId, badge] of Object.entries(this.badges)) {
      if (
        !this.achievements[badgeId] &&
        badge.condition(stats)
      ) {
        await this.unlockAchievement(badgeId, badge);
        unlockedAchievements.push(badge);
      }
    }

    return unlockedAchievements;
  }

  /**
   * Unlock an achievement
   */
  async unlockAchievement(badgeId, badge) {
    const achievement = {
      id: badgeId,
      user_id: this.user?.id,
      name: badge.name,
      description: badge.description,
      icon: badge.icon,
      points: badge.points,
      unlocked_date: new Date().toISOString(),
    };

    this.achievements[badgeId] = achievement;

    // Store in IndexedDB
    await indexedDBService.put("achievements", achievement);

    // Update user points
    this.user.total_points = (this.user.total_points || 0) + badge.points;
    stateManager.setState("user.points", this.user.total_points);
    stateManager.setState("user.achievement", achievement);

    if (config.isDebugMode()) {
      console.log(`🏆 Achievement Unlocked: ${badge.name} (+${badge.points} pts)`);
    }

    return achievement;
  }

  /**
   * Get current challenges based on period
   */
  async getCurrentChallenges(period = "daily") {
    const challenges = this.challenges[period] || [];
    const stats = await this.calculateStats();

    return challenges.map((challenge) => ({
      ...challenge,
      progress: this.getProgressForChallenge(challenge, stats),
      completed: challenge.condition(stats),
      reward: challenge.reward,
    }));
  }

  /**
   * Get progress toward challenge completion
   */
  getProgressForChallenge(challenge, stats) {
    switch (challenge.id) {
      case "daily_workout":
        return { current: stats.todayWorkouts, target: challenge.target };
      case "daily_minutes":
        return { current: Math.round(stats.todayMinutes), target: challenge.target };
      case "weekly_consistency":
        return { current: stats.weeklyCount, target: challenge.target };
      case "weekly_variety":
        return { current: stats.weeklyTypes, target: challenge.target };
      case "weekly_duration":
        return { current: Math.round(stats.weeklyMinutes), target: challenge.target };
      case "monthly_warrior":
        return { current: stats.monthlyCount, target: challenge.target };
      case "monthly_marathon":
        return { current: Math.round(stats.monthlyMinutes), target: challenge.target };
      default:
        return { current: 0, target: challenge.target };
    }
  }

  /**
   * Complete a challenge and reward user
   */
  async completechallenge(challengeId) {
    const allChallenges = [
      ...this.challenges.daily,
      ...this.challenges.weekly,
      ...this.challenges.monthly,
    ];

    const challenge = allChallenges.find((c) => c.id === challengeId);

    if (!challenge) return false;

    const stats = await this.calculateStats();
    if (!challenge.condition(stats)) return false;

    // Award points
    this.user.total_points = (this.user.total_points || 0) + challenge.reward;
    this.user.challenges_completed = (this.user.challenges_completed || 0) + 1;

    stateManager.setState("user.points", this.user.total_points);
    stateManager.setState("user.challengesCompleted", this.user.challenges_completed);

    if (config.isDebugMode()) {
      console.log(`✅ Challenge Completed: ${challenge.name} (+${challenge.reward} pts)`);
    }

    return true;
  }

  /**
   * Get user level based on points
   */
  getUserLevel() {
    const points = this.user?.total_points || 0;
    const levels = [
      { level: 1, minPoints: 0, maxPoints: 100, name: "Beginner" },
      { level: 2, minPoints: 100, maxPoints: 300, name: "Novice" },
      { level: 3, minPoints: 300, maxPoints: 600, name: "Intermediate" },
      { level: 4, minPoints: 600, maxPoints: 1000, name: "Advanced" },
      { level: 5, minPoints: 1000, maxPoints: 1500, name: "Expert" },
      { level: 6, minPoints: 1500, maxPoints: 2500, name: "Master" },
      { level: 7, minPoints: 2500, maxPoints: Infinity, name: "Elite" },
    ];

    const current = levels.find((l) => points >= l.minPoints && points < l.maxPoints);
    const nextLevel = levels.find((l) => l.level === (current?.level || 0) + 1);

    return {
      current: current || levels[0],
      next: nextLevel,
      pointsToNext: nextLevel ? nextLevel.minPoints - points : 0,
      progress: nextLevel ? ((points - (current?.minPoints || 0)) / (nextLevel.minPoints - (current?.minPoints || 0))) * 100 : 100,
    };
  }

  /**
   * Load achievements from storage
   */
  async loadAchievements() {
    try {
      const stored = await indexedDBService.getAll("achievements");
      if (Array.isArray(stored)) {
        stored.forEach((ach) => {
          this.achievements[ach.id] = ach;
        });
      }
    } catch (error) {
      console.error("Error loading achievements:", error);
    }
  }

  /**
   * Get all unlocked achievements
   */
  getUnlockedAchievements() {
    return Object.values(this.achievements);
  }

  /**
   * Get achievement statistics
   */
  async getStatistics() {
    const stats = await this.calculateStats();
    const level = this.getUserLevel();

    return {
      totalPoints: this.user?.total_points || 0,
      level: level.current,
      nextLevel: level.next,
      achievements: Object.keys(this.achievements).length,
      totalAchievements: Object.keys(this.badges).length,
      challengesCompleted: this.user?.challenges_completed || 0,
      stats: stats,
    };
  }

  /**
   * Reset daily challenges
   */
  resetDailyChallenges() {
    this.currentChallenges.daily = {};
    if (config.isDebugMode()) {
      console.log("🔄 Daily challenges reset");
    }
  }
}

// Export singleton
export const gamificationService = new GamificationService();
