/**
 * AuthService.js
 * Advanced Authentication and Security System for Fitness Pro App
 * Handles user authentication, session management, biometric auth, and security features
 */

import { config } from '../utils/Config.js';
import { stateManager, actions } from '../utils/StateManager.js';
import { analytics } from './Analytics.js';
import { notificationManager } from '../utils/NotificationManager.js';

class AuthService {
    constructor() {
        this.isInitialized = false;
        this.sessionTimeout = config.get('auth.sessionTimeout', 30 * 60 * 1000); // 30 minutes
        this.maxLoginAttempts = config.get('auth.maxLoginAttempts', 5);
        this.lockoutDuration = config.get('auth.lockoutDuration', 15 * 60 * 1000); // 15 minutes
        this.encryptionKey = null;
        this.sessionTimer = null;

        this.init();
    }

    async init() {
        try {
            // Initialize encryption
            await this.initializeCrypto();

            // Check for existing session
            await this.restoreSession();

            // Set up session monitoring
            this.setupSessionMonitoring();

            // Set up security event listeners
            this.setupSecurityListeners();

            this.isInitialized = true;

            if (config.isDebugMode()) {
                console.log('🔐 AuthService initialized');
            }
        } catch (error) {
            console.error('AuthService initialization failed:', error);
        }
    }

    /**
     * Initialize cryptographic functions
     */
    async initializeCrypto() {
        if (window.crypto && window.crypto.subtle) {
            try {
                // Generate or retrieve encryption key
                const storedKey = localStorage.getItem(`${config.get('storage.prefix')}enc_key`);

                if (storedKey) {
                    // Import existing key
                    const keyData = JSON.parse(storedKey);
                    this.encryptionKey = await window.crypto.subtle.importKey(
                        'raw',
                        new Uint8Array(keyData),
                        { name: 'AES-GCM' },
                        false,
                        ['encrypt', 'decrypt']
                    );
                } else {
                    // Generate new key
                    this.encryptionKey = await window.crypto.subtle.generateKey(
                        { name: 'AES-GCM', length: 256 },
                        true,
                        ['encrypt', 'decrypt']
                    );

                    // Store key (in production, this should be more secure)
                    const keyData = await window.crypto.subtle.exportKey('raw', this.encryptionKey);
                    localStorage.setItem(
                        `${config.get('storage.prefix')}enc_key`,
                        JSON.stringify(Array.from(new Uint8Array(keyData)))
                    );
                }
            } catch (error) {
                console.warn('Crypto initialization failed:', error);
                this.encryptionKey = null;
            }
        }
    }

    /**
     * Encrypt sensitive data
     */
    async encrypt(data) {
        if (!this.encryptionKey) return data;

        try {
            const encoder = new TextEncoder();
            const dataBuffer = encoder.encode(JSON.stringify(data));
            const iv = window.crypto.getRandomValues(new Uint8Array(12));

            const encrypted = await window.crypto.subtle.encrypt(
                { name: 'AES-GCM', iv },
                this.encryptionKey,
                dataBuffer
            );

            return {
                encrypted: Array.from(new Uint8Array(encrypted)),
                iv: Array.from(iv),
                timestamp: Date.now()
            };
        } catch (error) {
            console.error('Encryption failed:', error);
            return data;
        }
    }

    /**
     * Decrypt sensitive data
     */
    async decrypt(encryptedData) {
        if (!this.encryptionKey || !encryptedData.encrypted) return encryptedData;

        try {
            const encrypted = new Uint8Array(encryptedData.encrypted);
            const iv = new Uint8Array(encryptedData.iv);

            const decrypted = await window.crypto.subtle.decrypt(
                { name: 'AES-GCM', iv },
                this.encryptionKey,
                encrypted
            );

            const decoder = new TextDecoder();
            return JSON.parse(decoder.decode(decrypted));
        } catch (error) {
            console.error('Decryption failed:', error);
            return null;
        }
    }

