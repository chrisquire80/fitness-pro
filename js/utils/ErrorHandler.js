/**
 * ErrorHandler.js
 * Advanced Error Handling and Logging System for Fitness Pro App
 * Provides centralized error handling, logging, crash reporting, and error recovery
 */

import { config } from './Config.js';
import { stateManager, actions } from './StateManager.js';
import { analytics } from '../services/Analytics.js';
import { notificationManager } from './NotificationManager.js';

class ErrorHandler {
    constructor() {
        this.isInitialized = false;
        this.errorQueue = [];
        this.maxErrorQueue = config.get('errorHandler.maxQueue', 50);
        this.logLevel = config.get('errorHandler.logLevel', 'warn'); // debug, info, warn, error, fatal
        this.enableConsoleLogging = config.get('errorHandler.console', true);
        this.enableRemoteLogging = config.get('errorHandler.remote', false);
        this.enableUserNotifications = config.get('errorHandler.notifications', true);
        this.errorCounts = new Map();
        this.suppressedErrors = new Set();
        this.errorPatterns = new Map();
        this.retryAttempts = new Map();
        this.maxRetries = config.get('errorHandler.maxRetries', 3);

        this.init();
    }

    init() {
        try {
            // Set up global error handlers
            this.setupGlobalErrorHandlers();

            // Set up unhandled promise rejection handler
            this.setupPromiseRejectionHandler();

            // Set up custom error event listeners
            this.setupCustomErrorListeners();

            // Initialize error patterns for common issues
            this.initializeErrorPatterns();

            // Set up periodic error reporting
            this.setupPeriodicReporting();

            // Set up error recovery mechanisms
            this.setupErrorRecovery();

            this.isInitialized = true;

            if (config.isDebugMode()) {
                console.log('🚨 ErrorHandler initialized');
            }
        } catch (error) {
            console.error('ErrorHandler initialization failed:', error);
        }
    }

    /**
     * Setup global error handlers
     */
    setupGlobalErrorHandlers() {
        window.addEventListener('error', (event) => {
            this.handleError({
                type: 'javascript',
                message: event.message,
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                error: event.error,
                stack: event.error?.stack,
                timestamp: Date.now(),
                url: window.location.href,
                userAgent: navigator.userAgent
            });
        }, true);

        // Handle resource loading errors
        window.addEventListener('error', (event) => {
            if (event.target !== window) {
                this.handleError({
                    type: 'resource',
                    message: `Failed to load ${event.target.tagName}: ${event.target.src || event.target.href}`,
                    element: event.target.tagName,
                    source: event.target.src || event.target.href,
                    timestamp: Date.now(),
                    url: window.location.href
                });
            }
        }, true);
    }

    /**
     * Setup unhandled promise rejection handler
     */
    setupPromiseRejectionHandler() {
        window.addEventListener('unhandledrejection', (event) => {
            this.handleError({
                type: 'promise',
                message: 'Unhandled Promise Rejection',
                reason: event.reason,
                stack: event.reason?.stack,
                timestamp: Date.now(),
                url: window.location.href
            });

            // Prevent default browser behavior (logging to console)
            if (!config.isDebugMode()) {
                event.preventDefault();
            }
        });
    }

    /**
     * Setup custom error event listeners
     */
    setupCustomErrorListeners() {
        // Listen for custom error events from other parts of the app
        document.addEventListener('fitnessAppError', (event) => {
            this.handleError(event.detail);
        });

        // Listen for network errors
        document.addEventListener('fitnessNetworkError', (event) => {
            this.handleNetworkError(event.detail);
        });

        // Listen for data errors
        document.addEventListener('fitnessDataError', (event) => {
            this.handleDataError(event.detail);
        });
    }

