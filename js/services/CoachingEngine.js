/**
 * CoachingEngine.js
 * Advanced AI Coaching system with personalized feedback, form analysis, and motivation
 */

import { dataManager } from "./DataManager.js";
import { gamificationService } from "./GamificationService.js";
import { recommendationEngine } from "./RecommendationEngine.js";
import { config } from "../utils/Config.js";
import { stateManager } from "../utils/StateManager.js";

class CoachingEngine {
  constructor() {
    this.coachName = "Aura";
    this.coachPersonality = "motivante, professionale, e amichevole";
    this.sessionStartTime = null;
    this.currentExerciseIndex = 0;
    this.feedbackHistory = [];
    this.init();
  }

  async init() {
    try {
      if (config.isDebugMode()) {
        console.log("🤖 CoachingEngine initialized");
      }
    } catch (error) {
      console.error("CoachingEngine initialization failed:", error);
    }
  }

  /**
   * Get personalized greeting based on user and time of day
   */
  getPersonalizedGreeting() {
    const user = dataManager.getCurrentUser();
    const now = new Date();
    const hour = now.getHours();

    let timeGreeting = "";
    if (hour < 12) timeGreeting = "Buongiorno";
    else if (hour < 18) timeGreeting = "Buonpomeriggio";
    else timeGreeting = "Buonasera";

    const motivations = [
      `${timeGreeting} ${user.name}! Sono ${this.coachName}. Pronto per trasformare il tuo corpo e la tua mente? 💪`,
      `${user.name}, ${timeGreeting}! Ho sentito dire che sei una persona di talento. Dimostrami di cosa sei capace! 🚀`,
      `Benvenuto ${user.name}! Oggi è il giorno perfetto per fare progressi verso il tuo obiettivo di **${user.goal}**! ⚡`,
      `${timeGreeting}, ${user.name}! La versione migliore di te stesso ti sta aspettando. Iniziamo! 🔥`,
    ];

    return motivations[Math.floor(Math.random() * motivations.length)];
  }

  /**
   * Analyze workout performance and provide feedback
   */
  async analyzeWorkoutPerformance(workout, sessionData) {
    const analysis = {
      overallScore: 0,
      strengths: [],
      areasForImprovement: [],
      nextSteps: [],
      feedback: "",
      motivation: "",
    };

    try {
      // Calculate performance metrics
      const totalSets = sessionData.sets || 0;
      const totalReps = sessionData.reps || 0;
      const duration = sessionData.duration || 0;
      const exerciseCount = workout.exercises.length;

      // Score calculation (0-100)
      let score = 50; // Base score

      if (totalSets > 0) score += Math.min(30, totalSets * 5);
      if (totalReps > 0) score += Math.min(20, (totalReps / 100) * 20);
      if (duration > 30 * 60) score += 15; // Bonus for longer workouts

      analysis.overallScore = Math.min(100, score);

      // Identify strengths
      if (duration > 45 * 60) {
        analysis.strengths.push("⏱️ Eccellente dedizione temporale");
      }
      if (totalSets >= exerciseCount * 3) {
        analysis.strengths.push("💪 Buona intensità");
      }
      if (sessionData.completed_exercises && sessionData.completed_exercises >= exerciseCount * 0.8) {
        analysis.strengths.push("✅ Completamento quasi perfetto");
      }

      // Identify areas for improvement
      if (totalSets < exerciseCount * 2) {
        analysis.areasForImprovement.push(
          "Prova ad aumentare il numero di set per esercizio (almeno 3)"
        );
      }
      if (duration < 30 * 60) {
        analysis.areasForImprovement.push(
          "Potevi estendere la sessione di almeno 10 minuti per massimizzare i risultati"
        );
      }

      // Next steps recommendations
      if (analysis.overallScore >= 80) {
        analysis.nextSteps.push("Aumenta il peso/difficoltà nel prossimo allenamento");
        analysis.nextSteps.push("Mantieni questo ritmo per 2-3 settimane prima di aumentare l'intensità");
      } else if (analysis.overallScore >= 60) {
        analysis.nextSteps.push("Buon lavoro! Prova ad aggiungere 1-2 set extra nella prossima sessione");
      } else {
        analysis.nextSteps.push("Non scoraggiarti, la costanza è la chiave. Completa il prossimo workout!");
      }

      // Generate feedback
      analysis.feedback = this.generateWorkoutFeedback(
        analysis.overallScore,
        analysis.strengths,
        analysis.areasForImprovement
      );

      // Generate motivation
      analysis.motivation = this.generateMotivation(analysis.overallScore);

      return analysis;
    } catch (error) {
      console.error("Workout analysis error:", error);
      return analysis;
    }
  }

