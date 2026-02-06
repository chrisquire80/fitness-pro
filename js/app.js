import Navbar from "./components/Navbar.js";
import FloatCoach from "./components/FloatCoach.js";
import Home from "./views/Home.js";
import Workouts from "./views/Workouts.js";
import Exercises from "./views/Exercises.js";
import ActiveWorkout from "./views/ActiveWorkout.js";
import Profile from "./views/Profile.js";
import Progress from "./views/Progress.js";
import Nutrition from "./views/Nutrition.js";
import Onboarding from "./views/Onboarding.js";
import { notificationManager } from "./utils/NotificationManager.js";
import { stateManager, actions } from "./utils/StateManager.js";
import { config } from "./utils/Config.js";
import { analytics } from "./services/Analytics.js";

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
  "/onboarding": {
    component: Onboarding,
    title: "Configurazione",
    requiresAuth: false,
    analytics: "page_onboarding",
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

// Get current path (supporting both hash and history API)
function getCurrentPath() {
  // Check if using hash routing
  if (window.location.hash) {
    return window.location.hash.slice(1) || "/";
  }
  // Fallback to pathname for future History API support
  return window.location.pathname || "/";
}

// Update active navigation link
function updateActiveNavLink(path) {
  const navLinks = document.querySelectorAll(".nav-link");
  navLinks.forEach((link) => {
    link.classList.remove("active-nav");
    const href = link.getAttribute("href");
    if (href === `#${path}`) {
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

    // Handle route not found
    if (!route) {
      console.warn(`Route not found: ${path}`);
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

    // Add route transition animation
    if (config.get("userPreferences.animations", true)) {
      await animateRouteTransition(path);
    }

    // Render view with error boundary
    try {
      const content = await renderViewWithErrorBoundary(ViewComponent, path);
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

// Navigate to a path programmatically
function navigateTo(path) {
  window.location.hash = `#${path}`;
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
window.addEventListener("load", async () => {
  // Initialize app with enhanced error handling
  try {
    actions.setLoading(true);

    // Initialize state manager
    await initializeAppState();

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
  // Load user profile into state
  const hasProfile = localStorage.getItem("fitness_profile");
  if (hasProfile) {
    try {
      const profile = JSON.parse(hasProfile);
      actions.setUserProfile(profile);
    } catch (error) {
      console.warn("Failed to load user profile:", error);
    }
  }

  // Subscribe to state changes for debugging
  if (config.isDebugMode()) {
    stateManager.subscribe("*", (value, oldValue, path) => {
      console.log(`🗃️ State changed: ${path}`, { old: oldValue, new: value });
    });
  }
}

// Initialize router
async function initializeRouter() {
  renderLayout();
  await router();
}

// Set up global event listeners
function setupGlobalEventListeners() {
  // Global error handler
  window.addEventListener("error", (e) => {
    console.error("Global error:", e.error);

    if (config.isFeatureEnabled("analytics")) {
      analytics.logEvent("global_error", {
        message: e.error?.message,
        filename: e.filename,
        lineno: e.lineno,
      });
    }

    notificationManager.error(
      "Errore dell'App",
      "Si è verificato un errore imprevisto.",
      {
        actions: [
          {
            text: "Ricarica",
            onClick: () => window.location.reload(),
            type: "primary",
          },
          {
            text: "Ignora",
            onClick: () => {},
            type: "secondary",
          },
        ],
      },
    );
  });

  // Unhandled promise rejection handler
  window.addEventListener("unhandledrejection", (e) => {
    console.error("Unhandled promise rejection:", e.reason);

    if (config.isFeatureEnabled("analytics")) {
      analytics.logEvent("unhandled_promise_rejection", {
        reason: e.reason?.toString(),
      });
    }

    notificationManager.warning(
      "Attenzione",
      "Alcune funzionalità potrebbero non funzionare correttamente.",
    );
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

  // Debug helpers (only in debug mode)
  ...(config.isDebugMode() && {
    _debug: {
      stateManager,
      notificationManager,
      config,
      routes,
      navigationHistory,
    },
  }),
};
