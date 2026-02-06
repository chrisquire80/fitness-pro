/**
 * EmailService.js
 * Mock service for transactional emails (Resend / Brevo integration).
 */

import { dataManager } from './DataManager.js';

class EmailService {
    /**
     * sendWeeklyRecap()
     * Simulates sending a recap email to the user.
     */
    sendWeeklyRecap() {
        const user = dataManager.getCurrentUser();
        const stats = dataManager.getWeeklyStats();

        if (!user.name) return;

        const emailContent = `
            Ciao ${user.name}! 🚀
            Ecco il tuo riepilogo settimanale:
            - Workouts completati: ${stats.total_workouts}
            - Calorie bruciate: ${stats.total_calories} kcal
            - Minuti di attività: ${stats.total_minutes} min
            
            Continua così! La costanza è il tuo superpotere. 🔥
        `;

        console.log("%c [EMAIL SERVICE] Invio Riepilogo Settimanale...", "color: #8b5cf6; font-weight: bold;");
        console.log(emailContent);

        return true;
    }
}

export const emailService = new EmailService();
