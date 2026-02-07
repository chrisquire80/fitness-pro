/**
 * IndexedDBService.js
 * Provides IndexedDB storage with fallback to localStorage
 * Optimizes data storage for large datasets (workouts, logs, exercises)
 * Supports offline access and background sync integration
 */

import { config } from "../utils/Config.js";

class IndexedDBService {
  constructor() {
    this.db = null;
    this.isAvailable = this.checkIndexedDBSupport();
    this.dbName = config.get("storage.dbName", "FitnessProDB");
    this.version = 1;
    this.objectStores = ["users", "workouts", "exercises", "logs", "achievements"];
    this.init();
  }

  /**
   * Check if IndexedDB is available in the browser
   */
  checkIndexedDBSupport() {
    return (
      typeof window !== "undefined" &&
      (window.indexedDB ||
        window.mozIndexedDB ||
        window.webkitIndexedDB ||
        window.msIndexedDB)
    );
  }

  /**
   * Initialize IndexedDB database
   */
  async init() {
    if (!this.isAvailable) {
      console.warn("⚠️ IndexedDB not available, using localStorage fallback");
      return;
    }

    try {
      const idb = window.indexedDB || window.mozIndexedDB;
      const request = idb.open(this.dbName, this.version);

      return new Promise((resolve, reject) => {
        request.onerror = () => {
          console.error("IndexedDB open error:", request.error);
          this.isAvailable = false;
          reject(request.error);
        };

        request.onsuccess = () => {
          this.db = request.result;
          if (config.isDebugMode()) {
            console.log("✅ IndexedDB initialized:", this.dbName);
          }
          resolve(this.db);
        };

        request.onupgradeneeded = (event) => {
          this.setupSchema(event.target.result);
        };
      });
    } catch (error) {
      console.error("IndexedDB initialization failed:", error);
      this.isAvailable = false;
    }
  }

  /**
   * Set up database schema and object stores
   */
  setupSchema(db) {
    // Users object store
    if (!db.objectStoreNames.contains("users")) {
      const userStore = db.createObjectStore("users", { keyPath: "id" });
      userStore.createIndex("email", "email", { unique: true });
    }

    // Workouts object store
    if (!db.objectStoreNames.contains("workouts")) {
      const workoutStore = db.createObjectStore("workouts", { keyPath: "id" });
      workoutStore.createIndex("type", "type");
      workoutStore.createIndex("difficulty_label", "difficulty_label");
      workoutStore.createIndex("focus_label", "focus_label");
    }

    // Exercises object store
    if (!db.objectStoreNames.contains("exercises")) {
      const exerciseStore = db.createObjectStore("exercises", { keyPath: "id" });
      exerciseStore.createIndex("name", "name");
      exerciseStore.createIndex("muscle_group", "muscle_group");
    }

    // Logs object store
    if (!db.objectStoreNames.contains("logs")) {
      const logStore = db.createObjectStore("logs", { keyPath: "id" });
      logStore.createIndex("date", "date");
      logStore.createIndex("workout_id", "workout_id");
      logStore.createIndex("created_at", "created_at");
    }

    // Achievements object store
    if (!db.objectStoreNames.contains("achievements")) {
      const achievementStore = db.createObjectStore("achievements", {
        keyPath: "id",
      });
      achievementStore.createIndex("user_id", "user_id");
      achievementStore.createIndex("unlocked_date", "unlocked_date");
    }

    if (config.isDebugMode()) {
      console.log("📊 IndexedDB schema created");
    }
  }

  /**
   * Add or update a record
   */
  async put(storeName, data) {
    if (!this.isAvailable || !this.db) {
      return this.localStorageFallback("put", storeName, data);
    }

    try {
      const transaction = this.db.transaction([storeName], "readwrite");
      const store = transaction.objectStore(storeName);
      const request = store.put(data);

      return new Promise((resolve, reject) => {
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
      });
    } catch (error) {
      console.error(`Error putting data in ${storeName}:`, error);
      return this.localStorageFallback("put", storeName, data);
    }
  }

  /**
   * Get a record by key
   */
  async get(storeName, key) {
    if (!this.isAvailable || !this.db) {
      return this.localStorageFallback("get", storeName, key);
    }

    try {
      const transaction = this.db.transaction([storeName], "readonly");
      const store = transaction.objectStore(storeName);
      const request = store.get(key);

      return new Promise((resolve, reject) => {
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
      });
    } catch (error) {
      console.error(`Error getting data from ${storeName}:`, error);
      return this.localStorageFallback("get", storeName, key);
    }
  }

  /**
   * Get all records from a store
   */
  async getAll(storeName) {
    if (!this.isAvailable || !this.db) {
      return this.localStorageFallback("getAll", storeName);
    }

    try {
      const transaction = this.db.transaction([storeName], "readonly");
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      return new Promise((resolve, reject) => {
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
      });
    } catch (error) {
      console.error(`Error getting all data from ${storeName}:`, error);
      return this.localStorageFallback("getAll", storeName);
    }
  }

