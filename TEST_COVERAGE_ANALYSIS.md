# Test Coverage Analysis - Fitness Pro

## Executive Summary

The Fitness Pro codebase has **approximately 160+ public methods** across 15 key source files. The existing TestRunner (`js/utils/TestRunner.js`) contains **14 tests**, nearly all of which are **existence checks or shallow type assertions**. Only ~5 methods receive any behavioral testing (a single get/set cycle, a return-type check, or a single call without assertions).

**Estimated behavioral test coverage: ~3%**

The majority of critical business logic -- authentication flows, data persistence, workout tracking, GPS distance calculation, recommendation scoring, gamification, and backup encryption -- has **zero test coverage**.

---

## Current Test Suite Overview

The 14 existing tests and their depth:

| # | Test Name | Priority | What It Actually Tests |
|---|-----------|----------|----------------------|
| 1 | Config System | critical | `config` object exists, `version` and `environment` are truthy |
| 2 | State Manager | critical | One `setState`/`getState` roundtrip |
| 3 | Data Manager | critical | `getExercises()` and `getWorkouts()` return arrays |
| 4 | Auth Service | critical | 3 methods exist as functions |
| 5 | Router System | critical | `getCurrentPath()` returns a string |
| 6 | Error Handler | normal | `logInfo()` call + `getErrorStats().totalErrors` is a number |
| 7 | Performance Monitor | normal | `getPerformanceSummary()` returns object with `timestamp` |
| 8 | Backup Service | normal | `getBackupStats().totalBackups` is a number |
| 9 | Notification Manager | normal | Create and dismiss a notification |
| 10 | UI Components | normal | 3 DOM elements exist + CSS variable loaded |
| 11 | PWA Features | normal | Service worker API, manifest link, meta tags present |
| 12 | Local Storage | normal | `localStorage` read/write/remove roundtrip |
| 13 | Network Handling | normal | `navigator.onLine` is boolean + `fetch` exists |
| 14 | Full Integration | critical | 8 global objects exist + 4 `fitnessApp` methods exist |

**Problem**: These tests verify that things are _present_, not that they _work correctly_. A test like "Auth Service" passes even if `createAccount()` silently corrupts data -- it only checks that the function exists.

---

## Coverage Gaps by File

### Completely Untested Services (0% coverage)

#### 1. GamificationService (`js/services/GamificationService.js`)
- `calculateStats()` -- complex aggregation of today/weekly/monthly workout logs
- `checkAndUnlockAchievements()` -- evaluates badge conditions against stats
- `getUserLevel()` -- 7-tier point-based level system with progress calculation
- Badge condition closures -- each badge has a threshold function
- `completeChallenge()` -- awards points, increments counter

#### 2. LeaderboardService (`js/services/LeaderboardService.js`)
- `calculateUserStats()` -- totalMinutes, caloriesBurned, consistency calculation
- `createLeaderboard()` -- computes userRank and percentile (division-by-zero risk)
- `getComparisonWithRank()` -- percentage differences (division-by-zero risk)
- `getProgressionTips()` -- conditional tip generation based on thresholds

#### 3. RecommendationEngine (`js/services/RecommendationEngine.js`)
- `calculateWorkoutScore()` -- weighted multi-factor scoring algorithm (30+20+15+15+10+10+5 points)
- `scoreGoalAlignment()` -- maps user goals to workout categories
- `scoreFrequency()` -- anti-repetition logic with date math
- `difficultyToNumber()` -- maps Italian/English difficulty labels to numbers
- `getContextualRecommendation()` -- filter+score pipeline

#### 4. CoachingEngine (`js/services/CoachingEngine.js`)
- `analyzeWorkoutPerformance()` -- 0-100 score from sets/reps/duration
- `getFormFeedback()` -- exercise-specific form tips lookup
- `getRealTimeCoaching()` -- boundary conditions for last/penultimate sets
- `calculateUserLevel()` -- level tier system with progression
- `storeFeedback()` -- capped history (max 50 entries)

