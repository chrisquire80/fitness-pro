/**
 * PerformanceMonitor.js
 * Performance monitoring and optimization system for Fitness Pro App
 * Tracks metrics like load times, memory usage, user interactions, and app responsiveness
 */

import { config } from './Config.js';
import { analytics } from '../services/Analytics.js';

class PerformanceMonitor {
    constructor() {
        this.metrics = new Map();
        this.observers = new Map();
        this.isEnabled = config.isFeatureEnabled('performance') || config.isDebugMode();
        this.reportingInterval = config.get('performance.reportingInterval', 60000); // 1 minute
        this.maxMetricsHistory = config.get('performance.maxHistory', 100);

        this.init();
    }

    init() {
        if (!this.isEnabled) return;

        // Initialize performance observers
        this.initPerformanceObservers();

        // Start monitoring
        this.startResourceMonitoring();
        this.startMemoryMonitoring();
        this.startUserInteractionMonitoring();
        this.startNetworkMonitoring();

        // Set up periodic reporting
        this.startPeriodicReporting();

        // Monitor page load performance
        this.measurePageLoad();

        // Set up visibility change monitoring
        this.setupVisibilityMonitoring();

        if (config.isDebugMode()) {
            console.log('📊 PerformanceMonitor initialized');
            window.performanceMonitor = this;
        }
    }

    /**
     * Initialize Performance API observers
     */
    initPerformanceObservers() {
        // Long Task Observer - tracks blocking tasks > 50ms
        if ('PerformanceObserver' in window) {
            try {
                const longTaskObserver = new PerformanceObserver((list) => {
                    list.getEntries().forEach((entry) => {
                        this.recordMetric('longTask', {
                            duration: entry.duration,
                            startTime: entry.startTime,
                            timestamp: Date.now()
                        });

                        if (entry.duration > 100) {
                            console.warn(`Long task detected: ${entry.duration}ms`);
                        }
                    });
                });

                longTaskObserver.observe({ entryTypes: ['longtask'] });
                this.observers.set('longtask', longTaskObserver);
            } catch (error) {
                console.warn('Long Task Observer not supported:', error);
            }

            // Layout Shift Observer - tracks visual stability
            try {
                const layoutShiftObserver = new PerformanceObserver((list) => {
                    let cls = 0;
                    list.getEntries().forEach((entry) => {
                        if (!entry.hadRecentInput) {
                            cls += entry.value;
                        }
                    });

                    if (cls > 0) {
                        this.recordMetric('cumulativeLayoutShift', {
                            value: cls,
                            timestamp: Date.now()
                        });
                    }
                });

                layoutShiftObserver.observe({ entryTypes: ['layout-shift'] });
                this.observers.set('layout-shift', layoutShiftObserver);
            } catch (error) {
                console.warn('Layout Shift Observer not supported:', error);
            }

            // First Input Delay Observer
            try {
                const fidObserver = new PerformanceObserver((list) => {
                    list.getEntries().forEach((entry) => {
                        this.recordMetric('firstInputDelay', {
                            delay: entry.processingStart - entry.startTime,
                            timestamp: Date.now()
                        });
                    });
                });

                fidObserver.observe({ entryTypes: ['first-input'] });
                this.observers.set('first-input', fidObserver);
            } catch (error) {
                console.warn('First Input Delay Observer not supported:', error);
            }
        }
    }

    /**
     * Monitor resource loading performance
     */
    startResourceMonitoring() {
        const checkResources = () => {
            if (performance.getEntriesByType) {
                const resources = performance.getEntriesByType('resource');
                const slowResources = resources.filter(resource =>
                    resource.duration > 1000 && // > 1 second
                    resource.initiatorType !== 'beacon'
                );

                slowResources.forEach(resource => {
                    this.recordMetric('slowResource', {
                        name: resource.name,
                        duration: resource.duration,
                        size: resource.transferSize || 0,
                        type: resource.initiatorType,
                        timestamp: Date.now()
                    });
                });
            }
        };

        // Check resources periodically
        setInterval(checkResources, 30000); // Every 30 seconds
    }

    /**
     * Monitor memory usage
     */
    startMemoryMonitoring() {
        const checkMemory = () => {
            if (performance.memory) {
                const memory = {
                    used: performance.memory.usedJSHeapSize,
                    total: performance.memory.totalJSHeapSize,
                    limit: performance.memory.jsHeapSizeLimit,
                    usage: (performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit) * 100,
                    timestamp: Date.now()
                };

                this.recordMetric('memoryUsage', memory);

                // Alert if memory usage is high
                if (memory.usage > 80) {
                    console.warn(`High memory usage: ${memory.usage.toFixed(2)}%`);

                    if (config.isFeatureEnabled('analytics')) {
                        analytics.logEvent('high_memory_usage', {
                            usage_percent: memory.usage,
                            used_mb: Math.round(memory.used / (1024 * 1024))
                        });
                    }
                }
            }
        };

        // Check memory every minute
        setInterval(checkMemory, 60000);
        // Initial check
        checkMemory();
    }

