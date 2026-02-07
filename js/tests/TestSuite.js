/**
 * TestSuite.js
 * Comprehensive test suite for Fitness Pro App
 * Covers Tiers 1-5 from the coverage analysis
 */

// ============================================================
// ASSERTION UTILITIES
// ============================================================

class AssertionError extends Error {
  constructor(message) {
    super(message);
    this.name = "AssertionError";
  }
}

function assertEqual(actual, expected, label = "") {
  if (actual !== expected) {
    throw new AssertionError(
      `${label ? label + ": " : ""}Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`
    );
  }
}

function assertDeepEqual(actual, expected, label = "") {
  const a = JSON.stringify(actual);
  const b = JSON.stringify(expected);
  if (a !== b) {
    throw new AssertionError(
      `${label ? label + ": " : ""}Expected ${b}, got ${a}`
    );
  }
}

function assertTrue(value, label = "") {
  if (!value) {
    throw new AssertionError(
      `${label ? label + ": " : ""}Expected truthy, got ${JSON.stringify(value)}`
    );
  }
}

function assertFalse(value, label = "") {
  if (value) {
    throw new AssertionError(
      `${label ? label + ": " : ""}Expected falsy, got ${JSON.stringify(value)}`
    );
  }
}

function assertThrows(fn, label = "") {
  try {
    fn();
    throw new AssertionError(
      `${label ? label + ": " : ""}Expected function to throw, but it did not`
    );
  } catch (e) {
    if (e instanceof AssertionError) throw e;
    // Expected throw
  }
}

function assertCloseTo(actual, expected, tolerance, label = "") {
  if (Math.abs(actual - expected) > tolerance) {
    throw new AssertionError(
      `${label ? label + ": " : ""}Expected ${expected} ± ${tolerance}, got ${actual}`
    );
  }
}

function assertArrayLength(arr, length, label = "") {
  if (!Array.isArray(arr)) {
    throw new AssertionError(
      `${label ? label + ": " : ""}Expected array, got ${typeof arr}`
    );
  }
  if (arr.length !== length) {
    throw new AssertionError(
      `${label ? label + ": " : ""}Expected array of length ${length}, got ${arr.length}`
    );
  }
}

function assertNotNull(value, label = "") {
  if (value === null || value === undefined) {
    throw new AssertionError(
      `${label ? label + ": " : ""}Expected non-null value, got ${value}`
    );
  }
}

function assertNull(value, label = "") {
  if (value !== null && value !== undefined) {
    throw new AssertionError(
      `${label ? label + ": " : ""}Expected null/undefined, got ${JSON.stringify(value)}`
    );
  }
}

function assertContains(str, substring, label = "") {
  if (typeof str !== "string" || !str.includes(substring)) {
    throw new AssertionError(
      `${label ? label + ": " : ""}Expected "${str}" to contain "${substring}"`
    );
  }
}

function assertType(value, expectedType, label = "") {
  if (typeof value !== expectedType) {
    throw new AssertionError(
      `${label ? label + ": " : ""}Expected type ${expectedType}, got ${typeof value}`
    );
  }
}

// ============================================================
// TIER 1: PURE FUNCTION TESTS
// ============================================================

/**
 * RunTracker pure function tests
 */
async function testRunTrackerPureFunctions() {
  const { calculateDistance, formatTime, formatPace, toRad } = await import(
    "../views/RunTracker.js"
  );

  // --- toRad ---
  assertCloseTo(toRad(0), 0, 0.0001, "toRad(0)");
  assertCloseTo(toRad(180), Math.PI, 0.0001, "toRad(180)");
  assertCloseTo(toRad(90), Math.PI / 2, 0.0001, "toRad(90)");
  assertCloseTo(toRad(360), 2 * Math.PI, 0.0001, "toRad(360)");

  // --- calculateDistance (Haversine) ---
  // Same point = 0 distance
  assertCloseTo(
    calculateDistance(45.0, 9.0, 45.0, 9.0),
    0,
    0.001,
    "Same point distance"
  );

  // Known distance: Rome (41.9028, 12.4964) to Milan (45.4642, 9.1900) ≈ 477 km
  const romeMilan = calculateDistance(41.9028, 12.4964, 45.4642, 9.19);
  assertCloseTo(romeMilan, 477, 10, "Rome-Milan distance");

  // Short distance: ~100m apart
  const short = calculateDistance(45.0, 9.0, 45.0009, 9.0);
  assertCloseTo(short, 0.1, 0.05, "Short ~100m distance");

  // Symmetry: distance A->B = distance B->A
  const ab = calculateDistance(40.0, 10.0, 50.0, 20.0);
  const ba = calculateDistance(50.0, 20.0, 40.0, 10.0);
  assertCloseTo(ab, ba, 0.001, "Distance symmetry");

  // Non-negative
  assertTrue(
    calculateDistance(0, 0, 90, 180) >= 0,
    "Distance is non-negative"
  );

  // --- formatTime ---
  assertEqual(formatTime(0), "00:00", "formatTime(0)");
  assertEqual(formatTime(59), "00:59", "formatTime(59)");
  assertEqual(formatTime(60), "01:00", "formatTime(60)");
  assertEqual(formatTime(61), "01:01", "formatTime(61)");
  assertEqual(formatTime(3599), "59:59", "formatTime(3599)");
  assertEqual(formatTime(3600), "01:00:00", "formatTime(3600)");
  assertEqual(formatTime(3661), "01:01:01", "formatTime(3661)");
  assertEqual(formatTime(7200), "02:00:00", "formatTime(7200)");

  // --- formatPace ---
  assertEqual(formatPace(0), "--:--", "formatPace(0)");
  assertEqual(formatPace(null), "--:--", "formatPace(null)");
  assertEqual(formatPace(undefined), "--:--", "formatPace(undefined)");
  assertEqual(formatPace(Infinity), "--:--", "formatPace(Infinity)");
  assertEqual(formatPace(100), "--:--", "formatPace(100)");
  assertEqual(formatPace(NaN), "--:--", "formatPace(NaN)");
  assertEqual(formatPace(5.0), "5'00\"", "formatPace(5.0)");
  assertEqual(formatPace(5.5), "5'30\"", "formatPace(5.5)");
  assertEqual(formatPace(4.25), "4'15\"", "formatPace(4.25)");
}

/**
 * Config pure function tests
 */
