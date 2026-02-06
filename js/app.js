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

// Enhanced Router with better error handling
const routes = {
    "/": Home,
    "/workouts": Workouts,
    "/exercises": Exercises,
    "/active": ActiveWorkout,
    "/profile": Profile,
    "/progress": Progress,
    "/nutrition": Nutrition,
    "/onboarding": Onboarding,
};

const app = document.getElementById("app");
const mainContent = document.getElementById("main-content");
const navbarContainer = document.getElementById("navbar");

// Router state
let currentPath = "";

// Render Layout with error handling
function renderLayout() {
    try {
        const path = getCurrentPath();
        // Hide navbar if in onboarding
        if (path === "/onboarding") {
            navbarContainer.innerHTML = "";
            const coachContainer = document.getElementById("coach-container");
            if (coachContainer) coachContainer.innerHTML = "";
        } else {
            navbarContainer.innerHTML = Navbar();
            const coachContainer = document.getElementById("coach-container");
            if (coachContainer) coachContainer.innerHTML = FloatCoach();
        }

        // Update active nav link
        updateActiveNavLink(path);
    } catch (error) {
        console.error("Error rendering layout:", error);
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

// Enhanced Router Logic with error handling and loading states
function router() {
    try {
        const path = getCurrentPath();

        // Prevent unnecessary re-renders
        if (currentPath === path) return;
        currentPath = path;

        // Show loading state
        showLoadingState();

        // Auth Check / Onboarding Redirect
        const hasProfile = localStorage.getItem("fitness_profile");
        if (!hasProfile && path !== "/onboarding") {
            navigateTo("/onboarding");
            return;
        }

        // Get view component
        const ViewComponent = routes[path];
        if (!ViewComponent) {
            // Handle 404 - redirect to home
            console.warn(`Route not found: ${path}`);
            navigateTo("/");
            return;
        }

        // Render view with error boundary
        try {
            const content = ViewComponent();
            mainContent.innerHTML = content;
            renderLayout();

            // Initialize view-specific JavaScript if needed
            initializeViewEvents(path);
        } catch (viewError) {
            console.error(`Error rendering view ${path}:`, viewError);
            mainContent.innerHTML = getErrorView(viewError);
        }
    } catch (error) {
        console.error("Router error:", error);
        mainContent.innerHTML = getErrorView(error);
    } finally {
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

// Initialize view-specific events
function initializeViewEvents(path) {
    // This can be extended to initialize specific JavaScript for each view
    switch (path) {
        case "/active":
            // Initialize workout timer, exercise tracking, etc.
            break;
        case "/progress":
            // Initialize charts, statistics, etc.
            break;
        default:
            break;
    }
}

// Enhanced Navigation Handling
window.addEventListener("hashchange", router);
window.addEventListener("load", () => {
    // Initialize app
    try {
        renderLayout();
        router();

        // Add global error handler
        window.addEventListener("error", (e) => {
            console.error("Global error:", e.error);
        });

        // Add unhandled promise rejection handler
        window.addEventListener("unhandledrejection", (e) => {
            console.error("Unhandled promise rejection:", e.reason);
        });
    } catch (error) {
        console.error("App initialization error:", error);
        document.getElementById("main-content").innerHTML = getErrorView(error);
    }
});

// Export for global access
window.fitnessApp = {
    navigateTo,
    getCurrentPath,
    router,
};