    /**
     * Monitor user interactions
     */
    startUserInteractionMonitoring() {
        let interactionCount = 0;
        let lastInteractionTime = Date.now();

        const trackInteraction = (type) => {
            return (event) => {
                const now = Date.now();
                interactionCount++;

                this.recordMetric('userInteraction', {
                    type,
                    target: event.target.tagName,
                    timeSinceLastInteraction: now - lastInteractionTime,
                    totalInteractions: interactionCount,
                    timestamp: now
                });

                lastInteractionTime = now;

                // Track interaction responsiveness
                const startTime = performance.now();
                requestAnimationFrame(() => {
                    const responseTime = performance.now() - startTime;
                    if (responseTime > 16) { // > 1 frame at 60fps
                        this.recordMetric('interactionDelay', {
                            type,
                            delay: responseTime,
                            timestamp: now
                        });
                    }
                });
            };
        };

        // Track various interaction types
        ['click', 'touchstart', 'keydown', 'scroll'].forEach(eventType => {
            document.addEventListener(eventType, trackInteraction(eventType), { passive: true });
        });

        // Track navigation timing
        const trackNavigation = () => {
            if (performance.navigation) {
                this.recordMetric('navigationType', {
                    type: performance.navigation.type,
                    redirectCount: performance.navigation.redirectCount,
                    timestamp: Date.now()
                });
            }
        };

        window.addEventListener('load', trackNavigation);
    }

    /**
     * Monitor network performance
     */
    startNetworkMonitoring() {
        const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;

        if (connection) {
            const recordConnectionInfo = () => {
                this.recordMetric('networkInfo', {
                    effectiveType: connection.effectiveType,
                    downlink: connection.downlink,
                    rtt: connection.rtt,
                    saveData: connection.saveData,
                    timestamp: Date.now()
                });
            };

            // Record initial connection info
            recordConnectionInfo();

            // Listen for connection changes
            connection.addEventListener('change', recordConnectionInfo);
        }

        // Monitor fetch/XHR performance
        const originalFetch = window.fetch;
        if (originalFetch) {
            window.fetch = async (...args) => {
                const startTime = performance.now();
                const url = args[0];

                try {
                    const response = await originalFetch.apply(this, args);
                    const duration = performance.now() - startTime;

                    this.recordMetric('networkRequest', {
                        url: typeof url === 'string' ? url : url.url,
                        method: args[1]?.method || 'GET',
                        status: response.status,
                        duration,
                        success: response.ok,
                        timestamp: Date.now()
                    });

                    return response;
                } catch (error) {
                    const duration = performance.now() - startTime;

                    this.recordMetric('networkRequest', {
                        url: typeof url === 'string' ? url : url.url,
                        method: args[1]?.method || 'GET',
                        duration,
                        success: false,
                        error: error.message,
                        timestamp: Date.now()
                    });

                    throw error;
                }
            };
        }
    }

    /**
     * Set up visibility change monitoring
     */
    setupVisibilityMonitoring() {
        let visibilityStart = Date.now();

        document.addEventListener('visibilitychange', () => {
            const now = Date.now();

            if (document.hidden) {
                // Page became hidden
                const visibleTime = now - visibilityStart;
                this.recordMetric('pageVisibility', {
                    state: 'hidden',
                    visibleDuration: visibleTime,
                    timestamp: now
                });
            } else {
                // Page became visible
                this.recordMetric('pageVisibility', {
                    state: 'visible',
                    timestamp: now
                });
                visibilityStart = now;
            }
        });
    }