async function testConfigPureFunctions() {
  const { config } = await import("../utils/Config.js");

  // --- get() with dot-notation ---
  assertEqual(config.get("app.name"), "Fitness Pro", "Config app.name");
  assertNotNull(config.get("app.version"), "Config app.version");
  assertEqual(config.get("nonexistent.path"), null, "Config missing path returns null");
  assertEqual(
    config.get("nonexistent.path", "default"),
    "default",
    "Config missing path returns default"
  );
  assertEqual(
    config.get("storage.prefix"),
    "fitness_",
    "Config storage prefix"
  );

  // --- deepMerge ---
  const merged = config.deepMerge({ a: 1, b: { c: 2 } }, { b: { d: 3 }, e: 4 });
  assertEqual(merged.a, 1, "deepMerge preserves target keys");
  assertEqual(merged.b.c, 2, "deepMerge preserves nested target keys");
  assertEqual(merged.b.d, 3, "deepMerge adds nested source keys");
  assertEqual(merged.e, 4, "deepMerge adds top-level source keys");

  // deepMerge does not mutate target
  const target = { x: { y: 1 } };
  const source = { x: { z: 2 } };
  const result = config.deepMerge(target, source);
  assertEqual(target.x.z, undefined, "deepMerge does not mutate target");
  assertEqual(result.x.y, 1, "deepMerge result has target nested");
  assertEqual(result.x.z, 2, "deepMerge result has source nested");

  // deepMerge with arrays (should overwrite, not recurse)
  const arrayMerge = config.deepMerge({ a: [1, 2] }, { a: [3, 4, 5] });
  assertDeepEqual(arrayMerge.a, [3, 4, 5], "deepMerge overwrites arrays");

  // deepMerge with empty objects
  const emptyMerge = config.deepMerge({}, { a: 1 });
  assertEqual(emptyMerge.a, 1, "deepMerge from empty target");

  // --- detectEnvironment ---
  const env = config.detectEnvironment();
  assertTrue(
    ["development", "staging", "production", "server"].includes(env),
    "detectEnvironment returns valid environment"
  );
  // On localhost we should get development
  if (
    typeof window !== "undefined" &&
    (window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1")
  ) {
    assertEqual(env, "development", "Localhost = development");
  }

  // --- isValidUrl ---
  assertTrue(config.isValidUrl("https://example.com"), "Valid HTTPS URL");
  assertTrue(config.isValidUrl("http://localhost:3000"), "Valid localhost URL");
  assertFalse(config.isValidUrl("not-a-url"), "Invalid URL string");
  assertFalse(config.isValidUrl(""), "Empty string is not a URL");

  // --- validate ---
  const validation = config.validate();
  assertTrue(validation.isValid, "Config validates correctly");
  assertArrayLength(validation.errors, 0, "Config has no validation errors");

  // --- isFeatureEnabled ---
  assertTrue(config.isFeatureEnabled("aiCoach"), "AI Coach feature enabled");
  assertTrue(config.isFeatureEnabled("offline"), "Offline feature enabled");
  assertFalse(
    config.isFeatureEnabled("nonexistentFeature"),
    "Unknown feature is disabled"
  );

  // --- exportConfig masks API keys ---
  const exported = config.exportConfig();
  assertNotNull(exported, "exportConfig returns non-null");
  assertNotNull(exported.app, "exportConfig includes app section");
  // API keys should be masked or have placeholder
  if (exported.apiKeys) {
    for (const [key, value] of Object.entries(exported.apiKeys)) {
      if (typeof value === "string" && !value.startsWith("YOUR_")) {
        assertEqual(value, "***HIDDEN***", `API key '${key}' should be masked`);
      }
    }
  }

  // --- set and get roundtrip ---
  config.set("test.nested.value", 42);
  assertEqual(config.get("test.nested.value"), 42, "Config set/get roundtrip");
}

/**
 * DataManager _validateData tests
 */
async function testDataManagerValidation() {
  const { dataManager } = await import("../services/DataManager.js");

  // --- Exercise validation ---
  assertTrue(
    dataManager._validateData(
      { id: "ex1", name: "Push Up", muscle_group: "Chest" },
      "exercise"
    ),
    "Valid exercise passes"
  );
  assertFalse(
    dataManager._validateData({ id: "ex1", name: "Push Up" }, "exercise"),
    "Exercise without muscle_group fails"
  );
  assertFalse(
    dataManager._validateData({ id: "ex1", muscle_group: "Chest" }, "exercise"),
    "Exercise without name fails"
  );
  assertFalse(
    dataManager._validateData({ name: "Push Up", muscle_group: "Chest" }, "exercise"),
    "Exercise without id fails"
  );
  assertFalse(
    dataManager._validateData(null, "exercise"),
    "Null exercise fails"
  );

  // --- Workout validation ---
  assertTrue(
    dataManager._validateData(
      { id: "wk1", name: "Morning", exercises: [] },
      "workout"
    ),
    "Valid workout passes"
  );
  assertFalse(
    dataManager._validateData(
      { id: "wk1", name: "Morning", exercises: "not-array" },
      "workout"
    ),
    "Workout with non-array exercises fails"
  );
  assertFalse(
    dataManager._validateData(
      { id: "wk1", exercises: [] },
      "workout"
    ),
    "Workout without name fails"
  );

  // --- User validation ---
  assertTrue(
    dataManager._validateData({ name: "John" }, "user"),
    "User with name passes"
  );
  assertTrue(
    dataManager._validateData({ age: 25 }, "user"),
    "User with age passes"
  );
  assertTrue(
    dataManager._validateData({ goal: "lose" }, "user"),
    "User with goal passes"
  );
  assertFalse(
    dataManager._validateData({}, "user"),
    "Empty user fails"
  );

  // --- Log validation ---
  assertTrue(
    dataManager._validateData(
      { workout_id: "wk1", date: "2024-01-01" },
      "log"
    ),
    "Valid log passes"
  );
  assertFalse(
    dataManager._validateData({ workout_id: "wk1" }, "log"),
    "Log without date fails"
  );
  assertFalse(
    dataManager._validateData({ date: "2024-01-01" }, "log"),
    "Log without workout_id fails"
  );

  // --- Unknown type (always true) ---
  assertTrue(
    dataManager._validateData({ anything: true }, "unknown_type"),
    "Unknown type passes"
  );
}

/**
 * RecommendationEngine pure function tests
 */
async function testRecommendationEnginePureFunctions() {
  const { recommendationEngine } = await import(
    "../services/RecommendationEngine.js"
  );

  // --- difficultyToNumber ---
  assertEqual(
    recommendationEngine.difficultyToNumber("facile"),
    1,
    "facile = 1"
  );
  assertEqual(
    recommendationEngine.difficultyToNumber("easy"),
    1,
    "easy = 1"
  );
  assertEqual(
    recommendationEngine.difficultyToNumber("principiante"),
    1,
    "principiante = 1"
  );
  assertEqual(
    recommendationEngine.difficultyToNumber("beginner"),
    1,
    "beginner = 1"
  );
  assertEqual(
    recommendationEngine.difficultyToNumber("intermedio"),
    2,
    "intermedio = 2"
  );
  assertEqual(
    recommendationEngine.difficultyToNumber("media"),
    2,
    "media = 2"
  );
  assertEqual(
    recommendationEngine.difficultyToNumber("medium"),
    2,
    "medium = 2"
  );
  assertEqual(
    recommendationEngine.difficultyToNumber("avanzato"),
    3,
    "avanzato = 3"
  );
  assertEqual(
    recommendationEngine.difficultyToNumber("hard"),
    3,
    "hard = 3"
  );
  assertEqual(
    recommendationEngine.difficultyToNumber("esperto"),
    4,
    "esperto = 4"
  );
  assertEqual(
    recommendationEngine.difficultyToNumber("expert"),
    4,
    "expert = 4"
  );
  assertEqual(
    recommendationEngine.difficultyToNumber("elite"),
    4,
    "elite = 4"
  );
  // Case insensitivity
  assertEqual(
    recommendationEngine.difficultyToNumber("FACILE"),
    1,
    "FACILE = 1 (case-insensitive)"
  );
  assertEqual(
    recommendationEngine.difficultyToNumber("Medium"),
    2,
    "Medium = 2 (case-insensitive)"
  );
  // Unknown defaults to 2
  assertEqual(
    recommendationEngine.difficultyToNumber("unknown"),
    2,
    "unknown = 2 (default)"
  );
  assertEqual(
    recommendationEngine.difficultyToNumber(null),
    2,
    "null = 2 (default)"
  );
  assertEqual(
    recommendationEngine.difficultyToNumber(undefined),
    2,
    "undefined = 2 (default)"
  );

  // --- scoreGoalAlignment ---
  assertEqual(
    recommendationEngine.scoreGoalAlignment(
      { focus_label: "Full Body" },
      { goal: "lose" }
    ),
    1.0,
    "Full Body + lose = 1.0"
  );
  assertEqual(
    recommendationEngine.scoreGoalAlignment(
      { focus_label: "Cardio" },
      { goal: "lose" }
    ),
    1.0,
    "Cardio + lose = 1.0"
  );
  assertEqual(
    recommendationEngine.scoreGoalAlignment(
      { focus_label: "Yoga" },
      { goal: "lose" }
    ),
    0.3,
    "Yoga + lose = 0.3"
  );
  assertEqual(
    recommendationEngine.scoreGoalAlignment(
      { focus_label: "Full Body" },
      null
    ),
    0.5,
    "No user = 0.5"
  );
  assertEqual(
    recommendationEngine.scoreGoalAlignment(
      { focus_label: "Upper Body" },
      { goal: "gain" }
    ),
    1.0,
    "Upper Body + gain = 1.0"
  );

  // --- scoreTimeMatch ---
  assertEqual(
    recommendationEngine.scoreTimeMatch({ estimated_duration: 45 }, 45),
    1.0,
    "Perfect time match"
  );
  assertEqual(
    recommendationEngine.scoreTimeMatch({ estimated_duration: 40 }, 45),
    1.0,
    "Within 80-120% = 1.0"
  );
  assertEqual(
    recommendationEngine.scoreTimeMatch({ estimated_duration: 30 }, 45),
    0.8,
    "Within 60-150% = 0.8"
  );
  assertEqual(
    recommendationEngine.scoreTimeMatch({ estimated_duration: 10 }, 45),
    0.5,
    "Outside range = 0.5"
  );

  // --- scoreFrequency ---
  assertEqual(
    recommendationEngine.scoreFrequency({ id: "wk1" }, []),
    1.0,
    "No logs = 1.0"
  );
  assertEqual(
    recommendationEngine.scoreFrequency({ id: "wk1" }, null),
    1.0,
    "Null logs = 1.0"
  );
  assertEqual(
    recommendationEngine.scoreFrequency(
      { id: "wk1" },
      [{ workout_id: "wk2", date: "2024-01-01" }]
    ),
    1.0,
    "Never done this workout = 1.0"
  );

  // --- scoreEquipmentMatch ---
  assertEqual(
    recommendationEngine.scoreEquipmentMatch(
      { equipment_label: "Nessun attrezzo" },
      []
    ),
    1.0,
    "No equipment needed = 1.0"
  );
  assertEqual(
    recommendationEngine.scoreEquipmentMatch(
      { equipment_label: "Manubri" },
      []
    ),
    0.9,
    "Equipment needed, none specified = 0.9"
  );
  assertEqual(
    recommendationEngine.scoreEquipmentMatch(
      { equipment_label: "Manubri" },
      ["manubri"]
    ),
    1.0,
    "Equipment available = 1.0"
  );
  assertEqual(
    recommendationEngine.scoreEquipmentMatch(
      { equipment_label: "Bilanciere" },
      ["manubri"]
    ),
    0.4,
    "Equipment not available = 0.4"
  );

  // --- scoreDifficultyProgression ---
  assertEqual(
    recommendationEngine.scoreDifficultyProgression(
      { difficulty_label: "media" },
      {},
      []
    ),
    0.7,
    "No logs = 0.7 (neutral)"
  );
}

/**
 * AuthService validation tests
 */
async function testAuthServiceValidation() {
  const { authService } = await import("../services/AuthService.js");

  // --- isValidEmail ---
  assertTrue(authService.isValidEmail("test@example.com"), "Valid email");
  assertTrue(authService.isValidEmail("user.name@domain.co"), "Email with dot");
  assertFalse(authService.isValidEmail("invalid"), "No @ sign");
  assertFalse(authService.isValidEmail("@domain.com"), "No local part");
  assertFalse(authService.isValidEmail("user@"), "No domain");
  assertFalse(authService.isValidEmail(""), "Empty string");
  assertFalse(authService.isValidEmail("user @domain.com"), "Space in email");

  // --- validateUserData (full registration) ---
  const validResult = authService.validateUserData({
    name: "Mario",
    age: 25,
    goal: "lose",
  });
  assertTrue(validResult.isValid, "Valid user data passes");
  assertArrayLength(validResult.errors, 0, "Valid data has no errors");

  // Name too short
  const shortName = authService.validateUserData({
    name: "A",
    age: 25,
    goal: "lose",
  });
  assertFalse(shortName.isValid, "Short name fails");
  assertTrue(shortName.errors.length > 0, "Short name has errors");

  // Missing name
  const noName = authService.validateUserData({
    age: 25,
    goal: "lose",
  });
  assertFalse(noName.isValid, "Missing name fails");

  // Age too young
  const tooYoung = authService.validateUserData({
    name: "Mario",
    age: 10,
    goal: "lose",
  });
  assertFalse(tooYoung.isValid, "Age < 13 fails");

  // Age too old
  const tooOld = authService.validateUserData({
    name: "Mario",
    age: 121,
    goal: "lose",
  });
  assertFalse(tooOld.isValid, "Age > 120 fails");

  // Invalid goal
  const badGoal = authService.validateUserData({
    name: "Mario",
    age: 25,
    goal: "fly",
  });
  assertFalse(badGoal.isValid, "Invalid goal fails");

  // Valid goals
  for (const goal of ["lose", "gain", "maintain"]) {
    const r = authService.validateUserData({ name: "Mario", age: 25, goal });
    assertTrue(r.isValid, `Goal '${goal}' is valid`);
  }

  // Update mode (less strict)
  const updateResult = authService.validateUserData({ email: "test@test.com" }, true);
  assertTrue(updateResult.isValid, "Update mode with valid email passes");

  const updateBadEmail = authService.validateUserData(
    { email: "not-email" },
    true
  );
  assertFalse(updateBadEmail.isValid, "Update mode with invalid email fails");

  // --- validateSecurityToken ---
  assertFalse(
    authService.validateSecurityToken(null),
    "Null token fails"
  );
  assertFalse(
    authService.validateSecurityToken(""),
    "Empty token fails"
  );
  assertFalse(
    authService.validateSecurityToken("short"),
    "Too short token fails"
  );
  // Valid 32-char hex token
  assertTrue(
    authService.validateSecurityToken("abcdef0123456789abcdef0123456789"),
    "Valid hex token passes"
  );
  // Invalid 32-char non-hex
  assertFalse(
    authService.validateSecurityToken("zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz"),
    "Invalid hex chars fail"
  );
  // Alphanumeric token of valid length
  assertTrue(
    authService.validateSecurityToken("abc123def456ghi78"),
    "Alphanumeric token passes"
  );
}

// ============================================================
// TIER 2: CORE BUSINESS LOGIC TESTS
// ============================================================

/**
 * DataManager streak calculation tests
 */
async function testDataManagerStreak() {
  const { dataManager } = await import("../services/DataManager.js");

  // Empty logs = 0 streak
  assertEqual(
    dataManager._calculateStreak([]),
    0,
    "Empty logs = 0 streak"
  );
  assertEqual(
    dataManager._calculateStreak(null),
    0,
    "Null logs = 0 streak"
  );

  // Today only = 1 streak
  const today = new Date().toISOString().split("T")[0];
  assertEqual(
    dataManager._calculateStreak([{ date: today }]),
    1,
    "Today only = 1 streak"
  );

  // Yesterday only = 1 streak
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0];
  assertEqual(
    dataManager._calculateStreak([{ date: yesterdayStr }]),
    1,
    "Yesterday only = 1 streak"
  );

  // Today + yesterday = 2 streak
  assertEqual(
    dataManager._calculateStreak([{ date: today }, { date: yesterdayStr }]),
    2,
    "Today + yesterday = 2 streak"
  );

  // Consecutive 3 days ending today
  const twoDaysAgo = new Date();
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
  const twoDaysAgoStr = twoDaysAgo.toISOString().split("T")[0];
  assertEqual(
    dataManager._calculateStreak([
      { date: today },
      { date: yesterdayStr },
      { date: twoDaysAgoStr },
    ]),
    3,
    "3 consecutive days = 3 streak"
  );

  // Gap breaks streak (2 days ago but not yesterday)
  assertEqual(
    dataManager._calculateStreak([{ date: today }, { date: twoDaysAgoStr }]),
    1,
    "Gap breaks streak"
  );

  // Multiple logs on same day should not inflate streak
  assertEqual(
    dataManager._calculateStreak([
      { date: today },
      { date: today },
      { date: today },
    ]),
    1,
    "Multiple same-day logs = 1 streak"
  );

  // created_at format support
  assertEqual(
    dataManager._calculateStreak([
      { created_at: new Date().toISOString() },
    ]),
    1,
    "created_at format works"
  );

  // Old logs only (> 1 day ago gap) = 0 streak
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  assertEqual(
    dataManager._calculateStreak([{ date: weekAgo.toISOString().split("T")[0] }]),
    0,
    "Week-old log only = 0 streak"
  );
}

