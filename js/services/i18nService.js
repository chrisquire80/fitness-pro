/**
 * i18nService.js
 * Internationalization (i18n) system for multi-language support
 * Supports: Italian (it), English (en), Spanish (es), French (fr), German (de)
 */

import { config } from "../utils/Config.js";
import { stateManager } from "../utils/StateManager.js";

class I18nService {
  constructor() {
    this.currentLanguage = this.getDefaultLanguage();
    this.supportedLanguages = ["it", "en", "es", "fr", "de"];
    this.translations = this.loadTranslations();
    this.init();
  }

  async init() {
    // Load saved language preference
    const savedLang = localStorage.getItem("app_language");
    if (savedLang && this.supportedLanguages.includes(savedLang)) {
      this.currentLanguage = savedLang;
    }

    // Sync with state manager
    stateManager.setState("app.language", this.currentLanguage);

    if (config.isDebugMode()) {
      console.log("🌍 i18nService initialized with language:", this.currentLanguage);
    }
  }

  /**
   * Get default language based on browser settings
   */
  getDefaultLanguage() {
    // Check localStorage first
    const saved = localStorage.getItem("app_language");
    if (saved) return saved;

    // Check browser language
    const browserLang = navigator.language.split("-")[0];
    if (this.supportedLanguages.includes(browserLang)) {
      return browserLang;
    }

    // Default to Italian
    return "it";
  }

  /**
   * Set current language
   */
  setLanguage(language) {
    if (!this.supportedLanguages.includes(language)) {
      console.warn(`Language ${language} not supported`);
      return false;
    }

    this.currentLanguage = language;
    localStorage.setItem("app_language", language);
    stateManager.setState("app.language", language);

    // Update document language attribute
    document.documentElement.lang = language;

    if (config.isDebugMode()) {
      console.log("🌍 Language changed to:", language);
    }

    return true;
  }

  /**
   * Get translation for a key
   */
  t(key, defaultValue = key) {
    const keys = key.split(".");
    let value = this.translations[this.currentLanguage];

    for (const k of keys) {
      value = value?.[k];
      if (!value) return defaultValue;
    }

    return value || defaultValue;
  }

  /**
   * Get all translations for current language
   */
  getTranslations() {
    return this.translations[this.currentLanguage] || {};
  }

