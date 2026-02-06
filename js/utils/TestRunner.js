/**
 * TestRunner.js
 * Automated Testing System for Fitness Pro App
 * Runs comprehensive tests on all app functionalities
 */

class TestRunner {
  constructor() {
    this.tests = [];
    this.results = [];
    this.isRunning = false;
    this.currentTest = null;
    this.testContainer = null;
  }

  /**
   * Initialize test runner and create UI
   */
  init() {
    this.createTestUI();
    this.registerTests();
    console.log("🧪 TestRunner initialized with", this.tests.length, "tests");
  }

  /**
   * Create test UI overlay
   */
  createTestUI() {
    this.testContainer = document.createElement("div");
    this.testContainer.id = "test-runner";
    this.testContainer.innerHTML = `
            <div class="test-overlay">
                <div class="test-panel">
                    <div class="test-header">
                        <h3>🧪 Fitness Pro Test Suite</h3>
                        <button class="test-close" onclick="testRunner.hideTestUI()">×</button>
                    </div>
                    <div class="test-controls">
                        <button class="test-btn run-all" onclick="testRunner.runAllTests()">Run All Tests</button>
                        <button class="test-btn run-critical" onclick="testRunner.runCriticalTests()">Run Critical Only</button>
                        <button class="test-btn clear-results" onclick="testRunner.clearResults()">Clear Results</button>
                    </div>
                    <div class="test-progress">
                        <div class="progress-bar">
                            <div class="progress-fill" id="test-progress-fill"></div>
                        </div>
                        <div class="progress-text" id="test-progress-text">Ready to run tests</div>
                    </div>
                    <div class="test-results" id="test-results">
                        <div class="test-placeholder">Click "Run All Tests" to start testing</div>
                    </div>
                </div>
            </div>
            <style>
                .test-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.9);
                    z-index: 9999;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 1rem;
                }
                .test-panel {
                    background: var(--bg-secondary);
                    border-radius: var(--radius-lg);
                    width: 100%;
                    max-width: 800px;
                    max-height: 90vh;
                    display: flex;
                    flex-direction: column;
                    border: 1px solid var(--accent-primary);
                    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
                }
                .test-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 1.5rem;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                    background: var(--accent-primary);
                    border-radius: var(--radius-lg) var(--radius-lg) 0 0;
                }
                .test-header h3 {
                    margin: 0;
                    color: white;
                    font-size: 1.2rem;
                }
                .test-close {
                    background: none;
                    border: none;
                    color: white;
                    font-size: 1.5rem;
                    cursor: pointer;
                    padding: 0.25rem;
                    width: 30px;
                    height: 30px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 50%;
                    transition: background 0.2s;
                }
                .test-close:hover {
                    background: rgba(255, 255, 255, 0.2);
                }
                .test-controls {
                    padding: 1rem 1.5rem;
                    display: flex;
                    gap: 0.5rem;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                }
                .test-btn {
                    padding: 0.5rem 1rem;
                    border: 1px solid var(--accent-primary);
                    background: transparent;
                    color: var(--accent-primary);
                    border-radius: var(--radius-sm);
                    cursor: pointer;
                    font-size: 0.9rem;
                    transition: all 0.2s;
                }
                .test-btn:hover {
                    background: var(--accent-primary);
                    color: white;
                }
                .test-btn:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }
                .test-progress {
                    padding: 1rem 1.5rem;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                }
                .progress-bar {
                    background: var(--bg-card);
                    height: 8px;
                    border-radius: 4px;
                    overflow: hidden;
                    margin-bottom: 0.5rem;
                }
                .progress-fill {
                    background: var(--accent-primary);
                    height: 100%;
                    width: 0%;
                    transition: width 0.3s ease;
                }
                .progress-text {
                    font-size: 0.9rem;
                    color: var(--text-secondary);
                }
                .test-results {
                    flex: 1;
                    padding: 1rem 1.5rem;
                    overflow-y: auto;
                    max-height: 400px;
                }
                .test-placeholder {
                    text-align: center;
                    color: var(--text-secondary);
                    padding: 2rem;
                    font-style: italic;
                }
                .test-result {
                    display: flex;
                    align-items: center;
                    padding: 0.75rem;
                    margin-bottom: 0.5rem;
                    border-radius: var(--radius-sm);
                    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
                    font-size: 0.85rem;
                }
                .test-result.pass {
                    background: rgba(16, 185, 129, 0.1);
                    border-left: 3px solid #10b981;
                    color: #34d399;
                }
                .test-result.fail {
                    background: rgba(239, 68, 68, 0.1);
                    border-left: 3px solid #ef4444;
                    color: #fca5a5;
                }
                .test-result.skip {
                    background: rgba(107, 114, 128, 0.1);
                    border-left: 3px solid #6b7280;
                    color: #9ca3af;
                }
                .test-icon {
                    margin-right: 0.75rem;
                    font-size: 1rem;
                }
                .test-name {
                    flex: 1;
                    font-weight: 500;
                }
                .test-time {
                    color: var(--text-secondary);
                    font-size: 0.8rem;
                }
                .test-error {
                    margin-top: 0.5rem;
                    padding: 0.5rem;
                    background: rgba(0, 0, 0, 0.3);
                    border-radius: 4px;
                    font-size: 0.8rem;
                    color: #fca5a5;
                    white-space: pre-wrap;
                }
                .test-summary {
                    padding: 1rem 1.5rem;
                    border-top: 1px solid rgba(255, 255, 255, 0.1);
                    display: flex;
                    justify-content: space-between;
                    font-size: 0.9rem;
                }
                .test-stats {
                    display: flex;
                    gap: 1rem;
                }
                .test-stat {
                    display: flex;
                    align-items: center;
                    gap: 0.25rem;
                }
                .test-stat.pass { color: #10b981; }
                .test-stat.fail { color: #ef4444; }
                .test-stat.skip { color: #6b7280; }
            </style>
        `;

    document.body.appendChild(this.testContainer);
    this.testContainer.style.display = "none";
  }