/**
 * DataManager CRUD operations tests
 */
async function testDataManagerCRUD() {
  const { dataManager } = await import("../services/DataManager.js");

  // --- getExercises should return seeded data ---
  const exercises = dataManager.getExercises();
  assertTrue(Array.isArray(exercises), "getExercises returns array");
  assertTrue(exercises.length > 0, "getExercises returns seeded data");

  // --- getExerciseById ---
  const firstExercise = exercises[0];
  const found = dataManager.getExerciseById(firstExercise.id);
  assertNotNull(found, "getExerciseById returns exercise");
  assertEqual(found.id, firstExercise.id, "getExerciseById returns correct exercise");
  assertNull(
    dataManager.getExerciseById("nonexistent_id"),
    "getExerciseById returns null for unknown id"
  );
  assertNull(
    dataManager.getExerciseById(null),
    "getExerciseById handles null id"
  );

  // --- getWorkouts ---
  const workouts = dataManager.getWorkouts();
  assertTrue(Array.isArray(workouts), "getWorkouts returns array");
  assertTrue(workouts.length > 0, "getWorkouts returns seeded data");

  // --- getWorkoutById with exercise hydration ---
  const firstWorkout = workouts[0];
  const hydrated = dataManager.getWorkoutById(firstWorkout.id);
  assertNotNull(hydrated, "getWorkoutById returns workout");
  assertTrue(
    Array.isArray(hydrated.exercises),
    "Hydrated workout has exercises array"
  );
  if (hydrated.exercises.length > 0) {
    assertTrue(
      "details" in hydrated.exercises[0],
      "Hydrated exercises have details field"
    );
  }
  assertNull(
    dataManager.getWorkoutById("nonexistent_id"),
    "getWorkoutById returns null for unknown id"
  );

  // --- addExercise ---
  const testExercise = {
    id: "test_ex_" + Date.now(),
    name: "Test Exercise",
    muscle_group: "Test",
  };
  const addResult = dataManager.addExercise(testExercise);
  assertTrue(addResult, "addExercise succeeds for valid data");

  // Duplicate ID should fail
  const dupResult = dataManager.addExercise(testExercise);
  assertFalse(dupResult, "addExercise fails for duplicate ID");

  // Invalid data should fail
  assertFalse(
    dataManager.addExercise({ id: "x" }),
    "addExercise fails for invalid data"
  );

  // Clean up: remove test exercise
  const allExercises = dataManager.getExercises();
  const cleaned = allExercises.filter((e) => e.id !== testExercise.id);
  dataManager._save(dataManager.STORAGE_KEYS.EXERCISES, cleaned);

  // --- addWorkout ---
  const testWorkout = {
    id: "test_wk_" + Date.now(),
    name: "Test Workout",
    exercises: [],
  };
  assertTrue(dataManager.addWorkout(testWorkout), "addWorkout succeeds");
  assertFalse(
    dataManager.addWorkout(testWorkout),
    "addWorkout fails for duplicate ID"
  );
  assertFalse(
    dataManager.addWorkout({ id: "x" }),
    "addWorkout fails for invalid data"
  );

  // Clean up
  const allWorkouts = dataManager.getWorkouts();
  const cleanedWk = allWorkouts.filter((w) => w.id !== testWorkout.id);
  dataManager._save(dataManager.STORAGE_KEYS.WORKOUTS, cleanedWk);

  // --- saveLog / getLogs ---
  const logsBefore = dataManager.getLogs().length;
  const testLog = {
    workout_id: "wk_001",
    date: new Date().toISOString().split("T")[0],
  };
  assertTrue(dataManager.saveLog(testLog), "saveLog succeeds");
  const logsAfter = dataManager.getLogs();
  assertEqual(logsAfter.length, logsBefore + 1, "Log count increased by 1");

  // Saved log should have auto-generated id and created_at
  const savedLog = logsAfter[logsAfter.length - 1];
  assertNotNull(savedLog.id, "Saved log has auto-generated id");
  assertNotNull(savedLog.created_at, "Saved log has auto-generated created_at");

  // Invalid log should fail
  assertFalse(
    dataManager.saveLog({ date: "2024-01-01" }),
    "saveLog fails without workout_id"
  );

  // --- getCurrentUser / saveUser ---
  const user = dataManager.getCurrentUser();
  assertType(typeof user, "object", "getCurrentUser returns object");

  // --- getWeeklyStats ---
  const weeklyStats = dataManager.getWeeklyStats();
  assertNotNull(weeklyStats, "getWeeklyStats returns non-null");
  assertType(weeklyStats.total_workouts, "number", "weekly stats has total_workouts");
  assertType(weeklyStats.total_calories, "number", "weekly stats has total_calories");

  // --- getStorageStats ---
  const storageStats = dataManager.getStorageStats();
  assertNotNull(storageStats, "getStorageStats returns non-null");
  assertNotNull(storageStats.total_size, "Storage stats has total_size");

  // --- exportData ---
  const exported = dataManager.exportData();
  assertNotNull(exported, "exportData returns non-null");
  assertTrue("exercises" in exported, "exportData includes exercises");
  assertTrue("workouts" in exported, "exportData includes workouts");
  assertTrue("user" in exported, "exportData includes user");
}

