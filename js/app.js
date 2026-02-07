import Navbar from "./components/Navbar.js?v=2";
import FloatCoach from "./components/FloatCoach.js?v=2";
import PWAPrompt from "./components/PWAPrompt.js";
import { modal } from "./components/Modal.js";
import Home from "./views/Home.js?v=2";
import Workouts from "./views/Workouts.js?v=2";
import Exercises from "./views/Exercises.js?v=2";
import ActiveWorkout from "./views/ActiveWorkout.js?v=2";
import Profile from "./views/Profile.js?v=2";
import Progress from "./views/Progress.js?v=2";
import Nutrition from "./views/Nutrition.js?v=2";
import Gamification from "./views/Gamification.js?v=2";
import VideoLibrary from "./views/VideoLibrary.js?v=2";
import AICoach from "./views/AICoach.js?v=2";
import Leaderboards from "./views/Leaderboards.js?v=2";
import Onboarding from "./views/Onboarding.js?v=2";
import AdminDashboard from "./views/AdminDashboard.js?v=2";
import RunTracker from "./views/RunTracker.js?v=2";
import { notificationManager } from "./utils/NotificationManager.js";
import { stateManager, actions } from "./utils/StateManager.js";
import { config } from "./utils/Config.js";
import { analytics } from "./services/Analytics.js";
import { authService } from "./services/AuthService.js";
import { backupService } from "./services/BackupService.js";
import { syncQueueService } from "./services/SyncQueueService.js";
import { indexedDBService } from "./services/IndexedDBService.js";
import { gamificationService } from "./services/GamificationService.js";
import { videoService } from "./services/VideoService.js";
import { pwaService } from "./services/PWAService.js";
import { coachingEngine } from "./services/CoachingEngine.js";
import { leaderboardService } from "./services/LeaderboardService.js";
import { errorHandler } from "./utils/ErrorHandler.js";
import { performanceMonitor } from "./utils/PerformanceMonitor.js";
import { testRunner } from "./utils/TestRunner.js";

// Initialize core services - globally accessible
async function initializeCoreServices() {
  try {
    // Initialize performance monitoring first
    if (!performanceMonitor.isInitialized) {
      performanceMonitor.init();
    }

    // Initialize error handling
    if (!errorHandler.isInitialized) {
      errorHandler.init();
    }

    // Initialize authentication service
    await authService.init();

    // Initialize backup service
    await backupService.init();

    // Initialize sync queue service for offline operations
    syncQueueService.init();

    // Initialize IndexedDB service for optimized storage
    await indexedDBService.init();

    // Initialize gamification service for achievements and challenges
    await gamificationService.init();

    // Initialize video service for workout videos
    await videoService.init();

    // Initialize PWA service for offline support and installation
    await pwaService.init();

    // Initialize coaching engine for AI coaching
    await coachingEngine.init();

    // Initialize leaderboard service for rankings
    await leaderboardService.init();

    // Initialize test runner in debug mode
    if (config.isDebugMode()) {
      testRunner.init();
    }

    // Initialize analytics integration (Firebase if available)
    if (config.isFeatureEnabled("analytics")) {
      analytics.flushQueue();
    }

    if (config.isDebugMode()) {
      console.log("🚀 Core services initialized");
    }
  } catch (error) {
    console.error("Core services initialization failed:", error);
    throw error;
  }
}

