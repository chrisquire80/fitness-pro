/**
 * PWAPrompt.js
 * Displays PWA installation prompt to users
 */

export default function PWAPrompt() {
  let deferredPrompt = null;
  let isInstalled = false;

  // Check if app is already installed
  if (window.matchMedia("(display-mode: standalone)").matches) {
    isInstalled = true;
  }

  // Listen for beforeinstallprompt event
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e;
    showPrompt();
  });

  // Listen for appinstalled event
  window.addEventListener("appinstalled", () => {
    isInstalled = true;
    const promptEl = document.getElementById("pwa-prompt");
    if (promptEl) {
      promptEl.remove();
    }
  });

  function showPrompt() {
    const promptEl = document.getElementById("pwa-prompt");
    if (!promptEl || isInstalled) return;

    // Remove hide class to show prompt
    promptEl.classList.remove("pwa-prompt-hidden");
  }

  function dismissPrompt() {
    const promptEl = document.getElementById("pwa-prompt");
    if (promptEl) {
      promptEl.classList.add("pwa-prompt-hidden");
      // Remember dismissal for 30 days
      sessionStorage.setItem("pwa-prompt-dismissed", Date.now().toString());
    }
  }

  // Attach handlers to window for inline onclick
  window.installPWA = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        isInstalled = true;
        dismissPrompt();
      }
      deferredPrompt = null;
    }
  };

  window.dismissPWAPrompt = dismissPrompt;

  return `
    <div id="pwa-prompt" class="pwa-prompt-container pwa-prompt-hidden">
      <div class="pwa-prompt-card">
        <button class="pwa-close-btn" onclick="window.dismissPWAPrompt()">
          <i class="fas fa-times"></i>
        </button>

        <div class="pwa-prompt-header">
          <div class="pwa-icon">💪</div>
          <h3>Installa Fitness Pro</h3>
        </div>

        <div class="pwa-prompt-content">
          <p>Installa l'app per un accesso più veloce e migliori funzionalità:</p>
          <ul class="pwa-benefits">
            <li>
              <span class="benefit-icon">📱</span>
              <span>Accedi direttamente dalla home</span>
            </li>
            <li>
              <span class="benefit-icon">🔌</span>
              <span>Usa offline con sincronizzazione automatica</span>
            </li>
            <li>
              <span class="benefit-icon">⚡</span>
              <span>Prestazioni superiori e caricamento più veloce</span>
            </li>
            <li>
              <span class="benefit-icon">🔔</span>
              <span>Ricevi notifiche e reminder di allenamento</span>
            </li>
          </ul>
        </div>

        <div class="pwa-prompt-actions">
          <button class="btn btn-secondary" onclick="window.dismissPWAPrompt()">
            Forse dopo
          </button>
          <button class="btn btn-primary" onclick="window.installPWA()">
            <i class="fas fa-download"></i> Installa ora
          </button>
        </div>

        <p class="pwa-hint">💡 Puoi sempre installare l'app in seguito dal menu del browser</p>
      </div>

      <style>
        .pwa-prompt-container {
          position: fixed;
          bottom: 80px;
          left: 12px;
          right: 12px;
          z-index: 200;
          animation: slideUp 0.3s ease-out;
        }

        .pwa-prompt-container.pwa-prompt-hidden {
          display: none;
        }

        .pwa-prompt-card {
          background: linear-gradient(135deg, rgba(139, 92, 246, 0.95) 0%, rgba(59, 130, 246, 0.95) 100%);
          border-radius: 12px;
          padding: 16px;
          color: white;
          box-shadow: 0 8px 24px rgba(139, 92, 246, 0.3);
          backdrop-filter: blur(10px);
          position: relative;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .pwa-close-btn {
          position: absolute;
          top: 12px;
          right: 12px;
          background: rgba(255, 255, 255, 0.2);
          border: none;
          color: white;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
          font-size: 16px;
        }

        .pwa-close-btn:hover {
          background: rgba(255, 255, 255, 0.3);
          transform: scale(1.1);
        }

        .pwa-prompt-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 12px;
        }

        .pwa-icon {
          font-size: 32px;
          line-height: 1;
        }

        .pwa-prompt-header h3 {
          margin: 0;
          font-size: 18px;
          font-weight: 600;
        }

        .pwa-prompt-content {
          margin-bottom: 12px;
        }

        .pwa-prompt-content p {
          margin: 0 0 10px 0;
          font-size: 14px;
          opacity: 0.95;
          line-height: 1.4;
        }

        .pwa-benefits {
          list-style: none;
          padding: 0;
          margin: 0;
          display: grid;
          gap: 6px;
        }

        .pwa-benefits li {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          opacity: 0.9;
        }

        .benefit-icon {
          display: inline-flex;
          font-size: 16px;
        }

        .pwa-prompt-actions {
          display: flex;
          gap: 8px;
          margin-bottom: 10px;
        }

        .pwa-prompt-actions .btn {
          flex: 1;
          padding: 10px 12px;
          font-size: 13px;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s ease;
          font-weight: 500;
        }

        .btn-primary {
          background: white;
          color: #8b5cf6;
        }

        .btn-primary:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .btn-primary i {
          margin-right: 6px;
        }

        .btn-secondary {
          background: rgba(255, 255, 255, 0.2);
          color: white;
        }

        .btn-secondary:hover {
          background: rgba(255, 255, 255, 0.3);
          transform: translateY(-1px);
        }

        .pwa-hint {
          margin: 0;
          font-size: 12px;
          opacity: 0.8;
          text-align: center;
        }

        @keyframes slideUp {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        @media (min-width: 480px) {
          .pwa-prompt-container {
            bottom: 100px;
            left: 16px;
            right: auto;
            max-width: 380px;
          }

          .pwa-prompt-card {
            padding: 20px;
          }

          .pwa-prompt-header h3 {
            font-size: 20px;
          }
        }

        @media (min-width: 768px) {
          .pwa-prompt-container {
            bottom: 32px;
            right: 32px;
            left: auto;
          }
        }
      </style>
    </div>
  `;
}