  /**
   * Generate personalized workout feedback
   */
  generateWorkoutFeedback(score, strengths, improvements) {
    let feedback = "";

    if (score >= 90) {
      feedback = `Incredibile! Hai ottenuto un punteggio di ${score}/100! 🏆`;
    } else if (score >= 80) {
      feedback = `Ottimo lavoro! Score: ${score}/100 - Sei sulla buona strada! 👏`;
    } else if (score >= 70) {
      feedback = `Bene! Score: ${score}/100. Continua così! 💪`;
    } else if (score >= 60) {
      feedback = `Score: ${score}/100 - Non è male per iniziare. Puoi fare meglio! 🚀`;
    } else {
      feedback = `Score: ${score}/100 - Ogni allenamento è un passo avanti. Persevera! 💪`;
    }

    if (strengths.length > 0) {
      feedback += `\n\n**Punti Forti:**\n${strengths.map((s) => `• ${s}`).join("\n")}`;
    }

    if (improvements.length > 0) {
      feedback += `\n\n**Aree di Miglioramento:**\n${improvements.map((i) => `• ${i}`).join("\n")}`;
    }

    return feedback;
  }

  /**
   * Generate personalized motivation message
   */
  generateMotivation(score) {
    const motivations = {
      90: "Sei un vero campione! Questo è il tipo di dedizione che porta ai risultati! 🥇",
      80: "Questo è il livello di impegno che distingue i vincitori! Continua! 🔥",
      70: "Stai costruendo una base solida. La costanza pagherà! 📈",
      60: "Ogni allenamento ti avvicina ai tuoi obiettivi. Non mollare! 💪",
      50: "Tutto comincia da qui. Sei sulla strada giusta! 🌟",
      0: "Non è il tuo miglior allenamento, ma è un inizio. Ce la farai! 🚀",
    };

    let message = "";
    for (const [threshold, msg] of Object.entries(motivations).sort(
      (a, b) => b[0] - a[0]
    )) {
      if (score >= parseInt(threshold)) {
        message = msg;
        break;
      }
    }

    return message;
  }

  /**
   * Provide form correction feedback
   */
  getFormFeedback(exerciseName) {
    const formTips = {
      squat: {
        tips: [
          "Mantieni il petto sollevato e lo sguardo davanti",
          "Le ginocchia dovrebbero allinearsi con le dita dei piedi",
          "Scendi finché le cosce non sono parallele al suolo",
          "Premi i talloni per tornare alla posizione iniziale",
        ],
        commonMistakes: [
          "Ginocchia che crollano verso l'interno",
          "Inclinazione eccessiva del busto",
          "Range di movimento insufficiente",
        ],
      },
      pushup: {
        tips: [
          "Corpo dritto dalla testa ai piedi (plancia)",
          "Mani larghe quanto le spalle",
          "Abbassa il corpo fino a quando il petto quasi tocca il pavimento",
          "Premi il pavimento per tornare su",
        ],
        commonMistakes: [
          "Fianchi che si abbassano",
          "Testa che scende prima del corpo",
          "Gomiti troppo aperti",
        ],
      },
      deadlift: {
        tips: [
          "Piedi alla larghezza dell'anca, barra sulle tibie",
          "Schiena piatta, petto alto durante il sollevamento",
          "Usa le gambe per spingere dal pavimento",
          "Hip thruster alla fine, non tirare con la schiena",
        ],
        commonMistakes: [
          "Schiena arrotondata",
          "Barra lontana dal corpo",
          "Partenza dal sedere troppo alto",
        ],
      },
      bench: {
        tips: [
          "Spalle tirate indietro e verso il basso",
          "Piedi fissi sul pavimento",
          "Abbassa la barra al petto controllando il movimento",
          "Premi diritto verso l'alto",
        ],
        commonMistakes: [
          "Spalle sollevate (mancanza di ritrazione scapolare)",
          "Barra che scende al collo invece del petto",
          "Gomiti troppo divaricati",
        ],
      },
    };

    const exercise = formTips[exerciseName.toLowerCase()] || null;

    if (!exercise) {
      return {
        tips: ["Mantieni la forma controllata e concentrata"],
        commonMistakes: [],
        feedback:
          "Per questo esercizio, cerca di mantenere il controllo del movimento e la forma corretta è prioritaria rispetto al peso.",
      };
    }

    return {
      tips: exercise.tips,
      commonMistakes: exercise.commonMistakes,
      feedback: `Ecco alcuni punti importanti per l'esercizio "${exerciseName}": ${exercise.tips[0]}`,
    };
  }