    /**
     * Create user account (guest mode with optional upgrade)
     */
    async createAccount(userData) {
        try {
            const loginAttempts = this.getLoginAttempts();
            if (loginAttempts.count >= this.maxLoginAttempts && Date.now() < loginAttempts.lockedUntil) {
                throw new Error('Account temporaneamente bloccato. Riprova più tardi.');
            }

            // Validate user data
            const validationResult = this.validateUserData(userData);
            if (!validationResult.isValid) {
                throw new Error(validationResult.errors.join(', '));
            }

            // Generate unique user ID
            const userId = this.generateUserId();

            // Create user profile
            const userProfile = {
                id: userId,
                ...userData,
                createdAt: new Date().toISOString(),
                lastLoginAt: new Date().toISOString(),
                isGuest: !userData.email, // Guest if no email provided
                securityLevel: userData.email ? 'standard' : 'guest',
                preferences: {
                    theme: 'dark',
                    notifications: true,
                    biometricAuth: false,
                    twoFactorAuth: false
                },
                stats: {
                    totalWorkouts: 0,
                    streakDays: 0,
                    totalXp: 0,
                    level: 1
                }
            };

            // Encrypt sensitive data
            const encryptedProfile = await this.encrypt(userProfile);

            // Store user profile
            localStorage.setItem(
                `${config.get('storage.prefix')}profile`,
                JSON.stringify(encryptedProfile)
            );

            // Create session
            await this.createSession(userProfile);

            // Track account creation
            if (config.isFeatureEnabled('analytics')) {
                analytics.logEvent('account_created', {
                    user_type: userProfile.isGuest ? 'guest' : 'registered',
                    timestamp: Date.now()
                });
            }

            // Clear login attempts on successful creation
            this.clearLoginAttempts();

            return {
                success: true,
                user: this.sanitizeUserData(userProfile)
            };
        } catch (error) {
            this.recordLoginAttempt(false);

            if (config.isFeatureEnabled('analytics')) {
                analytics.logEvent('account_creation_failed', {
                    error: error.message
                });
            }

            throw error;
        }
    }

    /**
     * Login user (restore session)
     */
    async login(credentials = null) {
        try {
            const loginAttempts = this.getLoginAttempts();
            if (loginAttempts.count >= this.maxLoginAttempts && Date.now() < loginAttempts.lockedUntil) {
                throw new Error('Troppi tentativi falliti. Account temporaneamente bloccato.');
            }

            // For guest mode, just restore existing profile
            let userProfile = await this.getCurrentUser();

            if (!userProfile) {
                throw new Error('Nessun account trovato. Crea un nuovo profilo.');
            }

            // Update last login
            userProfile.lastLoginAt = new Date().toISOString();
            await this.updateUserProfile(userProfile);

            // Create new session
            await this.createSession(userProfile);

            // Track login
            if (config.isFeatureEnabled('analytics')) {
                analytics.logEvent('login_success', {
                    user_type: userProfile.isGuest ? 'guest' : 'registered',
                    timestamp: Date.now()
                });
            }

            this.clearLoginAttempts();

            return {
                success: true,
                user: this.sanitizeUserData(userProfile)
            };
        } catch (error) {
            this.recordLoginAttempt(false);

            if (config.isFeatureEnabled('analytics')) {
                analytics.logEvent('login_failed', {
                    error: error.message
                });
            }

            throw error;
        }
    }

    /**
     * Logout user
     */
    async logout() {
        try {
            const currentUser = stateManager.getState('user.profile');

            // Clear session
            this.clearSession();

            // Update state
            actions.setUserProfile(null);

            // Track logout
            if (config.isFeatureEnabled('analytics') && currentUser) {
                analytics.logEvent('logout', {
                    user_id: currentUser.id,
                    session_duration: Date.now() - (currentUser.sessionStartTime || Date.now())
                });
            }

            // Show logout notification
            notificationManager.info(
                'Logout Completato',
                'Sei stato disconnesso con successo.',
                { duration: 3000 }
            );

            return { success: true };
        } catch (error) {
            console.error('Logout failed:', error);
            throw error;
        }
    }