// Enhanced Router with state management and metadata
const routes = {
  "/": {
    component: Home,
    title: "Home",
    requiresAuth: true,
    analytics: "page_home",
  },
  "/workouts": {
    component: Workouts,
    title: "Allenamenti",
    requiresAuth: true,
    analytics: "page_workouts",
  },
  "/exercises": {
    component: Exercises,
    title: "Esercizi",
    requiresAuth: true,
    analytics: "page_exercises",
  },
  "/active": {
    component: ActiveWorkout,
    title: "Allenamento Attivo",
    requiresAuth: true,
    analytics: "page_active_workout",
    keepAlive: true,
  },
  "/profile": {
    component: Profile,
    title: "Profilo",
    requiresAuth: true,
    analytics: "page_profile",
  },
  "/progress": {
    component: Progress,
    title: "Progressi",
    requiresAuth: true,
    analytics: "page_progress",
  },
  "/nutrition": {
    component: Nutrition,
    title: "Nutrizione",
    requiresAuth: true,
    analytics: "page_nutrition",
  },
  "/gamification": {
    component: Gamification,
    title: "Progressione",
    requiresAuth: true,
    analytics: "page_gamification",
  },
  "/videos": {
    component: VideoLibrary,
    title: "Video Library",
    requiresAuth: true,
    analytics: "page_videos",
  },
  "/coach": {
    component: AICoach,
    title: "AI Coach",
    requiresAuth: true,
    analytics: "page_ai_coach",
  },
  "/leaderboards": {
    component: Leaderboards,
    title: "Leaderboards",
    requiresAuth: true,
    analytics: "page_leaderboards",
  },
  "/onboarding": {
    component: Onboarding,
    title: "Configurazione",
    requiresAuth: false,
    analytics: "page_onboarding",
  },
  "/run": {
    component: RunTracker,
    title: "Corsa",
    requiresAuth: true,
    analytics: "page_run_tracker",
    keepAlive: true,
  },
  "/admin": {
    component: AdminDashboard, // Use imported component directly
    title: "Admin Dashboard",
    requiresAuth: false,
    analytics: "page_admin",
    hideNavbar: true,
  },
};

const app = document.getElementById("app");
const mainContent = document.getElementById("main-content");
const navbarContainer = document.getElementById("navbar");

// Router state - now managed by StateManager
let currentPath = "";
let routeTransition = null;
let navigationHistory = [];

// Render Layout with enhanced state management
function renderLayout() {
  try {
    const path = getCurrentPath();
    const route = routes[path];

    // Update state
    actions.setRoute(path);

    // Hide navbar if in onboarding or specific routes
    const hideNavbar = path === "/onboarding" || route?.hideNavbar;

    if (hideNavbar) {
      navbarContainer.innerHTML = "";
      const coachContainer = document.getElementById("coach-container");
      if (coachContainer) coachContainer.innerHTML = "";
      stateManager.setState("ui.navbar.visible", false);
    } else {
      navbarContainer.innerHTML = Navbar();
      const coachContainer = document.getElementById("coach-container");
      if (coachContainer) coachContainer.innerHTML = FloatCoach();

      // Add PWA installation prompt
      const pwaContainer = document.getElementById("pwa-container");
      if (pwaContainer) pwaContainer.innerHTML = PWAPrompt();

      stateManager.setState("ui.navbar.visible", true);
    }

    // Update document title
    if (route?.title) {
      document.title = `${route.title} - ${config.get("app.name")}`;
    }

    // Update active nav link
    updateActiveNavLink(path);

    // Track page view
    if (route?.analytics && config.isFeatureEnabled("analytics")) {
      analytics.logEvent(route.analytics, {
        path,
        title: route.title,
        timestamp: Date.now(),
      });
      analytics.logPageView(route.title);
    }
  } catch (error) {
    console.error("Error rendering layout:", error);
    actions.setError({
      type: "LAYOUT_ERROR",
      message: error.message,
      timestamp: Date.now(),
    });
  }
}

// Get current path (supporting both hash and History API)
function getCurrentPath() {
  // Prefer History API if available and not using hash routing
  if (window.history && config.get("routing.useHistoryApi", true)) {
    const pathname = window.location.pathname;
    // Remove base path if configured
    const basePath = config.get("routing.basePath", "");
    if (basePath && pathname.startsWith(basePath)) {
      return pathname.slice(basePath.length) || "/";
    }
    return pathname || "/";
  }

  // Fallback to hash routing for backward compatibility
  if (window.location.hash) {
    return window.location.hash.slice(1) || "/";
  }

  return "/";
}