  /**
   * Get real-time coaching during workout
   */
  getRealTimeCoaching(exerciseName, currentSet, totalSets) {
    const messages = [
      `Set ${currentSet} di ${totalSets}! Dai tutto! 💪`,
      `Ottimo ritmo! Mantienilo! 🔥`,
      `Concentrati sulla forma! La qualità prima della quantità! 👌`,
      `Sto vedendo una grande dedizione! Continua così! 🚀`,
      `Set ${currentSet}/${totalSets} - Sei quasi a metà! 💪`,
      `Ricorda di respirare: inspira mentre abbassi, espira mentre spingi! 🌬️`,
      `La tua perseveranza è incredibile! Dai! 🏆`,
      `Ultimi sforzi! Puoi farcela! ⚡`,
    ];

    // Give more encouraging messages on final sets
    if (currentSet === totalSets) {
      return "ULTIMO SET! Dai TUTTO quello che hai! Questa è la differenza che fa la vittoria! 🔥🏆";
    }

    if (currentSet === totalSets - 1) {
      return "Penultimo set! La meta è vicina! Spingiti al limite! 💪⚡";
    }

    return messages[Math.floor(Math.random() * messages.length)];
  }

  /**
   * Get recovery recommendations
   */
  getRecoveryRecommendations(workout) {
    const user = dataManager.getCurrentUser();
    const logs = dataManager.getLogs();
    const lastLog = logs[logs.length - 1];

    const recommendations = {
      hydration: "Bevi almeno 500ml d'acqua nei prossimi 30 minuti",
      nutrition:
        "Consuma una combinazione di carboidrati e proteine (es: banana con burro d'arachidi)",
      stretching: "Dedica 10-15 minuti allo stretching per ridurre l'indolenzimento muscolare",
      sleep:
        "Dormire 7-9 ore è cruciale per il recupero muscolare e la crescita",
      separation:
        "Riposa questo gruppo muscolare per almeno 48 ore prima di allenarlo di nuovo",
    };

    const selectedRecs = [
      recommendations.hydration,
      recommendations.nutrition,
      recommendations.stretching,
    ];

    // Add sleep recommendation if late workout
    const hour = new Date().getHours();
    if (hour > 19) {
      selectedRecs.push(recommendations.sleep);
    }

    return selectedRecs;
  }

  /**
   * Get personalized training plan advice
   */
  getTrainingPlanAdvice() {
    const user = dataManager.getCurrentUser();
    const logs = dataManager.getLogs();

    const advice = {
      frequency:
        user.goal === "lose"
          ? "Per dimagrimento: 4-5 allenamenti a settimana (2-3 forza + 2 cardio)"
          : "Per massa: 4-5 allenamenti a settimana (split body-part)",
      intensity:
        user.goal === "lose"
          ? "Mantieni frequenza cardiaca al 70-85% del massimo durante il cardio"
          : "Allenati con pesi che permettono 6-12 reps con buona forma",
      progression:
        "Aumenta il peso o le reps del 5-10% quando raggiungi la resistenza",
      recovery: "Includi 1-2 giorni di riposo completo o attività leggera",
      consistency: "La costanza supera l'intensità - 3 allenamenti regolari superano 1 intensissimo",
    };

    return advice;
  }

  /**
   * Get injury prevention tips
   */
  getInjuryPreventionTips(exerciseName) {
    const tips = {
      general: [
        "Riscaldati sempre per 5-10 minuti prima di allenarti",
        "Non saltare lo stretching post-allenamento",
        "Ascolta il tuo corpo - dolore diverso da indolenzimento",
        "Aumenta il volume di allenamento gradualmente",
        "Mantieni una forma corretta, specialmente sotto fatica",
      ],
      upperBody: [
        "Proteggere le spalle con corrette progressioni di carico",
        "Non ignorare il riscaldamento delle spalle",
        "Bilancia push e pull per evitare squilibri",
        "Rafforza la cuffia dei rotatori",
      ],
      lowerBody: [
        "Mantieni equilibrio tra quadricipiti e posteriori della coscia",
        "Rafforza i glutei per prevenire problemi al ginocchio",
        "Non ignorare la mobilità dell'anca",
        "Proteggi la schiena bassa mantenendo il core forte",
      ],
    };

    const category = exerciseName.toLowerCase().includes("squat")
      ? "lowerBody"
      : exerciseName.toLowerCase().includes("press")
        ? "upperBody"
        : "general";

    return {
      general: tips.general.slice(0, 2),
      specific: tips[category],
    };
  }

