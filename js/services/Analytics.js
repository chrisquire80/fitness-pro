/**
 * Analytics.js
 * Advanced Analytics system with session tracking, local queue, export, and helpers.
 */

import { config } from "../utils/Config.js";

class Analytics {
  constructor() {
    this.debug = config.get("analytics.debug", true);
    this.enabled = config.isFeatureEnabled("analytics");
    this.queueKey = `${config.get("storage.prefix")}analytics_queue`;
    this.sessionKey = `${config.get("storage.prefix")}session_id`;
    this.historyKey = `${config.get("storage.prefix")}analytics_history`;
    this.maxQueueSize = 500;
    this.maxHistorySize = 2000;
    this.firebaseAnalytics = null;

    this.sessionId = this.getOrCreateSessionId();
    this.sessionStart = Date.now();
    this.pageStart = Date.now();

    this.restoreQueue();
    this.restoreHistory();
    this.setupListeners();
  }

  setupListeners() {
    window.addEventListener("online", () => this.flushQueue());
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) {
        this.logEvent("page_refocus", { path: window.location.hash || "/" });
      }
    });
  }

  getFirebaseAnalytics() {
    if (this.firebaseAnalytics) return this.firebaseAnalytics;

    const apiKey = config.get("apiKeys.firebase.apiKey");
    if (!apiKey || apiKey.startsWith("YOUR_")) return null;

    if (window.firebase?.analytics) {
      try {
        this.firebaseAnalytics = window.firebase.analytics();
        return this.firebaseAnalytics;
      } catch {
        return null;
      }
    }

    return null;
  }

  getOrCreateSessionId() {
    try {
      const existing = sessionStorage.getItem(this.sessionKey);
      if (existing) return existing;

      const newId = `sess_${Math.random().toString(36).slice(2)}_${Date.now()}`;
      sessionStorage.setItem(this.sessionKey, newId);
      return newId;
    } catch {
      return `sess_${Math.random().toString(36).slice(2)}_${Date.now()}`;
    }
  }

  restoreQueue() {
    try {
      const raw = localStorage.getItem(this.queueKey);
      this.queue = raw ? JSON.parse(raw) : [];
    } catch {
      this.queue = [];
    }
  }

  persistQueue() {
    try {
      localStorage.setItem(this.queueKey, JSON.stringify(this.queue));
    } catch {
      // Ignore storage errors
    }
  }

  restoreHistory() {
    try {
      const raw = localStorage.getItem(this.historyKey);
      this.history = raw ? JSON.parse(raw) : [];
    } catch {
      this.history = [];
    }
  }

  persistHistory() {
    try {
      localStorage.setItem(this.historyKey, JSON.stringify(this.history));
    } catch {
      // Ignore storage errors
    }
  }

  recordHistory(event) {
    if (!event) return;
    this.history.push(event);
    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
    }
    this.persistHistory();
  }

  getHistory() {
    return this.history || [];
  }

  getAggregates() {
    const events = this.getHistory();
    const byName = {};
    const byPath = {};
    const bySession = {};
    let totalDuration = 0;
    let timingCount = 0;

    events.forEach((evt) => {
      byName[evt.name] = (byName[evt.name] || 0) + 1;
      const path = evt.params?.path || "/";
      byPath[path] = (byPath[path] || 0) + 1;
      const sessionId = evt.params?.session_id || "unknown";
      bySession[sessionId] = (bySession[sessionId] || 0) + 1;

      if (
        evt.name === "timing" &&
        typeof evt.params?.duration_ms === "number"
      ) {
        totalDuration += evt.params.duration_ms;
        timingCount += 1;
      }
    });

    return {
      totalEvents: events.length,
      byName,
      byPath,
      sessions: Object.keys(bySession).length,
      avgPageTimeMs:
        timingCount > 0 ? Math.round(totalDuration / timingCount) : 0,
    };
  }

  enqueue(event) {
    this.queue.push(event);
    if (this.queue.length > this.maxQueueSize) {
      this.queue.shift();
    }
    this.persistQueue();
  }

  flushQueue() {
    if (!this.enabled || !navigator.onLine || this.queue.length === 0) return;

    if (this.debug) {
      console.log("[Analytics] Flushing queue", this.queue);
    }

    const firebaseAnalytics = this.getFirebaseAnalytics();
    if (firebaseAnalytics) {
      this.queue.forEach((evt) => {
        try {
          firebaseAnalytics.logEvent(evt.name, evt.params);
        } catch {
          // Ignore per-event errors
        }
      });
    } else if (this.debug) {
      console.log(
        "[Analytics] Firebase analytics not configured or unavailable",
      );
    }

    this.queue = [];
    this.persistQueue();
  }

  sanitizeParams(params = {}) {
    const sanitized = { ...params };
    Object.keys(sanitized).forEach((key) => {
      const value = sanitized[key];
      if (value === undefined || value === null) {
        delete sanitized[key];
      } else if (typeof value === "string" && value.length > 500) {
        sanitized[key] = `${value.slice(0, 497)}...`;
      }
    });
    return sanitized;
  }

  logEvent(eventName, params = {}) {
    if (!this.enabled) return;

    const base = {
      session_id: this.sessionId,
      timestamp: Date.now(),
      env: config.getEnvironment(),
      path: window.location.hash || "/",
    };

    const payload = {
      name: eventName,
      params: { ...base, ...this.sanitizeParams(params) },
    };

    if (this.debug) {
      console.log(`[Analytics] Event: ${eventName}`, payload.params);
    }

    this.enqueue(payload);
    this.recordHistory(payload);
  }

  // Pre-defined events for consistency
  logTutorialComplete() {
    this.logEvent("tutorial_complete");
  }

  logWorkoutStart(workoutId, workoutName) {
    this.logEvent("workout_start", {
      workout_id: workoutId,
      workout_name: workoutName,
    });
  }

  logWorkoutComplete(workoutId, duration, exercisesCount) {
    this.logEvent("workout_complete", {
      workout_id: workoutId,
      duration_seconds: duration,
      exercises_count: exercisesCount,
    });
  }

  logShareApp(method) {
    this.logEvent("share_app", { method });
  }

  logPageView(title = null) {
    this.pageStart = Date.now();
    this.logEvent("page_view", { title });
  }

  logPageTiming(label = "page_time") {
    const elapsed = Date.now() - this.pageStart;
    this.logEvent("timing", { label, duration_ms: elapsed });
  }

  logError(message, details = {}) {
    this.logEvent("error", { message, ...details });
  }

  logPerformance(metric, value) {
    this.logEvent("performance", { metric, value });
  }

  exportQueue(download = true) {
    const data = {
      exportedAt: new Date().toISOString(),
      sessionId: this.sessionId,
      events: this.queue,
    };

    const json = JSON.stringify(data, null, 2);

    if (download) {
      try {
        const blob = new Blob([json], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "fitness_analytics_export.json";
        a.click();
        URL.revokeObjectURL(url);
      } catch {
        // Ignore download errors
      }
    }

    return json;
  }

  clearQueue() {
    this.queue = [];
    this.persistQueue();
  }

  setDebug(enabled) {
    this.debug = !!enabled;
  }
}

export const analytics = new Analytics();
