/**
 * StateManager.js
 * Global state management system for Fitness Pro App
 * Provides reactive state management with persistence and event handling
 */

import { config } from './Config.js';

class StateManager {
    constructor() {
        this.state = {};
        this.subscribers = new Map();
        this.middleware = [];
        this.history = [];
        this.maxHistorySize = 50;

        this.init();
    }

    init() {
        // Initialize default state
        this.state = {
            app: {
                isLoading: false,
                isOnline: navigator.onLine,
                currentRoute: '/',
                previousRoute: null,
                isInitialized: false,
                version: config.getVersion(),
                lastError: null
            },

            user: {
                profile: null,
                isAuthenticated: false,
                preferences: {},
                stats: {
                    totalWorkouts: 0,
                    streakDays: 0,
                    totalXp: 0,
                    level: 1
                }
            },

            workout: {
                current: null,
                isActive: false,
                isPaused: false,
                currentExercise: 0,
                currentSet: 0,
                startTime: null,
                elapsedTime: 0,
                history: []
            },

            ui: {
                theme: 'dark',
                notifications: [],
                modals: [],
                activeModal: null,
                navbar: {
                    visible: true,
                    activeTab: 'home'
                },
                coach: {
                    visible: true,
                    hasNotification: false,
                    isTyping: false
                }
            },

            data: {
                exercises: [],
                workouts: [],
                logs: [],
                isLoaded: false,
                lastSync: null,
                hasPendingChanges: false
            },

            features: {
                offline: false,
                pushNotifications: false,
                audioGuide: true,
                analytics: config.isFeatureEnabled('analytics')
            }
        };

        // Load persisted state
        this.loadPersistedState();

        // Set up online/offline listeners
        window.addEventListener('online', () => this.setState('app.isOnline', true));
        window.addEventListener('offline', () => this.setState('app.isOnline', false));

        // Set up beforeunload to save state
        window.addEventListener('beforeunload', () => this.persistState());

        // Auto-save state periodically
        setInterval(() => this.persistState(), 30000); // Every 30 seconds

        if (config.isDebugMode()) {
            window.fitnessState = this;
            console.log('🗃️ StateManager initialized');
        }
    }

    /**
     * Get state value by path
     */
    getState(path = null) {
        if (!path) return this.state;

        const keys = path.split('.');
        let current = this.state;

        for (const key of keys) {
            if (current && typeof current === 'object' && key in current) {
                current = current[key];
            } else {
                return undefined;
            }
        }

        return current;
    }

    /**
     * Set state value by path
     */
    setState(path, value, options = {}) {
        const { persist = true, notify = true, history = true } = options;

        // Save to history
        if (history && this.history.length >= this.maxHistorySize) {
            this.history.shift();
        }

        if (history) {
            this.history.push({
                timestamp: Date.now(),
                path,
                oldValue: this.getState(path),
                newValue: value,
                action: 'setState'
            });
        }

        // Apply middleware
        for (const middleware of this.middleware) {
            const result = middleware(path, value, this.state);
            if (result !== undefined) {
                value = result;
            }
        }

        // Update state
        const keys = path.split('.');
        const lastKey = keys.pop();
        let current = this.state;

        for (const key of keys) {
            if (!current[key] || typeof current[key] !== 'object') {
                current[key] = {};
            }
            current = current[key];
        }

        const oldValue = current[lastKey];
        current[lastKey] = value;

        // Notify subscribers
        if (notify) {
            this.notifySubscribers(path, value, oldValue);
        }

        // Persist if needed
        if (persist) {
            this.markForPersistence();
        }

        if (config.isDebugMode()) {
            console.log(`🗃️ State updated: ${path}`, value);
        }
    }

    /**
     * Update state with partial object
     */
    updateState(path, updates, options = {}) {
        const current = this.getState(path) || {};
        const newValue = { ...current, ...updates };
        this.setState(path, newValue, options);
    }

    /**
     * Subscribe to state changes
     */
    subscribe(path, callback) {
        if (!this.subscribers.has(path)) {
            this.subscribers.set(path, new Set());
        }

        const pathSubscribers = this.subscribers.get(path);
        pathSubscribers.add(callback);

        // Return unsubscribe function
        return () => {
            pathSubscribers.delete(callback);
            if (pathSubscribers.size === 0) {
                this.subscribers.delete(path);
            }
        };
    }