    /**
     * Measure page load performance
     */
    measurePageLoad() {
        window.addEventListener('load', () => {
            setTimeout(() => {
                const timing = performance.timing;
                const navigation = performance.getEntriesByType('navigation')[0];

                if (timing) {
                    const metrics = {
                        // Basic timing metrics
                        domContentLoaded: timing.domContentLoadedEventEnd - timing.navigationStart,
                        loadComplete: timing.loadEventEnd - timing.navigationStart,
                        domReady: timing.domComplete - timing.navigationStart,

                        // Network timing
                        dnsLookup: timing.domainLookupEnd - timing.domainLookupStart,
                        tcpConnect: timing.connectEnd - timing.connectStart,
                        serverResponse: timing.responseEnd - timing.requestStart,

                        // Resource timing
                        domProcessing: timing.domComplete - timing.domLoading,

                        timestamp: Date.now()
                    };

                    this.recordMetric('pageLoadTiming', metrics);

                    // Record Core Web Vitals
                    if (navigation) {
                        this.recordMetric('coreWebVitals', {
                            lcp: navigation.loadEventEnd - navigation.startTime, // Approximation
                            fid: 0, // Will be updated by observer
                            cls: 0, // Will be updated by observer
                            timestamp: Date.now()
                        });
                    }
                }

                // Measure Largest Contentful Paint
                if ('PerformanceObserver' in window) {
                    try {
                        const lcpObserver = new PerformanceObserver((list) => {
                            const entries = list.getEntries();
                            const lastEntry = entries[entries.length - 1];

                            this.recordMetric('largestContentfulPaint', {
                                value: lastEntry.startTime,
                                timestamp: Date.now()
                            });
                        });

                        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
                        this.observers.set('lcp', lcpObserver);
                    } catch (error) {
                        console.warn('LCP Observer not supported:', error);
                    }
                }
            }, 0);
        });
    }

    /**
     * Record a performance metric
     */
    recordMetric(name, data) {
        if (!this.metrics.has(name)) {
            this.metrics.set(name, []);
        }

        const metricArray = this.metrics.get(name);
        metricArray.push(data);

        // Limit history size
        if (metricArray.length > this.maxMetricsHistory) {
            metricArray.shift();
        }

        // Log significant metrics in debug mode
        if (config.isDebugMode()) {
            if (name === 'longTask' && data.duration > 100) {
                console.warn(`📊 Long task: ${data.duration}ms`);
            }
            if (name === 'slowResource' && data.duration > 2000) {
                console.warn(`📊 Slow resource: ${data.name} (${data.duration}ms)`);
            }
        }
    }

    /**
     * Get metrics by name
     */
    getMetrics(name) {
        return this.metrics.get(name) || [];
    }

    /**
     * Get all metrics
     */
    getAllMetrics() {
        const result = {};
        this.metrics.forEach((value, key) => {
            result[key] = value;
        });
        return result;
    }

    /**
     * Get performance summary
     */
    getPerformanceSummary() {
        const summary = {
            timestamp: Date.now(),
            metrics: {}
        };

        // Calculate averages and totals for key metrics
        this.metrics.forEach((values, name) => {
            if (values.length === 0) return;

            switch (name) {
                case 'longTask':
                    const longTasks = values.filter(v => v.duration > 50);
                    summary.metrics.longTasks = {
                        count: longTasks.length,
                        averageDuration: longTasks.reduce((sum, v) => sum + v.duration, 0) / longTasks.length || 0,
                        maxDuration: Math.max(...longTasks.map(v => v.duration))
                    };
                    break;

                case 'memoryUsage':
                    const latest = values[values.length - 1];
                    summary.metrics.memory = {
                        current: latest,
                        peak: Math.max(...values.map(v => v.usage))
                    };
                    break;

                case 'userInteraction':
                    summary.metrics.interactions = {
                        total: values.length,
                        types: this.countByProperty(values, 'type')
                    };
                    break;

                case 'networkRequest':
                    const requests = values.filter(v => v.success !== undefined);
                    const successful = requests.filter(v => v.success);
                    summary.metrics.network = {
                        totalRequests: requests.length,
                        successRate: successful.length / requests.length * 100,
                        averageResponseTime: requests.reduce((sum, v) => sum + v.duration, 0) / requests.length || 0
                    };
                    break;

                case 'pageLoadTiming':
                    const timing = values[values.length - 1];
                    if (timing) {
                        summary.metrics.pageLoad = timing;
                    }
                    break;
            }
        });

        return summary;
    }

    /**
     * Start periodic reporting
     */
    startPeriodicReporting() {
        setInterval(() => {
            const summary = this.getPerformanceSummary();

            if (config.isFeatureEnabled('analytics')) {
                // Report to analytics (sanitized)
                analytics.logEvent('performance_report', {
                    long_tasks: summary.metrics.longTasks?.count || 0,
                    memory_usage: Math.round(summary.metrics.memory?.current?.usage || 0),
                    interaction_count: summary.metrics.interactions?.total || 0,
                    network_success_rate: Math.round(summary.metrics.network?.successRate || 100),
                    page_load_time: Math.round(summary.metrics.pageLoad?.loadComplete || 0)
                });
            }

            if (config.isDebugMode()) {
                console.log('📊 Performance Report:', summary);
            }
        }, this.reportingInterval);
    }