  /**
   * Register all tests
   */
  registerTests() {
    // Configuration Tests
    this.addTest("Config System", this.testConfig, "critical");

    // State Management Tests
    this.addTest("State Manager", this.testStateManager, "critical");

    // Data Manager Tests
    this.addTest("Data Manager", this.testDataManager, "critical");

    // Authentication Tests
    this.addTest("Auth Service", this.testAuthService, "critical");

    // Router Tests
    this.addTest("Router System", this.testRouter, "critical");

    // Error Handler Tests
    this.addTest("Error Handler", this.testErrorHandler, "normal");

    // Performance Monitor Tests
    this.addTest("Performance Monitor", this.testPerformanceMonitor, "normal");

    // Backup Service Tests
    this.addTest("Backup Service", this.testBackupService, "normal");

    // Notification System Tests
    this.addTest(
      "Notification Manager",
      this.testNotificationManager,
      "normal",
    );

    // UI Components Tests
    this.addTest("UI Components", this.testUIComponents, "normal");

    // PWA Features Tests
    this.addTest("PWA Features", this.testPWAFeatures, "normal");

    // Storage Tests
    this.addTest("Local Storage", this.testLocalStorage, "critical");

    // Network Tests
    this.addTest("Network Handling", this.testNetworkHandling, "normal");

    // Integration Tests
    this.addTest("Full Integration", this.testIntegration, "critical");
  }

  /**
   * Add a test to the suite
   */
  addTest(name, testFunction, priority = "normal") {
    this.tests.push({
      name,
      testFunction,
      priority,
      id: this.generateTestId(),
    });
  }