    /**
     * Subscribe to multiple paths
     */
    subscribeToMultiple(paths, callback) {
        const unsubscribers = paths.map(path => this.subscribe(path, callback));

        return () => {
            unsubscribers.forEach(unsubscribe => unsubscribe());
        };
    }

    /**
     * Notify subscribers of state changes
     */
    notifySubscribers(path, newValue, oldValue) {
        // Direct subscribers
        const directSubscribers = this.subscribers.get(path);
        if (directSubscribers) {
            directSubscribers.forEach(callback => {
                try {
                    callback(newValue, oldValue, path);
                } catch (error) {
                    console.error('Subscriber callback error:', error);
                }
            });
        }

        // Notify parent path subscribers
        const pathParts = path.split('.');
        for (let i = pathParts.length - 1; i > 0; i--) {
            const parentPath = pathParts.slice(0, i).join('.');
            const parentSubscribers = this.subscribers.get(parentPath);

            if (parentSubscribers) {
                const parentValue = this.getState(parentPath);
                parentSubscribers.forEach(callback => {
                    try {
                        callback(parentValue, null, parentPath);
                    } catch (error) {
                        console.error('Parent subscriber callback error:', error);
                    }
                });
            }
        }
    }

    /**
     * Add middleware for state changes
     */
    addMiddleware(middleware) {
        this.middleware.push(middleware);
    }

    /**
     * Load persisted state from localStorage
     */
    loadPersistedState() {
        try {
            const persistedState = localStorage.getItem(`${config.get('storage.prefix')}state`);
            if (persistedState) {
                const parsed = JSON.parse(persistedState);

                // Only load certain parts of the state
                const persistablePaths = [
                    'user.preferences',
                    'ui.theme',
                    'ui.navbar',
                    'features'
                ];

                persistablePaths.forEach(path => {
                    const value = this.getValueByPath(parsed, path);
                    if (value !== undefined) {
                        this.setState(path, value, { persist: false, notify: false });
                    }
                });

                if (config.isDebugMode()) {
                    console.log('🗃️ Loaded persisted state');
                }
            }
        } catch (error) {
            console.warn('Failed to load persisted state:', error);
        }
    }

    /**
     * Persist state to localStorage
     */
    persistState() {
        try {
            // Only persist certain parts of the state
            const persistableState = {
                user: {
                    preferences: this.state.user.preferences
                },
                ui: {
                    theme: this.state.ui.theme,
                    navbar: this.state.ui.navbar
                },
                features: this.state.features,
                timestamp: Date.now()
            };

            localStorage.setItem(
                `${config.get('storage.prefix')}state`,
                JSON.stringify(persistableState)
            );
        } catch (error) {
            console.warn('Failed to persist state:', error);
        }
    }

    /**
     * Mark state for persistence (debounced)
     */
    markForPersistence() {
        if (this.persistTimeout) {
            clearTimeout(this.persistTimeout);
        }

        this.persistTimeout = setTimeout(() => {
            this.persistState();
        }, 1000); // Debounce by 1 second
    }

    /**
     * Get value by dot-notation path from object
     */
    getValueByPath(obj, path) {
        const keys = path.split('.');
        let current = obj;

        for (const key of keys) {
            if (current && typeof current === 'object' && key in current) {
                current = current[key];
            } else {
                return undefined;
            }
        }

        return current;
    }

    /**
     * Reset state to default values
     */
    resetState() {
        const backup = { ...this.state };

        try {
            this.init();
            this.notifySubscribers('*', this.state, backup);

            if (config.isDebugMode()) {
                console.log('🗃️ State reset to defaults');
            }
        } catch (error) {
            console.error('Failed to reset state:', error);
            this.state = backup;
        }
    }

    /**
     * Get state history
     */
    getHistory(limit = 10) {
        return this.history.slice(-limit);
    }