/**
 * RecommendationEngine scoring tests
 */
async function testRecommendationEngineScoring() {
  const { recommendationEngine } = await import(
    "../services/RecommendationEngine.js"
  );

  // calculateWorkoutScore should return a non-negative number
  const workout = {
    id: "wk_001",
    focus_label: "Full Body",
    difficulty_label: "media",
    estimated_duration: 20,
    equipment_label: "Nessun attrezzo",
    is_premium: false,
  };
  const user = { goal: "lose" };
  const logs = [];

  const score = recommendationEngine.calculateWorkoutScore(
    workout,
    user,
    logs,
    {}
  );
  assertTrue(score >= 0, "Score is non-negative");
  assertTrue(score <= 105, "Score is within reasonable range");

  // Perfect match workout should score high
  const perfectWorkout = {
    id: "wk_perfect",
    focus_label: "Full Body",
    difficulty_label: "media",
    estimated_duration: 45,
    equipment_label: "Nessun attrezzo",
    is_premium: false,
  };
  const perfectScore = recommendationEngine.calculateWorkoutScore(
    perfectWorkout,
    { goal: "lose" },
    [],
    { timeAvailable: 45 }
  );
  assertTrue(perfectScore > 70, "Perfect match scores high");

  // Premium workout penalty
  const premiumWorkout = { ...perfectWorkout, is_premium: true };
  const premiumScore = recommendationEngine.calculateWorkoutScore(
    premiumWorkout,
    { goal: "lose" },
    [],
    { timeAvailable: 45 }
  );
  assertTrue(perfectScore > premiumScore, "Premium workout scores lower");
}