#### 5. IndexedDBService (`js/services/IndexedDBService.js`)
- All CRUD operations (`put`/`get`/`getAll`/`query`/`delete`/`clear`)
- `batch()` -- heterogeneous operation processing
- `localStorageFallback()` -- 6-operation-type switch (double-parse risk in `getAll`)
- `setupSchema()` -- 5 object stores with indexes
- `exportDatabase()` / `importDatabase()` -- no roundtrip test

#### 6. SyncQueueService (`js/services/SyncQueueService.js`)
- `syncNow()` -- processes pending/failed items with retry logic
- `addToQueue()` -- creates items, persists, triggers sync if online
- Retry with exponential backoff (`[1000, 5000, 15000]`)
- Offline-to-online transition behavior

### Completely Untested Views (0% coverage)

#### 7. ActiveWorkout (`js/views/ActiveWorkout.js`)
- Workout loading from URL params + fallback logic
- `handleNextSet()` -- set/rep progression and session stats tracking
- `finishWorkout()` -- log creation, calorie/duration calculation, data persistence
- Timer interval management

#### 8. RunTracker (`js/views/RunTracker.js`)
- `calculateDistance()` -- Haversine formula (pure math, ideal for unit testing)
- `formatTime()` -- HH:MM:SS / MM:SS formatting
- `formatPace()` -- edge cases for infinity, >99, NaN
- `handlePosition()` -- GPS jitter filtering (accuracy > 30m, speed > 50km/h), distance accumulation, pace calculation, km split detection
- `stopRun()` -- position downsampling (> 100 points)

### Services with Existence-Only Coverage

#### 9. AuthService (`js/services/AuthService.js`) -- ~1% covered
**Tested**: 3 methods checked as `typeof === 'function'`
**Untested critical logic**:
- `createAccount()` -- validation, lockout check, ID generation, encryption, session creation
- `validateUserData()` -- name length >=2, age 13-120, valid goal enum, email regex
- `login()` -- lockout logic (maxLoginAttempts, lockedUntil)
- `encrypt()`/`decrypt()` -- AES-GCM roundtrip
- `isValidEmail()` -- regex validation
- Account lockout mechanism

#### 10. DataManager (`js/services/DataManager.js`) -- ~2% covered
**Tested**: `getExercises()` and `getWorkouts()` return arrays
**Untested critical logic**:
- `_validateData()` -- validates exercises, workouts, users, logs
- `_calculateStreak()` -- date-walking streak logic (high regression risk)
- `saveLog()` -- auto-ID, timestamp, stats update, analytics
- `getWorkoutById()` -- exercise hydration (join operation)
- `_save()` -- size limit enforcement, QuotaExceededError handling
- Duplicate ID detection in `addExercise()`/`addWorkout()`

#### 11. BackupService (`js/services/BackupService.js`) -- ~1% covered
**Tested**: `getBackupStats()` returns object with `totalBackups` as number
**Untested critical logic**:
- `createBackup()` -- gather, compress, encrypt, checksum, store
- `restoreBackup()` -- integrity check, decrypt, decompress, merge
- `encryptData()`/`decryptData()` -- PBKDF2 + AES-GCM with user passphrase
- `compressData()`/`decompressData()` -- CompressionStream gzip roundtrip
- `convertToCSV()`/`parseCSV()` -- quote escaping, line parsing
- `verifyBackupIntegrity()` -- SHA-256 checksum
- `storeBackupLocally()` -- max backups eviction

### Utils with Shallow Coverage

#### 12. StateManager (`js/utils/StateManager.js`) -- ~3% covered
**Tested**: One `setState`/`getState` cycle
**Untested**: `subscribe()` + notification propagation to parent paths, `dispatch()` for 12 action types, middleware system, state persistence (selective serialization), computed properties (`isWorkoutActive`, `workoutProgress`, `userLevel`)

#### 13. ErrorHandler (`js/utils/ErrorHandler.js`) -- ~2% covered
**Tested**: `logInfo()` called once, `getErrorStats()` type-checked
**Untested**: `classifyError()` (regex-based 5-category classification), `shouldSuppressError()` (deduplication, high-frequency threshold), `handleError()` pipeline, error recovery mechanisms, retry with exponential backoff, rate limiting for notifications