  /**
   * Load all translations
   */
  loadTranslations() {
    return {
      it: {
        common: {
          home: "Home",
          workouts: "Allenamenti",
          exercises: "Esercizi",
          progress: "Progressi",
          profile: "Profilo",
          nutrition: "Nutrizione",
          settings: "Impostazioni",
          logout: "Esci",
          language: "Lingua",
        },
        workout: {
          start: "Inizia",
          duration: "Durata",
          difficulty: "Difficoltà",
          sets: "Set",
          reps: "Ripetizioni",
          rest: "Recupero",
          complete: "Completa",
          skip: "Salta",
        },
        progress: {
          weekly: "Questa Settimana",
          monthly: "Questo Mese",
          trend: "Trend",
          records: "Tuoi Migliori",
          achievements: "Risultati",
        },
        buttons: {
          save: "Salva",
          cancel: "Annulla",
          delete: "Elimina",
          edit: "Modifica",
          export: "Esporta",
          import: "Importa",
        },
      },
      en: {
        common: {
          home: "Home",
          workouts: "Workouts",
          exercises: "Exercises",
          progress: "Progress",
          profile: "Profile",
          nutrition: "Nutrition",
          settings: "Settings",
          logout: "Logout",
          language: "Language",
        },
        workout: {
          start: "Start",
          duration: "Duration",
          difficulty: "Difficulty",
          sets: "Sets",
          reps: "Reps",
          rest: "Rest",
          complete: "Complete",
          skip: "Skip",
        },
        progress: {
          weekly: "This Week",
          monthly: "This Month",
          trend: "Trend",
          records: "Your Records",
          achievements: "Achievements",
        },
        buttons: {
          save: "Save",
          cancel: "Cancel",
          delete: "Delete",
          edit: "Edit",
          export: "Export",
          import: "Import",
        },
      },
      es: {
        common: {
          home: "Inicio",
          workouts: "Entrenamientos",
          exercises: "Ejercicios",
          progress: "Progreso",
          profile: "Perfil",
          nutrition: "Nutrición",
          settings: "Configuración",
          logout: "Cerrar sesión",
          language: "Idioma",
        },
        workout: {
          start: "Comenzar",
          duration: "Duración",
          difficulty: "Dificultad",
          sets: "Series",
          reps: "Repeticiones",
          rest: "Descanso",
          complete: "Completar",
          skip: "Omitir",
        },
        progress: {
          weekly: "Esta Semana",
          monthly: "Este Mes",
          trend: "Tendencia",
          records: "Tus Récords",
          achievements: "Logros",
        },
        buttons: {
          save: "Guardar",
          cancel: "Cancelar",
          delete: "Eliminar",
          edit: "Editar",
          export: "Exportar",
          import: "Importar",
        },
      },
      fr: {
        common: {
          home: "Accueil",
          workouts: "Entraînements",
          exercises: "Exercices",
          progress: "Progrès",
          profile: "Profil",
          nutrition: "Nutrition",
          settings: "Paramètres",
          logout: "Déconnexion",
          language: "Langue",
        },
        workout: {
          start: "Commencer",
          duration: "Durée",
          difficulty: "Difficulté",
          sets: "Séries",
          reps: "Répétitions",
          rest: "Repos",
          complete: "Compléter",
          skip: "Sauter",
        },
        progress: {
          weekly: "Cette Semaine",
          monthly: "Ce Mois",
          trend: "Tendance",
          records: "Vos Records",
          achievements: "Réalisations",
        },
        buttons: {
          save: "Enregistrer",
          cancel: "Annuler",
          delete: "Supprimer",
          edit: "Modifier",
          export: "Exporter",
          import: "Importer",
        },
      },
      de: {
        common: {
          home: "Startseite",
          workouts: "Trainings",
          exercises: "Übungen",
          progress: "Fortschritt",
          profile: "Profil",
          nutrition: "Ernährung",
          settings: "Einstellungen",
          logout: "Abmelden",
          language: "Sprache",
        },
        workout: {
          start: "Starten",
          duration: "Dauer",
          difficulty: "Schwierigkeit",
          sets: "Sätze",
          reps: "Wiederholungen",
          rest: "Ruhe",
          complete: "Abschließen",
          skip: "Überspringen",
        },
        progress: {
          weekly: "Diese Woche",
          monthly: "Diesen Monat",
          trend: "Trend",
          records: "Ihre Rekorde",
          achievements: "Erfolge",
        },
        buttons: {
          save: "Speichern",
          cancel: "Abbrechen",
          delete: "Löschen",
          edit: "Bearbeiten",
          export: "Exportieren",
          import: "Importieren",
        },
      },
    };
  }

  /**
   * Format number with locale settings
   */
  formatNumber(number, decimals = 0) {
    return new Intl.NumberFormat(this.currentLanguage, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(number);
  }

  /**
   * Format date with locale settings
   */
  formatDate(date, format = "long") {
    const dateObj = typeof date === "string" ? new Date(date) : date;
    const options =
      format === "long"
        ? { weekday: "long", year: "numeric", month: "long", day: "numeric" }
        : { year: "numeric", month: "2-digit", day: "2-digit" };

    return new Intl.DateTimeFormat(this.currentLanguage, options).format(dateObj);
  }

  /**
   * Format time with locale settings
   */
  formatTime(date) {
    const dateObj = typeof date === "string" ? new Date(date) : date;
    return new Intl.DateTimeFormat(this.currentLanguage, {
      hour: "2-digit",
      minute: "2-digit",
    }).format(dateObj);
  }

  /**
   * Get all supported languages
   */
  getSupportedLanguages() {
    return [
      { code: "it", name: "Italiano", flag: "🇮🇹" },
      { code: "en", name: "English", flag: "🇬🇧" },
      { code: "es", name: "Español", flag: "🇪🇸" },
      { code: "fr", name: "Français", flag: "🇫🇷" },
      { code: "de", name: "Deutsch", flag: "🇩🇪" },
    ];
  }

  /**
   * Get current language name
   */
  getCurrentLanguageName() {
    const langs = this.getSupportedLanguages();
    return langs.find((l) => l.code === this.currentLanguage)?.name || "Italian";
  }
}

// Export singleton
export const i18nService = new I18nService();