/**
 * GamificationService getUserLevel tests
 */
async function testGamificationLevel() {
  const { gamificationService } = await import(
    "../services/GamificationService.js"
  );

  // Save original user
  const originalUser = gamificationService.user;

  // Level 1: 0 points
  gamificationService.user = { total_points: 0 };
  let level = gamificationService.getUserLevel();
  assertEqual(level.current.level, 1, "0 points = level 1");
  assertEqual(level.current.name, "Beginner", "0 points = Beginner");
  assertNotNull(level.next, "Has next level at 0 points");

  // Level 2: 100 points
  gamificationService.user = { total_points: 100 };
  level = gamificationService.getUserLevel();
  assertEqual(level.current.level, 2, "100 points = level 2");
  assertEqual(level.current.name, "Novice", "100 points = Novice");

  // Level 3: 300 points
  gamificationService.user = { total_points: 300 };
  level = gamificationService.getUserLevel();
  assertEqual(level.current.level, 3, "300 points = level 3");

  // Level 4: 600 points
  gamificationService.user = { total_points: 600 };
  level = gamificationService.getUserLevel();
  assertEqual(level.current.level, 4, "600 points = level 4");

  // Level 5: 1000 points
  gamificationService.user = { total_points: 1000 };
  level = gamificationService.getUserLevel();
  assertEqual(level.current.level, 5, "1000 points = level 5");

  // Level 7 (max): 2500 points
  gamificationService.user = { total_points: 2500 };
  level = gamificationService.getUserLevel();
  assertEqual(level.current.level, 7, "2500 points = level 7 (Elite)");

  // Progress calculation
  gamificationService.user = { total_points: 200 };
  level = gamificationService.getUserLevel();
  assertEqual(level.current.level, 2, "200 points = level 2");
  assertTrue(level.progress > 0, "Progress is positive");
  assertTrue(level.progress <= 100, "Progress is <= 100");
  assertEqual(level.pointsToNext, 100, "100 points to next level");

  // Null user
  gamificationService.user = null;
  level = gamificationService.getUserLevel();
  assertEqual(level.current.level, 1, "Null user = level 1");

  // Restore
  gamificationService.user = originalUser;
}

/**
 * GamificationService badge conditions tests
 */
async function testGamificationBadges() {
  const { gamificationService } = await import(
    "../services/GamificationService.js"
  );

  const badges = gamificationService.badges;

  // Test badge conditions with mock stats
  assertTrue(
    badges.first_workout.condition({ totalWorkouts: 1 }),
    "first_workout unlocks at 1 workout"
  );
  assertFalse(
    badges.first_workout.condition({ totalWorkouts: 0 }),
    "first_workout locked at 0 workouts"
  );

  assertTrue(
    badges.week_warrior.condition({ weeklyCount: 7 }),
    "week_warrior unlocks at 7 weekly"
  );
  assertFalse(
    badges.week_warrior.condition({ weeklyCount: 6 }),
    "week_warrior locked at 6 weekly"
  );

  assertTrue(
    badges.month_master.condition({ monthlyCount: 25 }),
    "month_master unlocks at 25 monthly"
  );
  assertFalse(
    badges.month_master.condition({ monthlyCount: 24 }),
    "month_master locked at 24 monthly"
  );

  assertTrue(
    badges.ten_day_streak.condition({ currentStreak: 10 }),
    "10-day streak unlocks"
  );
  assertFalse(
    badges.ten_day_streak.condition({ currentStreak: 9 }),
    "9-day streak locked"
  );

  assertTrue(
    badges.thirty_day_streak.condition({ currentStreak: 30 }),
    "30-day streak unlocks"
  );

  assertTrue(
    badges.hundred_minutes.condition({ totalMinutes: 100 }),
    "100 min badge unlocks"
  );

  assertTrue(
    badges.thousand_minutes.condition({ totalMinutes: 1000 }),
    "1000 min badge unlocks"
  );

  assertTrue(
    badges.exercise_explorer.condition({ uniqueCategories: 5 }),
    "explorer unlocks at 5 categories"
  );

  assertTrue(
    badges.equipment_master.condition({ uniqueEquipment: 10 }),
    "equipment master unlocks at 10"
  );

  assertTrue(
    badges.difficulty_climber.condition({ allDifficultiesCompleted: true }),
    "difficulty climber unlocks"
  );

  assertTrue(
    badges.elite_workouts.condition({ expertCount: 10 }),
    "elite unlocks at 10 expert workouts"
  );
}

/**
 * CoachingEngine tests
 */
