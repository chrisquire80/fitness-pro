/**
 * NotificationManager.js
 * Centralized notification system for user feedback and alerts
 */

class NotificationManager {
  constructor() {
    this.notifications = [];
    this.container = null;
    this.init();
  }

  init() {
    // Create notification container if it doesn't exist
    this.createContainer();
  }

  createContainer() {
    // Remove existing container if present
    const existingContainer = document.getElementById('notification-container');
    if (existingContainer) {
      existingContainer.remove();
    }

    // Create new container
    this.container = document.createElement('div');
    this.container.id = 'notification-container';
    this.container.innerHTML = `
      <style>
        #notification-container {
          position: fixed;
          top: 20px;
          right: 20px;
          z-index: 9999;
          max-width: 320px;
          pointer-events: none;
        }

        .notification {
          background: var(--bg-card);
          border-radius: var(--radius-md);
          padding: 1rem 1.2rem;
          margin-bottom: 0.8rem;
          box-shadow: 0 8px 25px rgba(0,0,0,0.4);
          border-left: 4px solid var(--accent-primary);
          pointer-events: auto;
          transform: translateX(400px);
          opacity: 0;
          transition: all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255,255,255,0.1);
        }

        .notification.show {
          transform: translateX(0);
          opacity: 1;
        }

        .notification.hide {
          transform: translateX(400px);
          opacity: 0;
          margin-bottom: -100px;
        }

        .notification-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 0.5rem;
        }

        .notification-title {
          font-weight: 600;
          font-size: 0.9rem;
          color: var(--text-primary);
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .notification-close {
          background: none;
          border: none;
          color: var(--text-secondary);
          cursor: pointer;
          padding: 0;
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          transition: all 0.2s;
        }

        .notification-close:hover {
          background: rgba(255,255,255,0.1);
          color: var(--text-primary);
        }

        .notification-message {
          font-size: 0.85rem;
          line-height: 1.4;
          color: var(--text-secondary);
          margin: 0;
        }

        .notification-actions {
          margin-top: 0.8rem;
          display: flex;
          gap: 0.5rem;
        }

        .notification-btn {
          padding: 0.4rem 0.8rem;
          border-radius: 4px;
          border: none;
          font-size: 0.75rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .notification-btn-primary {
          background: var(--accent-primary);
          color: white;
        }

        .notification-btn-secondary {
          background: rgba(255,255,255,0.1);
          color: var(--text-primary);
        }

        .notification-btn:hover {
          transform: translateY(-1px);
        }

        /* Notification Types */
        .notification.success {
          border-left-color: var(--success);
        }

        .notification.warning {
          border-left-color: #f59e0b;
        }

        .notification.error {
          border-left-color: var(--danger);
        }

        .notification.info {
          border-left-color: var(--accent-secondary);
        }

        /* Progress bar for auto-dismiss */
        .notification-progress {
          position: absolute;
          bottom: 0;
          left: 0;
          height: 2px;
          background: var(--accent-primary);
          transition: width linear;
          border-radius: 0 0 var(--radius-md) var(--radius-md);
        }

        /* Mobile responsive */
        @media (max-width: 480px) {
          #notification-container {
            left: 10px;
            right: 10px;
            top: 10px;
            max-width: none;
          }

          .notification {
            transform: translateY(-400px);
          }

          .notification.show {
            transform: translateY(0);
          }

          .notification.hide {
            transform: translateY(-400px);
            margin-bottom: -100px;
          }
        }
      </style>
    `;

    document.body.appendChild(this.container);
  }

  /**
   * Show a notification
   * @param {Object} options - Notification options
   * @param {string} options.title - Notification title
   * @param {string} options.message - Notification message
   * @param {string} options.type - success, error, warning, info
   * @param {number} options.duration - Auto-dismiss duration in ms (0 = no auto-dismiss)
   * @param {Array} options.actions - Array of action objects {text, onClick, type}
   * @param {string} options.icon - Icon class (Font Awesome)
   * @returns {string} Notification ID
   */
  show(options = {}) {
    const {
      title = 'Notifica',
      message = '',
      type = 'info',
      duration = 5000,
      actions = [],
      icon = this.getDefaultIcon(type)
    } = options;

    const id = this.generateId();
    const notification = this.createNotificationElement({
      id,
      title,
      message,
      type,
      actions,
      icon,
      duration
    });

    this.notifications.push({ id, element: notification, type });
    this.container.appendChild(notification);

    // Trigger show animation
    requestAnimationFrame(() => {
      notification.classList.add('show');
    });

    // Auto-dismiss if duration is set
    if (duration > 0) {
      this.startProgressBar(notification, duration);
      setTimeout(() => {
        this.dismiss(id);
      }, duration);
    }

    return id;
  }

  /**
   * Quick methods for common notification types
   */
  success(title, message, options = {}) {
    return this.show({
      title,
      message,
      type: 'success',
      ...options
    });
  }

  error(title, message, options = {}) {
    return this.show({
      title,
      message,
      type: 'error',
      duration: 0, // Don't auto-dismiss errors
      ...options
    });
  }