    /**
     * Initialize error patterns for classification
     */
    initializeErrorPatterns() {
        this.errorPatterns.set('network', [
            /fetch.*failed/i,
            /network.*error/i,
            /connection.*refused/i,
            /timeout/i,
            /cors/i
        ]);

        this.errorPatterns.set('storage', [
            /localstorage/i,
            /storage.*quota/i,
            /indexeddb/i,
            /storage.*full/i
        ]);

        this.errorPatterns.set('memory', [
            /out.*of.*memory/i,
            /memory.*limit/i,
            /heap.*size/i
        ]);

        this.errorPatterns.set('security', [
            /security.*error/i,
            /cross.*origin/i,
            /mixed.*content/i,
            /csp.*violation/i
        ]);

        this.errorPatterns.set('ui', [
            /cannot.*read.*property/i,
            /undefined.*is.*not.*a.*function/i,
            /null.*is.*not.*an.*object/i
        ]);
    }

    /**
     * Main error handling function
     */
    handleError(errorData, options = {}) {
        try {
            const {
                notify = this.enableUserNotifications,
                retry = false,
                suppress = false,
                level = 'error'
            } = options;

            // Enhance error data
            const enhancedError = this.enhanceErrorData(errorData);

            // Check if error should be suppressed
            if (suppress || this.shouldSuppressError(enhancedError)) {
                return;
            }

            // Classify error
            enhancedError.category = this.classifyError(enhancedError);

            // Update error counts
            this.updateErrorCounts(enhancedError);

            // Add to error queue
            this.addToErrorQueue(enhancedError);

            // Log error
            this.logError(enhancedError, level);

            // Send to analytics
            this.sendToAnalytics(enhancedError);

            // Handle specific error types
            this.handleSpecificError(enhancedError);

            // Notify user if needed
            if (notify && this.shouldNotifyUser(enhancedError)) {
                this.notifyUser(enhancedError);
            }

            // Attempt recovery
            this.attemptRecovery(enhancedError);

            // Retry if specified
            if (retry && this.shouldRetry(enhancedError)) {
                this.scheduleRetry(enhancedError, options);
            }

        } catch (handlerError) {
            // Fallback error handling to prevent infinite loops
            console.error('Error in error handler:', handlerError);

            if (config.isDebugMode()) {
                console.error('Original error:', errorData);
            }
        }
    }

    /**
     * Enhance error data with additional context
     */
    enhanceErrorData(errorData) {
        const enhanced = {
            ...errorData,
            id: this.generateErrorId(),
            timestamp: errorData.timestamp || Date.now(),
            sessionId: this.getSessionId(),
            userId: this.getUserId(),
            appVersion: config.getVersion(),
            environment: config.getEnvironment(),
            url: window.location.href,
            userAgent: navigator.userAgent,
            viewport: `${window.innerWidth}x${window.innerHeight}`,
            connection: this.getConnectionInfo(),
            memory: this.getMemoryInfo(),
            appState: this.getAppState()
        };

        // Add browser and device info
        enhanced.browserInfo = {
            language: navigator.language,
            platform: navigator.platform,
            cookieEnabled: navigator.cookieEnabled,
            onLine: navigator.onLine,
            deviceMemory: navigator.deviceMemory,
            hardwareConcurrency: navigator.hardwareConcurrency
        };

        return enhanced;
    }

    /**
     * Classify error type
     */
    classifyError(errorData) {
        const message = (errorData.message || '').toLowerCase();
        const stack = (errorData.stack || '').toLowerCase();
        const combinedText = `${message} ${stack}`;

        for (const [category, patterns] of this.errorPatterns) {
            if (patterns.some(pattern => pattern.test(combinedText))) {
                return category;
            }
        }

        return 'unknown';
    }

    /**
     * Check if error should be suppressed
     */
    shouldSuppressError(errorData) {
        // Suppress duplicate errors
        const errorSignature = this.getErrorSignature(errorData);

        if (this.suppressedErrors.has(errorSignature)) {
            return true;
        }

        // Suppress high-frequency errors
        const count = this.errorCounts.get(errorSignature) || 0;
        if (count > 10) {
            this.suppressedErrors.add(errorSignature);
            return true;
        }

        // Suppress certain error types in production
        if (config.getEnvironment() === 'production') {
            if (errorData.category === 'ui' && errorData.message?.includes('Script error')) {
                return true;
            }
        }

        return false;
    }

    /**
     * Update error counts
     */
    updateErrorCounts(errorData) {
        const signature = this.getErrorSignature(errorData);
        const currentCount = this.errorCounts.get(signature) || 0;
        this.errorCounts.set(signature, currentCount + 1);
    }