async function testCoachingEngine() {
  const { coachingEngine } = await import("../services/CoachingEngine.js");

  // --- getFormFeedback ---
  const squat = coachingEngine.getFormFeedback("squat");
  assertTrue(squat.tips.length > 0, "Squat has form tips");
  assertTrue(squat.commonMistakes.length > 0, "Squat has common mistakes");

  const pushup = coachingEngine.getFormFeedback("pushup");
  assertTrue(pushup.tips.length > 0, "Pushup has form tips");

  const deadlift = coachingEngine.getFormFeedback("deadlift");
  assertTrue(deadlift.tips.length > 0, "Deadlift has form tips");

  const bench = coachingEngine.getFormFeedback("bench");
  assertTrue(bench.tips.length > 0, "Bench has form tips");

  // Unknown exercise gives generic feedback
  const unknown = coachingEngine.getFormFeedback("unknown_exercise");
  assertTrue(unknown.tips.length > 0, "Unknown exercise has generic tips");
  assertArrayLength(
    unknown.commonMistakes,
    0,
    "Unknown exercise has no common mistakes"
  );

  // --- getRealTimeCoaching ---
  const lastSet = coachingEngine.getRealTimeCoaching("Squat", 3, 3);
  assertContains(lastSet, "ULTIMO SET", "Last set has special message");

  const penultimate = coachingEngine.getRealTimeCoaching("Squat", 2, 3);
  assertContains(penultimate, "Penultimo", "Penultimate set has special message");

  const regularSet = coachingEngine.getRealTimeCoaching("Squat", 1, 5);
  assertType(regularSet, "string", "Regular set returns string");
  assertTrue(regularSet.length > 0, "Regular set has message");

  // --- generateMotivation ---
  const high = coachingEngine.generateMotivation(95);
  assertContains(high, "campione", "High score = champion message");

  const medium = coachingEngine.generateMotivation(65);
  assertTrue(medium.length > 0, "Medium score has message");

  const low = coachingEngine.generateMotivation(10);
  assertTrue(low.length > 0, "Low score has message");

  // --- generateWorkoutFeedback ---
  const feedbackHigh = coachingEngine.generateWorkoutFeedback(
    95,
    ["Good time"],
    []
  );
  assertContains(feedbackHigh, "95/100", "High feedback includes score");

  const feedbackLow = coachingEngine.generateWorkoutFeedback(
    40,
    [],
    ["More sets needed"]
  );
  assertContains(feedbackLow, "40/100", "Low feedback includes score");
  assertContains(feedbackLow, "More sets needed", "Feedback includes improvements");

  // --- storeFeedback ---
  const initialLength = coachingEngine.feedbackHistory.length;
  coachingEngine.storeFeedback({ type: "test", score: 80 });
  assertEqual(
    coachingEngine.feedbackHistory.length,
    initialLength + 1,
    "storeFeedback adds to history"
  );

  // Cap at 50
  for (let i = 0; i < 55; i++) {
    coachingEngine.storeFeedback({ type: "cap_test", score: i });
  }
  assertTrue(
    coachingEngine.feedbackHistory.length <= 50,
    "Feedback history capped at 50"
  );

  // --- getMostFrequentType ---
  assertEqual(
    coachingEngine.getMostFrequentType([]),
    "Non ancora disponibile",
    "Empty logs returns default"
  );
  assertEqual(
    coachingEngine.getMostFrequentType([
      { type: "cardio" },
      { type: "strength" },
      { type: "cardio" },
    ]),
    "cardio",
    "Most frequent type is cardio"
  );

  // --- calculateUserLevel ---
  const levelInfo = await coachingEngine.calculateUserLevel();
  assertNotNull(levelInfo.current, "calculateUserLevel has current");
  assertNotNull(levelInfo.next, "calculateUserLevel has next");
  assertTrue(levelInfo.workoutsToNext >= 0, "workoutsToNext is non-negative");
}

// ============================================================
// TIER 3: DATA INTEGRITY TESTS
// ============================================================

/**
 * AuthService encrypt/decrypt roundtrip
 */
async function testAuthServiceEncryption() {
  const { authService } = await import("../services/AuthService.js");

  // Wait for initialization
  await new Promise((r) => setTimeout(r, 500));

  if (!authService.encryptionKey) {
    // Skip if crypto not available (non-secure context)
    console.warn("Skipping encryption tests - crypto not available");
    return;
  }

  // String roundtrip
  const testData = { name: "Mario", age: 25, goal: "lose" };
  const encrypted = await authService.encrypt(testData);
  assertNotNull(encrypted, "Encrypt returns non-null");
  assertTrue("encrypted" in encrypted, "Encrypted data has encrypted field");
  assertTrue("iv" in encrypted, "Encrypted data has iv field");

  const decrypted = await authService.decrypt(encrypted);
  assertDeepEqual(decrypted, testData, "Decrypt recovers original data");

  // Various data types
  const complexData = {
    string: "hello",
    number: 42,
    boolean: true,
    array: [1, 2, 3],
    nested: { a: { b: "c" } },
  };
  const encrypted2 = await authService.encrypt(complexData);
  const decrypted2 = await authService.decrypt(encrypted2);
  assertDeepEqual(decrypted2, complexData, "Complex data survives roundtrip");

  // Empty object
  const encrypted3 = await authService.encrypt({});
  const decrypted3 = await authService.decrypt(encrypted3);
  assertDeepEqual(decrypted3, {}, "Empty object survives roundtrip");
}

/**
 * AuthService login attempt tracking
 */
async function testAuthServiceLoginAttempts() {
  const { authService } = await import("../services/AuthService.js");

  // Clean state
  authService.clearLoginAttempts();
  let attempts = authService.getLoginAttempts();
  assertEqual(attempts.count, 0, "Login attempts start at 0");
  assertEqual(attempts.lockedUntil, 0, "Not locked initially");

  // Record failed attempts
  authService.recordLoginAttempt(false);
  attempts = authService.getLoginAttempts();
  assertEqual(attempts.count, 1, "1 failed attempt recorded");

  authService.recordLoginAttempt(false);
  attempts = authService.getLoginAttempts();
  assertEqual(attempts.count, 2, "2 failed attempts recorded");

  // Successful attempt clears count
  authService.recordLoginAttempt(true);
  attempts = authService.getLoginAttempts();
  assertEqual(attempts.count, 0, "Success clears attempts");

  // Lockout after max attempts
  authService.clearLoginAttempts();
  for (let i = 0; i < authService.maxLoginAttempts; i++) {
    authService.recordLoginAttempt(false);
  }
  attempts = authService.getLoginAttempts();
  assertTrue(
    attempts.lockedUntil > Date.now(),
    "Account locked after max attempts"
  );

  // Clean up
  authService.clearLoginAttempts();
}

// ============================================================
// TIER 4: STATE MANAGEMENT & ERROR HANDLING
// ============================================================

/**
 * StateManager tests
 */
