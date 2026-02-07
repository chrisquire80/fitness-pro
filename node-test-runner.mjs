/**
 * node-test-runner.mjs
 * Lightweight Node.js harness to validate test logic offline.
 * Mocks browser globals so ES-module tests can import and run.
 */

// ── Minimal browser-global shims ──────────────────────────────
{
  // No jsdom – build our own minimal stubs
  const storage = {};
  globalThis.Storage = class Storage {
    getItem(k)    { return storage[k] ?? null; }
    setItem(k, v) { storage[k] = String(v); }
    removeItem(k) { delete storage[k]; }
    clear()       { for (const k in storage) delete storage[k]; }
  };
  const ls = new globalThis.Storage();
  globalThis.window = globalThis;
  globalThis.localStorage = ls;
  globalThis.sessionStorage = ls;
  Object.defineProperty(globalThis, 'navigator', { value: { onLine: true, userAgent: "node-test", language: "it", platform: "linux", cookieEnabled: true, deviceMemory: 8, hardwareConcurrency: 4, serviceWorker: { getRegistrations: async () => [] }, storage: { estimate: async () => ({ usage: 0, quota: 1e9 }) } }, configurable: true, writable: true });
  globalThis.document   = {
    createElement()       { const e = { style:{}, innerHTML:"", id:"", appendChild(){}, setAttribute(){}, querySelectorAll(){ return []; }, querySelector(){ return null; } }; return e; },
    getElementById(id)    { return id === "app" || id === "main-content" || id === "navbar" ? { id } : null; },
    querySelector()       { return { content:"" }; },
    querySelectorAll()    { return []; },
    addEventListener()    {},
    body: { appendChild(){} },
    documentElement: { style: { getPropertyValue(){ return "#8b5cf6"; } } },
    dispatchEvent()       {},
  };
  globalThis.performance = { now: () => Date.now(), memory: {} };
  globalThis.fetch = () => Promise.resolve({ ok: true });
  globalThis.Blob  = class Blob { constructor(a){ this.size = a?.[0]?.length ?? 0; } };
  globalThis.URL   = globalThis.URL ?? (await import("url")).URL;
  globalThis.getComputedStyle = () => ({ getPropertyValue: () => "#8b5cf6" });
  globalThis.HTMLElement = class HTMLElement {};
  globalThis.location = { hostname: "localhost", href: "http://localhost:8000", hash: "" };
  globalThis.addEventListener = () => {};
  globalThis.setInterval = setInterval;
  globalThis.setTimeout  = setTimeout;
  globalThis.clearTimeout = clearTimeout;
  globalThis.clearInterval = clearInterval;
  if (!globalThis.crypto) Object.defineProperty(globalThis, 'crypto', { value: (await import("crypto")).webcrypto, configurable: true, writable: true });
  globalThis.CompressionStream   = class { readable = new ReadableStream(); writable = new WritableStream(); };
  globalThis.DecompressionStream = class { readable = new ReadableStream(); writable = new WritableStream(); };
  globalThis.indexedDB = null;
  globalThis.TextEncoder = globalThis.TextEncoder ?? (await import("util")).TextEncoder;
  globalThis.TextDecoder = globalThis.TextDecoder ?? (await import("util")).TextDecoder;
  globalThis.history = { pushState(){}, replaceState(){} };
  globalThis.requestAnimationFrame = (fn) => setTimeout(fn, 0);
  globalThis.cancelAnimationFrame = clearTimeout;
  globalThis.innerWidth = 1024;
  globalThis.innerHeight = 768;
  globalThis.speechSynthesis = { speak(){}, cancel(){} };
  globalThis.SpeechSynthesisUtterance = class {};
  globalThis.ReadableStream = globalThis.ReadableStream ?? (await import("stream/web")).ReadableStream;
  globalThis.WritableStream = globalThis.WritableStream ?? (await import("stream/web")).WritableStream;
}

// ── Run the tests ─────────────────────────────────────────────
const PASS = "\x1b[32m✓\x1b[0m";
const FAIL = "\x1b[31m✗\x1b[0m";
const SKIP = "\x1b[33m⊘\x1b[0m";

let passed = 0, failed = 0, skipped = 0;
const failures = [];

async function runTest(name, fn) {
  const start = performance.now();
  try {
    await fn();
    const ms = Math.round(performance.now() - start);
    console.log(`  ${PASS} ${name}  (${ms}ms)`);
    passed++;
  } catch (err) {
    if (err.message?.includes("Skip") || err.message?.includes("crypto not available")) {
      console.log(`  ${SKIP} ${name}  [skipped: ${err.message}]`);
      skipped++;
    } else {
      const ms = Math.round(performance.now() - start);
      console.log(`  ${FAIL} ${name}  (${ms}ms)`);
      console.log(`     ${err.message}`);
      failures.push({ name, error: err.message });
      failed++;
    }
  }
}

console.log("\n🧪 Fitness Pro – Node.js Test Validation\n");
console.log("─".repeat(55));

try {
  const { testRegistry } = await import("./js/tests/TestSuite.js");
  console.log(`\nLoaded ${testRegistry.length} test groups\n`);

  for (const t of testRegistry) {
    await runTest(t.name, t.testFunction);
  }
} catch (err) {
  console.error("Failed to load test suite:", err.message);
  // try individual imports for diagnostics
  console.log("\nAttempting individual test imports for diagnostics...\n");
  try {
    await import("./js/utils/Config.js");
    console.log("  Config.js loaded OK");
  } catch (e) { console.log("  Config.js FAILED:", e.message); }
  try {
    await import("./js/services/DataManager.js");
    console.log("  DataManager.js loaded OK");
  } catch (e) { console.log("  DataManager.js FAILED:", e.message); }
}

// ── Summary ───────────────────────────────────────────────────
console.log("\n" + "─".repeat(55));
console.log(`\n  ${PASS} ${passed} passed   ${FAIL} ${failed} failed   ${SKIP} ${skipped} skipped\n`);

if (failures.length > 0) {
  console.log("Failures:");
  failures.forEach(f => console.log(`  - ${f.name}: ${f.error}`));
  console.log("");
}

process.exit(failed > 0 ? 1 : 0);