    /**
     * Get error signature for deduplication
     */
    getErrorSignature(errorData) {
        return `${errorData.type}_${errorData.message}_${errorData.filename || ''}_${errorData.lineno || ''}`;
    }

    /**
     * Add error to queue
     */
    addToErrorQueue(errorData) {
        this.errorQueue.push(errorData);

        // Limit queue size
        if (this.errorQueue.length > this.maxErrorQueue) {
            this.errorQueue.shift();
        }
    }

    /**
     * Log error with appropriate level
     */
    logError(errorData, level) {
        if (!this.enableConsoleLogging) return;

        const logMessage = this.formatErrorMessage(errorData);

        switch (level) {
            case 'debug':
                if (config.isDebugMode()) {
                    console.debug('🐛', logMessage, errorData);
                }
                break;
            case 'info':
                console.info('ℹ️', logMessage);
                break;
            case 'warn':
                console.warn('⚠️', logMessage);
                break;
            case 'error':
                console.error('❌', logMessage);
                if (config.isDebugMode()) {
                    console.error('Error details:', errorData);
                }
                break;
            case 'fatal':
                console.error('💥', logMessage);
                console.error('Fatal error details:', errorData);
                break;
        }
    }

    /**
     * Format error message for logging
     */
    formatErrorMessage(errorData) {
        const parts = [
            `[${errorData.category?.toUpperCase() || 'ERROR'}]`,
            errorData.message
        ];

        if (errorData.filename) {
            parts.push(`at ${errorData.filename}:${errorData.lineno || 0}`);
        }

        return parts.join(' ');
    }

    /**
     * Send error to analytics
     */
    sendToAnalytics(errorData) {
        if (!config.isFeatureEnabled('analytics')) return;

        try {
            analytics.logEvent('app_error', {
                error_type: errorData.type,
                error_category: errorData.category,
                error_message: errorData.message?.substring(0, 100), // Limit length
                error_filename: errorData.filename,
                error_line: errorData.lineno,
                app_version: errorData.appVersion,
                environment: errorData.environment,
                user_id: errorData.userId ? 'logged_in' : 'guest' // Don't send actual user ID
            });
        } catch (analyticsError) {
            console.warn('Failed to send error to analytics:', analyticsError);
        }
    }

    /**
     * Handle specific error types
     */
    handleSpecificError(errorData) {
        switch (errorData.category) {
            case 'network':
                this.handleNetworkError(errorData);
                break;
            case 'storage':
                this.handleStorageError(errorData);
                break;
            case 'memory':
                this.handleMemoryError(errorData);
                break;
            case 'security':
                this.handleSecurityError(errorData);
                break;
            default:
                // Generic handling
                break;
        }
    }

    /**
     * Handle network errors
     */
    handleNetworkError(errorData) {
        stateManager.setState('app.networkError', true);

        // Check if offline
        if (!navigator.onLine) {
            stateManager.setState('app.isOnline', false);
        }

        // Store failed request for retry
        if (errorData.request) {
            this.storeFailedRequest(errorData.request);
        }
    }

    /**
     * Handle storage errors
     */
    handleStorageError(errorData) {
        if (errorData.message?.includes('quota')) {
            // Storage quota exceeded
            this.handleStorageQuotaExceeded();
        }
    }

    /**
     * Handle memory errors
     */
    handleMemoryError(errorData) {
        // Clear some memory if possible
        this.performMemoryCleanup();

        // Notify performance monitor
        if (window.performanceMonitor) {
            window.performanceMonitor.recordMetric('memoryError', {
                message: errorData.message,
                timestamp: Date.now()
            });
        }
    }

    /**
     * Handle security errors
     */
    handleSecurityError(errorData) {
        console.warn('Security error detected:', errorData.message);

        // Log security event
        if (config.isFeatureEnabled('analytics')) {
            analytics.logEvent('security_error', {
                error_type: errorData.type,
                message: errorData.message?.substring(0, 50)
            });
        }
    }