    /**
     * Measure function execution time
     */
    measureFunction(fn, name) {
        return (...args) => {
            const startTime = performance.now();
            const result = fn.apply(this, args);

            if (result instanceof Promise) {
                return result.finally(() => {
                    const duration = performance.now() - startTime;
                    this.recordMetric('functionExecution', {
                        name,
                        duration,
                        isAsync: true,
                        timestamp: Date.now()
                    });
                });
            } else {
                const duration = performance.now() - startTime;
                this.recordMetric('functionExecution', {
                    name,
                    duration,
                    isAsync: false,
                    timestamp: Date.now()
                });
                return result;
            }
        };
    }

    /**
     * Mark custom timing
     */
    mark(name) {
        if (performance.mark) {
            performance.mark(name);
        }

        this.recordMetric('customMark', {
            name,
            timestamp: Date.now()
        });
    }

    /**
     * Measure time between marks
     */
    measure(name, startMark, endMark) {
        if (performance.measure && startMark && endMark) {
            try {
                performance.measure(name, startMark, endMark);
                const measure = performance.getEntriesByName(name, 'measure')[0];

                if (measure) {
                    this.recordMetric('customMeasure', {
                        name,
                        duration: measure.duration,
                        timestamp: Date.now()
                    });
                }
            } catch (error) {
                console.warn('Performance measure failed:', error);
            }
        }
    }

    /**
     * Get recommendations based on performance metrics
     */
    getRecommendations() {
        const recommendations = [];
        const summary = this.getPerformanceSummary();

        // Long tasks recommendation
        if (summary.metrics.longTasks?.count > 5) {
            recommendations.push({
                type: 'performance',
                priority: 'high',
                title: 'Riduci Task Lunghi',
                description: `Rilevati ${summary.metrics.longTasks.count} task che bloccano il main thread. Considera di ottimizzare il codice JavaScript.`
            });
        }

        // Memory usage recommendation
        if (summary.metrics.memory?.current?.usage > 70) {
            recommendations.push({
                type: 'memory',
                priority: 'medium',
                title: 'Utilizzo Memoria Alto',
                description: `Utilizzo memoria al ${Math.round(summary.metrics.memory.current.usage)}%. Considera di ottimizzare l'uso della memoria.`
            });
        }

        // Network recommendation
        if (summary.metrics.network?.successRate < 95) {
            recommendations.push({
                type: 'network',
                priority: 'medium',
                title: 'Errori di Rete',
                description: `Tasso di successo richieste: ${Math.round(summary.metrics.network.successRate)}%. Implementa retry logic.`
            });
        }

        // Page load recommendation
        if (summary.metrics.pageLoad?.loadComplete > 3000) {
            recommendations.push({
                type: 'loading',
                priority: 'high',
                title: 'Caricamento Lento',
                description: `Tempo di caricamento: ${Math.round(summary.metrics.pageLoad.loadComplete)}ms. Ottimizza risorse e caricamento.`
            });
        }

        return recommendations;
    }

    /**
     * Export performance data
     */
    exportData() {
        return {
            timestamp: Date.now(),
            environment: config.getEnvironment(),
            userAgent: navigator.userAgent,
            metrics: this.getAllMetrics(),
            summary: this.getPerformanceSummary(),
            recommendations: this.getRecommendations()
        };
    }

    /**
     * Helper function to count by property
     */
    countByProperty(array, property) {
        return array.reduce((counts, item) => {
            const value = item[property];
            counts[value] = (counts[value] || 0) + 1;
            return counts;
        }, {});
    }

    /**
     * Clear all metrics
     */
    clearMetrics() {
        this.metrics.clear();
        if (config.isDebugMode()) {
            console.log('📊 Performance metrics cleared');
        }
    }

    /**
     * Disable monitoring
     */
    disable() {
        this.isEnabled = false;

        // Disconnect observers
        this.observers.forEach((observer) => {
            observer.disconnect();
        });
        this.observers.clear();

        if (config.isDebugMode()) {
            console.log('📊 PerformanceMonitor disabled');
        }
    }

    /**
     * Enable monitoring
     */
    enable() {
        this.isEnabled = true;
        this.init();

        if (config.isDebugMode()) {
            console.log('📊 PerformanceMonitor enabled');
        }
    }
}

// Create singleton instance
export const performanceMonitor = new PerformanceMonitor();

// Export for global access in debug mode
if (config.isDebugMode()) {
    window.performanceMonitor = performanceMonitor;
}