  /**
   * Query by index
   */
  async query(storeName, indexName, key) {
    if (!this.isAvailable || !this.db) {
      return this.localStorageFallback("query", storeName, indexName, key);
    }

    try {
      const transaction = this.db.transaction([storeName], "readonly");
      const store = transaction.objectStore(storeName);
      const index = store.index(indexName);
      const request = index.getAll(key);

      return new Promise((resolve, reject) => {
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
      });
    } catch (error) {
      console.error(`Error querying ${storeName}:`, error);
      return this.localStorageFallback("query", storeName, indexName, key);
    }
  }

  /**
   * Delete a record
   */
  async delete(storeName, key) {
    if (!this.isAvailable || !this.db) {
      return this.localStorageFallback("delete", storeName, key);
    }

    try {
      const transaction = this.db.transaction([storeName], "readwrite");
      const store = transaction.objectStore(storeName);
      const request = store.delete(key);

      return new Promise((resolve, reject) => {
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(true);
      });
    } catch (error) {
      console.error(`Error deleting from ${storeName}:`, error);
      return this.localStorageFallback("delete", storeName, key);
    }
  }

  /**
   * Clear all records from a store
   */
  async clear(storeName) {
    if (!this.isAvailable || !this.db) {
      return this.localStorageFallback("clear", storeName);
    }

    try {
      const transaction = this.db.transaction([storeName], "readwrite");
      const store = transaction.objectStore(storeName);
      const request = store.clear();

      return new Promise((resolve, reject) => {
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(true);
      });
    } catch (error) {
      console.error(`Error clearing ${storeName}:`, error);
      return this.localStorageFallback("clear", storeName);
    }
  }

  /**
   * Batch operations for efficiency
   */
  async batch(operations) {
    if (!this.isAvailable || !this.db) {
      return this.localStorageFallback("batch", operations);
    }

    try {
      const results = [];

      for (const op of operations) {
        if (op.type === "put") {
          results.push(await this.put(op.store, op.data));
        } else if (op.type === "delete") {
          results.push(await this.delete(op.store, op.key));
        } else if (op.type === "get") {
          results.push(await this.get(op.store, op.key));
        }
      }

      return results;
    } catch (error) {
      console.error("Batch operation error:", error);
      throw error;
    }
  }

  /**
   * Fallback to localStorage for operations
   */
  localStorageFallback(operation, ...args) {
    const prefix = `${config.get("storage.prefix")}`;

    switch (operation) {
      case "put":
        const [storeName, data] = args;
        localStorage.setItem(`${prefix}${storeName}`, JSON.stringify(data));
        return data.id || true;

      case "get":
        const [store, key] = args;
        const item = localStorage.getItem(`${prefix}${store}`);
        return item ? JSON.parse(item) : null;

      case "getAll":
        const [st] = args;
        const allItem = localStorage.getItem(`${prefix}${st}`);
        return allItem ? (Array.isArray(JSON.parse(allItem)) ? JSON.parse(allItem) : []) : [];

      case "delete":
        const [s, k] = args;
        localStorage.removeItem(`${prefix}${s}`);
        return true;

      case "clear":
        const [store2] = args;
        localStorage.removeItem(`${prefix}${store2}`);
        return true;

      case "batch":
        return args[0].map((op) =>
          this.localStorageFallback(op.type, op.store, op.data || op.key)
        );

      default:
        return null;
    }
  }

  /**
   * Export database to JSON for backup
   */
  async exportDatabase() {
    const backup = {};

    try {
      for (const store of this.objectStores) {
        backup[store] = await this.getAll(store);
      }

      if (config.isDebugMode()) {
        console.log("📦 Database exported:", backup);
      }

      return backup;
    } catch (error) {
      console.error("Error exporting database:", error);
      return null;
    }
  }

  /**
   * Import database from JSON backup
   */
  async importDatabase(backup) {
    try {
      const operations = [];

      for (const [storeName, records] of Object.entries(backup)) {
        if (this.objectStores.includes(storeName)) {
          for (const record of records) {
            operations.push({
              type: "put",
              store: storeName,
              data: record,
            });
          }
        }
      }

      await this.batch(operations);

      if (config.isDebugMode()) {
        console.log("✅ Database imported successfully");
      }

      return true;
    } catch (error) {
      console.error("Error importing database:", error);
      return false;
    }
  }

  /**
   * Get database statistics
   */
  async getStats() {
    const stats = {
      available: this.isAvailable,
      dbName: this.dbName,
      stores: {},
    };

    try {
      for (const store of this.objectStores) {
        const all = await this.getAll(store);
        stats.stores[store] = {
          count: Array.isArray(all) ? all.length : 0,
          size: JSON.stringify(all).length,
        };
      }

      return stats;
    } catch (error) {
      console.error("Error getting stats:", error);
      return stats;
    }
  }

  /**
   * Close database connection
   */
  close() {
    if (this.db) {
      this.db.close();
      this.db = null;
      if (config.isDebugMode()) {
        console.log("🔌 IndexedDB closed");
      }
    }
  }
}

// Export singleton
export const indexedDBService = new IndexedDBService();
