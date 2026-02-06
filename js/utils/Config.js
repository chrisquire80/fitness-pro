/**
 * Config.js
 * Centralized configuration system for Fitness Pro App
 * Manages environment variables, API keys, feature flags, and app settings
 */

class Config {
    constructor() {
        this.environment = this.detectEnvironment();
        this.loadConfig();
    }

    /**
     * Detect current environment
     */
    detectEnvironment() {
        if (typeof window === 'undefined') return 'server';

        const hostname = window.location.hostname;

        if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.includes('192.168')) {
            return 'development';
        } else if (hostname.includes('staging') || hostname.includes('test')) {
            return 'staging';
        } else {
            return 'production';
        }
    }

    /**
     * Load configuration based on environment
     */
    loadConfig() {
        const baseConfig = {
            app: {
                name: 'Fitness Pro',
                version: '1.0.0',
                description: 'Il tuo personal trainer AI per allenamenti personalizzati',
                supportEmail: 'support@fitnesspro.app',
                websiteUrl: 'https://fitnesspro.app'
            },

            storage: {
                prefix: 'fitness_',
                version: 1,
                ttl: {
                    user_session: 30 * 24 * 60 * 60 * 1000, // 30 days
                    api_cache: 5 * 60 * 1000, // 5 minutes
                    static_cache: 7 * 24 * 60 * 60 * 1000 // 7 days
                }
            },

            ui: {
                theme: {
                    primary: '#8b5cf6',
                    secondary: '#06b6d4',
                    success: '#10b981',
                    warning: '#f59e0b',
                    danger: '#ef4444',
                    dark: '#0f172a'
                },
                animation: {
                    duration: {
                        fast: 200,
                        normal: 300,
                        slow: 500
                    },
                    easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
                },
                breakpoints: {
                    mobile: 480,
                    tablet: 768,
                    desktop: 1024,
                    wide: 1200
                }
            },

            features: {
                aiCoach: true,
                nutrition: true,
                runTracking: true,
                socialSharing: true,
                pushNotifications: true,
                offline: true,
                analytics: true,
                audioGuide: true,
                darkMode: true,
                exportData: true
            },

            limits: {
                maxWorkoutDuration: 180, // minutes
                maxCustomExercises: 50,
                maxCustomWorkouts: 20,
                maxImageSize: 5 * 1024 * 1024, // 5MB
                maxVideoLength: 300 // seconds
            },

            workout: {
                defaultRestTime: 60, // seconds
                minRestTime: 10,
                maxRestTime: 300,
                defaultSets: 3,
                maxSets: 10,
                streakMilestones: [3, 7, 14, 30, 60, 100, 365],
                xpRewards: {
                    workout_complete: 100,
                    streak_milestone: 250,
                    custom_workout: 50,
                    first_workout: 500
                }
            }
        };

        // Environment-specific overrides
        const envConfigs = {
            development: {
                debug: true,
                api: {
                    timeout: 30000,
                    retries: 3,
                    baseUrl: 'http://localhost:3000/api'
                },
                analytics: {
                    enabled: false,
                    debug: true
                },
                notifications: {
                    enabled: true,
                    debug: true
                },
                cache: {
                    disabled: false,
                    debug: true
                }
            },

            staging: {
                debug: true,
                api: {
                    timeout: 15000,
                    retries: 2,
                    baseUrl: 'https://api-staging.fitnesspro.app'
                },
                analytics: {
                    enabled: true,
                    debug: true
                },
                notifications: {
                    enabled: true,
                    debug: false
                },
                cache: {
                    disabled: false,
                    debug: false
                }
            },

            production: {
                debug: false,
                api: {
                    timeout: 10000,
                    retries: 2,
                    baseUrl: 'https://api.fitnesspro.app'
                },
                analytics: {
                    enabled: true,
                    debug: false
                },
                notifications: {
                    enabled: true,
                    debug: false
                },
                cache: {
                    disabled: false,
                    debug: false
                }
            }
        };

        // Merge configurations
        this.config = this.deepMerge(baseConfig, envConfigs[this.environment] || {});

        // Load user preferences
        this.loadUserPreferences();

        // Load API keys from environment or localStorage
        this.loadApiKeys();
    }

    /**
     * Load user preferences from storage
     */
    loadUserPreferences() {
        try {
            const userPrefs = localStorage.getItem(`${this.config.storage.prefix}preferences`);
            if (userPrefs) {
                const prefs = JSON.parse(userPrefs);
                this.config.userPreferences = {
                    theme: prefs.theme || 'dark',
                    language: prefs.language || 'it',
                    notifications: prefs.notifications !== false,
                    audioGuide: prefs.audioGuide !== false,
                    animations: prefs.animations !== false,
                    units: prefs.units || 'metric', // metric or imperial
                    autoPlay: prefs.autoPlay !== false,
                    dataSharing: prefs.dataSharing === true
                };
            } else {
                // Default preferences
                this.config.userPreferences = {
                    theme: 'dark',
                    language: 'it',
                    notifications: true,
                    audioGuide: true,
                    animations: true,
                    units: 'metric',
                    autoPlay: true,
                    dataSharing: false
                };
            }
        } catch (error) {
            console.error('Error loading user preferences:', error);
            this.config.userPreferences = {};
        }
    }

    /**
     * Load API keys from environment or localStorage
     */
    loadApiKeys() {
        this.config.apiKeys = {
            gemini: this.getApiKey('GEMINI_API_KEY', 'YOUR_GEMINI_API_KEY'),
            openFood: null, // OpenFoodFacts doesn't require API key
            mapbox: this.getApiKey('MAPBOX_API_KEY', 'YOUR_MAPBOX_API_KEY'),
            firebase: {
                apiKey: this.getApiKey('FIREBASE_API_KEY', 'YOUR_FIREBASE_API_KEY'),
                authDomain: this.getApiKey('FIREBASE_AUTH_DOMAIN', 'fitnesspro.firebaseapp.com'),
                projectId: this.getApiKey('FIREBASE_PROJECT_ID', 'fitnesspro'),
                storageBucket: this.getApiKey('FIREBASE_STORAGE_BUCKET', 'fitnesspro.appspot.com'),
                messagingSenderId: this.getApiKey('FIREBASE_SENDER_ID', '123456789'),
                appId: this.getApiKey('FIREBASE_APP_ID', '1:123456789:web:abcdef')
            }
        };
    }

    /**
     * Get API key from various sources
     */
    getApiKey(keyName, defaultValue) {
        // Try environment variables first (if available)
        if (typeof process !== 'undefined' && process.env) {
            const envValue = process.env[keyName];
            if (envValue && envValue !== defaultValue) {
                return envValue;
            }
        }

        // Try localStorage
        try {
            const storedKey = localStorage.getItem(`${this.config.storage.prefix}apikey_${keyName.toLowerCase()}`);
            if (storedKey && storedKey !== defaultValue) {
                return storedKey;
            }
        } catch (error) {
            console.warn(`Could not access localStorage for API key ${keyName}:`, error);
        }

        return defaultValue;
    }

    /**
     * Deep merge two objects
     */
    deepMerge(target, source) {
        const result = { ...target };

        for (const key in source) {
            if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                result[key] = this.deepMerge(result[key] || {}, source[key]);
            } else {
                result[key] = source[key];
            }
        }

        return result;
    }

    /**
     * Get configuration value by path
     */
    get(path, defaultValue = null) {
        const keys = path.split('.');
        let current = this.config;

        for (const key of keys) {
            if (current && typeof current === 'object' && key in current) {
                current = current[key];
            } else {
                return defaultValue;
            }
        }

        return current;
    }

    /**
     * Set configuration value by path
     */
    set(path, value) {
        const keys = path.split('.');
        const lastKey = keys.pop();
        let current = this.config;

        for (const key of keys) {
            if (!current[key] || typeof current[key] !== 'object') {
                current[key] = {};
            }
            current = current[key];
        }

        current[lastKey] = value;
    }

    /**
     * Update user preference
     */
    setUserPreference(key, value) {
        if (!this.config.userPreferences) {
            this.config.userPreferences = {};
        }

        this.config.userPreferences[key] = value;

        try {
            localStorage.setItem(
                `${this.config.storage.prefix}preferences`,
                JSON.stringify(this.config.userPreferences)
            );
        } catch (error) {
            console.error('Error saving user preference:', error);
        }
    }

    /**
     * Save API key securely
     */
    setApiKey(keyName, value) {
        try {
            if (value && value !== `YOUR_${keyName.toUpperCase()}`) {
                localStorage.setItem(`${this.config.storage.prefix}apikey_${keyName.toLowerCase()}`, value);
                this.loadApiKeys(); // Reload to update config
                return true;
            }
        } catch (error) {
            console.error('Error saving API key:', error);
        }
        return false;
    }

    /**
     * Check if feature is enabled
     */
    isFeatureEnabled(featureName) {
        return this.get(`features.${featureName}`, false);
    }

    /**
     * Check if API key is configured
     */
    isApiKeyConfigured(keyName) {
        const key = this.get(`apiKeys.${keyName}`);
        return key && !key.startsWith('YOUR_');
    }

    /**
     * Get current environment
     */
    getEnvironment() {
        return this.environment;
    }

    /**
     * Check if debug mode is enabled
     */
    isDebugMode() {
        return this.get('debug', false);
    }

    /**
     * Get app version
     */
    getVersion() {
        return this.get('app.version', '1.0.0');
    }

    /**
     * Export configuration for debugging
     */
    exportConfig() {
        const exportConfig = { ...this.config };

        // Remove sensitive data
        if (exportConfig.apiKeys) {
            Object.keys(exportConfig.apiKeys).forEach(key => {
                if (typeof exportConfig.apiKeys[key] === 'string') {
                    exportConfig.apiKeys[key] = exportConfig.apiKeys[key].startsWith('YOUR_')
                        ? exportConfig.apiKeys[key]
                        : '***HIDDEN***';
                } else if (typeof exportConfig.apiKeys[key] === 'object') {
                    Object.keys(exportConfig.apiKeys[key]).forEach(subKey => {
                        exportConfig.apiKeys[key][subKey] = '***HIDDEN***';
                    });
                }
            });
        }

        return exportConfig;
    }

    /**
     * Validate configuration
     */
    validate() {
        const errors = [];

        // Check required fields
        if (!this.get('app.name')) {
            errors.push('App name is required');
        }

        if (!this.get('app.version')) {
            errors.push('App version is required');
        }

        // Validate API endpoints
        const apiBaseUrl = this.get('api.baseUrl');
        if (apiBaseUrl && !this.isValidUrl(apiBaseUrl)) {
            errors.push('Invalid API base URL');
        }

        // Validate limits
        const maxWorkoutDuration = this.get('limits.maxWorkoutDuration');
        if (maxWorkoutDuration && (maxWorkoutDuration < 1 || maxWorkoutDuration > 480)) {
            errors.push('Invalid max workout duration');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Helper method to validate URL
     */
    isValidUrl(string) {
        try {
            new URL(string);
            return true;
        } catch (_) {
            return false;
        }
    }
}

// Create singleton instance
export const config = new Config();

// Export for debugging in development
if (config.isDebugMode()) {
    window.fitnessConfig = config;
    console.log('🔧 Config loaded for environment:', config.getEnvironment());
}