#### 14. Config (`js/utils/Config.js`) -- ~2% covered
**Tested**: `version` and `environment` are truthy
**Untested**: `detectEnvironment()` (hostname-based), `deepMerge()` (recursive merge), `get()` (dot-notation path resolution), `validate()` (required fields, URL format, limits range), `setApiKey()` + localStorage, `exportConfig()` (API key masking -- could leak if broken)

#### 15. App (`js/app.js`) -- ~1% covered
**Tested**: 4 method existence checks + 8 global object checks
**Untested**: `router()` (path resolution, auth guard, 404, view rendering), `navigateTo()` (hash + pushState), auth guard redirect logic, service initialization orchestration, online/offline event handling

---

## Proposed Improvements: Priority-Ordered Test Plan

### Tier 1: Critical -- Pure Functions (Easy Wins, High Value)

These are pure functions that can be tested in isolation without DOM or browser APIs.

1. **RunTracker `calculateDistance(lat1, lon1, lat2, lon2)`**
   - Test known GPS coordinate pairs against expected distances
   - Edge cases: same point (0 distance), antipodal points, equator vs polar

2. **RunTracker `formatTime(seconds)` and `formatPace(paceMinPerKm)`**
   - Boundary values: 0, 59, 60, 3599, 3600, negative, Infinity, NaN
   - `formatPace` edge cases: Infinity -> `"--:--"`, >99 -> `"--:--"`

3. **Config `deepMerge(target, source)`**
   - Nested objects, arrays (should not recurse), null values, undefined values
   - Verify it doesn't mutate the target

4. **Config `detectEnvironment()`**
   - localhost -> development, staging.* -> staging, production hosts -> production

5. **DataManager `_validateData(data, type)`**
   - Valid and invalid exercises, workouts, users, and logs
   - Missing required fields, wrong types

6. **RecommendationEngine `difficultyToNumber(label)`**
   - Italian labels: "facile", "medio", "difficile", "esperto"
   - English labels: "easy", "medium", "hard", "expert"
   - Unknown label handling

7. **AuthService `isValidEmail(email)`**
   - Valid emails, invalid formats, empty strings, edge cases

### Tier 2: Critical -- Core Business Logic

8. **DataManager `_calculateStreak(logs)`**
   - Consecutive days, gaps, today-only, yesterday+today, empty logs
   - Date boundary edge cases (midnight, timezone)

9. **AuthService `validateUserData(userData, isUpdate)`**
   - Valid data, name too short, age out of range (< 13, > 120), invalid goal
   - Partial updates (isUpdate = true)

10. **RecommendationEngine `calculateWorkoutScore()`**
    - Verify weights sum correctly
    - Test each scoring factor independently
    - Test with missing/null user data

11. **GamificationService `calculateStats()`**
    - Empty logs, single workout, week boundary, monthly boundary
    - Verify all stat fields are computed correctly

12. **GamificationService `getUserLevel()`**
    - Each tier threshold boundary
    - Progress percentage calculation

13. **CoachingEngine `analyzeWorkoutPerformance()`**
    - Score calculation with various set/rep/duration inputs
    - Strengths and improvements identification

14. **LeaderboardService `calculateUserStats()`**
    - Calorie calculation (5 cal/min), consistency, edge cases with empty logs

### Tier 3: Important -- Data Integrity & Security

15. **AuthService `createAccount()` flow**
    - Valid account creation, duplicate detection
    - Lockout behavior after max failed attempts

16. **AuthService `encrypt()`/`decrypt()` roundtrip**
    - Verify data survives encrypt-then-decrypt
    - Test with various data types and sizes

17. **BackupService `encryptData()`/`decryptData()` roundtrip**
    - Verify passphrase-based encryption roundtrip
    - Wrong passphrase should fail decryption

18. **BackupService `verifyBackupIntegrity()`**
    - Valid checksum passes, tampered data fails

19. **BackupService `compressData()`/`decompressData()` roundtrip**
    - Verify data survives compress-then-decompress

20. **BackupService `convertToCSV()`/`parseCSV()` roundtrip**
    - Data with commas, quotes, newlines in values
    - Empty fields, special characters