  /**
   * Get progress insights
   */
  async getProgressInsights() {
    const user = dataManager.getCurrentUser();
    const logs = dataManager.getLogs();

    const insights = {
      totalWorkouts: logs.length,
      totalMinutes: logs.reduce((acc, log) => acc + (log.duration_real || 0), 0),
      currentStreak: user.streak_days || 0,
      favoriteType: this.getMostFrequentType(logs),
      levelInfo: await this.calculateUserLevel(),
      achievements: await gamificationService.getStatistics(),
    };

    return insights;
  }

  /**
   * Get most frequent workout type
   */
  getMostFrequentType(logs) {
    if (logs.length === 0) return "Non ancora disponibile";

    const typeCounts = {};
    logs.forEach((log) => {
      typeCounts[log.type] = (typeCounts[log.type] || 0) + 1;
    });

    const favorite = Object.entries(typeCounts).reduce((a, b) =>
      a[1] > b[1] ? a : b
    );

    return favorite[0];
  }

  /**
   * Calculate user level and next milestone
   */
  async calculateUserLevel() {
    const logs = dataManager.getLogs();
    const totalWorkouts = logs.length;

    const levels = [
      { name: "Principiante", minWorkouts: 0, icon: "🌱" },
      { name: "Alle Prime Armi", minWorkouts: 5, icon: "💪" },
      { name: "Intermedio", minWorkouts: 15, icon: "⚡" },
      { name: "Avanzato", minWorkouts: 30, icon: "🔥" },
      { name: "Esperto", minWorkouts: 50, icon: "🏆" },
      { name: "Leggenda", minWorkouts: 100, icon: "👑" },
    ];

    let currentLevel = levels[0];
    for (const level of levels) {
      if (totalWorkouts >= level.minWorkouts) {
        currentLevel = level;
      }
    }

    const nextLevel = levels.find((l) => l.minWorkouts > totalWorkouts) || levels[levels.length - 1];
    const workoutsToNext = nextLevel.minWorkouts - totalWorkouts;

    return {
      current: currentLevel,
      next: nextLevel,
      workoutsToNext: Math.max(0, workoutsToNext),
    };
  }

  /**
   * Send motivational message based on streak
   */
  getStreakMotivation() {
    const user = dataManager.getCurrentUser();
    const streak = user.streak_days || 0;

    const streakMessages = {
      1: "Ottimo inizio! Continua domani per mantenere lo streak! 🔥",
      3: "3 giorni di fila! Stai costruendo un'abitudine! 💪",
      7: "SETTIMANA PERFETTA! 🎉 Hai fatto 7 giorni di fila!",
      14: "DUE SETTIMANE! Sei un guerriero dedicato! 🏆",
      30: "UN MESE INTERO! Non c'è limite a quello che puoi fare! 👑",
    };

    for (const [days, message] of Object.entries(streakMessages)
      .map(([k, v]) => [parseInt(k), v])
      .sort((a, b) => b[0] - a[0])) {
      if (streak >= days) {
        return message;
      }
    }

    return "Sei sulla strada giusta. Continua così! 🚀";
  }

  /**
   * Store feedback for future improvements
   */
  storeFeedback(feedbackData) {
    this.feedbackHistory.push({
      ...feedbackData,
      timestamp: new Date().toISOString(),
    });

    // Keep only last 50 feedbacks
    if (this.feedbackHistory.length > 50) {
      this.feedbackHistory.shift();
    }

    if (config.isDebugMode()) {
      console.log(`💾 Feedback stored: ${feedbackData.type}`);
    }
  }

  /**
   * Get AI coaching summary
   */
  getCoachSummary() {
    const user = dataManager.getCurrentUser();
    const logs = dataManager.getLogs();

    return {
      coachName: this.coachName,
      userGoal: user.goal,
      totalSessions: logs.length,
      consistency: user.streak_days || 0,
      personalityTraits: [
        "🎯 Orientato ai risultati",
        "💪 Motivante e incoraggiante",
        "📊 Basato sui dati",
        "🤝 Supportivo e comprensivo",
      ],
      availability: "24/7 per consigli e supporto",
    };
  }
}

// Export singleton
export const coachingEngine = new CoachingEngine();