  /**
   * Run all tests
   */
  async runAllTests() {
    if (this.isRunning) return;

    this.isRunning = true;
    this.results = [];
    this.updateProgress(0, "Starting tests...");
    this.clearResultsDisplay();

    for (let i = 0; i < this.tests.length; i++) {
      const test = this.tests[i];
      this.currentTest = test;

      this.updateProgress(
        (i / this.tests.length) * 100,
        `Running: ${test.name}`,
      );

      await this.runSingleTest(test);
      await this.delay(100); // Small delay for UI updates
    }

    this.updateProgress(100, "All tests completed");
    this.displaySummary();
    this.isRunning = false;
    this.currentTest = null;
  }

  /**
   * Run only critical tests
   */
  async runCriticalTests() {
    if (this.isRunning) return;

    const criticalTests = this.tests.filter((t) => t.priority === "critical");

    this.isRunning = true;
    this.results = [];
    this.updateProgress(0, "Starting critical tests...");
    this.clearResultsDisplay();

    for (let i = 0; i < criticalTests.length; i++) {
      const test = criticalTests[i];
      this.currentTest = test;

      this.updateProgress(
        (i / criticalTests.length) * 100,
        `Running: ${test.name}`,
      );

      await this.runSingleTest(test);
      await this.delay(100);
    }

    this.updateProgress(100, "Critical tests completed");
    this.displaySummary();
    this.isRunning = false;
    this.currentTest = null;
  }

  /**
   * Run a single test
   */
  async runSingleTest(test) {
    const startTime = performance.now();
    let result;

    try {
      await test.testFunction();
      result = {
        name: test.name,
        status: "pass",
        time: Math.round(performance.now() - startTime),
        error: null,
      };
    } catch (error) {
      result = {
        name: test.name,
        status: "fail",
        time: Math.round(performance.now() - startTime),
        error: error.message + "\n" + (error.stack || ""),
      };
    }

    this.results.push(result);
    this.displayTestResult(result);
  }

  /**
   * Individual test functions
   */
  async testConfig() {
    if (!window.fitnessApp?.config) {
      throw new Error("Config system not available");
    }

    const version = window.fitnessApp.config.app?.version;
    if (!version) {
      throw new Error("App version not configured");
    }

    const environment = window.fitnessApp.config.environment;
    if (!environment) {
      throw new Error("Environment not detected");
    }
  }

  async testStateManager() {
    if (!window.fitnessApp?.getState) {
      throw new Error("State manager not available");
    }

    // Test state get/set
    const testKey = "test.value";
    const testValue = "test-" + Date.now();

    window.fitnessApp.setState(testKey, testValue);
    const retrievedValue = window.fitnessApp.getState(testKey);

    if (retrievedValue !== testValue) {
      throw new Error("State get/set test failed");
    }
  }

  async testDataManager() {
    if (!window.dataManager) {
      throw new Error("DataManager not available");
    }

    // Test basic data operations
    const exercises = window.dataManager.getExercises();
    if (!Array.isArray(exercises)) {
      throw new Error("Exercises data not properly loaded");
    }

    const workouts = window.dataManager.getWorkouts();
    if (!Array.isArray(workouts)) {
      throw new Error("Workouts data not properly loaded");
    }
  }

  async testAuthService() {
    if (!window.authService) {
      throw new Error("AuthService not available");
    }

    // Test auth methods exist
    const methods = ["getCurrentUser", "isAuthenticated", "createAccount"];
    for (const method of methods) {
      if (typeof window.authService[method] !== "function") {
        throw new Error(`AuthService method ${method} not available`);
      }
    }
  }

  async testRouter() {
    if (!window.fitnessApp?.router) {
      throw new Error("Router not available");
    }

    // Test navigation
    const currentPath = window.fitnessApp.getCurrentPath();
    if (typeof currentPath !== "string") {
      throw new Error("Router getCurrentPath failed");
    }
  }

  async testErrorHandler() {
    if (!window.errorHandler) {
      throw new Error("ErrorHandler not available");
    }

    // Test error logging
    window.errorHandler.logInfo("Test log message");

    const stats = window.errorHandler.getErrorStats();
    if (!stats || typeof stats.totalErrors !== "number") {
      throw new Error("Error stats not available");
    }
  }