  warning(title, message, options = {}) {
    return this.show({
      title,
      message,
      type: 'warning',
      ...options
    });
  }

  info(title, message, options = {}) {
    return this.show({
      title,
      message,
      type: 'info',
      ...options
    });
  }

  /**
   * Workout-specific notifications
   */
  workoutCompleted(workoutName, stats = {}) {
    const { duration, caloriesBurned, exercises } = stats;

    return this.success(
      '🎉 Allenamento Completato!',
      `Hai completato "${workoutName}"${duration ? ` in ${duration} minuti` : ''}${caloriesBurned ? ` bruciando ${caloriesBurned} calorie` : ''}!`,
      {
        actions: [
          {
            text: 'Vedi Progressi',
            onClick: () => window.location.hash = '#/progress',
            type: 'primary'
          }
        ],
        duration: 8000
      }
    );
  }

  streakUpdate(streakDays) {
    const messages = {
      3: 'Stai prendendo il ritmo! 🔥',
      7: 'Una settimana di fila! Incredibile! 🚀',
      14: 'Due settimane consecutive! Sei una macchina! 💪',
      30: 'UN MESE INTERO! Sei leggendario! 👑'
    };

    const message = messages[streakDays] || `${streakDays} giorni di fila! Continua così! 🔥`;

    return this.success(
      `Serie di ${streakDays} giorni!`,
      message,
      { duration: 6000 }
    );
  }

  restDay() {
    return this.info(
      '🧘 Giorno di Riposo',
      'Il recupero è importante quanto l\'allenamento. Rilassati e preparati per domani!',
      { duration: 4000 }
    );
  }

  /**
   * System notifications
   */
  offlineMode() {
    return this.warning(
      '📱 Modalità Offline',
      'Connessione internet non disponibile. Alcune funzioni potrebbero essere limitate.',
      {
        duration: 0,
        actions: [
          {
            text: 'Riprova',
            onClick: () => window.location.reload(),
            type: 'primary'
          }
        ]
      }
    );
  }

  dataSync(success = true) {
    if (success) {
      return this.success(
        '☁️ Dati Sincronizzati',
        'I tuoi progressi sono stati salvati nel cloud.',
        { duration: 3000 }
      );
    } else {
      return this.error(
        '❌ Errore Sincronizzazione',
        'Impossibile sincronizzare i dati. Riproveremo automaticamente.',
        {
          actions: [
            {
              text: 'Riprova Ora',
              onClick: () => this.dataSync(),
              type: 'primary'
            }
          ]
        }
      );
    }
  }

  /**
   * Dismiss a notification
   */
  dismiss(id) {
    const notification = this.notifications.find(n => n.id === id);
    if (!notification) return;

    notification.element.classList.add('hide');

    setTimeout(() => {
      if (notification.element.parentNode) {
        notification.element.remove();
      }
      this.notifications = this.notifications.filter(n => n.id !== id);
    }, 400);
  }

  /**
   * Clear all notifications
   */
  clear() {
    this.notifications.forEach(notification => {
      this.dismiss(notification.id);
    });
  }

  /**
   * Private methods
   */
  generateId() {
    return 'notification_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  getDefaultIcon(type) {
    const icons = {
      success: 'fas fa-check-circle',
      error: 'fas fa-exclamation-circle',
      warning: 'fas fa-exclamation-triangle',
      info: 'fas fa-info-circle'
    };
    return icons[type] || 'fas fa-bell';
  }

  createNotificationElement({ id, title, message, type, actions, icon, duration }) {
    const element = document.createElement('div');
    element.className = `notification ${type}`;
    element.setAttribute('data-id', id);

    element.innerHTML = `
      <div class="notification-header">
        <div class="notification-title">
          <i class="${icon}"></i>
          ${title}
        </div>
        <button class="notification-close" onclick="notificationManager.dismiss('${id}')">
          <i class="fas fa-times"></i>
        </button>
      </div>
      ${message ? `<p class="notification-message">${message}</p>` : ''}
      ${actions.length > 0 ? `
        <div class="notification-actions">
          ${actions.map(action => `
            <button class="notification-btn notification-btn-${action.type || 'secondary'}"
                    onclick="${action.onClick ? `(${action.onClick.toString()})(); notificationManager.dismiss('${id}');` : `notificationManager.dismiss('${id}')`}">
              ${action.text}
            </button>
          `).join('')}
        </div>
      ` : ''}
      ${duration > 0 ? '<div class="notification-progress"></div>' : ''}
    `;

    return element;
  }

  startProgressBar(notification, duration) {
    const progressBar = notification.querySelector('.notification-progress');
    if (!progressBar) return;

    progressBar.style.width = '100%';
    progressBar.style.transitionDuration = duration + 'ms';

    requestAnimationFrame(() => {
      progressBar.style.width = '0%';
    });
  }
}

// Create global instance
export const notificationManager = new NotificationManager();

// For global access (useful for inline event handlers)
window.notificationManager = notificationManager;