    /**
     * Delete account and all data
     */
    async deleteAccount() {
        try {
            const currentUser = await this.getCurrentUser();
            if (!currentUser) {
                throw new Error('Nessun account da eliminare.');
            }

            // Show confirmation
            const confirmed = confirm(
                'Sei sicuro di voler eliminare il tuo account? ' +
                'Tutti i dati saranno persi definitivamente e non potranno essere recuperati.'
            );

            if (!confirmed) {
                return { success: false, reason: 'cancelled' };
            }

            // Clear all user data
            const keysToRemove = [
                `${config.get('storage.prefix')}profile`,
                `${config.get('storage.prefix')}session`,
                `${config.get('storage.prefix')}preferences`,
                `${config.get('storage.prefix')}enc_key`,
                `${config.get('storage.prefix')}login_attempts`,
                // Clear all fitness data
                `${config.get('storage.prefix')}logs`,
                `${config.get('storage.prefix')}progress`,
                `${config.get('storage.prefix')}state`
            ];

            keysToRemove.forEach(key => {
                localStorage.removeItem(key);
            });

            // Clear session
            this.clearSession();

            // Update state
            actions.setUserProfile(null);

            // Track account deletion
            if (config.isFeatureEnabled('analytics')) {
                analytics.logEvent('account_deleted', {
                    user_id: currentUser.id,
                    account_age: Date.now() - new Date(currentUser.createdAt).getTime()
                });
            }

            return { success: true };
        } catch (error) {
            console.error('Account deletion failed:', error);
            throw error;
        }
    }

    /**
     * Update user profile
     */
    async updateUserProfile(updates) {
        try {
            const currentUser = await this.getCurrentUser();
            if (!currentUser) {
                throw new Error('Nessun utente loggato.');
            }

            // Validate updates
            const validationResult = this.validateUserData(updates, true);
            if (!validationResult.isValid) {
                throw new Error(validationResult.errors.join(', '));
            }

            // Merge updates
            const updatedProfile = {
                ...currentUser,
                ...updates,
                updatedAt: new Date().toISOString()
            };

            // Encrypt and save
            const encryptedProfile = await this.encrypt(updatedProfile);
            localStorage.setItem(
                `${config.get('storage.prefix')}profile`,
                JSON.stringify(encryptedProfile)
            );

            // Update state
            actions.setUserProfile(this.sanitizeUserData(updatedProfile));

            return {
                success: true,
                user: this.sanitizeUserData(updatedProfile)
            };
        } catch (error) {
            console.error('Profile update failed:', error);
            throw error;
        }
    }

    /**
     * Enable biometric authentication
     */
    async enableBiometricAuth() {
        if (!('credentials' in navigator)) {
            throw new Error('Autenticazione biometrica non supportata su questo dispositivo.');
        }

        try {
            // Check if biometric auth is available
            const available = await navigator.credentials.create({
                publicKey: {
                    challenge: new Uint8Array(32),
                    rp: { name: config.get('app.name') },
                    user: {
                        id: new Uint8Array(16),
                        name: 'fitness-user',
                        displayName: 'Fitness User'
                    },
                    pubKeyCredParams: [{ alg: -7, type: 'public-key' }],
                    timeout: 60000,
                    attestation: 'direct'
                }
            });

            if (available) {
                // Update user preference
                await this.updateUserProfile({
                    'preferences.biometricAuth': true
                });

                notificationManager.success(
                    'Autenticazione Biometrica Abilitata',
                    'Potrai ora accedere usando impronta digitale o Face ID.'
                );

                return { success: true };
            }
        } catch (error) {
            console.error('Biometric auth setup failed:', error);
            throw new Error('Impossibile configurare l\'autenticazione biometrica.');
        }
    }

    /**
     * Authenticate with biometrics
     */
    async authenticateWithBiometrics() {
        if (!('credentials' in navigator)) {
            throw new Error('Autenticazione biometrica non disponibile.');
        }

        try {
            const credential = await navigator.credentials.get({
                publicKey: {
                    challenge: new Uint8Array(32),
                    timeout: 60000,
                    userVerification: 'required'
                }
            });

            if (credential) {
                return await this.login();
            }
        } catch (error) {
            console.error('Biometric authentication failed:', error);
            throw new Error('Autenticazione biometrica fallita.');
        }
    }