  async testPerformanceMonitor() {
    if (!window.performanceMonitor) {
      throw new Error("PerformanceMonitor not available");
    }

    // Test performance methods
    const summary = window.performanceMonitor.getPerformanceSummary();
    if (!summary || !summary.timestamp) {
      throw new Error("Performance summary not available");
    }
  }

  async testBackupService() {
    if (!window.backupService) {
      throw new Error("BackupService not available");
    }

    // Test backup methods
    const stats = window.backupService.getBackupStats();
    if (!stats || typeof stats.totalBackups !== "number") {
      throw new Error("Backup stats not available");
    }
  }

  async testNotificationManager() {
    if (!window.notificationManager) {
      throw new Error("NotificationManager not available");
    }

    // Test notification creation (but hide immediately)
    const id = window.notificationManager.info("Test", "Test notification", {
      duration: 1,
    });
    if (!id) {
      throw new Error("Notification creation failed");
    }

    // Clean up
    window.notificationManager.dismiss(id);
  }

  async testUIComponents() {
    // Test DOM elements
    const requiredElements = ["app", "main-content", "navbar"];
    for (const elementId of requiredElements) {
      const element = document.getElementById(elementId);
      if (!element) {
        throw new Error(`Required element #${elementId} not found`);
      }
    }

    // Test CSS variables
    const computedStyle = getComputedStyle(document.documentElement);
    const primaryColor = computedStyle.getPropertyValue("--accent-primary");
    if (!primaryColor || primaryColor.trim() === "") {
      throw new Error("CSS variables not loaded properly");
    }
  }

  async testPWAFeatures() {
    // Test Service Worker
    if (!("serviceWorker" in navigator)) {
      throw new Error("Service Worker not supported");
    }

    // Test Manifest
    const manifestLink = document.querySelector('link[rel="manifest"]');
    if (!manifestLink) {
      throw new Error("Web App Manifest not found");
    }

    // Test Web App Capable
    const webAppCapable = document.querySelector(
      'meta[name="apple-mobile-web-app-capable"]',
    );
    if (!webAppCapable) {
      throw new Error("Apple Web App meta tags not found");
    }
  }

  async testLocalStorage() {
    // Test localStorage availability
    if (!window.localStorage) {
      throw new Error("localStorage not available");
    }

    // Test read/write
    const testKey = "fitness_test_" + Date.now();
    const testValue = "test-value";

    localStorage.setItem(testKey, testValue);
    const retrieved = localStorage.getItem(testKey);

    if (retrieved !== testValue) {
      throw new Error("localStorage read/write test failed");
    }

    // Clean up
    localStorage.removeItem(testKey);
  }

  async testNetworkHandling() {
    // Test online status
    const isOnline = navigator.onLine;
    if (typeof isOnline !== "boolean") {
      throw new Error("Network status detection failed");
    }

    // Test fetch capability
    if (typeof fetch !== "function") {
      throw new Error("Fetch API not available");
    }
  }

  async testIntegration() {
    // Test that all major systems work together
    const systems = [
      "fitnessApp",
      "dataManager",
      "stateManager",
      "authService",
      "errorHandler",
      "performanceMonitor",
      "backupService",
      "notificationManager",
    ];

    for (const system of systems) {
      if (!window[system]) {
        throw new Error(
          `Integration test failed: ${system} not available globally`,
        );
      }
    }

    // Test that fitnessApp has all expected methods
    const expectedMethods = [
      "getState",
      "setState",
      "navigateTo",
      "showNotification",
    ];
    for (const method of expectedMethods) {
      if (typeof window.fitnessApp[method] !== "function") {
        throw new Error(
          `Integration test failed: fitnessApp.${method} not available`,
        );
      }
    }
  }

