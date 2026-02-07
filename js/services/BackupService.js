/**
 * BackupService.js
 * Backup and Cloud Synchronization System for Fitness Pro App
 * Handles data backup, cloud sync, import/export, and data recovery
 */

import { config } from "../utils/Config.js";
import { dataManager } from "./DataManager.js";
import { stateManager, actions } from "../utils/StateManager.js";
import { analytics } from "./Analytics.js";
import { notificationManager } from "../utils/NotificationManager.js";

class BackupService {
  constructor() {
    this.isInitialized = false;
    this.syncInterval = config.get("backup.syncInterval", 5 * 60 * 1000); // 5 minutes
    this.maxBackups = config.get("backup.maxBackups", 10);
    this.compressionEnabled = config.get("backup.compression", true);
    this.encryptionEnabled = config.get("backup.encryption", true);
    this.autoSyncEnabled = config.get("backup.autoSync", true);
    this.cloudProvider = config.get("backup.provider", "browser"); // browser, firebase, custom
    this.syncTimer = null;
    this.isOnline = navigator.onLine;
    this.cachedPassphrase = null;
    this.rememberPassphrase = this._loadRememberPassphrasePreference();

    this.init();
  }

  async init() {
    try {
      // Initialize cloud provider
      await this.initializeCloudProvider();

      // Set up auto-sync
      if (this.autoSyncEnabled) {
        this.startAutoSync();
      }

      // Set up network monitoring
      this.setupNetworkMonitoring();

      // Set up data change monitoring
      this.setupDataChangeMonitoring();

      // Restore pending syncs
      await this.restorePendingSyncs();

      this.isInitialized = true;

      if (config.isDebugMode()) {
        console.log("☁️ BackupService initialized");
      }
    } catch (error) {
      console.error("BackupService initialization failed:", error);
    }
  }

  /**
   * Initialize cloud provider
   */
  async initializeCloudProvider() {
    switch (this.cloudProvider) {
      case "firebase":
        await this.initializeFirebase();
        break;
      case "browser":
        // Use browser storage as backup
        break;
      default:
        console.warn("Unknown cloud provider:", this.cloudProvider);
    }
  }

  /**
   * Initialize Firebase (if API keys are configured)
   */
  async initializeFirebase() {
    const firebaseConfig = config.get("apiKeys.firebase");

    if (!firebaseConfig.apiKey || firebaseConfig.apiKey.startsWith("YOUR_")) {
      console.warn("Firebase not configured for backup");
      return;
    }

    try {
      // In a real implementation, you would initialize Firebase SDK here
      console.log("Firebase backup ready (mock implementation)");
    } catch (error) {
      console.error("Firebase initialization failed:", error);
    }
  }