    /**
     * Create session
     */
    async createSession(user) {
        const sessionData = {
            userId: user.id,
            createdAt: Date.now(),
            expiresAt: Date.now() + this.sessionTimeout,
            deviceInfo: this.getDeviceInfo(),
            securityToken: this.generateSecurityToken()
        };

        // Encrypt session data
        const encryptedSession = await this.encrypt(sessionData);
        localStorage.setItem(
            `${config.get('storage.prefix')}session`,
            JSON.stringify(encryptedSession)
        );

        // Update state
        actions.setUserProfile({
            ...this.sanitizeUserData(user),
            sessionStartTime: sessionData.createdAt
        });

        // Start session timer
        this.startSessionTimer();

        if (config.isDebugMode()) {
            console.log('🔐 Session created for user:', user.id);
        }
    }

    /**
     * Validate session
     */
    async validateSession() {
        try {
            const encryptedSession = localStorage.getItem(`${config.get('storage.prefix')}session`);
            if (!encryptedSession) return false;

            const sessionData = await this.decrypt(JSON.parse(encryptedSession));
            if (!sessionData) return false;

            // Check if session is expired
            if (Date.now() > sessionData.expiresAt) {
                this.clearSession();
                return false;
            }

            // Validate security token
            if (!this.validateSecurityToken(sessionData.securityToken)) {
                this.clearSession();
                notificationManager.warning(
                    'Sessione Invalidata',
                    'La tua sessione è stata invalidata per motivi di sicurezza.'
                );
                return false;
            }

            return true;
        } catch (error) {
            console.error('Session validation failed:', error);
            this.clearSession();
            return false;
        }
    }

    /**
     * Restore session on app load
     */
    async restoreSession() {
        const isValid = await this.validateSession();

        if (isValid) {
            const user = await this.getCurrentUser();
            if (user) {
                actions.setUserProfile(this.sanitizeUserData(user));
                this.startSessionTimer();

                if (config.isDebugMode()) {
                    console.log('🔐 Session restored for user:', user.id);
                }
            }
        }
    }

    /**
     * Clear session
     */
    clearSession() {
        localStorage.removeItem(`${config.get('storage.prefix')}session`);

        if (this.sessionTimer) {
            clearTimeout(this.sessionTimer);
            this.sessionTimer = null;
        }

        if (config.isDebugMode()) {
            console.log('🔐 Session cleared');
        }
    }

    /**
     * Start session timer
     */
    startSessionTimer() {
        if (this.sessionTimer) {
            clearTimeout(this.sessionTimer);
        }

        this.sessionTimer = setTimeout(async () => {
            await this.logout();
            notificationManager.warning(
                'Sessione Scaduta',
                'La tua sessione è scaduta. Effettua nuovamente l\'accesso.'
            );
        }, this.sessionTimeout);
    }

    /**
     * Setup session monitoring
     */
    setupSessionMonitoring() {
        // Monitor user activity to extend session
        let lastActivity = Date.now();

        const updateActivity = () => {
            lastActivity = Date.now();
        };

        ['click', 'keypress', 'scroll', 'touchstart'].forEach(event => {
            document.addEventListener(event, updateActivity, { passive: true });
        });

        // Check for inactivity
        setInterval(async () => {
            const inactiveTime = Date.now() - lastActivity;
            const warningTime = this.sessionTimeout - (5 * 60 * 1000); // 5 minutes before expiry

            if (inactiveTime > warningTime && await this.validateSession()) {
                notificationManager.warning(
                    'Sessione in Scadenza',
                    'La tua sessione scadrà presto. Interagisci con l\'app per mantenerla attiva.',
                    { duration: 10000 }
                );
            }
        }, 60000); // Check every minute
    }

    /**
     * Setup security event listeners
     */
    setupSecurityListeners() {
        // Monitor for potential security issues
        let suspiciousActivity = 0;

        // Monitor for rapid clicks (bot behavior)
        let clickCount = 0;
        document.addEventListener('click', () => {
            clickCount++;
            setTimeout(() => clickCount--, 1000);

            if (clickCount > 10) {
                suspiciousActivity++;
                console.warn('Suspicious clicking behavior detected');
            }
        });

        // Monitor for dev tools opening
        let devtools = { open: false, orientation: null };
        const threshold = 160;

        const checkDevTools = () => {
            if (window.outerHeight - window.innerHeight > threshold ||
                window.outerWidth - window.innerWidth > threshold) {
                if (!devtools.open) {
                    devtools.open = true;
                    suspiciousActivity++;

                    if (config.getEnvironment() === 'production') {
                        console.warn('Developer tools detected');
                    }
                }
            } else {
                devtools.open = false;
            }
        };

        setInterval(checkDevTools, 500);

        // If suspicious activity is too high, increase security measures
        setInterval(() => {
            if (suspiciousActivity > 5) {
                console.warn('High suspicious activity detected');
                suspiciousActivity = 0; // Reset counter
            }
        }, 60000);
    }