  /**
   * UI Methods
   */
  showTestUI() {
    this.testContainer.style.display = "flex";
  }

  hideTestUI() {
    this.testContainer.style.display = "none";
  }

  updateProgress(percentage, text) {
    const fill = document.getElementById("test-progress-fill");
    const textElement = document.getElementById("test-progress-text");

    if (fill) fill.style.width = percentage + "%";
    if (textElement) textElement.textContent = text;
  }

  displayTestResult(result) {
    const resultsContainer = document.getElementById("test-results");
    if (!resultsContainer) return;

    // Remove placeholder if it exists
    const placeholder = resultsContainer.querySelector(".test-placeholder");
    if (placeholder) placeholder.remove();

    const resultElement = document.createElement("div");
    resultElement.className = `test-result ${result.status}`;

    const icon =
      result.status === "pass" ? "✅" : result.status === "fail" ? "❌" : "⏭️";

    resultElement.innerHTML = `
            <span class="test-icon">${icon}</span>
            <span class="test-name">${result.name}</span>
            <span class="test-time">${result.time}ms</span>
            ${result.error ? `<div class="test-error">${result.error}</div>` : ""}
        `;

    resultsContainer.appendChild(resultElement);
    resultsContainer.scrollTop = resultsContainer.scrollHeight;
  }

  displaySummary() {
    const resultsContainer = document.getElementById("test-results");
    if (!resultsContainer) return;

    const passed = this.results.filter((r) => r.status === "pass").length;
    const failed = this.results.filter((r) => r.status === "fail").length;
    const skipped = this.results.filter((r) => r.status === "skip").length;
    const totalTime = this.results.reduce((sum, r) => sum + r.time, 0);

    const summaryElement = document.createElement("div");
    summaryElement.className = "test-summary";
    summaryElement.innerHTML = `
            <div class="test-stats">
                <div class="test-stat pass">✅ ${passed} Passed</div>
                <div class="test-stat fail">❌ ${failed} Failed</div>
                <div class="test-stat skip">⏭️ ${skipped} Skipped</div>
            </div>
            <div class="test-time">Total: ${totalTime}ms</div>
        `;

    resultsContainer.appendChild(summaryElement);
  }

  clearResults() {
    this.results = [];
    this.clearResultsDisplay();
  }

  clearResultsDisplay() {
    const resultsContainer = document.getElementById("test-results");
    if (resultsContainer) {
      resultsContainer.innerHTML =
        '<div class="test-placeholder">Running tests...</div>';
    }
  }

  /**
   * Utility methods
   */
  generateTestId() {
    return "test_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
  }

  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Public API
   */
  getResults() {
    return this.results;
  }

  exportResults() {
    const report = {
      timestamp: new Date().toISOString(),
      environment: window.fitnessApp?.config?.environment || "unknown",
      appVersion: window.fitnessApp?.config?.app?.version || "unknown",
      userAgent: navigator.userAgent,
      results: this.results,
      summary: {
        total: this.results.length,
        passed: this.results.filter((r) => r.status === "pass").length,
        failed: this.results.filter((r) => r.status === "fail").length,
        skipped: this.results.filter((r) => r.status === "skip").length,
        totalTime: this.results.reduce((sum, r) => sum + r.time, 0),
      },
    };

    const dataStr = JSON.stringify(report, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `fitness-test-report-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }
}

// Create global instance
export const testRunner = new TestRunner();

// Make available globally for easy access
window.testRunner = testRunner;

// Auto-initialize if in debug mode
if (
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1"
) {
  document.addEventListener("DOMContentLoaded", () => {
    testRunner.init();

    // Add keyboard shortcut to open tests (Alt + Shift + T)
    document.addEventListener("keydown", (e) => {
      if (e.altKey && e.shiftKey && e.key === "T") {
        e.preventDefault();
        testRunner.showTestUI();
      }
    });

    console.log("🧪 Test Runner ready! Press Alt+Shift+T to open test panel");
  });
}