// Update active navigation link (supports both hash and History API)
function updateActiveNavLink(path) {
  const navLinks = document.querySelectorAll(".nav-link");
  const useHistoryApi = config.get("routing.useHistoryApi", true);

  navLinks.forEach((link) => {
    link.classList.remove("active-nav");
    const href = link.getAttribute("href");

    // Check both hash (#path) and History API (pathname) formats
    const hashMatch = href === `#${path}`;
    const pathnameMatch = useHistoryApi && href === path;

    if (hashMatch || pathnameMatch) {
      link.classList.add("active-nav");
    }
  });
}

// Enhanced Router Logic with state management and advanced features
async function router() {
  try {
    const path = getCurrentPath();
    const route = routes[path];

    // Prevent unnecessary re-renders
    if (currentPath === path) return;

    // Store navigation history
    if (currentPath) {
      if (config.isFeatureEnabled("analytics")) {
        analytics.logPageTiming("page_time");
      }
      navigationHistory.push({
        from: currentPath,
        to: path,
        timestamp: Date.now(),
      });

      // Limit history size
      if (navigationHistory.length > 50) {
        navigationHistory.shift();
      }
    }

    currentPath = path;

    // Show loading state
    actions.setLoading(true);
    showLoadingState();

    // Auth Check / Onboarding Redirect
    const hasProfile = localStorage.getItem("fitness_profile");
    const requiresAuth = route?.requiresAuth !== false;

    if (!hasProfile && requiresAuth) {
      navigateTo("/onboarding");
      return;
    }

    // Debug route resolution
    console.log("🔍 Debug Route Resolution:");
    console.log("Available routes:", Object.keys(routes));
    console.log("Current path:", JSON.stringify(path));
    console.log("Route object:", route);
    console.log("AdminDashboard component:", AdminDashboard);

    // Handle route not found
    if (!route) {
      console.error(`❌ Route not found: ${path}`);
      console.log("Available routes:", Object.keys(routes));
      notificationManager.warning(
        "Pagina non trovata",
        "La pagina richiesta non esiste. Verrai reindirizzato alla home.",
      );
      setTimeout(() => navigateTo("/"), 2000);
      return;
    }

    // Pre-route checks
    if (path === "/active") {
      const hasActiveWorkout = stateManager.getState("workout.isActive");
      if (!hasActiveWorkout) {
        // No active workout, redirect to workouts page
        notificationManager.info(
          "Nessun allenamento attivo",
          "Seleziona un allenamento per iniziare.",
        );
        navigateTo("/workouts");
        return;
      }
    }

    // Get view component
    const ViewComponent = route.component;
    console.log(
      "🎯 ViewComponent for",
      path,
      ":",
      ViewComponent?.name || ViewComponent,
    );

    // Add route transition animation
    if (config.get("userPreferences.animations", true)) {
      await animateRouteTransition(path);
    }

    // Render view with error boundary
    try {
      console.log("🎨 Rendering view for:", path);
      const content = await renderViewWithErrorBoundary(ViewComponent, path);
      console.log("✅ View rendered successfully for:", path);
      mainContent.innerHTML = content;

      renderLayout();

      // Initialize view-specific JavaScript
      await initializeViewEvents(path, route);

      // Mark route as successfully loaded
      stateManager.setState("app.isInitialized", true);
    } catch (viewError) {
      console.error(`Error rendering view ${path}:`, viewError);
      mainContent.innerHTML = getErrorView(viewError);

      // Track rendering errors
      if (config.isFeatureEnabled("analytics")) {
        analytics.logEvent("route_render_error", {
          path,
          error: viewError.message,
          stack: viewError.stack?.substring(0, 500),
        });
      }
    }
  } catch (error) {
    console.error("Router error:", error);
    mainContent.innerHTML = getErrorView(error);
    actions.setError({
      type: "ROUTER_ERROR",
      message: error.message,
      path: getCurrentPath(),
    });
  } finally {
    actions.setLoading(false);
    hideLoadingState();
  }
}

