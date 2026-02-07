import { coachingEngine } from "../services/CoachingEngine.js";
import { dataManager } from "../services/DataManager.js";

export default async function AICoach() {
  const user = dataManager.getCurrentUser();
  const insights = await coachingEngine.getProgressInsights();
  const level = insights.levelInfo;
  const coachSummary = coachingEngine.getCoachSummary();
  const streakMotivation = coachingEngine.getStreakMotivation();
  const trainingAdvice = coachingEngine.getTrainingPlanAdvice();
  const injuries = coachingEngine.getInjuryPreventionTips("squat");

  // Attach handlers to window
  window.toggleSection = (sectionId) => {
    const section = document.getElementById(sectionId);
    if (section) {
      section.classList.toggle("section-expanded");
    }
  };

  window.askCoach = () => {
    const input = document.getElementById("coach-input");
    if (input && input.value.trim()) {
      const question = input.value.trim();
      input.value = "";
      displayCoachMessage("me", question);
      getCoachResponse(question);
    }
  };

  window.getCoachResponse = async (question) => {
    const response = coachingEngine.generateMotivation(75) + "\n\n" + question;
    displayCoachMessage("coach", response);
  };

  window.displayCoachMessage = (sender, message) => {
    const chatContainer = document.getElementById("coach-chat");
    if (chatContainer) {
      const messageEl = document.createElement("div");
      messageEl.className = `coach-message coach-message-${sender}`;
      messageEl.innerHTML = `<div class="message-content">${message}</div>`;
      chatContainer.appendChild(messageEl);
      chatContainer.scrollTop = chatContainer.scrollHeight;
    }
  };

  return `
    <div class="ai-coach-page">
      <h1>🤖 ${coachingEngine.coachName} - Il Tuo Coach AI</h1>

      <!-- Coach Profile Card -->
      <div class="coach-profile card">
        <div class="profile-header">
          <div class="coach-avatar">🤖</div>
          <div class="profile-info">
            <h2>${coachingEngine.coachName}</h2>
            <p class="subtitle">Personal Trainer AI - Disponibile 24/7</p>
          </div>
        </div>

        <div class="profile-stats">
          <div class="stat">
            <span class="stat-label">Sessioni Guidate</span>
            <span class="stat-value">${insights.totalWorkouts}</span>
          </div>
          <div class="stat">
            <span class="stat-label">Streak Attuale</span>
            <span class="stat-value">${insights.currentStreak} giorni</span>
          </div>
          <div class="stat">
            <span class="stat-label">Tempo Totale</span>
            <span class="stat-value">${Math.round(insights.totalMinutes / 60)}h</span>
          </div>
          <div class="stat">
            <span class="stat-label">Livello</span>
            <span class="stat-value">${level.current.icon} ${level.current.name}</span>
          </div>
        </div>

        <div class="streak-motivation">
          <p>${streakMotivation}</p>
        </div>
      </div>

      <!-- Chat Interface -->
      <div class="coach-chat-section card">
        <h3>💬 Chiedi a ${coachingEngine.coachName}</h3>
        <div id="coach-chat" class="coach-chat-container">
          <div class="coach-message coach-message-coach">
            <div class="message-content">${coachingEngine.getPersonalizedGreeting()}</div>
          </div>
        </div>
        <div class="chat-input-group">
          <input
            type="text"
            id="coach-input"
            class="coach-input"
            placeholder="Chiedi consigli su form, motivazione, nutrizione..."
            onkeypress="if(event.key==='Enter') window.askCoach()"
          />
          <button class="btn btn-primary" onclick="window.askCoach()">
            <i class="fas fa-paper-plane"></i>
          </button>
        </div>
      </div>

      <!-- Training Plan Section -->
      <div class="coaching-section card">
        <h3 onclick="window.toggleSection('training-plan')" class="section-header">
          📋 Piano di Allenamento Personalizzato
        </h3>
        <div id="training-plan" class="section-content">
          <div class="advice-grid">
            <div class="advice-card">
              <span class="advice-icon">📅</span>
              <span class="advice-label">Frequenza</span>
              <p>${trainingAdvice.frequency}</p>
            </div>
            <div class="advice-card">
              <span class="advice-icon">⚡</span>
              <span class="advice-label">Intensità</span>
              <p>${trainingAdvice.intensity}</p>
            </div>
            <div class="advice-card">
              <span class="advice-icon">📈</span>
              <span class="advice-label">Progressione</span>
              <p>${trainingAdvice.progression}</p>
            </div>
            <div class="advice-card">
              <span class="advice-icon">💤</span>
              <span class="advice-label">Recupero</span>
              <p>${trainingAdvice.recovery}</p>
            </div>
            <div class="advice-card">
              <span class="advice-icon">🎯</span>
              <span class="advice-label">Consistenza</span>
              <p>${trainingAdvice.consistency}</p>
            </div>
            <div class="advice-card">
              <span class="advice-icon">🏋️</span>
              <span class="advice-label">Obiettivo</span>
              <p>Lavora verso il tuo goal di <strong>${user.goal === "lose" ? "dimagrimento" : "massa muscolare"}</strong></p>
            </div>
          </div>
        </div>
      </div>

      <!-- Injury Prevention Section -->
      <div class="coaching-section card">
        <h3 onclick="window.toggleSection('injury-prevention')" class="section-header">
          🛡️ Prevenzione Infortuni
        </h3>
        <div id="injury-prevention" class="section-content">
          <div class="injury-tips">
            <h4>Consigli Generali</h4>
            <ul>
              ${injuries.general.map((tip) => `<li>✅ ${tip}</li>`).join("")}
            </ul>

            <h4>Consigli Specifici per il Tuo Allenamento</h4>
            <ul>
              ${injuries.specific.map((tip) => `<li>⚠️ ${tip}</li>`).join("")}
            </ul>

            <div class="prevention-tips">
              <p><strong>🔑 Chiave:</strong> La forma corretta è più importante del peso. Se non puoi mantenere la forma, riduci il carico.</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Form Correction Guide -->
      <div class="coaching-section card">
        <h3 onclick="window.toggleSection('form-guide')" class="section-header">
          👤 Guida alla Forma Corretta
        </h3>
        <div id="form-guide" class="section-content">
          <div class="form-exercises">
            <div class="exercise-form">
              <h4>🦵 Squat</h4>
              <div class="form-content">
                <p><strong>Esecuzione Corretta:</strong></p>
                <ul>
                  <li>Petto sollevato, sguardo avanti</li>
                  <li>Ginocchia allineate alle dita</li>
                  <li>Cosce parallele al suolo</li>
                  <li>Premi i talloni per risalire</li>
                </ul>
                <p><strong>Errori Comuni:</strong></p>
                <ul class="error-list">
                  <li>❌ Ginocchia che crollano verso l'interno</li>
                  <li>❌ Inclinazione eccessiva del busto</li>
                  <li>❌ Range di movimento insufficiente</li>
                </ul>
              </div>
            </div>

            <div class="exercise-form">
              <h4>💪 Push-up</h4>
              <div class="form-content">
                <p><strong>Esecuzione Corretta:</strong></p>
                <ul>
                  <li>Corpo dritto dalla testa ai piedi</li>
                  <li>Mani alla larghezza spalle</li>
                  <li>Petto quasi tocca il pavimento</li>
                  <li>Spingere con controllo</li>
                </ul>
                <p><strong>Errori Comuni:</strong></p>
                <ul class="error-list">
                  <li>❌ Fianchi che si abbassano</li>
                  <li>❌ Testa che scende prima</li>
                  <li>❌ Gomiti troppo aperti</li>
                </ul>
              </div>
            </div>

            <div class="exercise-form">
              <h4>🏋️ Deadlift</h4>
              <div class="form-content">
                <p><strong>Esecuzione Corretta:</strong></p>
                <ul>
                  <li>Piedi alla larghezza anca</li>
                  <li>Schiena piatta, petto alto</li>
                  <li>Spingi con le gambe</li>
                  <li>Hip thrust alla fine</li>
                </ul>
                <p><strong>Errori Comuni:</strong></p>
                <ul class="error-list">
                  <li>❌ Schiena arrotondata</li>
                  <li>❌ Barra lontana dal corpo</li>
                  <li>❌ Partenza dal sedere alto</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Progression Tips -->
      <div class="coaching-section card">
        <h3 onclick="window.toggleSection('progression')" class="section-header">
          📈 Strategie di Progressione
        </h3>
        <div id="progression" class="section-content">
          <div class="progression-tips">
            <div class="tip-card">
              <h4>1. Aumenta il Peso (5-10%)</h4>
              <p>Una volta che puoi completare tutte le reps con buona forma</p>
            </div>

            <div class="tip-card">
              <h4>2. Aumenta le Reps o i Set</h4>
              <p>Aggiungi 1-2 reps o un set prima di aumentare il peso</p>
            </div>

            <div class="tip-card">
              <h4>3. Riduci il Riposo</h4>
              <p>Accorcia il tempo di riposo tra i set (progressione vascolare)</p>
            </div>

            <div class="tip-card">
              <h4>4. Migliora la Tempo/Controllo</h4>
              <p>Rallenta la fase eccentrica per 2-3 secondi</p>
            </div>

            <div class="tip-card">
              <h4>5. Varia gli Esercizi</h4>
              <p>Cambia varianti di esercizi ogni 4-6 settimane</p>
            </div>

            <div class="tip-card">
              <h4>6. Aumenta il Volume Totale</h4>
              <p>Aumenta sets × reps × peso nel tempo</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Level Progress -->
      <div class="coaching-section card">
        <h3>🎖️ Tuo Livello e Progressione</h3>
        <div class="level-info">
          <div class="current-level">
            <div class="level-badge">${level.current.icon}</div>
            <div>
              <h4>${level.current.name}</h4>
              <p>Hai completato ${insights.totalWorkouts} allenamenti</p>
            </div>
          </div>

          ${level.workoutsToNext > 0 ? `
            <div class="next-level-progress">
              <p>Prossimo livello: <strong>${level.next.name}</strong></p>
              <p>${level.workoutsToNext} allenamenti rimanenti</p>
              <div class="progress-bar">
                <div class="progress-fill" style="width: ${((insights.totalWorkouts - level.current.minWorkouts) / (level.next.minWorkouts - level.current.minWorkouts)) * 100}%"></div>
              </div>
            </div>
          ` : `
            <div class="elite-badge">
              <p>🏆 Sei LEGGENDA! Hai raggiunto il massimo livello!</p>
            </div>
          `}
        </div>
      </div>

      <style>
        .ai-coach-page {
          padding: var(--spacing-md);
        }

        .ai-coach-page h1 {
          margin-bottom: var(--spacing-lg);
          color: var(--accent-primary);
        }

        /* Coach Profile */
        .coach-profile {
          background: linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%);
          border: 2px solid var(--accent-primary);
          padding: var(--spacing-lg);
          margin-bottom: var(--spacing-lg);
        }

        .profile-header {
          display: flex;
          align-items: center;
          gap: var(--spacing-md);
          margin-bottom: var(--spacing-lg);
        }

        .coach-avatar {
          font-size: 4rem;
          width: 80px;
          height: 80px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(139, 92, 246, 0.2);
          border-radius: 50%;
        }

        .profile-info h2 {
          margin: 0;
          color: var(--accent-primary);
        }

        .profile-info .subtitle {
          margin: 4px 0 0 0;
          color: var(--text-secondary);
          font-size: 0.9rem;
        }

        .profile-stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
          gap: var(--spacing-md);
          margin-bottom: var(--spacing-lg);
          padding-bottom: var(--spacing-lg);
          border-bottom: 1px solid rgba(139, 92, 246, 0.2);
        }

        .stat {
          text-align: center;
        }

        .stat-label {
          display: block;
          font-size: 0.8rem;
          color: var(--text-secondary);
          margin-bottom: 4px;
        }

        .stat-value {
          display: block;
          font-size: 1.5rem;
          font-weight: bold;
          color: var(--accent-primary);
        }

        .streak-motivation {
          background: rgba(16, 185, 129, 0.1);
          border-left: 4px solid #10b981;
          padding: var(--spacing-md);
          border-radius: var(--radius-md);
        }

        .streak-motivation p {
          margin: 0;
          color: var(--text-primary);
          line-height: 1.6;
        }

        /* Chat Interface */
        .coach-chat-section {
          margin-bottom: var(--spacing-lg);
        }

        .coach-chat-section h3 {
          margin-top: 0;
        }

        .coach-chat-container {
          height: 300px;
          overflow-y: auto;
          background: rgba(139, 92, 246, 0.05);
          border-radius: var(--radius-md);
          padding: var(--spacing-md);
          margin-bottom: var(--spacing-md);
          display: flex;
          flex-direction: column;
          gap: var(--spacing-sm);
        }

        .coach-message {
          display: flex;
          animation: slideIn 0.3s ease-out;
        }

        .coach-message-coach {
          justify-content: flex-start;
        }

        .coach-message-me {
          justify-content: flex-end;
        }

        .message-content {
          max-width: 80%;
          padding: var(--spacing-sm) var(--spacing-md);
          border-radius: var(--radius-md);
          line-height: 1.5;
          word-wrap: break-word;
        }

        .coach-message-coach .message-content {
          background: var(--accent-primary);
          color: white;
        }

        .coach-message-me .message-content {
          background: rgba(139, 92, 246, 0.2);
          color: var(--text-primary);
        }

        .chat-input-group {
          display: flex;
          gap: var(--spacing-sm);
        }

        .coach-input {
          flex: 1;
          padding: var(--spacing-sm);
          border: 1px solid rgba(139, 92, 246, 0.3);
          background: var(--bg-primary);
          color: var(--text-primary);
          border-radius: var(--radius-md);
          font-size: 0.9rem;
        }

        .coach-input:focus {
          outline: none;
          border-color: var(--accent-primary);
          box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
        }

        /* Coaching Sections */
        .coaching-section {
          margin-bottom: var(--spacing-lg);
        }

        .section-header {
          cursor: pointer;
          margin: 0;
          padding: var(--spacing-md);
          background: rgba(139, 92, 246, 0.1);
          border-radius: var(--radius-md);
          transition: all 0.3s ease;
          user-select: none;
        }

        .section-header:hover {
          background: rgba(139, 92, 246, 0.2);
        }

        .section-content {
          padding: var(--spacing-md);
          border-top: 1px solid rgba(139, 92, 246, 0.2);
        }

        .section-expanded .section-content {
          display: block;
        }

        /* Advice Grid */
        .advice-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: var(--spacing-md);
        }

        .advice-card {
          background: rgba(139, 92, 246, 0.1);
          padding: var(--spacing-md);
          border-radius: var(--radius-md);
          border-left: 4px solid var(--accent-primary);
        }

        .advice-icon {
          display: block;
          font-size: 1.8rem;
          margin-bottom: var(--spacing-sm);
        }

        .advice-label {
          display: block;
          font-weight: bold;
          color: var(--accent-primary);
          margin-bottom: var(--spacing-sm);
        }

        .advice-card p {
          margin: 0;
          font-size: 0.9rem;
          line-height: 1.5;
        }

        /* Injury Tips */
        .injury-tips {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-md);
        }

        .injury-tips h4 {
          margin: var(--spacing-md) 0 var(--spacing-sm) 0;
          color: var(--accent-primary);
        }

        .injury-tips ul {
          list-style: none;
          padding: 0;
          margin: 0;
          display: grid;
          gap: var(--spacing-sm);
        }

        .injury-tips li {
          padding: var(--spacing-sm);
          background: rgba(139, 92, 246, 0.05);
          border-radius: var(--radius-sm);
          border-left: 3px solid var(--accent-primary);
        }

        .prevention-tips {
          background: rgba(16, 185, 129, 0.1);
          border: 1px solid #10b981;
          padding: var(--spacing-md);
          border-radius: var(--radius-md);
          color: var(--text-primary);
        }

        /* Form Exercises */
        .form-exercises {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: var(--spacing-md);
        }

        .exercise-form {
          background: rgba(139, 92, 246, 0.05);
          padding: var(--spacing-md);
          border-radius: var(--radius-md);
          border: 1px solid rgba(139, 92, 246, 0.2);
        }

        .exercise-form h4 {
          margin-top: 0;
          color: var(--accent-primary);
        }

        .form-content ul {
          padding-left: var(--spacing-md);
          margin: var(--spacing-sm) 0;
        }

        .form-content li {
          margin-bottom: 6px;
          line-height: 1.5;
        }

        .error-list li {
          color: #ef4444;
        }

        /* Progression Tips */
        .progression-tips {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: var(--spacing-md);
        }

        .tip-card {
          background: linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(59, 130, 246, 0.1));
          padding: var(--spacing-md);
          border-radius: var(--radius-md);
          border: 1px solid rgba(139, 92, 246, 0.2);
        }

        .tip-card h4 {
          margin: 0 0 var(--spacing-sm) 0;
          color: var(--accent-primary);
        }

        .tip-card p {
          margin: 0;
          font-size: 0.9rem;
          color: var(--text-secondary);
        }

        /* Level Info */
        .level-info {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-lg);
        }

        .current-level {
          display: flex;
          align-items: center;
          gap: var(--spacing-lg);
          background: rgba(139, 92, 246, 0.1);
          padding: var(--spacing-md);
          border-radius: var(--radius-md);
        }

        .level-badge {
          font-size: 3rem;
          width: 100px;
          text-align: center;
        }

        .current-level h4 {
          margin: 0 0 4px 0;
          color: var(--accent-primary);
        }

        .current-level p {
          margin: 0;
          color: var(--text-secondary);
          font-size: 0.9rem;
        }

        .next-level-progress {
          background: rgba(59, 130, 246, 0.1);
          padding: var(--spacing-md);
          border-radius: var(--radius-md);
          border-left: 4px solid #3b82f6;
        }

        .progress-bar {
          height: 8px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 4px;
          overflow: hidden;
          margin-top: var(--spacing-sm);
        }

        .progress-fill {
          height: 100%;
          background: var(--accent-primary);
          transition: width 0.3s ease;
        }

        .elite-badge {
          text-align: center;
          padding: var(--spacing-lg);
          background: linear-gradient(135deg, rgba(245, 158, 11, 0.1), rgba(16, 185, 129, 0.1));
          border: 2px solid #f59e0b;
          border-radius: var(--radius-md);
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @media (max-width: 640px) {
          .profile-stats {
            grid-template-columns: repeat(2, 1fr);
          }

          .advice-grid,
          .form-exercises,
          .progression-tips {
            grid-template-columns: 1fr;
          }
        }
      </style>
    </div>
  `;
}
