/**
 * PWAService.js
 * Manages PWA features: installation, offline mode, notifications, and updates
 */

import { config } from "../utils/Config.js";
import { notificationManager } from "../utils/NotificationManager.js";

class PWAService {
  constructor() {
    this.isInstalled = false;
    this.isOnline = navigator.onLine;
    this.deferredPrompt = null;
    this.serviceWorkerRegistration = null;
    this.init();
  }

  async init() {
    try {
      // Check if app is installed
      this.checkInstallation();

      // Register service worker
      await this.registerServiceWorker();

      // Monitor online/offline status
      this.setupNetworkListeners();

      // Check for updates
      this.setupUpdateChecking();

      // Request notification permission
      this.requestNotificationPermission();

      if (config.isDebugMode()) {
        console.log("🎯 PWAService initialized");
      }
    } catch (error) {
      console.error("PWAService initialization failed:", error);
    }
  }

  /**
   * Check if app is installed
   */
  checkInstallation() {
    if (window.matchMedia("(display-mode: standalone)").matches) {
      this.isInstalled = true;
      if (config.isDebugMode()) {
        console.log("📱 Running in standalone mode (installed)");
      }
    }

    // Listen for install event
    window.addEventListener("appinstalled", () => {
      this.isInstalled = true;
      if (config.isDebugMode()) {
        console.log("✅ App installed successfully");
      }
      this.notifyAppInstalled();
    });
  }

  /**
   * Register service worker for offline support
   */
  async registerServiceWorker() {
    if (!("serviceWorker" in navigator)) {
      console.warn("Service Workers are not supported in this browser");
      return;
    }

    try {
      const registration = await navigator.serviceWorker.register("/sw.js", {
        scope: "/",
      });

      this.serviceWorkerRegistration = registration;

      if (config.isDebugMode()) {
        console.log("✅ Service Worker registered", registration);
      }

      // Listen for updates
      registration.addEventListener("updatefound", () => {
        this.handleServiceWorkerUpdate(registration);
      });

      // Check for updates periodically
      setInterval(() => {
        registration.update();
      }, 60 * 60 * 1000); // Check every hour

      return registration;
    } catch (error) {
      console.error("Service Worker registration failed:", error);
    }
  }