// Navigate to a path programmatically (with History API support)
function navigateTo(path) {
  // Use History API if available and configured
  if (window.history?.pushState && config.get("routing.useHistoryApi", true)) {
    const basePath = config.get("routing.basePath", "");
    const fullPath = basePath + path;
    window.history.pushState({ path }, "", fullPath);
    // Trigger router after state is pushed
    router();
  } else {
    // Fallback to hash routing
    window.location.hash = `#${path}`;
  }
}

// Show loading state
function showLoadingState() {
  mainContent.innerHTML = `
        <div class="loading-container">
            <div class="loading-spinner"></div>
            <p>Caricamento...</p>
        </div>
        <style>
            .loading-container {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                min-height: 200px;
                gap: 1rem;
            }
            .loading-spinner {
                width: 40px;
                height: 40px;
                border: 3px solid var(--bg-card);
                border-top: 3px solid var(--accent-primary);
                border-radius: 50%;
                animation: spin 1s linear infinite;
            }
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        </style>
    `;
}

// Hide loading state
function hideLoadingState() {
  // Loading state is replaced by actual content, so nothing to do here
}

// Error view component
function getErrorView(error) {
  return `
        <div class="error-container">
            <div class="error-icon">⚠️</div>
            <h2>Oops! Qualcosa è andato storto</h2>
            <p>Si è verificato un errore durante il caricamento della pagina.</p>
            <button class="btn btn-primary" onclick="window.location.reload()">
                Ricarica la pagina
            </button>
            <details style="margin-top: 1rem; font-size: 0.8rem; opacity: 0.7;">
                <summary>Dettagli tecnici</summary>
                <pre>${error.message}</pre>
            </details>
        </div>
        <style>
            .error-container {
                text-align: center;
                padding: 2rem;
                max-width: 400px;
                margin: 2rem auto;
            }
            .error-icon {
                font-size: 3rem;
                margin-bottom: 1rem;
            }
            .error-container h2 {
                color: var(--danger);
                margin-bottom: 1rem;
            }
            .error-container p {
                color: var(--text-secondary);
                margin-bottom: 2rem;
            }
        </style>
    `;
}

// Initialize view-specific events with enhanced functionality
async function initializeViewEvents(path, route) {
  try {
    // Set active tab in navbar
    const tabMap = {
      "/": "home",
      "/exercises": "exercises",
      "/progress": "progress",
      "/profile": "profile",
    };

    if (tabMap[path]) {
      stateManager.setState("ui.navbar.activeTab", tabMap[path]);
    }

    // Route-specific initialization
    switch (path) {
      case "/active":
        await initActiveWorkout();
        break;

      case "/progress":
        await initProgressCharts();
        break;

      case "/profile":
        await initProfileSettings();
        break;

      case "/nutrition":
        await initNutritionScanner();
        break;

      default:
        // Generic initialization
        initGenericView(path);
        break;
    }

    // Initialize common features
    initViewCommonFeatures(path, route);
  } catch (error) {
    console.warn(`Failed to initialize view events for ${path}:`, error);
  }
}

// Helper functions for view initialization
async function initActiveWorkout() {
  // Set up workout timer
  const updateTimer = () => {
    const startTime = stateManager.getState("workout.startTime");
    if (startTime && stateManager.getState("workout.isActive")) {
      const elapsed = Date.now() - startTime;
      stateManager.setState("workout.elapsedTime", elapsed, { persist: false });
    }
  };

  // Update timer every second
  const timerInterval = setInterval(updateTimer, 1000);

  // Store interval for cleanup
  stateManager.setState("workout.timerInterval", timerInterval, {
    persist: false,
  });

  // Initialize audio guide if enabled
  if (config.get("userPreferences.audioGuide", true)) {
    const { audioGuide } = await import("./utils/AudioGuide.js");
    audioGuide.speak("Allenamento avviato. Buon lavoro!");
  }
}