    /**
     * Check if user should be notified
     */
    shouldNotifyUser(errorData) {
        // Don't notify for debug/info level errors
        if (['debug', 'info'].includes(errorData.level)) {
            return false;
        }

        // Don't notify for suppressed error types
        if (errorData.category === 'ui' && config.getEnvironment() === 'production') {
            return false;
        }

        // Don't spam user with notifications
        const recentErrors = this.errorQueue.filter(e =>
            Date.now() - e.timestamp < 60000 // Last minute
        ).length;

        return recentErrors < 5;
    }

    /**
     * Notify user of error
     */
    notifyUser(errorData) {
        let title, message, actions = [];

        switch (errorData.category) {
            case 'network':
                title = 'Problema di Connessione';
                message = 'Verifica la tua connessione internet e riprova.';
                actions = [{
                    text: 'Riprova',
                    onClick: () => window.location.reload(),
                    type: 'primary'
                }];
                break;

            case 'storage':
                title = 'Spazio di Archiviazione';
                message = 'Spazio di archiviazione insufficiente. Alcuni dati potrebbero non essere salvati.';
                actions = [{
                    text: 'Libera Spazio',
                    onClick: () => this.cleanupStorage(),
                    type: 'primary'
                }];
                break;

            case 'memory':
                title = 'Problemi di Performance';
                message = 'L\'app sta usando troppa memoria. Ricarica per migliorare le prestazioni.';
                actions = [{
                    text: 'Ricarica',
                    onClick: () => window.location.reload(),
                    type: 'primary'
                }];
                break;

            default:
                if (errorData.type === 'fatal') {
                    title = 'Errore Grave';
                    message = 'Si è verificato un errore grave. L\'app verrà ricaricata.';
                    actions = [{
                        text: 'Ricarica',
                        onClick: () => window.location.reload(),
                        type: 'primary'
                    }];
                } else {
                    title = 'Errore Imprevisto';
                    message = 'Si è verificato un errore imprevisto. Alcune funzioni potrebbero non funzionare correttamente.';
                }
                break;
        }

        notificationManager.error(title, message, {
            duration: errorData.type === 'fatal' ? 0 : 8000,
            actions
        });
    }

    /**
     * Attempt error recovery
     */
    attemptRecovery(errorData) {
        switch (errorData.category) {
            case 'storage':
                this.recoverFromStorageError();
                break;
            case 'memory':
                this.recoverFromMemoryError();
                break;
            case 'network':
                this.recoverFromNetworkError();
                break;
        }
    }

    /**
     * Setup error recovery mechanisms
     */
    setupErrorRecovery() {
        // Auto-recovery for network errors
        window.addEventListener('online', () => {
            this.retryFailedRequests();
        });

        // Periodic cleanup
        setInterval(() => {
            this.performMaintenanceCleanup();
        }, 5 * 60 * 1000); // Every 5 minutes
    }

    /**
     * Schedule retry for failed operations
     */
    scheduleRetry(errorData, options) {
        const signature = this.getErrorSignature(errorData);
        const attempts = this.retryAttempts.get(signature) || 0;

        if (attempts >= this.maxRetries) {
            console.warn('Max retry attempts reached for error:', signature);
            return;
        }

        this.retryAttempts.set(signature, attempts + 1);

        const delay = Math.min(1000 * Math.pow(2, attempts), 30000); // Exponential backoff, max 30s

        setTimeout(() => {
            if (options.retryCallback && typeof options.retryCallback === 'function') {
                try {
                    options.retryCallback();
                } catch (retryError) {
                    this.handleError({
                        type: 'retry',
                        message: 'Retry callback failed',
                        originalError: errorData,
                        retryError: retryError
                    });
                }
            }
        }, delay);
    }

    /**
     * Check if error should be retried
     */
    shouldRetry(errorData) {
        const signature = this.getErrorSignature(errorData);
        const attempts = this.retryAttempts.get(signature) || 0;

        if (attempts >= this.maxRetries) {
            return false;
        }

        // Only retry certain types of errors
        return ['network', 'storage'].includes(errorData.category);
    }

    /**
     * Setup periodic error reporting
     */
    setupPeriodicReporting() {
        setInterval(() => {
            this.generateErrorReport();
        }, 10 * 60 * 1000); // Every 10 minutes
    }