  /**
   * Handle service worker updates
   */
  handleServiceWorkerUpdate(registration) {
    const newWorker = registration.installing;

    if (!newWorker) return;

    newWorker.addEventListener("statechange", () => {
      if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
        // New service worker is ready
        this.notifyUpdate();
      }
    });
  }

  /**
   * Setup network status listeners
   */
  setupNetworkListeners() {
    window.addEventListener("online", () => {
      this.isOnline = true;
      this.handleOnline();
    });

    window.addEventListener("offline", () => {
      this.isOnline = false;
      this.handleOffline();
    });
  }

  /**
   * Handle online status
   */
  handleOnline() {
    if (config.isDebugMode()) {
      console.log("🌐 Back online");
    }

    // Trigger background sync if available
    if ("serviceWorker" in navigator && "SyncManager" in window) {
      navigator.serviceWorker.ready
        .then((registration) => {
          return registration.sync.register("sync-data");
        })
        .catch((error) => {
          if (config.isDebugMode()) {
            console.warn("Background sync registration failed:", error);
          }
        });
    }

    // Notify user
    notificationManager.show("✅ Connessione ripristinata", {
      type: "success",
      duration: 3000,
    });
  }

  /**
   * Handle offline status
   */
  handleOffline() {
    if (config.isDebugMode()) {
      console.log("📡 Offline detected");
    }

    // Notify user
    notificationManager.show("📡 Sei offline - L'app continua a funzionare", {
      type: "warning",
      duration: 5000,
    });
  }

  /**
   * Setup periodic update checking
   */
  setupUpdateChecking() {
    if (!this.serviceWorkerRegistration) return;

    // Check for updates every 30 minutes
    setInterval(() => {
      if (this.isOnline) {
        this.serviceWorkerRegistration.update();
      }
    }, 30 * 60 * 1000);
  }

  /**
   * Request notification permission
   */
  async requestNotificationPermission() {
    if (!("Notification" in window)) {
      if (config.isDebugMode()) {
        console.warn("Notifications not supported");
      }
      return;
    }

    if (Notification.permission === "granted") {
      if (config.isDebugMode()) {
        console.log("✅ Notifications already permitted");
      }
      return;
    }

    if (Notification.permission !== "denied") {
      try {
        const permission = await Notification.requestPermission();
        if (permission === "granted") {
          if (config.isDebugMode()) {
            console.log("✅ Notification permission granted");
          }
        }
      } catch (error) {
        console.error("Notification permission error:", error);
      }
    }
  }

  /**
   * Send notification to user
   */
  async sendNotification(title, options = {}) {
    if (!("serviceWorker" in navigator) || !this.serviceWorkerRegistration) {
      return;
    }

    try {
      await this.serviceWorkerRegistration.showNotification(title, {
        icon: "/icons/icon.svg",
        badge: "/icons/badge.png",
        ...options,
      });

      if (config.isDebugMode()) {
        console.log(`📬 Notification sent: ${title}`);
      }
    } catch (error) {
      console.error("Notification error:", error);
    }
  }

  /**
   * Schedule notification
   */
  scheduleNotification(title, options = {}, delayMs = 0) {
    setTimeout(() => {
      this.sendNotification(title, options);
    }, delayMs);
  }

  /**
   * Notify when app is installed
   */
  notifyAppInstalled() {
    this.sendNotification("🎉 Fitness Pro Installato!", {
      body: "L'app è stata installata con successo. Puoi usarla offline!",
      tag: "app-installed",
    });
  }

  /**
   * Notify about available update
   */
  notifyUpdate() {
    this.sendNotification("🆕 Aggiornamento Disponibile", {
      body: "Una nuova versione di Fitness Pro è disponibile. Ricarica per aggiornare.",
      tag: "app-update",
      requireInteraction: true,
      actions: [
        {
          action: "update",
          title: "Aggiorna ora",
        },
        {
          action: "dismiss",
          title: "Dopo",
        },
      ],
    });
  }

  /**
   * Get app status information
   */
  getStatus() {
    return {
      isOnline: this.isOnline,
      isInstalled: this.isInstalled,
      isStandalone: this.isInstalled,
      serviceWorkerReady: !!this.serviceWorkerRegistration,
      notificationsEnabled:
        "Notification" in window &&
        Notification.permission === "granted",
      offlineMode: !this.isOnline,
    };
  }

  /**
   * Get app information
   */
  getAppInfo() {
    return {
      name: "Fitness Pro",
      version: "2.0.0",
      buildDate: new Date().toISOString(),
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      memory: navigator.deviceMemory
        ? `${navigator.deviceMemory}GB`
        : "Unknown",
      cores: navigator.hardwareConcurrency || "Unknown",
      storage: navigator.storage
        ? {
            available: true,
            quota: "Unknown",
          }
        : {
            available: false,
          },
    };
  }

  /**
   * Clear all caches
   */
  async clearAllCaches() {
    if (!("caches" in window)) {
      return false;
    }

    try {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map((name) => caches.delete(name)));

      if (config.isDebugMode()) {
        console.log("🗑️ All caches cleared");
      }

      return true;
    } catch (error) {
      console.error("Cache clearing error:", error);
      return false;
    }
  }

  /**
   * Get cache statistics
   */
  async getCacheStats() {
    if (!("caches" in window)) {
      return null;
    }

    try {
      const cacheNames = await caches.keys();
      const stats = {
        caches: cacheNames,
        totalSize: 0,
        entries: 0,
      };

      for (const cacheName of cacheNames) {
        const cache = await caches.open(cacheName);
        const keys = await cache.keys();
        stats.entries += keys.length;

        for (const key of keys) {
          const response = await cache.match(key);
          if (response) {
            const blob = await response.blob();
            stats.totalSize += blob.size;
          }
        }
      }

      return stats;
    } catch (error) {
      console.error("Cache stats error:", error);
      return null;
    }
  }

  /**
   * Enable app shortcuts
   */
  setupAppShortcuts() {
    if (!("launchQueue" in window)) {
      return;
    }

    window.launchQueue.setConsumer((launchParams) => {
      if (launchParams.files && launchParams.files.length > 0) {
        // Handle file launch
        const file = launchParams.files[0];
        if (config.isDebugMode()) {
          console.log("File launched:", file);
        }
      }
    });
  }

  /**
   * Share data to other apps
   */
  async shareWorkout(workoutData) {
    if (!navigator.share) {
      console.warn("Share API not supported");
      return false;
    }

    try {
      await navigator.share({
        title: "Fitness Pro Workout",
        text: `Ho completato un allenamento di ${workoutData.duration} minuti!`,
        url: window.location.href,
      });

      return true;
    } catch (error) {
      if (error.name !== "AbortError") {
        console.error("Share error:", error);
      }
      return false;
    }
  }

  /**
   * Request persistent storage
   */
  async requestPersistentStorage() {
    if (!navigator.storage || !navigator.storage.persist) {
      return false;
    }

    try {
      const persistent = await navigator.storage.persist();

      if (config.isDebugMode()) {
        console.log(`💾 Persistent storage ${persistent ? "granted" : "denied"}`);
      }

      return persistent;
    } catch (error) {
      console.error("Persistent storage error:", error);
      return false;
    }
  }

  /**
   * Reload app with service worker update
   */
  reloadApp() {
    if (this.serviceWorkerRegistration) {
      this.serviceWorkerRegistration.unregister().then(() => {
        window.location.reload();
      });
    } else {
      window.location.reload();
    }
  }
}

// Export singleton
export const pwaService = new PWAService();