  /**
   * Create a backup of all user data
   */
  async createBackup(options = {}) {
    try {
      const {
        includeWorkoutHistory = true,
        includePersonalData = true,
        includeSettings = true,
        compress = this.compressionEnabled,
        encrypt = this.encryptionEnabled,
      } = options;

      stateManager.setState("backup.isCreating", true);

      // Gather all data
      const backupData = {
        metadata: {
          version: config.getVersion(),
          timestamp: new Date().toISOString(),
          backupId: this.generateBackupId(),
          source: "fitness-pro-app",
          dataTypes: [],
        },
        data: {},
      };

      if (includePersonalData) {
        const userData = await dataManager.getCurrentUser();
        if (userData) {
          backupData.data.user = userData;
          backupData.metadata.dataTypes.push("user");
        }
      }

      if (includeWorkoutHistory) {
        const logs = dataManager.getLogs();
        const exercises = dataManager.getExercises();
        const workouts = dataManager.getWorkouts();

        backupData.data.workoutHistory = logs;
        backupData.data.exercises = exercises;
        backupData.data.workouts = workouts;
        backupData.metadata.dataTypes.push(
          "workoutHistory",
          "exercises",
          "workouts",
        );
      }

      if (includeSettings) {
        const preferences = config.get("userPreferences", {});
        const appState = stateManager.getState("ui");

        backupData.data.preferences = preferences;
        backupData.data.uiState = appState;
        backupData.metadata.dataTypes.push("preferences", "uiState");
      }

      // Add statistics
      backupData.metadata.statistics = {
        totalWorkouts: backupData.data.workoutHistory?.length || 0,
        totalExercises: backupData.data.exercises?.length || 0,
        dataSize: JSON.stringify(backupData.data).length,
        userLevel: backupData.data.user?.stats?.level || 1,
      };

      // Compress if enabled
      if (compress) {
        backupData.data = await this.compressData(backupData.data);
        backupData.metadata.compressed = true;
      }

      // Encrypt if enabled
      if (encrypt) {
        backupData.data = await this.encryptData(backupData.data);
        backupData.metadata.encrypted = true;
      }

      // Calculate checksum
      backupData.metadata.checksum = await this.calculateChecksum(
        backupData.data,
      );

      // Store backup locally
      await this.storeBackupLocally(backupData);

      // Track backup creation
      if (config.isFeatureEnabled("analytics")) {
        analytics.logEvent("backup_created", {
          backup_id: backupData.metadata.backupId,
          data_types: backupData.metadata.dataTypes.join(","),
          compressed: compress,
          encrypted: encrypt,
          size_bytes: JSON.stringify(backupData).length,
        });
      }

      stateManager.setState("backup.isCreating", false);
      stateManager.setState("backup.lastBackupTime", Date.now());

      return {
        success: true,
        backupId: backupData.metadata.backupId,
        size: JSON.stringify(backupData).length,
        dataTypes: backupData.metadata.dataTypes,
      };
    } catch (error) {
      stateManager.setState("backup.isCreating", false);
      console.error("Backup creation failed:", error);
      throw new Error(`Backup fallito: ${error.message}`);
    }
  }

  /**
   * Restore data from backup
   */
  async restoreBackup(backupId, options = {}) {
    try {
      const {
        mergeWithExisting = false,
        selectiveRestore = null, // array of data types to restore
        confirmOverwrite = true,
      } = options;

      if (confirmOverwrite && !mergeWithExisting) {
        const confirmed = confirm(
          "Attenzione: il ripristino sostituirà tutti i dati attuali. " +
            "Questa operazione non può essere annullata. Continuare?",
        );

        if (!confirmed) {
          return { success: false, reason: "cancelled" };
        }
      }

      stateManager.setState("backup.isRestoring", true);

      // Get backup data
      const backupData = await this.getBackupById(backupId);
      if (!backupData) {
        throw new Error("Backup non trovato");
      }

      // Verify backup integrity
      if (!(await this.verifyBackupIntegrity(backupData))) {
        throw new Error("Backup corrotto o non valido");
      }

      let restoredData = backupData.data;

      // Decrypt if needed
      if (backupData.metadata.encrypted) {
        restoredData = await this.decryptData(restoredData);
      }

      // Decompress if needed
      if (backupData.metadata.compressed) {
        restoredData = await this.decompressData(restoredData);
      }

      // Selective restore
      const dataTypesToRestore =
        selectiveRestore || backupData.metadata.dataTypes;

      // Restore each data type
      for (const dataType of dataTypesToRestore) {
        await this.restoreDataType(
          dataType,
          restoredData[dataType],
          mergeWithExisting,
        );
      }

      // Update last restore time
      stateManager.setState("backup.lastRestoreTime", Date.now());

      // Track restore
      if (config.isFeatureEnabled("analytics")) {
        analytics.logEvent("backup_restored", {
          backup_id: backupId,
          data_types: dataTypesToRestore.join(","),
          merge_mode: mergeWithExisting,
        });
      }

      stateManager.setState("backup.isRestoring", false);

      // Refresh app state
      window.location.reload();

      return {
        success: true,
        restoredTypes: dataTypesToRestore,
        timestamp: backupData.metadata.timestamp,
      };
    } catch (error) {
      stateManager.setState("backup.isRestoring", false);
      console.error("Backup restore failed:", error);
      throw new Error(`Ripristino fallito: ${error.message}`);
    }
  }