    /**
     * Dispatch action (Redux-like pattern)
     */
    dispatch(action) {
        if (config.isDebugMode()) {
            console.log('🎬 Action dispatched:', action);
        }

        // Add to history
        this.history.push({
            timestamp: Date.now(),
            action: action.type,
            payload: action.payload,
            state: JSON.parse(JSON.stringify(this.state))
        });

        // Handle built-in actions
        switch (action.type) {
            case 'SET_LOADING':
                this.setState('app.isLoading', action.payload);
                break;

            case 'SET_ROUTE':
                this.setState('app.previousRoute', this.state.app.currentRoute);
                this.setState('app.currentRoute', action.payload);
                break;

            case 'SET_USER_PROFILE':
                this.setState('user.profile', action.payload);
                this.setState('user.isAuthenticated', !!action.payload);
                break;

            case 'START_WORKOUT':
                this.updateState('workout', {
                    current: action.payload,
                    isActive: true,
                    isPaused: false,
                    startTime: Date.now(),
                    currentExercise: 0,
                    currentSet: 0
                });
                break;

            case 'PAUSE_WORKOUT':
                this.setState('workout.isPaused', true);
                break;

            case 'RESUME_WORKOUT':
                this.setState('workout.isPaused', false);
                break;

            case 'END_WORKOUT':
                this.updateState('workout', {
                    current: null,
                    isActive: false,
                    isPaused: false,
                    startTime: null,
                    elapsedTime: 0,
                    currentExercise: 0,
                    currentSet: 0
                });
                break;

            case 'ADD_NOTIFICATION':
                const notifications = [...this.state.ui.notifications, action.payload];
                this.setState('ui.notifications', notifications);
                break;

            case 'REMOVE_NOTIFICATION':
                const filteredNotifications = this.state.ui.notifications.filter(
                    n => n.id !== action.payload
                );
                this.setState('ui.notifications', filteredNotifications);
                break;

            case 'SHOW_MODAL':
                this.setState('ui.activeModal', action.payload);
                break;

            case 'HIDE_MODAL':
                this.setState('ui.activeModal', null);
                break;

            case 'SET_ERROR':
                this.setState('app.lastError', action.payload);
                break;

            case 'CLEAR_ERROR':
                this.setState('app.lastError', null);
                break;

            default:
                console.warn('Unknown action type:', action.type);
        }
    }

    /**
     * Create action creators
     */
    createActions() {
        return {
            setLoading: (isLoading) => this.dispatch({ type: 'SET_LOADING', payload: isLoading }),
            setRoute: (route) => this.dispatch({ type: 'SET_ROUTE', payload: route }),
            setUserProfile: (profile) => this.dispatch({ type: 'SET_USER_PROFILE', payload: profile }),
            startWorkout: (workout) => this.dispatch({ type: 'START_WORKOUT', payload: workout }),
            pauseWorkout: () => this.dispatch({ type: 'PAUSE_WORKOUT' }),
            resumeWorkout: () => this.dispatch({ type: 'RESUME_WORKOUT' }),
            endWorkout: () => this.dispatch({ type: 'END_WORKOUT' }),
            addNotification: (notification) => this.dispatch({ type: 'ADD_NOTIFICATION', payload: notification }),
            removeNotification: (id) => this.dispatch({ type: 'REMOVE_NOTIFICATION', payload: id }),
            showModal: (modal) => this.dispatch({ type: 'SHOW_MODAL', payload: modal }),
            hideModal: () => this.dispatch({ type: 'HIDE_MODAL' }),
            setError: (error) => this.dispatch({ type: 'SET_ERROR', payload: error }),
            clearError: () => this.dispatch({ type: 'CLEAR_ERROR' })
        };
    }

    /**
     * Create computed values (getters)
     */
    get computed() {
        return {
            isWorkoutActive: () => this.getState('workout.isActive'),
            currentUser: () => this.getState('user.profile'),
            isOnline: () => this.getState('app.isOnline'),
            hasActiveModal: () => !!this.getState('ui.activeModal'),
            notificationCount: () => this.getState('ui.notifications')?.length || 0,
            userLevel: () => {
                const xp = this.getState('user.stats.totalXp') || 0;
                return Math.floor(xp / 1000) + 1;
            },
            workoutProgress: () => {
                const current = this.getState('workout.current');
                const currentExercise = this.getState('workout.currentExercise');

                if (!current?.exercises) return 0;

                return Math.round((currentExercise / current.exercises.length) * 100);
            }
        };
    }

    /**
     * Export state for debugging
     */
    exportState() {
        return {
            state: JSON.parse(JSON.stringify(this.state)),
            history: this.getHistory(),
            subscribers: Array.from(this.subscribers.keys()),
            timestamp: Date.now()
        };
    }
}

// Create singleton instance
export const stateManager = new StateManager();

// Export actions for convenience
export const actions = stateManager.createActions();

// Export computed values
export const computed = stateManager.computed;

// Export individual methods for convenience
export const {
    getState,
    setState,
    updateState,
    subscribe,
    dispatch
} = stateManager;
