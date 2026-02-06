import Navbar from './components/Navbar.js';
import FloatCoach from './components/FloatCoach.js';
import Home from './views/Home.js';
import Workouts from './views/Workouts.js';
import Exercises from './views/Exercises.js';
import ActiveWorkout from './views/ActiveWorkout.js';
import Profile from './views/Profile.js';
import Progress from './views/Progress.js';
import Onboarding from './views/Onboarding.js';

// Simple Router
const routes = {
    '/': Home,
    '/workouts': Workouts,
    '/exercises': Exercises,
    '/active': ActiveWorkout,
    '/profile': Profile,
    '/progress': Progress,
    '/onboarding': Onboarding
};

const app = document.getElementById('app');
const mainContent = document.getElementById('main-content');
const navbarContainer = document.getElementById('navbar');

// Render Layout
function renderLayout() {
    // Hide navbar if in onboarding
    if (window.location.hash === '#/onboarding') {
        navbarContainer.innerHTML = '';
        document.getElementById('coach-container').innerHTML = '';
    } else {
        navbarContainer.innerHTML = Navbar();
        document.getElementById('coach-container').innerHTML = FloatCoach();
    }
}

// Router Logic
function router() {
    const path = window.location.hash.slice(1) || '/';

    // Auth Check / Onboarding Redirect
    const hasProfile = localStorage.getItem('fitness_profile');
    if (!hasProfile && path !== '/onboarding') {
        window.location.hash = '#/onboarding';
        return;
    }

    const view = routes[path] || Home;
    mainContent.innerHTML = view();
    renderLayout(); // Re-check layout on route change
}

// Handle Navigation
window.addEventListener('hashchange', router);
window.addEventListener('load', () => {
    renderLayout();
    router();
});
