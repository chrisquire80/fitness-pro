/**
 * SyncQueueService.js
 * Handles background synchronization queue for offline operations
 * Manages pending operations when offline and syncs when connection restored
 */

import { config } from "../utils/Config.js";
import { stateManager, actions } from "../utils/StateManager.js";
import { notificationManager } from "../utils/NotificationManager.js";

class SyncQueueService {
  constructor() {
    this.queue = [];
    this.isSyncing = false;
    this.isOnline = navigator.onLine;
    this.maxRetries = config.get("sync.maxRetries", 3);
    this.syncInterval = config.get("sync.interval", 30000); // 30 seconds
    this.retryDelays = [1000, 5000, 15000]; // exponential backoff: 1s, 5s, 15s

    this.STORAGE_KEY = `${config.get("storage.prefix")}sync_queue`;

    this.init();
  }

  async init() {
    try {
      // Load pending queue from storage
      await this.loadQueue();

      // Set up network monitoring
      this.setupNetworkListeners();

      // Set up periodic sync
      this.startPeriodicSync();

      if (config.isDebugMode()) {
        console.log("🔄 SyncQueueService initialized");
      }
    } catch (error) {
      console.error("SyncQueueService initialization failed:", error);
    }
  }

  /**
   * Add operation to queue
   */
  async addToQueue(operation) {
    try {
      const queueItem = {
        id: `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: operation.type, // 'create', 'update', 'delete', 'sync'
        resource: operation.resource, // 'workout', 'log', 'profile'
        data: operation.data,
        timestamp: Date.now(),
        retries: 0,
        lastError: null,
        status: "pending", // pending, processing, completed, failed
      };

      this.queue.push(queueItem);
      await this.persistQueue();

      stateManager.setState("sync.queueLength", this.queue.length);

      if (config.isDebugMode()) {
        console.log("📦 Added to sync queue:", queueItem.id, operation.type);
      }

      // Try to sync immediately if online
      if (this.isOnline && !this.isSyncing) {
        this.syncNow();
      }

      return queueItem.id;
    } catch (error) {
      console.error("Error adding to queue:", error);
      notificationManager.error("Errore", "Impossibile aggiungere l'operazione alla coda");
      return null;
    }
  }

  /**
   * Process queue and sync pending operations
   */
  async syncNow() {
    if (!this.isOnline) {
      if (config.isDebugMode()) {
        console.log("⚠️ Offline - skipping sync");
      }
      return { success: false, reason: "offline" };
    }

    if (this.isSyncing) {
      return { success: false, reason: "already_syncing" };
    }

    this.isSyncing = true;
    stateManager.setState("sync.isSyncing", true);

    let successCount = 0;
    let failureCount = 0;

    try {
      // Process pending items
      for (const item of this.queue) {
        if (item.status === "pending" || item.status === "failed") {
          const result = await this.processQueueItem(item);

          if (result.success) {
            item.status = "completed";
            successCount++;
          } else {
            failureCount++;

            // Retry logic with exponential backoff
            if (item.retries < this.maxRetries) {
              item.retries++;
              item.lastError = result.error;
              item.status = "pending";

              if (config.isDebugMode()) {
                console.log(
                  `🔁 Retrying ${item.id} (attempt ${item.retries}/${this.maxRetries})`
                );
              }
            } else {
              item.status = "failed";
              console.error(`❌ Failed to sync ${item.id} after ${this.maxRetries} retries`);
            }
          }
        }
      }

      // Remove completed items
      this.queue = this.queue.filter((item) => item.status !== "completed");

      await this.persistQueue();

      if (config.isDebugMode()) {
        console.log(`✅ Sync completed: ${successCount} success, ${failureCount} failed`);
      }

      // Show notification if there were failures
      if (failureCount > 0) {
        notificationManager.warning(
          "Sincronizzazione Parziale",
          `${successCount} operazioni sincronizzate, ${failureCount} in errore`
        );
      } else if (successCount > 0) {
        notificationManager.success("Sincronizzato", `${successCount} operazioni sincronizzate`);
      }

      stateManager.setState("sync.queueLength", this.queue.length);
      stateManager.setState("sync.lastSyncTime", Date.now());

      return {
        success: failureCount === 0,
        successCount,
        failureCount,
        totalItems: successCount + failureCount,
      };
    } catch (error) {
      console.error("Sync error:", error);
      return { success: false, error: error.message };
    } finally {
      this.isSyncing = false;
      stateManager.setState("sync.isSyncing", false);
    }
  }

  /**
   * Process individual queue item
   */
  async processQueueItem(item) {
    try {
      switch (item.type) {
        case "create_log":
          // Example: sync workout log
          return await this.syncWorkoutLog(item.data);

        case "update_profile":
          return await this.syncProfile(item.data);

        case "create_backup":
          return await this.syncBackup(item.data);

        default:
          return { success: true, message: "Unknown operation type" };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Sync workout log to cloud
   */
  async syncWorkoutLog(logData) {
    try {
      // This would integrate with your actual sync service
      // For now, simulate with a small delay
      await new Promise((resolve) => setTimeout(resolve, 100));

      if (config.isDebugMode()) {
        console.log("✅ Synced workout log:", logData.id);
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Sync profile to cloud
   */
  async syncProfile(profileData) {
    try {
      await new Promise((resolve) => setTimeout(resolve, 100));

      if (config.isDebugMode()) {
        console.log("✅ Synced profile");
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Sync backup to cloud
   */
  async syncBackup(backupData) {
    try {
      await new Promise((resolve) => setTimeout(resolve, 100));

      if (config.isDebugMode()) {
        console.log("✅ Synced backup:", backupData.id);
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Set up online/offline detection
   */
  setupNetworkListeners() {
    window.addEventListener("online", () => {
      this.isOnline = true;
      stateManager.setState("app.isOnline", true);

      if (config.isDebugMode()) {
        console.log("🟢 Back online - starting sync");
      }

      // Sync immediately when coming back online
      this.syncNow();
      notificationManager.success("Connessione Ripristinata", "Sincronizzazione in corso...");
    });

    window.addEventListener("offline", () => {
      this.isOnline = false;
      stateManager.setState("app.isOnline", false);

      if (config.isDebugMode()) {
        console.log("🔴 Offline - queuing operations");
      }

      notificationManager.warning("Offline", "Le operazioni verranno sincronizzate al ripristino");
    });
  }

  /**
   * Start periodic sync
   */
  startPeriodicSync() {
    setInterval(() => {
      if (this.isOnline && !this.isSyncing && this.queue.length > 0) {
        this.syncNow();
      }
    }, this.syncInterval);
  }

  /**
   * Load queue from storage
   */
  async loadQueue() {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      this.queue = stored ? JSON.parse(stored) : [];

      stateManager.setState("sync.queueLength", this.queue.length);

      if (config.isDebugMode() && this.queue.length > 0) {
        console.log(`📦 Loaded ${this.queue.length} pending operations from storage`);
      }
    } catch (error) {
      console.error("Error loading queue:", error);
      this.queue = [];
    }
  }

  /**
   * Persist queue to storage
   */
  async persistQueue() {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.queue));
    } catch (error) {
      console.error("Error persisting queue:", error);
    }
  }

  /**
   * Get queue status
   */
  getStatus() {
    const pending = this.queue.filter((item) => item.status === "pending").length;
    const failed = this.queue.filter((item) => item.status === "failed").length;

    return {
      isOnline: this.isOnline,
      isSyncing: this.isSyncing,
      queueLength: this.queue.length,
      pendingCount: pending,
      failedCount: failed,
      items: this.queue,
    };
  }

  /**
   * Clear queue (use with caution)
   */
  clearQueue() {
    this.queue = [];
    this.persistQueue();
    stateManager.setState("sync.queueLength", 0);
  }

  /**
   * Retry failed items
   */
  async retryFailed() {
    this.queue.forEach((item) => {
      if (item.status === "failed") {
        item.status = "pending";
        item.retries = 0;
      }
    });

    await this.persistQueue();
    return this.syncNow();
  }
}

// Export singleton
export const syncQueueService = new SyncQueueService();