    /**
     * Generate error report
     */
    generateErrorReport() {
        if (this.errorQueue.length === 0) return;

        const report = {
            timestamp: Date.now(),
            totalErrors: this.errorQueue.length,
            errorsByCategory: this.getErrorsByCategory(),
            errorsByType: this.getErrorsByType(),
            topErrors: this.getTopErrors(5),
            systemInfo: this.getSystemInfo()
        };

        if (config.isDebugMode()) {
            console.log('📊 Error Report:', report);
        }

        // Send to remote logging service if enabled
        if (this.enableRemoteLogging) {
            this.sendToRemoteLogging(report);
        }
    }

    /**
     * Utility functions
     */
    generateErrorId() {
        return 'err_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    getSessionId() {
        return stateManager.getState('app.sessionId') || 'unknown';
    }

    getUserId() {
        const user = stateManager.getState('user.profile');
        return user?.id || null;
    }

    getConnectionInfo() {
        const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
        if (connection) {
            return {
                effectiveType: connection.effectiveType,
                downlink: connection.downlink,
                rtt: connection.rtt,
                saveData: connection.saveData
            };
        }
        return null;
    }

    getMemoryInfo() {
        if (performance.memory) {
            return {
                used: performance.memory.usedJSHeapSize,
                total: performance.memory.totalJSHeapSize,
                limit: performance.memory.jsHeapSizeLimit
            };
        }
        return null;
    }

    getAppState() {
        return {
            currentRoute: stateManager.getState('app.currentRoute'),
            isOnline: stateManager.getState('app.isOnline'),
            isLoading: stateManager.getState('app.isLoading'),
            workoutActive: stateManager.getState('workout.isActive')
        };
    }

    getErrorsByCategory() {
        const categories = {};
        this.errorQueue.forEach(error => {
            const category = error.category || 'unknown';
            categories[category] = (categories[category] || 0) + 1;
        });
        return categories;
    }

    getErrorsByType() {
        const types = {};
        this.errorQueue.forEach(error => {
            const type = error.type || 'unknown';
            types[type] = (types[type] || 0) + 1;
        });
        return types;
    }

    getTopErrors(limit) {
        const errorCounts = Array.from(this.errorCounts.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, limit);

        return errorCounts.map(([signature, count]) => ({
            signature,
            count,
            lastOccurrence: this.errorQueue
                .filter(e => this.getErrorSignature(e) === signature)
                .pop()?.timestamp
        }));
    }

    getSystemInfo() {
        return {
            userAgent: navigator.userAgent,
            language: navigator.language,
            platform: navigator.platform,
            viewport: `${window.innerWidth}x${window.innerHeight}`,
            memory: this.getMemoryInfo(),
            connection: this.getConnectionInfo()
        };
    }

    /**
     * Recovery functions
     */
    recoverFromStorageError() {
        try {
            // Clear some storage space
            this.cleanupStorage();
        } catch (error) {
            console.warn('Storage recovery failed:', error);
        }
    }

    recoverFromMemoryError() {
        try {
            // Perform memory cleanup
            this.performMemoryCleanup();
        } catch (error) {
            console.warn('Memory recovery failed:', error);
        }
    }

    recoverFromNetworkError() {
        // Network recovery is handled by retry mechanisms
        stateManager.setState('app.networkError', false);
    }

    cleanupStorage() {
        try {
            // Clear old logs, backups, etc.
            if (window.dataManager) {
                window.dataManager._cleanupOldData();
            }

            // Clear browser cache if possible
            if ('storage' in navigator && 'estimate' in navigator.storage) {
                navigator.storage.estimate().then(estimate => {
                    console.log('Storage after cleanup:', estimate);
                });
            }
        } catch (error) {
            console.warn('Storage cleanup failed:', error);
        }
    }