async function initProgressCharts() {
  // Initialize Chart.js charts
  if (window.Chart) {
    // Will be implemented when charts are added to Progress view
    console.log("Initializing progress charts...");
  }
}

async function initProfileSettings() {
  // Initialize profile-specific features
  const user = stateManager.getState("user.profile");
  if (user) {
    // Pre-populate forms or update UI based on user data
    console.log("Profile initialized for:", user.name);
  }
}

async function initNutritionScanner() {
  // Initialize barcode scanner functionality
  console.log("Nutrition scanner initialized");
}

function initGenericView(path) {
  // Common view initialization
  console.log(`Generic view initialization for: ${path}`);
}


function initViewCommonFeatures(path, route) {
  // Add route-specific keyboard shortcuts
  document.addEventListener("keydown", (e) => {
    try {
      if (e.altKey) {
        switch (e.key) {
          case "h":
            navigateTo("/");
            break;
          case "w":
            navigateTo("/workouts");
            break;
          case "p":
            navigateTo("/progress");
            break;
        }
      }
    } catch (error) {
      errorHandler.handleError({
        type: "init",
        message: "App initialization failed",
        error: error,
        fatal: true,
      });
    }
  });

  // Update page visibility tracking
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      stateManager.setState("app.isVisible", false, { persist: false });
    } else {
      stateManager.setState("app.isVisible", true, { persist: false });

      // Refresh data when page becomes visible
      if (path !== "/onboarding") {
        refreshPageData(path);
      }
    }
  });
}

// Enhanced Navigation and App Initialization
window.addEventListener("hashchange", router);

// Support popstate for History API (back/forward buttons)
window.addEventListener("popstate", (event) => {
  if (config.get("routing.useHistoryApi", true)) {
    router();
  }
});

window.addEventListener("load", async () => {
  // Initialize app with enhanced error handling
  try {
    actions.setLoading(true);

    // Initialize core systems
    await initializeCoreServices();

    // Flush analytics queue early (Firebase if available)
    if (config.isFeatureEnabled("analytics")) {
      analytics.flushQueue();
    }

    // Initialize state manager
    // Initialize app state
    await initializeAppState();

    // Apply saved theme preference
    applySavedTheme();

    // Initialize notification system
    notificationManager.init();

    // Initialize layout and routing
    await initializeRouter();

    // Set up global event listeners
    setupGlobalEventListeners();

    // Show welcome notification for returning users
    showWelcomeNotification();

    // Mark app as initialized
    stateManager.setState("app.isInitialized", true);
    actions.setLoading(false);

    if (config.isDebugMode()) {
      console.log("🚀 App initialized successfully");
    }
  } catch (error) {
    console.error("App initialization error:", error);
    actions.setError({
      type: "INIT_ERROR",
      message: error.message,
    });
    document.getElementById("main-content").innerHTML = getErrorView(error);
  }
});

// Initialize app state
async function initializeAppState() {
  try {
    // Check if user is authenticated
    const isAuthenticated = await authService.isAuthenticated();

    if (isAuthenticated) {
      const currentUser = await authService.getCurrentUser();
      if (currentUser) {
        actions.setUserProfile(authService.sanitizeUserData(currentUser));
      }
    }

    // Initialize backup system
    stateManager.setState(
      "backup.isEnabled",
      config.isFeatureEnabled("backup"),
    );
    stateManager.setState("backup.lastBackupTime", 0);
    stateManager.setState("backup.hasPendingSync", false);

    // Subscribe to state changes for debugging
    if (config.isDebugMode()) {
      stateManager.subscribe("*", (value, oldValue, path) => {
        console.log(`🗃️ State changed: ${path}`, { old: oldValue, new: value });
      });
    }

    // Subscribe to user profile changes for backup
    stateManager.subscribe("user.profile", (profile) => {
      if (profile && config.isFeatureEnabled("backup")) {
        backupService.scheduleBackup();
      }
    });

    // Subscribe to workout completion for backup
    stateManager.subscribe("workout.isActive", (isActive, wasActive) => {
      if (wasActive && !isActive) {
        // Workout just ended, schedule backup
        setTimeout(() => {
          if (config.isFeatureEnabled("backup")) {
            backupService.scheduleBackup();
          }
        }, 5000);
      }
    });
  } catch (error) {
    errorHandler.handleError({
      type: "state_init",
      message: "Failed to initialize app state",
      error: error,
    });
  }
}