    /**
     * Get current user
     */
    async getCurrentUser() {
        try {
            const encryptedProfile = localStorage.getItem(`${config.get('storage.prefix')}profile`);
            if (!encryptedProfile) return null;

            const userProfile = await this.decrypt(JSON.parse(encryptedProfile));
            return userProfile;
        } catch (error) {
            console.error('Failed to get current user:', error);
            return null;
        }
    }

    /**
     * Check if user is authenticated
     */
    async isAuthenticated() {
        const hasSession = await this.validateSession();
        const hasUser = await this.getCurrentUser();
        return hasSession && !!hasUser;
    }

    /**
     * Utility functions
     */
    generateUserId() {
        return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    generateSecurityToken() {
        return window.crypto ?
            Array.from(window.crypto.getRandomValues(new Uint8Array(16)))
                .map(b => b.toString(16).padStart(2, '0')).join('') :
            Math.random().toString(36).substr(2, 15);
    }

    validateSecurityToken(token) {
        // In production, implement proper token validation
        return token && token.length > 10;
    }

    getDeviceInfo() {
        return {
            userAgent: navigator.userAgent,
            language: navigator.language,
            platform: navigator.platform,
            cookieEnabled: navigator.cookieEnabled,
            onLine: navigator.onLine,
            screenResolution: `${screen.width}x${screen.height}`,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
        };
    }

    validateUserData(userData, isUpdate = false) {
        const errors = [];

        if (!isUpdate) {
            if (!userData.name || userData.name.trim().length < 2) {
                errors.push('Nome deve essere di almeno 2 caratteri');
            }

            if (!userData.age || userData.age < 13 || userData.age > 120) {
                errors.push('Età deve essere tra 13 e 120 anni');
            }

            if (!userData.goal || !['lose', 'gain', 'maintain'].includes(userData.goal)) {
                errors.push('Obiettivo non valido');
            }
        }

        if (userData.email && !this.isValidEmail(userData.email)) {
            errors.push('Email non valida');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    sanitizeUserData(user) {
        const { encryptionKey, sessionStartTime, ...sanitized } = user;
        return sanitized;
    }

    getLoginAttempts() {
        try {
            const attempts = localStorage.getItem(`${config.get('storage.prefix')}login_attempts`);
            return attempts ? JSON.parse(attempts) : { count: 0, lockedUntil: 0 };
        } catch {
            return { count: 0, lockedUntil: 0 };
        }
    }

    recordLoginAttempt(success) {
        try {
            if (success) {
                localStorage.removeItem(`${config.get('storage.prefix')}login_attempts`);
            } else {
                const attempts = this.getLoginAttempts();
                attempts.count++;

                if (attempts.count >= this.maxLoginAttempts) {
                    attempts.lockedUntil = Date.now() + this.lockoutDuration;
                }

                localStorage.setItem(
                    `${config.get('storage.prefix')}login_attempts`,
                    JSON.stringify(attempts)
                );
            }
        } catch (error) {
            console.error('Failed to record login attempt:', error);
        }
    }

    clearLoginAttempts() {
        localStorage.removeItem(`${config.get('storage.prefix')}login_attempts`);
    }

    /**
     * Export security report
     */
    getSecurityReport() {
        return {
            timestamp: Date.now(),
            sessionActive: !!this.sessionTimer,
            encryptionEnabled: !!this.encryptionKey,
            biometricSupport: 'credentials' in navigator,
            secureContext: window.isSecureContext,
            environment: config.getEnvironment(),
            loginAttempts: this.getLoginAttempts()
        };
    }
}

export const authService = new AuthService();

// Export for debugging in development
if (config.isDebugMode()) {
    window.authService = authService;
}