    performMemoryCleanup() {
        try {
            // Clear error queue partially
            if (this.errorQueue.length > 20) {
                this.errorQueue.splice(0, this.errorQueue.length - 20);
            }

            // Clear error counts
            if (this.errorCounts.size > 100) {
                const entries = Array.from(this.errorCounts.entries())
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 50);
                this.errorCounts.clear();
                entries.forEach(([key, value]) => this.errorCounts.set(key, value));
            }

            // Suggest garbage collection
            if (window.gc) {
                window.gc();
            }
        } catch (error) {
            console.warn('Memory cleanup failed:', error);
        }
    }

    performMaintenanceCleanup() {
        // Clear old retry attempts
        const now = Date.now();
        for (const [key, timestamp] of this.retryAttempts) {
            if (now - timestamp > 60000) { // 1 minute old
                this.retryAttempts.delete(key);
            }
        }

        // Clear old suppressed errors
        if (this.suppressedErrors.size > 100) {
            this.suppressedErrors.clear();
        }

        // Limit error queue size
        if (this.errorQueue.length > this.maxErrorQueue) {
            this.errorQueue.splice(0, this.errorQueue.length - this.maxErrorQueue);
        }
    }

    storeFailedRequest(request) {
        // Store failed requests for retry when connection is restored
        const failedRequests = JSON.parse(localStorage.getItem('failed_requests') || '[]');
        failedRequests.push({
            ...request,
            timestamp: Date.now()
        });

        // Limit stored requests
        if (failedRequests.length > 10) {
            failedRequests.splice(0, failedRequests.length - 10);
        }

        localStorage.setItem('failed_requests', JSON.stringify(failedRequests));
    }

    retryFailedRequests() {
        try {
            const failedRequests = JSON.parse(localStorage.getItem('failed_requests') || '[]');

            failedRequests.forEach(async (request) => {
                try {
                    // Retry the request
                    await fetch(request.url, request.options);
                } catch (error) {
                    console.warn('Failed to retry request:', request.url);
                }
            });

            // Clear successful retries
            localStorage.removeItem('failed_requests');
        } catch (error) {
            console.warn('Failed to retry requests:', error);
        }
    }

    handleStorageQuotaExceeded() {
        notificationManager.warning(
            'Spazio di Archiviazione Pieno',
            'Lo spazio di archiviazione è quasi pieno. Alcuni dati potrebbero non essere salvati.',
            {
                duration: 10000,
                actions: [{
                    text: 'Libera Spazio',
                    onClick: () => {
                        this.cleanupStorage();
                        notificationManager.success(
                            'Pulizia Completata',
                            'Spazio di archiviazione liberato con successo.'
                        );
                    },
                    type: 'primary'
                }]
            }
        );
    }

    sendToRemoteLogging(report) {
        // Mock remote logging - in production, send to actual logging service
        if (config.isDebugMode()) {
            console.log('📡 Would send to remote logging:', report);
        }
    }

    /**
     * Public API methods
     */

    // Log custom error
    logError(message, data = {}, level = 'error') {
        this.handleError({
            type: 'custom',
            message,
            ...data
        }, { level });
    }

    // Log warning
    logWarning(message, data = {}) {
        this.logError(message, data, 'warn');
    }

    // Log info
    logInfo(message, data = {}) {
        this.logError(message, data, 'info');
    }

    // Get error statistics
    getErrorStats() {
        return {
            totalErrors: this.errorQueue.length,
            errorsByCategory: this.getErrorsByCategory(),
            errorsByType: this.getErrorsByType(),
            suppressedCount: this.suppressedErrors.size,
            retryAttempts: this.retryAttempts.size
        };
    }

    // Clear error history
    clearErrors() {
        this.errorQueue.length = 0;
        this.errorCounts.clear();
        this.suppressedErrors.clear();
        this.retryAttempts.clear();
    }

    // Enable/disable features
    setLoggingLevel(level) {
        this.logLevel = level;
    }

    enableRemoteLogging() {
        this.enableRemoteLogging = true;
    }

    disableRemoteLogging() {
        this.enableRemoteLogging = false;
    }
}

// Create singleton instance
export const errorHandler = new ErrorHandler();

// Export for debugging in development
if (config.isDebugMode()) {
    window.errorHandler = errorHandler;
}

// Export convenience functions
export const logError = errorHandler.logError.bind(errorHandler);
export const logWarning = errorHandler.logWarning.bind(errorHandler);
export const logInfo = errorHandler.logInfo.bind(errorHandler);