function applySavedTheme() {
  const theme = config.get("userPreferences.theme", "dark");

  document.documentElement.setAttribute("data-theme", theme);
  document.body.classList.toggle("theme-light", theme === "light");
  document.body.classList.toggle("theme-dark", theme !== "light");

  stateManager.setState("ui.theme", theme, { persist: false });
}

// Initialize router
async function initializeRouter() {
  renderLayout();
  await router();
}

// Set up global event listeners
function setupGlobalEventListeners() {
  // Global error handler - delegate to ErrorHandler
  window.addEventListener("error", (e) => {
    errorHandler.handleError({
      type: "javascript",
      message: e.message,
      filename: e.filename,
      lineno: e.lineno,
      colno: e.colno,
      error: e.error,
      stack: e.error?.stack,
    });
  });

  // Unhandled promise rejection handler - delegate to ErrorHandler
  window.addEventListener("unhandledrejection", (e) => {
    errorHandler.handleError({
      type: "promise",
      message: "Unhandled Promise Rejection",
      reason: e.reason,
      stack: e.reason?.stack,
    });
  });

  // Online/offline status
  window.addEventListener("offline", () => {
    stateManager.setState("app.isOnline", false);
    notificationManager.offlineMode();
  });

  window.addEventListener("online", () => {
    stateManager.setState("app.isOnline", true);
    notificationManager.success(
      "Connessione Ripristinata",
      "Sei di nuovo online! Tutte le funzionalità sono disponibili.",
      { duration: 3000 },
    );
  });

  // Handle app state changes
  window.addEventListener("beforeunload", () => {
    // Save any pending data
    stateManager.persistState();

    // Clean up active workout timer
    const timerInterval = stateManager.getState("workout.timerInterval");
    if (timerInterval) {
      clearInterval(timerInterval);
    }
  });
}

// Show welcome notification
function showWelcomeNotification() {
  const profile = stateManager.getState("user.profile");
  if (profile?.name) {
    setTimeout(() => {
      const greetings = ["Bentornato", "Ciao", "Benvenuto", "Hey"];
      const randomGreeting =
        greetings[Math.floor(Math.random() * greetings.length)];

      notificationManager.info(
        `${randomGreeting}!`,
        `${profile.name}, pronto per un nuovo allenamento?`,
        {
          duration: 4000,
          actions: [
            {
              text: "Inizia Workout",
              onClick: () => navigateTo("/workouts"),
              type: "primary",
            },
          ],
        },
      );
    }, 1000);
  }
}

// Helper functions
async function animateRouteTransition(path) {
  return new Promise((resolve) => {
    const duration = config.get("ui.animation.duration.normal", 300);

    mainContent.style.opacity = "0.7";
    mainContent.style.transform = "translateY(10px)";

    setTimeout(() => {
      mainContent.style.opacity = "1";
      mainContent.style.transform = "translateY(0)";
      resolve();
    }, duration / 2);
  });
}

async function renderViewWithErrorBoundary(ViewComponent, path) {
  try {
    const content = ViewComponent();
    return content;
  } catch (error) {
    console.error(`View render error for ${path}:`, error);
    throw error;
  }
}

function refreshPageData(path) {
  // Refresh data when page becomes visible
  if (config.isFeatureEnabled("analytics")) {
    analytics.logEvent("page_refocus", { path });
  }
}

