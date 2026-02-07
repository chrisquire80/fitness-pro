import { backupService } from "../services/BackupService.js";
import { modal } from "../components/Modal.js";

export default function Profile() {
  // Helper to save data
  window.saveProfile = (e) => {
    e.preventDefault();
    const data = {
      name: document.getElementById("p-name").value,
      age: document.getElementById("p-age").value,
      weight: document.getElementById("p-weight").value,
      goal: document.getElementById("p-goal").value,
    };
    localStorage.setItem("fitness_profile", JSON.stringify(data));
    modal.success("Salvato!", "Profilo salvato con successo.");
  };

  window.deleteAccount = async () => {
    const result = await modal.confirm(
      "Elimina Account",
      "Sei sicuro? Questa azione è irreversibile. Tutti i tuoi progressi verranno persi.",
      {
        buttons: [
          { text: "Annulla", type: "secondary", action: "cancel" },
          {
            text: "Elimina",
            type: "danger",
            action: "confirm",
            icon: "fa-trash",
          },
        ],
      },
    );

    if (result.action === "confirm") {
      localStorage.clear();
      modal.alert("Account Eliminato", "Arrivederci!");
      setTimeout(() => window.location.reload(), 1500);
    }
  };

  // Load existing data
  const saved = JSON.parse(localStorage.getItem("fitness_profile")) || {};

  // Load preferences
  const preferencesKey = "fitness_preferences";
  const getPreferences = () => {
    try {
      return JSON.parse(localStorage.getItem(preferencesKey)) || {};
    } catch {
      return {};
    }
  };
  const savedPreferences = getPreferences();
  const currentTheme = savedPreferences.theme || "dark";

  window.setThemePreference = (theme) => {
    const prefs = getPreferences();
    prefs.theme = theme;
    localStorage.setItem(preferencesKey, JSON.stringify(prefs));

    document.documentElement.setAttribute("data-theme", theme);
    document.body.classList.toggle("theme-light", theme === "light");
    document.body.classList.toggle("theme-dark", theme !== "light");
  };

  // Passphrase Management
  const getPassphraseStatus = () => {
    return (
      window.backupService?.getPassphraseStatus?.() || {
        rememberEnabled: false,
        hasCached: false,
        hasSessionStored: false,
      }
    );
  };

  const passphraseStatus = getPassphraseStatus();

  window.openPassphraseModal = async () => {
    const result = await modal.passphrase("Configura Passphrase", {
      content:
        "La passphrase protegge i tuoi backup cifrati. Scegli una password sicura e memorizzala.",
      inputs: [
        {
          name: "passphrase",
          type: "password",
          placeholder: "Inserisci la passphrase...",
          required: true,
          label: "Passphrase",
          autocomplete: "new-password",
          minlength: 6,
          hint: "Minimo 6 caratteri. Non viene salvata permanentemente.",
        },
      ],
    });

    if (result.action === "submit" && result.values.passphrase) {
      try {
        window.backupService?.setPassphrase?.(result.values.passphrase);
        updatePassphraseStatus();
        modal.success(
          "Passphrase Impostata",
          "La passphrase è ora attiva per i backup cifrati.",
        );
      } catch (error) {
        modal.error(
          "Errore",
          error.message || "Impossibile salvare la passphrase.",
        );
      }
    }
  };

  window.clearPassphrase = async () => {
    const result = await modal.confirm(
      "Rimuovi Passphrase",
      "Vuoi rimuovere la passphrase dalla sessione? I backup cifrati richiederanno nuovamente la passphrase.",
    );

    if (result.action === "confirm") {
      window.backupService?.clearPassphrase?.();
      updatePassphraseStatus();
      modal.success("Rimosso", "Passphrase rimossa dalla sessione.");
    }
  };

  window.toggleRememberPassphrase = (enabled) => {
    window.backupService?.setRememberPassphrase?.(enabled);
    updatePassphraseStatus();
  };

  function updatePassphraseStatus() {
    const status = getPassphraseStatus();
    const statusEl = document.getElementById("passphrase-status");
    const indicatorEl = document.getElementById("passphrase-indicator");

    if (statusEl) {
      statusEl.textContent =
        status.hasCached || status.hasSessionStored
          ? "Attiva"
          : "Non impostata";
    }
    if (indicatorEl) {
      indicatorEl.className = `status-indicator ${status.hasCached || status.hasSessionStored ? "active" : "inactive"}`;
    }
  }

  // Backup Management
  window.createBackup = async () => {
    const loadingModal = await modal.loading(
      "Creazione Backup...",
      "Attendere prego",
    );

    try {
      const result = await backupService.createBackup({
        includePersonalData: true,
        includeWorkoutHistory: true,
        includeSettings: true,
        compress: true,
        encrypt: true,
      });

      modal.close(loadingModal.id);

      if (result.success) {
        modal.success(
          "Backup Creato!",
          `Backup salvato con successo.<br>ID: ${result.backupId.slice(0, 15)}...<br>Dimensione: ${(result.size / 1024).toFixed(1)} KB`,
        );
        refreshBackupList();
      }
    } catch (error) {
      modal.closeAll();
      modal.error(
        "Errore Backup",
        error.message || "Impossibile creare il backup.",
      );
    }
  };

  window.viewBackupList = async () => {
    const backups = await backupService.getLocalBackups();

    if (backups.length === 0) {
      modal.alert("Nessun Backup", "Non hai ancora creato nessun backup.");
      return;
    }

    const listHtml = backups
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .map(
        (backup) => `
        <div class="backup-item" data-id="${backup.id}">
          <div class="backup-info">
            <span class="backup-date">${new Date(
              backup.timestamp,
            ).toLocaleDateString("it-IT", {
              day: "2-digit",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}</span>
            <span class="backup-size">${(backup.size / 1024).toFixed(1)} KB</span>
          </div>
          <div class="backup-actions">
            <button class="btn-icon" onclick="window.restoreBackup('${backup.id}')" title="Ripristina">
              <i class="fas fa-undo"></i>
            </button>
            <button class="btn-icon btn-danger" onclick="window.deleteBackup('${backup.id}')" title="Elimina">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
      `,
      )
      .join("");

    await modal.show({
      title: "I tuoi Backup",
      icon: "fa-database",
      content: `
        <div class="backup-list">
          ${listHtml}
        </div>
        <style>
          .backup-list { max-height: 300px; overflow-y: auto; }
          .backup-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px;
            background: rgba(0,0,0,0.2);
            border-radius: 8px;
            margin-bottom: 8px;
          }
          .backup-info { display: flex; flex-direction: column; gap: 4px; }
          .backup-date { font-weight: 500; }
          .backup-size { font-size: 0.8rem; color: var(--text-secondary); }
          .backup-actions { display: flex; gap: 8px; }
          .btn-icon {
            width: 36px; height: 36px;
            border-radius: 50%;
            border: none;
            background: rgba(255,255,255,0.1);
            color: var(--text-primary);
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s;
          }
          .btn-icon:hover { background: var(--accent-primary); }
          .btn-icon.btn-danger:hover { background: #ef4444; }
        </style>
      `,
      size: "medium",
      buttons: [{ text: "Chiudi", type: "secondary", action: "close" }],
    });
  };

  window.restoreBackup = async (backupId) => {
    modal.closeAll();

    const result = await modal.confirm(
      "Ripristina Backup",
      "Vuoi ripristinare questo backup? I dati attuali verranno sostituiti.",
      {
        buttons: [
          { text: "Annulla", type: "secondary", action: "cancel" },
          {
            text: "Ripristina",
            type: "primary",
            action: "confirm",
            icon: "fa-undo",
          },
        ],
      },
    );

    if (result.action === "confirm") {
      try {
        await backupService.restoreBackup(backupId, {
          mergeWithExisting: false,
          confirmOverwrite: false,
        });
      } catch (error) {
        modal.error("Errore Ripristino", error.message);
      }
    }
  };

  window.deleteBackup = async (backupId) => {
    const result = await modal.confirm(
      "Elimina Backup",
      "Sei sicuro di voler eliminare questo backup?",
      {
        buttons: [
          { text: "Annulla", type: "secondary", action: "cancel" },
          {
            text: "Elimina",
            type: "danger",
            action: "confirm",
            icon: "fa-trash",
          },
        ],
      },
    );

    if (result.action === "confirm") {
      try {
        await backupService.deleteBackup(backupId, "local");
        modal.success("Eliminato", "Backup eliminato con successo.");
        setTimeout(() => window.viewBackupList(), 500);
      } catch (error) {
        modal.error("Errore", error.message);
      }
    }
  };

  window.exportBackup = async () => {
    const result = await modal.show({
      title: "Esporta Dati",
      icon: "fa-download",
      content: `
        <p>Scegli il formato di esportazione:</p>
        <div class="export-options">
          <label class="export-option">
            <input type="radio" name="export-format" value="json" checked>
            <span class="option-content">
              <i class="fas fa-file-code"></i>
              <span class="option-label">JSON</span>
              <span class="option-desc">Formato completo, ideale per backup</span>
            </span>
          </label>
          <label class="export-option">
            <input type="radio" name="export-format" value="csv">
            <span class="option-content">
              <i class="fas fa-file-csv"></i>
              <span class="option-label">CSV</span>
              <span class="option-desc">Per Excel e fogli di calcolo</span>
            </span>
          </label>
        </div>
        <style>
          .export-options { display: flex; flex-direction: column; gap: 8px; margin-top: 16px; }
          .export-option { cursor: pointer; }
          .export-option input { display: none; }
          .option-content {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 12px;
            background: rgba(0,0,0,0.2);
            border-radius: 8px;
            border: 2px solid transparent;
            transition: all 0.2s;
          }
          .export-option input:checked + .option-content {
            border-color: var(--accent-primary);
            background: rgba(139, 92, 246, 0.1);
          }
          .option-content i { font-size: 1.5rem; color: var(--accent-primary); width: 40px; text-align: center; }
          .option-label { font-weight: 600; }
          .option-desc { font-size: 0.8rem; color: var(--text-secondary); margin-left: auto; }
        </style>
      `,
      buttons: [
        { text: "Annulla", type: "secondary", action: "cancel" },
        {
          text: "Esporta",
          type: "primary",
          action: "export",
          icon: "fa-download",
        },
      ],
    });

    if (result.action === "export") {
      const format =
        document.querySelector('input[name="export-format"]:checked')?.value ||
        "json";

      try {
        const exportResult = await backupService.exportData(format, {
          includePersonalData: true,
          includeWorkoutHistory: true,
        });

        modal.success(
          "Esportazione Completata",
          `File ${exportResult.filename} scaricato.`,
        );
      } catch (error) {
        modal.error("Errore Esportazione", error.message);
      }
    }
  };

  window.importBackup = async () => {
    // Create hidden file input
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json,.csv,.xml";

    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const result = await modal.confirm(
        "Importa Dati",
        `Vuoi importare il file "${file.name}"?<br><br>I dati esistenti verranno uniti con quelli importati.`,
        {
          buttons: [
            { text: "Annulla", type: "secondary", action: "cancel" },
            {
              text: "Importa",
              type: "primary",
              action: "confirm",
              icon: "fa-upload",
            },
          ],
        },
      );

      if (result.action === "confirm") {
        const loadingModal = await modal.loading(
          "Importazione...",
          "Analisi del file in corso",
        );

        try {
          const importResult = await backupService.importData(file, {
            mergeWithExisting: true,
            validateData: true,
          });

          modal.closeAll();
          modal.success(
            "Importazione Completata",
            `File "${importResult.filename}" importato con successo.<br>Dimensione: ${(importResult.size / 1024).toFixed(1)} KB`,
          );
        } catch (error) {
          modal.closeAll();
          modal.error("Errore Importazione", error.message);
        }
      }
    };

    input.click();
  };

  function refreshBackupList() {
    const countEl = document.getElementById("backup-count");
    if (countEl) {
      backupService.getLocalBackups().then((backups) => {
        countEl.textContent = backups.length;
      });
    }
  }

  // Initialize backup count on load
  setTimeout(refreshBackupList, 100);

  return `
        <h2>Il tuo Profilo</h2>
        <div class="card profile-card">
            <form onsubmit="window.saveProfile(event)">
                <div class="form-group">
                    <label>Nome</label>
                    <input type="text" id="p-name" value="${saved.name || ""}" placeholder="Il tuo nome">
                </div>
                <div class="form-group">
                    <label>Età</label>
                    <input type="number" id="p-age" value="${saved.age || ""}" placeholder="Anni">
                </div>
                <div class="form-group">
                    <label>Peso (kg)</label>
                    <input type="number" id="p-weight" value="${saved.weight || ""}" placeholder="Kg">
                </div>
                <div class="form-group">
                    <label>Obiettivo</label>
                    <select id="p-goal">
                        <option value="lose" ${saved.goal === "lose" ? "selected" : ""}>Perdita Peso</option>
                        <option value="muscle" ${saved.goal === "muscle" ? "selected" : ""}>Aumento Massa</option>
                        <option value="endurance" ${saved.goal === "endurance" ? "selected" : ""}>Resistenza</option>
                    </select>
                </div>
                <button type="submit" class="btn btn-primary">Salva Modifiche</button>
            </form>

            <div class="preferences-section">
                <h3>🎨 Preferenze</h3>
                <div class="theme-toggle">
                    <label class="theme-option">
                        <input type="radio" name="theme" value="dark" ${currentTheme === "dark" ? "checked" : ""} onclick="window.setThemePreference('dark')">
                        <span>🌙 Dark</span>
                    </label>
                    <label class="theme-option">
                        <input type="radio" name="theme" value="light" ${currentTheme === "light" ? "checked" : ""} onclick="window.setThemePreference('light')">
                        <span>☀️ Light</span>
                    </label>
                </div>
            </div>

            <div class="backup-section">
                <h3>💾 Backup & Sicurezza</h3>

                <div class="backup-passphrase-card">
                    <div class="passphrase-header">
                        <div class="passphrase-info">
                            <i class="fas fa-lock"></i>
                            <div>
                                <span class="passphrase-title">Passphrase di Cifratura</span>
                                <span class="passphrase-desc">Protegge i tuoi backup</span>
                            </div>
                        </div>
                        <div class="passphrase-status-wrap">
                            <span id="passphrase-indicator" class="status-indicator ${passphraseStatus.hasCached || passphraseStatus.hasSessionStored ? "active" : "inactive"}"></span>
                            <span id="passphrase-status">${passphraseStatus.hasCached || passphraseStatus.hasSessionStored ? "Attiva" : "Non impostata"}</span>
                        </div>
                    </div>
                    <div class="passphrase-actions">
                        <button type="button" class="btn btn-sm btn-secondary" onclick="window.openPassphraseModal()">
                            <i class="fas fa-key"></i> ${passphraseStatus.hasCached ? "Cambia" : "Imposta"}
                        </button>
                        ${
                          passphraseStatus.hasCached ||
                          passphraseStatus.hasSessionStored
                            ? `<button type="button" class="btn btn-sm btn-outline" onclick="window.clearPassphrase()">
                            <i class="fas fa-times"></i> Rimuovi
                        </button>`
                            : ""
                        }
                    </div>
                    <div class="remember-toggle">
                        <label class="checkbox-option">
                            <input type="checkbox" id="remember-passphrase" ${passphraseStatus.rememberEnabled ? "checked" : ""} onchange="window.toggleRememberPassphrase(this.checked)">
                            <span>Ricorda per questa sessione</span>
                        </label>
                    </div>
                </div>

                <div class="backup-actions-grid">
                    <button type="button" class="backup-action-card" onclick="window.createBackup()">
                        <i class="fas fa-plus-circle"></i>
                        <span class="action-title">Crea Backup</span>
                        <span class="action-desc">Salva i tuoi dati</span>
                    </button>
                    <button type="button" class="backup-action-card" onclick="window.viewBackupList()">
                        <i class="fas fa-list"></i>
                        <span class="action-title">I miei Backup</span>
                        <span class="action-desc"><span id="backup-count">0</span> salvati</span>
                    </button>
                    <button type="button" class="backup-action-card" onclick="window.exportBackup()">
                        <i class="fas fa-download"></i>
                        <span class="action-title">Esporta</span>
                        <span class="action-desc">JSON, CSV</span>
                    </button>
                    <button type="button" class="backup-action-card" onclick="window.importBackup()">
                        <i class="fas fa-upload"></i>
                        <span class="action-title">Importa</span>
                        <span class="action-desc">Ripristina dati</span>
                    </button>
                </div>
            </div>

            <div class="profile-links">
                <h3>🌐 Community & Supporto</h3>
                <div class="links-grid">
                    <a href="https://discord.gg/fitness-pro" target="_blank" class="card link-card">
                        <i class="fab fa-discord"></i>
                        <span>Discord Community</span>
                    </a>
                    <a href="https://t.me/fitnesspro" target="_blank" class="card link-card">
                        <i class="fab fa-telegram"></i>
                        <span>Canale Telegram</span>
                    </a>
                    <a href="#" onclick="window.reportBug && window.reportBug(); return false;" class="card link-card">
                        <i class="fas fa-bug"></i>
                        <span>Segnala un Bug</span>
                    </a>
                </div>
            </div>

            <div class="danger-zone">
                <hr>
                <h3>⚠️ Zona Pericolo</h3>
                <p>Vuoi cancellare tutti i tuoi dati?</p>
                <button class="btn btn-danger" onclick="window.deleteAccount()">
                    <i class="fas fa-trash"></i> Elimina Account (GDPR)
                </button>
            </div>
        </div>

        <style>
            .profile-card {
                max-width: 600px;
                margin: 0 auto;
            }
            .form-group {
                margin-bottom: var(--spacing-md);
            }
            label {
                display: block;
                margin-bottom: var(--spacing-xs);
                color: var(--text-secondary);
            }
            input, select {
                width: 100%;
                padding: 0.75rem;
                background-color: var(--bg-primary);
                border: 1px solid rgba(255,255,255,0.1);
                border-radius: var(--radius-sm);
                color: var(--text-primary);
                font-family: inherit;
            }
            input:focus, select:focus {
                outline: none;
                border-color: var(--accent-primary);
            }

            .preferences-section, .backup-section, .profile-links {
                margin-top: var(--spacing-xl);
                padding-top: var(--spacing-lg);
                border-top: 1px solid rgba(255,255,255,0.05);
            }

            .preferences-section h3, .backup-section h3, .profile-links h3 {
                font-size: 1rem;
                margin-bottom: var(--spacing-md);
            }

            .theme-toggle {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: var(--spacing-sm);
            }
            .theme-option {
                display: flex;
                align-items: center;
                gap: var(--spacing-sm);
                padding: 0.75rem 1rem;
                border-radius: var(--radius-sm);
                background: var(--bg-primary);
                border: 1px solid rgba(255,255,255,0.1);
                cursor: pointer;
                transition: all 0.2s;
            }
            .theme-option:has(input:checked) {
                border-color: var(--accent-primary);
                background: rgba(139, 92, 246, 0.1);
            }
            .theme-option input {
                width: auto;
                accent-color: var(--accent-primary);
            }
            .theme-option span {
                color: var(--text-primary);
                font-size: 0.9rem;
            }

            /* Backup Section */
            .backup-passphrase-card {
                background: var(--bg-primary);
                border-radius: var(--radius-md);
                padding: var(--spacing-md);
                margin-bottom: var(--spacing-md);
            }

            .passphrase-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: var(--spacing-md);
            }

            .passphrase-info {
                display: flex;
                align-items: center;
                gap: var(--spacing-sm);
            }

            .passphrase-info i {
                font-size: 1.5rem;
                color: var(--accent-primary);
            }

            .passphrase-title {
                display: block;
                font-weight: 600;
                font-size: 0.95rem;
            }

            .passphrase-desc {
                display: block;
                font-size: 0.8rem;
                color: var(--text-secondary);
            }

            .passphrase-status-wrap {
                display: flex;
                align-items: center;
                gap: var(--spacing-xs);
                font-size: 0.85rem;
                color: var(--text-secondary);
            }

            .status-indicator {
                width: 8px;
                height: 8px;
                border-radius: 50%;
            }

            .status-indicator.active {
                background: #10b981;
                box-shadow: 0 0 6px #10b981;
            }

            .status-indicator.inactive {
                background: var(--text-secondary);
            }

            .passphrase-actions {
                display: flex;
                gap: var(--spacing-sm);
                margin-bottom: var(--spacing-sm);
            }

            .remember-toggle {
                margin-top: var(--spacing-sm);
            }

            .checkbox-option {
                display: flex;
                align-items: center;
                gap: var(--spacing-sm);
                font-size: 0.85rem;
                color: var(--text-secondary);
                cursor: pointer;
            }

            .checkbox-option input {
                width: auto;
                accent-color: var(--accent-primary);
            }

            .backup-actions-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: var(--spacing-sm);
            }

            .backup-action-card {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                padding: var(--spacing-md);
                background: var(--bg-primary);
                border: 1px solid rgba(255,255,255,0.1);
                border-radius: var(--radius-md);
                cursor: pointer;
                transition: all 0.2s;
                text-align: center;
            }

            .backup-action-card:hover {
                border-color: var(--accent-primary);
                background: rgba(139, 92, 246, 0.05);
                transform: translateY(-2px);
            }

            .backup-action-card i {
                font-size: 1.5rem;
                color: var(--accent-primary);
                margin-bottom: var(--spacing-xs);
            }

            .backup-action-card .action-title {
                font-weight: 600;
                font-size: 0.9rem;
                color: var(--text-primary);
            }

            .backup-action-card .action-desc {
                font-size: 0.75rem;
                color: var(--text-secondary);
            }

            .btn-sm {
                padding: 0.5rem 1rem;
                font-size: 0.85rem;
            }

            .btn-outline {
                background: transparent;
                border: 1px solid rgba(255,255,255,0.2);
                color: var(--text-primary);
            }

            .btn-secondary {
                background: rgba(255,255,255,0.1);
                border: 1px solid rgba(255,255,255,0.1);
                color: var(--text-primary);
            }

            .btn i {
                margin-right: 6px;
            }

            /* Links */
            .links-grid {
                display: grid;
                grid-template-columns: 1fr;
                gap: var(--spacing-sm);
            }
            .link-card {
                display: flex;
                align-items: center;
                gap: var(--spacing-md);
                text-decoration: none;
                color: var(--text-primary);
                padding: var(--spacing-sm) var(--spacing-md);
                transition: all 0.2s;
            }
            .link-card i { font-size: 1.2rem; color: var(--accent-secondary); }
            .link-card:hover { border-color: var(--accent-primary); }

            /* Danger Zone */
            .danger-zone {
                margin-top: var(--spacing-xl);
                padding-top: var(--spacing-lg);
                text-align: center;
            }
            .danger-zone h3 { color: #ef4444; font-size: 1rem; margin-bottom: 0.5rem; }
            .danger-zone p { font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 1rem; }
            .btn-danger {
                background: rgba(239, 68, 68, 0.1);
                color: #ef4444;
                border: 1px solid #ef4444;
                width: 100%;
            }
            .btn-danger:hover {
                background: rgba(239, 68, 68, 0.2);
            }
        </style>
    `;
}