async function testStateManager() {
  const { stateManager, actions } = await import("../utils/StateManager.js");

  // --- getState / setState ---
  stateManager.setState("test.value", 42, { persist: false, history: false });
  assertEqual(stateManager.getState("test.value"), 42, "setState/getState roundtrip");

  // Nested path creation
  stateManager.setState("test.deep.nested.value", "hello", {
    persist: false,
    history: false,
  });
  assertEqual(
    stateManager.getState("test.deep.nested.value"),
    "hello",
    "Deep nested setState"
  );

  // Get full state
  const fullState = stateManager.getState();
  assertNotNull(fullState, "getState() returns full state");
  assertNotNull(fullState.app, "Full state has app");
  assertNotNull(fullState.user, "Full state has user");

  // Get undefined path
  assertEqual(
    stateManager.getState("nonexistent.path"),
    undefined,
    "Missing path returns undefined"
  );

  // --- subscribe / notifySubscribers ---
  let subscriberCalled = false;
  let subscriberValue = null;
  const unsubscribe = stateManager.subscribe(
    "test.subscribe",
    (newValue) => {
      subscriberCalled = true;
      subscriberValue = newValue;
    }
  );

  stateManager.setState("test.subscribe", "changed", { persist: false });
  assertTrue(subscriberCalled, "Subscriber was called");
  assertEqual(subscriberValue, "changed", "Subscriber received new value");

  // Unsubscribe
  subscriberCalled = false;
  unsubscribe();
  stateManager.setState("test.subscribe", "changed2", { persist: false });
  assertFalse(subscriberCalled, "Unsubscribed callback not called");

  // --- Parent path notification ---
  let parentNotified = false;
  const unsub2 = stateManager.subscribe("test.parent", () => {
    parentNotified = true;
  });
  stateManager.setState("test.parent.child", "value", { persist: false });
  assertTrue(parentNotified, "Parent subscriber notified on child change");
  unsub2();

  // --- updateState ---
  stateManager.setState("test.update", { a: 1, b: 2 }, { persist: false });
  stateManager.updateState("test.update", { b: 3, c: 4 }, { persist: false });
  const updated = stateManager.getState("test.update");
  assertEqual(updated.a, 1, "updateState preserves existing");
  assertEqual(updated.b, 3, "updateState overrides value");
  assertEqual(updated.c, 4, "updateState adds new field");

  // --- dispatch actions ---
  stateManager.dispatch({ type: "SET_LOADING", payload: true });
  assertTrue(
    stateManager.getState("app.isLoading"),
    "SET_LOADING sets isLoading"
  );
  stateManager.dispatch({ type: "SET_LOADING", payload: false });
  assertFalse(
    stateManager.getState("app.isLoading"),
    "SET_LOADING clears isLoading"
  );

  // SET_ROUTE
  stateManager.dispatch({ type: "SET_ROUTE", payload: "/test" });
  assertEqual(
    stateManager.getState("app.currentRoute"),
    "/test",
    "SET_ROUTE updates route"
  );

  // SET_USER_PROFILE
  stateManager.dispatch({
    type: "SET_USER_PROFILE",
    payload: { name: "Test" },
  });
  assertTrue(
    stateManager.getState("user.isAuthenticated"),
    "SET_USER_PROFILE sets authenticated"
  );
  stateManager.dispatch({ type: "SET_USER_PROFILE", payload: null });
  assertFalse(
    stateManager.getState("user.isAuthenticated"),
    "Null profile clears authenticated"
  );

  // START_WORKOUT / END_WORKOUT
  stateManager.dispatch({
    type: "START_WORKOUT",
    payload: { id: "wk1", name: "Test" },
  });
  assertTrue(
    stateManager.getState("workout.isActive"),
    "START_WORKOUT sets isActive"
  );
  assertNotNull(
    stateManager.getState("workout.startTime"),
    "START_WORKOUT sets startTime"
  );

  stateManager.dispatch({ type: "PAUSE_WORKOUT" });
  assertTrue(
    stateManager.getState("workout.isPaused"),
    "PAUSE_WORKOUT sets isPaused"
  );

  stateManager.dispatch({ type: "RESUME_WORKOUT" });
  assertFalse(
    stateManager.getState("workout.isPaused"),
    "RESUME_WORKOUT clears isPaused"
  );

  stateManager.dispatch({ type: "END_WORKOUT" });
  assertFalse(
    stateManager.getState("workout.isActive"),
    "END_WORKOUT clears isActive"
  );

  // ADD_NOTIFICATION / REMOVE_NOTIFICATION
  stateManager.dispatch({
    type: "ADD_NOTIFICATION",
    payload: { id: "test1", message: "Hello" },
  });
  const notifs = stateManager.getState("ui.notifications");
  assertTrue(
    notifs.some((n) => n.id === "test1"),
    "ADD_NOTIFICATION adds to list"
  );

  stateManager.dispatch({ type: "REMOVE_NOTIFICATION", payload: "test1" });
  const notifsAfter = stateManager.getState("ui.notifications");
  assertFalse(
    notifsAfter.some((n) => n.id === "test1"),
    "REMOVE_NOTIFICATION removes from list"
  );

  // SHOW_MODAL / HIDE_MODAL
  stateManager.dispatch({
    type: "SHOW_MODAL",
    payload: { type: "alert" },
  });
  assertNotNull(
    stateManager.getState("ui.activeModal"),
    "SHOW_MODAL sets activeModal"
  );
  stateManager.dispatch({ type: "HIDE_MODAL" });
  assertNull(
    stateManager.getState("ui.activeModal"),
    "HIDE_MODAL clears activeModal"
  );

  // SET_ERROR / CLEAR_ERROR
  stateManager.dispatch({
    type: "SET_ERROR",
    payload: "Something went wrong",
  });
  assertEqual(
    stateManager.getState("app.lastError"),
    "Something went wrong",
    "SET_ERROR sets lastError"
  );
  stateManager.dispatch({ type: "CLEAR_ERROR" });
  assertNull(
    stateManager.getState("app.lastError"),
    "CLEAR_ERROR clears lastError"
  );

  // --- History ---
  const history = stateManager.getHistory(5);
  assertTrue(Array.isArray(history), "getHistory returns array");
  assertTrue(history.length > 0, "History has entries");

  // --- Middleware ---
  const middleware = (path, value) => {
    if (path === "test.middleware" && typeof value === "string") {
      return value.toUpperCase();
    }
  };
  stateManager.addMiddleware(middleware);
  stateManager.setState("test.middleware", "hello", { persist: false });
  assertEqual(
    stateManager.getState("test.middleware"),
    "HELLO",
    "Middleware transforms value"
  );
  // Remove middleware to avoid side effects
  stateManager.middleware = stateManager.middleware.filter(
    (m) => m !== middleware
  );

  // --- Computed values ---
  assertType(
    stateManager.computed.isWorkoutActive(),
    "boolean",
    "isWorkoutActive is boolean"
  );
  assertType(
    stateManager.computed.isOnline(),
    "boolean",
    "isOnline is boolean"
  );
  assertType(
    stateManager.computed.notificationCount(),
    "number",
    "notificationCount is number"
  );
  assertType(
    stateManager.computed.userLevel(),
    "number",
    "userLevel is number"
  );

  // --- exportState ---
  const exportedState = stateManager.exportState();
  assertNotNull(exportedState.state, "Exported state has state");
  assertNotNull(exportedState.timestamp, "Exported state has timestamp");
  assertTrue(
    Array.isArray(exportedState.subscribers),
    "Exported state has subscribers array"
  );

  // Clean up test state
  stateManager.setState("test", undefined, {
    persist: false,
    notify: false,
    history: false,
  });
}

/**
 * ErrorHandler tests
 */