// Advanced navigation functions
function goBack() {
  if (navigationHistory.length > 0) {
    const lastNavigation = navigationHistory[navigationHistory.length - 1];
    navigateTo(lastNavigation.from);
  } else {
    navigateTo("/");
  }
}

function getNavigationHistory() {
  return [...navigationHistory];
}

function clearNavigationHistory() {
  navigationHistory.length = 0;
}

// Export enhanced API for global access
window.fitnessApp = {
  // Core router functions
  navigateTo,
  getCurrentPath,
  router,
  goBack,

  // State management
  getState: stateManager.getState.bind(stateManager),
  setState: stateManager.setState.bind(stateManager),
  subscribe: stateManager.subscribe.bind(stateManager),
  dispatch: stateManager.dispatch.bind(stateManager),
  actions,

  // Authentication
  auth: {
    login: authService.login.bind(authService),
    logout: authService.logout.bind(authService),
    createAccount: authService.createAccount.bind(authService),
    updateProfile: authService.updateUserProfile.bind(authService),
    deleteAccount: authService.deleteAccount.bind(authService),
    isAuthenticated: authService.isAuthenticated.bind(authService),
    getCurrentUser: authService.getCurrentUser.bind(authService),
    enableBiometric: authService.enableBiometricAuth.bind(authService),
  },

  // Backup and sync
  backup: {
    create: backupService.createBackup.bind(backupService),
    restore: backupService.restoreBackup.bind(backupService),
    export: backupService.exportData.bind(backupService),
    import: backupService.importData.bind(backupService),
    sync: backupService.syncToCloud.bind(backupService),
    getList: backupService.getBackupList.bind(backupService),
    getStats: backupService.getBackupStats.bind(backupService),
  },

  // Error handling
  error: {
    log: errorHandler.logError.bind(errorHandler),
    logWarning: errorHandler.logWarning.bind(errorHandler),
    logInfo: errorHandler.logInfo.bind(errorHandler),
    getStats: errorHandler.getErrorStats.bind(errorHandler),
    clear: errorHandler.clearErrors.bind(errorHandler),
  },

  // Performance monitoring
  performance: {
    getMetrics: performanceMonitor.getMetrics.bind(performanceMonitor),
    getSummary:
      performanceMonitor.getPerformanceSummary.bind(performanceMonitor),
    getRecommendations:
      performanceMonitor.getRecommendations.bind(performanceMonitor),
    mark: performanceMonitor.mark.bind(performanceMonitor),
    measure: performanceMonitor.measure.bind(performanceMonitor),
    measureFunction:
      performanceMonitor.measureFunction.bind(performanceMonitor),
  },

  // Utilities
  showNotification: (type, title, message, options) => {
    return notificationManager[type]
      ? notificationManager[type](title, message, options)
      : notificationManager.info(title, message, options);
  },

  // Advanced features
  getNavigationHistory,
  clearNavigationHistory,

  // Configuration
  config: config.exportConfig(),
  setApiKey: config.setApiKey.bind(config),
  setUserPreference: config.setUserPreference.bind(config),

  // Testing (only in debug mode)
  ...(config.isDebugMode() && {
    test: {
      run: testRunner.runAllTests.bind(testRunner),
      runCritical: testRunner.runCriticalTests.bind(testRunner),
      show: testRunner.showTestUI.bind(testRunner),
      hide: testRunner.hideTestUI.bind(testRunner),
      export: testRunner.exportResults.bind(testRunner),
      results: testRunner.getResults.bind(testRunner),
    },
  }),

  // Debug helpers (only in debug mode)
  ...(config.isDebugMode() && {
    _debug: {
      stateManager,
      notificationManager,
      authService,
      backupService,
      errorHandler,
      performanceMonitor,
      testRunner,
      config,
      routes,
      navigationHistory,
    },
  }),
};
