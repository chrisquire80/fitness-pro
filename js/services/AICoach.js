import { dataManager } from './DataManager.js';

class AICoach {
    constructor() {
        this.name = "Aura"; // Name of the AI
    }

    /**
     * analyzeState()
     * Scans user profile and logs to generate a proactive message.
     */
    analyzeState() {
        const user = dataManager.getCurrentUser();
        const logs = dataManager.getLogs();
        const now = new Date();

        if (!user.name) return null;

        // 1. New User / No workouts
        if (logs.length === 0) {
            return `Ciao ${user.name}! Ho visto che hai appena configurato il tuo piano per **${user.goal === 'lose' ? 'Dimagrire' : 'la Massa'}**. Cominciamo con la prima sessione? 🚀`;
        }

        const lastLog = logs[logs.length - 1];
        const lastDate = new Date(lastLog.date);
        const daysSince = Math.floor((now - lastDate) / (1000 * 60 * 60 * 24));

        // 2. High Streak
        if (user.streak_days > 3) {
            return `Sei una macchina, ${user.name}! 🔥 **${user.streak_days} giorni di fila**. Oggi ti consiglio una sessione di stretching per recuperare al meglio.`;
        }

        // 3. Long absence
        if (daysSince > 3) {
            return `Bentornato ${user.name}! Sono passati ${daysSince} giorni dall'ultimo workout. Che ne dici di una sessione "Rientro Soft" per riprendere il ritmo? 💪`;
        }

        // 4. Default suggestion
        return `Ciao! Pronto per la sfida di oggi? Ho preparato un allenamento perfetto per il tuo obiettivo di **${user.goal === 'lose' ? 'tonificazione' : 'ipertrofia'}**.`;
    }

    getQuickAdvice(topic) {
        const advices = {
            'soreness': "Il dolore muscolare (DOMS) è normale. Se è intenso, concentrati sul cardio leggero o stretching oggi.",
            'motivation': "Ricorda perché hai iniziato: il tuo obiettivo di trasformazione è a soli 20 minuti di distanza! ⚡",
            'nutrition': "Assicurati di bere almeno 2L d'acqua oggi e privilegia proteine magre dopo l'allenamento."
        };
        return advices[topic] || "Continua così, la costanza è la chiave!";
    }
}

export const aiCoach = new AICoach();