async function testErrorHandler() {
  const { errorHandler } = await import("../utils/ErrorHandler.js");

  // Wait for initialization
  if (!errorHandler || !errorHandler.isInitialized) {
    await new Promise((r) => setTimeout(r, 200));
  }

  // --- classifyError ---
  assertEqual(
    errorHandler.classifyError({ message: "Fetch failed" }),
    "network",
    "Classify fetch error as network"
  );
  assertEqual(
    errorHandler.classifyError({ message: "Connection refused" }),
    "network",
    "Classify connection error as network"
  );
  assertEqual(
    errorHandler.classifyError({ message: "CORS error" }),
    "network",
    "Classify CORS as network"
  );
  assertEqual(
    errorHandler.classifyError({ message: "Timeout" }),
    "network",
    "Classify timeout as network"
  );
  assertEqual(
    errorHandler.classifyError({ message: "localStorage quota exceeded" }),
    "storage",
    "Classify storage error"
  );
  assertEqual(
    errorHandler.classifyError({ message: "IndexedDB error" }),
    "storage",
    "Classify IndexedDB error as storage"
  );
  assertEqual(
    errorHandler.classifyError({ message: "Out of memory" }),
    "memory",
    "Classify memory error"
  );
  assertEqual(
    errorHandler.classifyError({ message: "Security error detected" }),
    "security",
    "Classify security error"
  );
  assertEqual(
    errorHandler.classifyError({
      message: "Cannot read property 'x' of undefined",
    }),
    "ui",
    "Classify property access error as ui"
  );
  assertEqual(
    errorHandler.classifyError({ message: "Something completely different" }),
    "unknown",
    "Unknown error classified as unknown"
  );

  // Stack is also considered
  assertEqual(
    errorHandler.classifyError({
      message: "error",
      stack: "fetch failed at line 1",
    }),
    "network",
    "Stack content is considered in classification"
  );

  // --- getErrorSignature ---
  const sig1 = errorHandler.getErrorSignature({
    type: "js",
    message: "error",
    filename: "app.js",
    lineno: 10,
  });
  const sig2 = errorHandler.getErrorSignature({
    type: "js",
    message: "error",
    filename: "app.js",
    lineno: 10,
  });
  assertEqual(sig1, sig2, "Same error produces same signature");

  const sig3 = errorHandler.getErrorSignature({
    type: "js",
    message: "different",
    filename: "app.js",
    lineno: 10,
  });
  assertTrue(sig1 !== sig3, "Different errors produce different signatures");

  // --- Error stats ---
  const stats = errorHandler.getErrorStats();
  assertNotNull(stats, "getErrorStats returns non-null");
  assertType(stats.totalErrors, "number", "totalErrors is number");

  // --- logInfo ---
  errorHandler.logInfo("Test info message", { detail: "test" });
  // No assertion - just ensure it doesn't throw
}

// ============================================================
// TIER 5: INTEGRATION TESTS
// ============================================================

/**
 * Integration: All services initialized
 */
async function testServicesIntegration() {
  // Verify all core services are available
  const services = [
    "fitnessApp",
    "dataManager",
    "stateManager",
    "authService",
    "errorHandler",
    "performanceMonitor",
    "notificationManager",
  ];

  for (const service of services) {
    assertNotNull(window[service], `${service} is available globally`);
  }

  // Verify fitnessApp API
  const methods = ["getState", "setState", "navigateTo", "showNotification"];
  for (const method of methods) {
    assertType(
      window.fitnessApp[method],
      "function",
      `fitnessApp.${method} is a function`
    );
  }

  // Verify DataManager has seeded data
  const exercises = window.dataManager.getExercises();
  assertTrue(exercises.length > 0, "DataManager has seeded exercises");

  const workouts = window.dataManager.getWorkouts();
  assertTrue(workouts.length > 0, "DataManager has seeded workouts");

  // Verify state manager has default state structure
  const state = window.stateManager.getState();
  assertNotNull(state.app, "State has app section");
  assertNotNull(state.user, "State has user section");
  assertNotNull(state.workout, "State has workout section");
  assertNotNull(state.ui, "State has ui section");

  // Cross-service: DataManager exercises match what StateManager can access
  const exercisesFromDM = window.dataManager.getExercises();
  assertTrue(
    exercisesFromDM.length > 0,
    "DataManager exercises accessible through global"
  );
}

/**
 * Integration: Data flow test
 */
async function testDataFlowIntegration() {
  const { dataManager } = await import("../services/DataManager.js");
  const { stateManager } = await import("../utils/StateManager.js");

  // Save a workout log and verify state updates
  const logsBefore = dataManager.getLogs().length;

  const testLog = {
    workout_id: "wk_001",
    date: new Date().toISOString().split("T")[0],
    duration_real: 1200,
    calories: 300,
    type: "integration_test",
  };

  const saved = dataManager.saveLog(testLog);
  assertTrue(saved, "Integration: saveLog succeeds");

  const logsAfter = dataManager.getLogs();
  assertTrue(
    logsAfter.length > logsBefore,
    "Integration: log count increased"
  );

  // Verify user stats updated
  const user = dataManager.getCurrentUser();
  if (user && user.total_workouts) {
    assertTrue(
      user.total_workouts >= logsAfter.length,
      "Integration: user stats updated"
    );
  }

  // Weekly stats should reflect the new log
  const weeklyStats = dataManager.getWeeklyStats();
  assertTrue(
    weeklyStats.total_workouts >= 1,
    "Integration: weekly stats reflect new log"
  );
}

// ============================================================
// EXPORT TEST REGISTRY
// ============================================================

export const testRegistry = [
  // Tier 1: Pure Functions
  {
    name: "RunTracker Pure Functions (distance, formatTime, formatPace)",
    testFunction: testRunTrackerPureFunctions,
    priority: "critical",
  },
  {
    name: "Config Pure Functions (get, deepMerge, validate, isValidUrl)",
    testFunction: testConfigPureFunctions,
    priority: "critical",
  },
  {
    name: "DataManager Validation (_validateData)",
    testFunction: testDataManagerValidation,
    priority: "critical",
  },
  {
    name: "RecommendationEngine Pure Functions (difficulty, scoring)",
    testFunction: testRecommendationEnginePureFunctions,
    priority: "critical",
  },
  {
    name: "AuthService Validation (email, userData, securityToken)",
    testFunction: testAuthServiceValidation,
    priority: "critical",
  },

  // Tier 2: Core Business Logic
  {
    name: "DataManager Streak Calculation",
    testFunction: testDataManagerStreak,
    priority: "critical",
  },
  {
    name: "DataManager CRUD Operations",
    testFunction: testDataManagerCRUD,
    priority: "critical",
  },
  {
    name: "RecommendationEngine Scoring",
    testFunction: testRecommendationEngineScoring,
    priority: "normal",
  },
  {
    name: "Gamification Level System",
    testFunction: testGamificationLevel,
    priority: "normal",
  },
  {
    name: "Gamification Badge Conditions",
    testFunction: testGamificationBadges,
    priority: "normal",
  },
  {
    name: "CoachingEngine (feedback, form, levels)",
    testFunction: testCoachingEngine,
    priority: "normal",
  },

  // Tier 3: Data Integrity
  {
    name: "AuthService Encrypt/Decrypt Roundtrip",
    testFunction: testAuthServiceEncryption,
    priority: "normal",
  },
  {
    name: "AuthService Login Attempt Tracking",
    testFunction: testAuthServiceLoginAttempts,
    priority: "critical",
  },

  // Tier 4: State Management & Error Handling
  {
    name: "StateManager (get/set, subscribe, dispatch, middleware, computed)",
    testFunction: testStateManager,
    priority: "critical",
  },
  {
    name: "ErrorHandler (classifyError, signatures, stats)",
    testFunction: testErrorHandler,
    priority: "normal",
  },

  // Tier 5: Integration
  {
    name: "Services Integration (all services initialized)",
    testFunction: testServicesIntegration,
    priority: "critical",
  },
  {
    name: "Data Flow Integration (save log -> stats update)",
    testFunction: testDataFlowIntegration,
    priority: "normal",
  },
];