21. **Config `exportConfig()` API key masking**
    - Verify API keys are replaced with `***HIDDEN***`
    - Verify non-sensitive data is preserved

### Tier 4: Important -- State Management & Error Handling

22. **StateManager `subscribe()` + `notifySubscribers()`**
    - Subscribe to path, set value, verify callback fires
    - Parent path notification (subscribe to `user`, change `user.profile`)

23. **StateManager `dispatch()` actions**
    - Test each of the 12 action types sets correct state
    - Invalid action type handling

24. **StateManager `persistState()` / `loadPersistedState()`**
    - Selective persistence of `user.preferences`, `ui.theme`, etc.
    - Verify non-persisted state is excluded

25. **ErrorHandler `classifyError()`**
    - Network errors (fetch, CORS, timeout patterns)
    - Storage errors (quota, IndexedDB patterns)
    - Security errors (CSRF, XSS patterns)

26. **ErrorHandler `shouldSuppressError()`**
    - Deduplication by signature
    - High-frequency threshold (>10 same errors)

27. **SyncQueueService `addToQueue()` + `syncNow()`**
    - Add item, verify persistence
    - Process pending items
    - Retry logic for failed items

### Tier 5: Integration & Flow Tests

28. **Workout flow**: Load workout -> track sets -> finish -> verify log saved
29. **Auth flow**: Create account -> login -> session validation -> logout
30. **Backup flow**: Create backup -> verify integrity -> restore -> verify data matches
31. **Router**: Navigate to routes, auth guard redirect, 404 handling
32. **Offline**: Queue operations while offline -> go online -> verify sync

---

## Structural Recommendations

### 1. Extract Pure Functions for Testability
Several services contain pure functions buried inside closures or class methods. Extracting them would make testing dramatically easier:
- `calculateDistance()` from RunTracker
- `formatTime()`, `formatPace()` from RunTracker
- `deepMerge()`, `detectEnvironment()` from Config
- `_calculateStreak()`, `_validateData()` from DataManager
- `difficultyToNumber()`, scoring functions from RecommendationEngine
- `classifyError()` from ErrorHandler

### 2. Introduce a Proper Test Framework
The custom TestRunner is browser-only and requires the full app to be initialized. Consider:
- Adding **Node.js-compatible unit tests** (using Vitest or Jest with jsdom) for pure logic
- Keeping the browser-based TestRunner for integration/smoke tests
- This enables CI/CD integration

### 3. Add Assertion Utilities
The current tests use only `throw new Error()`. Adding proper assertions (`assertEquals`, `assertThrows`, `assertDeepEquals`) would make tests more readable and failure messages more informative.

### 4. Test Data Fixtures
Create shared test fixtures for:
- Sample user profiles
- Sample workout logs (with various date patterns for streak testing)
- Sample exercises and workouts
- Known GPS coordinate pairs with expected distances

### 5. Mock External Dependencies
Several services depend on browser APIs (IndexedDB, Geolocation, Crypto) and external APIs (Gemini, OpenFoodFacts). Create mock implementations to enable:
- Offline testing
- Deterministic results
- Testing error paths

---

## Risk Assessment

| Area | Risk if Untested | Likelihood of Bugs |
|------|-----------------|-------------------|
| Auth validation & lockout | **High** -- security bypass | Medium |
| Backup encrypt/decrypt | **High** -- data loss | Medium |
| Streak calculation | **Medium** -- user frustration | High (date math is notoriously error-prone) |
| GPS distance (Haversine) | **Medium** -- inaccurate tracking | Low (well-known formula) but implementation could have typos |
| Recommendation scoring | **Medium** -- poor recommendations | Medium |
| CSV/XML parsing | **Medium** -- import/export failures | High (string escaping edge cases) |
| State persistence | **Medium** -- lost preferences | Medium |
| Error classification | **Low** -- wrong recovery action | Low |
| Gamification levels | **Low** -- cosmetic | Low |

---

## Quick Win Estimate

Implementing Tier 1 tests (7 test groups for pure functions) would raise behavioral coverage from ~3% to ~15% with minimal effort, since these functions need no mocking or DOM setup. Tiers 1-2 together would bring coverage to approximately 30-35%.