  /**
   * Sync data to cloud
   */
  async syncToCloud() {
    if (!this.isOnline) {
      console.warn("Cannot sync to cloud: offline");
      return { success: false, reason: "offline" };
    }

    try {
      stateManager.setState("backup.isSyncing", true);

      // Create backup for sync
      const backup = await this.createBackup({
        compress: true,
        encrypt: true,
      });

      // Upload to cloud
      const cloudResult = await this.uploadToCloud(backup.backupId);

      if (cloudResult.success) {
        stateManager.setState("backup.lastSyncTime", Date.now());
        stateManager.setState("backup.hasPendingSync", false);

        if (config.isDebugMode()) {
          console.log("☁️ Sync to cloud successful");
        }
      }

      stateManager.setState("backup.isSyncing", false);

      return cloudResult;
    } catch (error) {
      stateManager.setState("backup.isSyncing", false);
      stateManager.setState("backup.hasPendingSync", true);

      console.error("Cloud sync failed:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Sync data from cloud
   */
  async syncFromCloud() {
    if (!this.isOnline) {
      return { success: false, reason: "offline" };
    }

    try {
      stateManager.setState("backup.isSyncing", true);

      // Get latest cloud backup
      const cloudBackup = await this.getLatestCloudBackup();

      if (!cloudBackup) {
        return { success: true, reason: "no_cloud_data" };
      }

      // Check if cloud data is newer
      const lastLocalBackup =
        stateManager.getState("backup.lastBackupTime") || 0;
      const cloudTimestamp = new Date(cloudBackup.metadata.timestamp).getTime();

      if (cloudTimestamp > lastLocalBackup) {
        // Cloud data is newer, offer to restore
        const shouldRestore = confirm(
          "Trovati dati più recenti nel cloud. Vuoi sincronizzare?",
        );

        if (shouldRestore) {
          await this.restoreBackup(cloudBackup.metadata.backupId, {
            mergeWithExisting: true,
            confirmOverwrite: false,
          });
        }
      }

      stateManager.setState("backup.isSyncing", false);

      return { success: true };
    } catch (error) {
      stateManager.setState("backup.isSyncing", false);
      console.error("Cloud sync from failed:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Export data in various formats
   */
  async exportData(format = "json", options = {}) {
    try {
      const {
        includePersonalData = true,
        includeWorkoutHistory = true,
        filename = null,
      } = options;

      // Create backup data
      const backup = await this.createBackup({
        includePersonalData,
        includeWorkoutHistory,
        compress: false,
        encrypt: false,
      });

      let exportData;
      let mimeType;
      let fileExtension;

      switch (format.toLowerCase()) {
        case "json":
          exportData = JSON.stringify(backup, null, 2);
          mimeType = "application/json";
          fileExtension = "json";
          break;

        case "csv":
          exportData = await this.convertToCSV(backup.data);
          mimeType = "text/csv";
          fileExtension = "csv";
          break;

        case "xml":
          exportData = await this.convertToXML(backup.data);
          mimeType = "application/xml";
          fileExtension = "xml";
          break;

        default:
          throw new Error(`Formato non supportato: ${format}`);
      }

      // Generate filename
      const defaultFilename = `fitness-pro-backup-${new Date().toISOString().split("T")[0]}.${fileExtension}`;
      const finalFilename = filename || defaultFilename;

      // Create and download file
      const blob = new Blob([exportData], { type: mimeType });
      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = finalFilename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(url);

      // Track export
      if (config.isFeatureEnabled("analytics")) {
        analytics.logEvent("data_exported", {
          format,
          size_bytes: exportData.length,
          includes_personal: includePersonalData,
          includes_workouts: includeWorkoutHistory,
        });
      }

      return {
        success: true,
        filename: finalFilename,
        size: exportData.length,
        format,
      };
    } catch (error) {
      console.error("Data export failed:", error);
      throw new Error(`Export fallito: ${error.message}`);
    }
  }

  /**
   * Import data from file
   */
  async importData(file, options = {}) {
    try {
      const { mergeWithExisting = true, validateData = true } = options;

      if (!file) {
        throw new Error("Nessun file selezionato");
      }

      const fileContent = await this.readFile(file);
      let importData;

      // Parse based on file type
      const fileExtension = file.name.split(".").pop().toLowerCase();

      switch (fileExtension) {
        case "json":
          importData = JSON.parse(fileContent);
          break;
        case "csv":
          importData = await this.parseCSV(fileContent);
          break;
        case "xml":
          importData = await this.parseXML(fileContent);
          break;
        default:
          throw new Error(`Tipo file non supportato: ${fileExtension}`);
      }

      // Validate imported data
      if (validateData && !this.validateImportData(importData)) {
        throw new Error("File non valido o corrotto");
      }

      // Import data
      if (importData.metadata && importData.data) {
        // It's a backup file
        await this.restoreBackup(importData.metadata.backupId, {
          mergeWithExisting,
          confirmOverwrite: false,
        });
      } else {
        // Direct data import
        await this.importDirectData(importData, mergeWithExisting);
      }

      // Track import
      if (config.isFeatureEnabled("analytics")) {
        analytics.logEvent("data_imported", {
          file_type: fileExtension,
          file_size: file.size,
          merge_mode: mergeWithExisting,
        });
      }

      return {
        success: true,
        filename: file.name,
        size: file.size,
      };
    } catch (error) {
      console.error("Data import failed:", error);
      throw new Error(`Import fallito: ${error.message}`);
    }
  }

  /**
   * Get list of available backups
   */
  async getBackupList() {
    try {
      const localBackups = await this.getLocalBackups();
      const cloudBackups = await this.getCloudBackups();

      return {
        local: localBackups,
        cloud: cloudBackups,
        total: localBackups.length + cloudBackups.length,
      };
    } catch (error) {
      console.error("Failed to get backup list:", error);
      return { local: [], cloud: [], total: 0 };
    }
  }

  /**
   * Delete backup
   */
  async deleteBackup(backupId, location = "local") {
    try {
      if (location === "local") {
        await this.deleteLocalBackup(backupId);
      } else if (location === "cloud") {
        await this.deleteCloudBackup(backupId);
      }

      if (config.isFeatureEnabled("analytics")) {
        analytics.logEvent("backup_deleted", {
          backup_id: backupId,
          location,
        });
      }

      return { success: true };
    } catch (error) {
      console.error("Backup deletion failed:", error);
      throw new Error(`Eliminazione backup fallita: ${error.message}`);
    }
  }

  /**
   * Setup auto-sync
   */
  startAutoSync() {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
    }

    this.syncTimer = setInterval(async () => {
      if (this.isOnline && !stateManager.getState("backup.isSyncing")) {
        await this.syncToCloud();
      }
    }, this.syncInterval);

    if (config.isDebugMode()) {
      console.log("☁️ Auto-sync started");
    }
  }

  stopAutoSync() {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }

    if (config.isDebugMode()) {
      console.log("☁️ Auto-sync stopped");
    }
  }

  /**
   * Setup network monitoring
   */
  setupNetworkMonitoring() {
    window.addEventListener("online", () => {
      this.isOnline = true;

      // Attempt to sync pending changes
      if (stateManager.getState("backup.hasPendingSync")) {
        setTimeout(() => this.syncToCloud(), 2000);
      }
    });

    window.addEventListener("offline", () => {
      this.isOnline = false;
    });
  }

  /**
   * Setup data change monitoring
   */
  setupDataChangeMonitoring() {
    // Monitor for data changes that require backup
    stateManager.subscribe("user.profile", () => {
      this.scheduleBackup();
    });

    // Monitor workout completion
    stateManager.subscribe("workout.isActive", (isActive) => {
      if (!isActive) {
        // Workout ended, schedule backup
        setTimeout(() => this.scheduleBackup(), 5000);
      }
    });
  }

  scheduleBackup() {
    if (this.backupTimeout) {
      clearTimeout(this.backupTimeout);
    }

    // Debounce backup creation
    this.backupTimeout = setTimeout(async () => {
      try {
        await this.createBackup();

        if (this.autoSyncEnabled && this.isOnline) {
          await this.syncToCloud();
        }
      } catch (error) {
        console.warn("Scheduled backup failed:", error);
      }
    }, 30000); // 30 seconds delay
  }

  /**
   * Utility functions
   */
  generateBackupId() {
    return (
      "backup_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9)
    );
  }

  async calculateChecksum(data) {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(JSON.stringify(data));

    if (window.crypto && window.crypto.subtle) {
      const hashBuffer = await window.crypto.subtle.digest(
        "SHA-256",
        dataBuffer,
      );
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
    }

    // Fallback: simple hash
    let hash = 0;
    const str = JSON.stringify(data);
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(16);
  }

  async compressData(data) {
    const json = JSON.stringify(data);

    if (typeof CompressionStream === "undefined") {
      return {
        compressed: false,
        format: "json",
        data: json,
      };
    }

    const compressedBase64 = await this._compressString(json);
    return {
      compressed: true,
      format: "gzip-base64",
      data: compressedBase64,
    };
  }

  async decompressData(compressedData) {
    if (!compressedData || !compressedData.compressed) {
      return compressedData;
    }

    if (compressedData.format === "gzip-base64") {
      const json = await this._decompressString(compressedData.data);
      return JSON.parse(json);
    }

    return JSON.parse(compressedData.data);
  }

  async encryptData(data) {
    if (!window.crypto?.subtle) {
      throw new Error("Crittografia non supportata su questo dispositivo.");
    }

    const passphrase = await this._getPassphrase("per cifrare il backup");
    const salt = window.crypto.getRandomValues(new Uint8Array(16));
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const key = await this._deriveKey(passphrase, salt);

    const encoded = new TextEncoder().encode(JSON.stringify(data));
    const cipherBuffer = await window.crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      key,
      encoded,
    );

    return {
      encrypted: true,
      alg: "AES-GCM",
      kdf: "PBKDF2",
      salt: this._bufferToBase64(salt),
      iv: this._bufferToBase64(iv),
      data: this._bufferToBase64(new Uint8Array(cipherBuffer)),
    };
  }

  async decryptData(encryptedData) {
    if (!encryptedData || !encryptedData.encrypted) {
      return encryptedData;
    }

    if (!window.crypto?.subtle) {
      throw new Error("Crittografia non supportata su questo dispositivo.");
    }

    const passphrase = await this._getPassphrase("per decifrare il backup");
    const salt = this._base64ToBytes(encryptedData.salt);
    const iv = this._base64ToBytes(encryptedData.iv);
    const key = await this._deriveKey(passphrase, salt);
    const cipherBytes = this._base64ToBytes(encryptedData.data);

    const plainBuffer = await window.crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      key,
      cipherBytes,
    );

    const json = new TextDecoder().decode(plainBuffer);
    return JSON.parse(json);
  }

  async _compressString(text) {
    const stream = new Blob([text])
      .stream()
      .pipeThrough(new CompressionStream("gzip"));
    const buffer = await new Response(stream).arrayBuffer();
    return this._bufferToBase64(new Uint8Array(buffer));
  }

  async _decompressString(base64Data) {
    const bytes = this._base64ToBytes(base64Data);
    const stream = new Blob([bytes])
      .stream()
      .pipeThrough(new DecompressionStream("gzip"));
    const buffer = await new Response(stream).arrayBuffer();
    return new TextDecoder().decode(buffer);
  }

  _getRememberPassphraseKey() {
    return `${config.get("storage.prefix")}backup_remember_passphrase`;
  }

  _getSessionPassphraseKey() {
    return `${config.get("storage.prefix")}backup_passphrase`;
  }

  _loadRememberPassphrasePreference() {
    try {
      return localStorage.getItem(this._getRememberPassphraseKey()) === "true";
    } catch {
      return false;
    }
  }

  setRememberPassphrase(enabled) {
    this.rememberPassphrase = Boolean(enabled);
    try {
      localStorage.setItem(
        this._getRememberPassphraseKey(),
        String(this.rememberPassphrase),
      );
    } catch {
      // Ignore storage errors
    }

    if (!this.rememberPassphrase) {
      this.clearPassphrase();
    }
  }

  setPassphrase(passphrase) {
    if (!passphrase) {
      throw new Error("Passphrase mancante.");
    }

    this.cachedPassphrase = passphrase;

    if (this.rememberPassphrase) {
      try {
        sessionStorage.setItem(this._getSessionPassphraseKey(), passphrase);
      } catch {
        // Ignore storage errors
      }
    }
  }

  clearPassphrase() {
    this.cachedPassphrase = null;
    try {
      sessionStorage.removeItem(this._getSessionPassphraseKey());
    } catch {
      // Ignore storage errors
    }
  }

  getPassphraseStatus() {
    let hasSessionStored = false;
    try {
      hasSessionStored = Boolean(
        sessionStorage.getItem(this._getSessionPassphraseKey()),
      );
    } catch {
      hasSessionStored = false;
    }

    return {
      rememberEnabled: this.rememberPassphrase,
      hasCached: Boolean(this.cachedPassphrase),
      hasSessionStored,
    };
  }

  async _getPassphrase(reason) {
    if (this.cachedPassphrase) {
      return this.cachedPassphrase;
    }

    if (this.rememberPassphrase) {
      try {
        const stored = sessionStorage.getItem(this._getSessionPassphraseKey());
        if (stored) {
          this.cachedPassphrase = stored;
          return stored;
        }
      } catch {
        // Ignore storage errors
      }
    }

    const message = reason
      ? `Inserisci una passphrase ${reason}:`
      : "Inserisci una passphrase:";
    const passphrase = prompt(message);

    if (!passphrase) {
      throw new Error("Passphrase mancante.");
    }

    this.setPassphrase(passphrase);
    return passphrase;
  }

  async _deriveKey(passphrase, salt) {
    const baseKey = await window.crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(passphrase),
      "PBKDF2",
      false,
      ["deriveKey"],
    );

    return window.crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt,
        iterations: 100000,
        hash: "SHA-256",
      },
      baseKey,
      { name: "AES-GCM", length: 256 },
      false,
      ["encrypt", "decrypt"],
    );
  }

  _bufferToBase64(bytes) {
    let binary = "";
    const chunkSize = 0x8000;
    for (let i = 0; i < bytes.length; i += chunkSize) {
      binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
    }
    return btoa(binary);
  }

  _base64ToBytes(base64) {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }

  _escapeCsv(value) {
    const text = String(value ?? "");
    if (text.includes('"') || text.includes(",") || text.includes("\n")) {
      return `"${text.replace(/"/g, '""')}"`;
    }
    return text;
  }

  _parseCsvLine(line) {
    const values = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const next = line[i + 1];

      if (inQuotes) {
        if (char === '"' && next === '"') {
          current += '"';
          i++;
        } else if (char === '"') {
          inQuotes = false;
        } else {
          current += char;
        }
      } else {
        if (char === '"') {
          inQuotes = true;
        } else if (char === ",") {
          values.push(current);
          current = "";
        } else {
          current += char;
        }
      }
    }

    values.push(current);
    return values;
  }

  _escapeXml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");
  }

  async convertToCSV(data) {
    const rows = [["section", "json"]];
    Object.entries(data || {}).forEach(([section, value]) => {
      if (Array.isArray(value)) {
        value.forEach((item) => {
          rows.push([section, JSON.stringify(item)]);
        });
      } else {
        rows.push([section, JSON.stringify(value)]);
      }
    });

    return rows
      .map((row) => row.map((cell) => this._escapeCsv(cell)).join(","))
      .join("\n");
  }

  async parseCSV(csvText) {
    const lines = (csvText || "")
      .split(/\r?\n/)
      .filter((line) => line.trim().length > 0);

    if (lines.length < 2) {
      throw new Error("CSV non valido o vuoto.");
    }

    const header = this._parseCsvLine(lines[0]);
    const sectionIndex = header.indexOf("section");
    const jsonIndex = header.indexOf("json");

    if (sectionIndex === -1 || jsonIndex === -1) {
      throw new Error("CSV non valido: intestazioni mancanti.");
    }

    const result = {};
    for (let i = 1; i < lines.length; i++) {
      const values = this._parseCsvLine(lines[i]);
      const section = values[sectionIndex];
      const json = values[jsonIndex];

      if (!section) continue;

      let parsedValue = null;
      try {
        parsedValue = JSON.parse(json);
      } catch {
        parsedValue = json;
      }

      if (section in result) {
        if (!Array.isArray(result[section])) {
          result[section] = [result[section]];
        }
        result[section].push(parsedValue);
      } else {
        result[section] = parsedValue;
      }
    }

    return result;
  }

  async convertToXML(data) {
    const sections = Object.entries(data || {})
      .map(([section, value]) => {
        if (Array.isArray(value)) {
          const items = value
            .map(
              (item) => `<item>${this._escapeXml(JSON.stringify(item))}</item>`,
            )
            .join("");
          return `<section name="${this._escapeXml(section)}">${items}</section>`;
        }
        return `<section name="${this._escapeXml(section)}">${this._escapeXml(JSON.stringify(value))}</section>`;
      })
      .join("");

    return `<?xml version="1.0" encoding="UTF-8"?><backup>${sections}</backup>`;
  }

  async parseXML(xmlText) {
    if (typeof DOMParser === "undefined") {
      throw new Error("Parsing XML non supportato su questo dispositivo.");
    }

    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlText, "application/xml");
    const parseError = doc.querySelector("parsererror");

    if (parseError) {
      throw new Error("XML non valido.");
    }

    const result = {};
    const sections = Array.from(doc.querySelectorAll("section"));
    sections.forEach((section) => {
      const name = section.getAttribute("name");
      if (!name) return;

      const items = Array.from(section.querySelectorAll("item"));
      if (items.length > 0) {
        result[name] = items.map((item) => {
          try {
            return JSON.parse(item.textContent || "");
          } catch {
            return item.textContent || "";
          }
        });
      } else {
        const text = section.textContent || "";
        try {
          result[name] = JSON.parse(text);
        } catch {
          result[name] = text;
        }
      }
    });

    return result;
  }

  async importDirectData(data, mergeWithExisting = true) {
    if (!data || typeof data !== "object") {
      throw new Error("Dati import non validi.");
    }

    if (data.user) {
      await this.restoreDataType("user", data.user, mergeWithExisting);
    }

    if (data.workoutHistory) {
      await this.restoreDataType(
        "workoutHistory",
        data.workoutHistory,
        mergeWithExisting,
      );
    }

    if (data.preferences) {
      await this.restoreDataType(
        "preferences",
        data.preferences,
        mergeWithExisting,
      );
    }

    if (data.uiState) {
      await this.restoreDataType("uiState", data.uiState, mergeWithExisting);
    }

    if (Array.isArray(data.exercises)) {
      data.exercises.forEach((exercise) => dataManager.addExercise(exercise));
    }

    if (Array.isArray(data.workouts)) {
      data.workouts.forEach((workout) => dataManager.addWorkout(workout));
    }
  }

  async deleteLocalBackup(backupId) {
    const backups = this.getStoredBackups();
    if (!backups[backupId]) {
      console.warn(`Backup non trovato: ${backupId}`);
      return;
    }

    delete backups[backupId];
    localStorage.setItem(
      `${config.get("storage.prefix")}backups`,
      JSON.stringify(backups),
    );
  }

  async deleteCloudBackup() {
    throw new Error("Cloud provider non configurato o non supportato.");
  }

  async storeBackupLocally(backupData) {
    const backups = this.getStoredBackups();
    backups[backupData.metadata.backupId] = backupData;

    // Limit number of local backups
    const backupIds = Object.keys(backups).sort(
      (a, b) =>
        new Date(backups[b].metadata.timestamp) -
        new Date(backups[a].metadata.timestamp),
    );

    if (backupIds.length > this.maxBackups) {
      const toDelete = backupIds.slice(this.maxBackups);
      toDelete.forEach((id) => delete backups[id]);
    }

    localStorage.setItem(
      `${config.get("storage.prefix")}backups`,
      JSON.stringify(backups),
    );
  }

  getStoredBackups() {
    try {
      const stored = localStorage.getItem(
        `${config.get("storage.prefix")}backups`,
      );
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  }

  async getBackupById(backupId) {
    const backups = this.getStoredBackups();
    return backups[backupId] || null;
  }

  async verifyBackupIntegrity(backupData) {
    try {
      const calculatedChecksum = await this.calculateChecksum(backupData.data);
      return calculatedChecksum === backupData.metadata.checksum;
    } catch {
      return false;
    }
  }

  async restoreDataType(dataType, data, merge) {
    switch (dataType) {
      case "user":
        if (data) {
          // Update user profile
          const currentUser = merge ? await dataManager.getCurrentUser() : null;
          const userData = merge ? { ...currentUser, ...data } : data;
          await dataManager.saveUser(userData);
        }
        break;

      case "workoutHistory":
        if (data && Array.isArray(data)) {
          const existingLogs = merge ? dataManager.getLogs() : [];
          const mergedLogs = merge ? [...existingLogs, ...data] : data;

          // Remove duplicates by ID
          const uniqueLogs = mergedLogs.filter(
            (log, index, self) =>
              index === self.findIndex((l) => l.id === log.id),
          );

          // Save logs individually
          uniqueLogs.forEach((log) => dataManager.saveLog(log));
        }
        break;

      case "preferences":
        if (data) {
          Object.entries(data).forEach(([key, value]) => {
            config.setUserPreference(key, value);
          });
        }
        break;

      case "uiState":
        if (data) {
          stateManager.updateState("ui", data);
        }
        break;
    }
  }

  readFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = (e) => reject(e);
      reader.readAsText(file);
    });
  }

  validateImportData(data) {
    // Basic validation
    if (!data) return false;

    // Check if it's a backup file
    if (data.metadata && data.data) {
      return data.metadata.source === "fitness-pro-app";
    }

    // Check if it has expected data structure
    return typeof data === "object";
  }

  /**
   * Cloud operations (mock implementations)
   */
  async uploadToCloud(backupId) {
    // Mock cloud upload
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ success: true, cloudId: backupId + "_cloud" });
      }, 1000);
    });
  }

  async getLatestCloudBackup() {
    // Mock cloud retrieval
    return null;
  }

  async getLocalBackups() {
    const backups = this.getStoredBackups();
    return Object.values(backups).map((backup) => ({
      id: backup.metadata.backupId,
      timestamp: backup.metadata.timestamp,
      size: JSON.stringify(backup).length,
      dataTypes: backup.metadata.dataTypes,
      location: "local",
    }));
  }

  async getCloudBackups() {
    // Mock cloud backup list
    return [];
  }

  async restorePendingSyncs() {
    // Check for pending sync operations
    const hasPending = stateManager.getState("backup.hasPendingSync");
    if (hasPending && this.isOnline) {
      setTimeout(() => this.syncToCloud(), 5000);
    }
  }

  /**
   * Get backup statistics
   */
  getBackupStats() {
    const backups = this.getStoredBackups();
    const backupList = Object.values(backups);

    return {
      totalBackups: backupList.length,
      latestBackup:
        backupList.length > 0
          ? Math.max(
              ...backupList.map((b) =>
                new Date(b.metadata.timestamp).getTime(),
              ),
            )
          : null,
      totalSize: backupList.reduce(
        (sum, b) => sum + JSON.stringify(b).length,
        0,
      ),
      lastSync: stateManager.getState("backup.lastSyncTime"),
      autoSyncEnabled: this.autoSyncEnabled,
      cloudProvider: this.cloudProvider,
    };
  }
}

export const backupService = new BackupService();

// Export for debugging in development
if (config.isDebugMode()) {
  window.backupService = backupService;
}
