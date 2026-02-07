# 🏋️ Fitness Pro - Documentazione Tecnica

**Versione:** 1.0.0  
**Data:** 2024  
**Tipo:** Progressive Web Application (PWA)  
**Target:** Web Browser (Desktop/Mobile)

---

## 📋 Indice

1. [Panoramica Architetturale](#panoramica-architetturale)
2. [Stack Tecnologico](#stack-tecnologico)
3. [Struttura del Progetto](#struttura-del-progetto)
4. [Architettura dei Componenti](#architettura-dei-componenti)
5. [Sistemi Core](#sistemi-core)
6. [Database e Storage](#database-e-storage)
7. [API e Integrazioni](#api-e-integrazioni)
8. [Sicurezza](#sicurezza)
9. [Performance](#performance)
10. [PWA e Offline](#pwa-e-offline)
11. [Testing](#testing)
12. [Deployment](#deployment)
13. [Configurazione](#configurazione)
14. [Ciclo di Vita Dati e Logging](#ciclo-di-vita-dati-e-logging)
15. [Appendici Operative](#appendici-operative)

---

## 🏗️ Panoramica Architetturale

### Architettura Generale
- **Pattern**: Single Page Application (SPA) con architettura modulare
- **Paradigma**: Component-based con state management centralizzato
- **Routing**: Hash-based routing con supporto per History API
- **Persistenza**: Client-side con LocalStorage e IndexedDB
- **Offline**: Service Worker con strategia cache-first

### Principi di Design
- **Modulare**: Ogni componente è auto-contenuto
- **Reattivo**: State management reattivo con observer pattern
- **Resiliente**: Error handling e recovery automatico
- **Performante**: Lazy loading e ottimizzazioni avanzate
- **Sicuro**: Crittografia client-side e validazione dati

---

## 💻 Stack Tecnologico

### Frontend Core
- **JavaScript**: ES6+ Modules (Vanilla JavaScript)
- **CSS**: Custom Properties + Modern CSS Features
- **HTML**: Semantic HTML5
- **PWA**: Service Worker + Web App Manifest

### Librerie Esterne
- **Chart.js**: Visualizzazione grafici e statistiche
- **Font Awesome**: Iconografia
- **Google Fonts**: Typography (Outfit font family)

### API Integrate
- **Gemini AI**: Assistente virtuale coach
- **OpenFoodFacts**: Scanner nutrizionale prodotti
- **Mapbox** (ready): GPS tracking per corsa
- **Firebase** (ready): Backend opzionale

### Browser Support
- **Chrome/Edge**: 90+
- **Firefox**: 88+
- **Safari**: 14+
- **Mobile**: iOS 14+, Android 8+

---

## 📁 Struttura del Progetto

```
programma fitness/
├── index.html                 # Entry point principale
├── manifest.json             # PWA manifest
├── sw.js                     # Service Worker
├── start_server.bat         # Server di sviluppo
├── TESTING.md               # Guida ai test
│
├── css/
│   └── style.css            # Stili principali
│
├── js/
│   ├── app.js              # Router e inizializzazione app
│   │
│   ├── components/         # Componenti UI riutilizzabili
│   │   ├── Navbar.js       # Navigazione bottom
│   │   └── FloatCoach.js   # AI Coach floating
│   │
│   ├── views/              # Pagine/Schermate principali
│   │   ├── Home.js         # Dashboard principale
│   │   ├── Onboarding.js   # Setup iniziale utente
│   │   ├── Exercises.js    # Libreria esercizi
│   │   ├── Workouts.js     # Lista allenamenti
│   │   ├── ActiveWorkout.js # Sessione attiva
│   │   ├── Progress.js     # Statistiche e grafici
│   │   ├── Profile.js      # Profilo utente
│   │   ├── Nutrition.js    # Scanner alimentare
│   │   └── AdminDashboard.js # Debug/Admin panel
│   │
│   ├── services/           # Business logic e API
│   │   ├── DataManager.js  # Gestione dati centralizzata
│   │   ├── AuthService.js  # Autenticazione e sicurezza
│   │   ├── BackupService.js # Backup e sync cloud
│   │   ├── AICoach.js      # Integrazione Gemini AI
│   │   ├── NutritionService.js # OpenFoodFacts API
│   │   ├── EmailService.js # Notifiche email
│   │   └── Analytics.js    # Tracking eventi
│   │
│   └── utils/              # Utilità e sistemi di supporto
│       ├── Config.js       # Configurazione multi-env
│       ├── StateManager.js # State management reattivo
│       ├── ErrorHandler.js # Gestione errori globale
│       ├── PerformanceMonitor.js # Monitoraggio performance
│       ├── NotificationManager.js # Sistema notifiche
│       ├── AudioGuide.js   # Sintesi vocale
│       └── TestRunner.js   # Testing automatizzato
│
└── icons/ (da generare)    # PWA icons
```

---

## 🧩 Architettura dei Componenti

### Component Pattern
```javascript
// Esempio componente base
export default function ComponentName(props = {}) {
    // 1. Logic and state management
    const handleEvent = () => { /* ... */ };
    
    // 2. Return HTML template + styles
    return `
        <div class="component">
            <!-- HTML structure -->
        </div>
        <style>
            /* Scoped CSS */
        </style>
        <script>
            // Inline JavaScript for component-specific logic
        </script>
    `;
}
```

### State Management
- **Centralized**: `StateManager.js` gestisce tutto lo stato globale
- **Reactive**: Observer pattern per aggiornamenti automatici UI
- **Persistent**: Stato critico salvato automaticamente in localStorage
- **History**: Tracciamento modifiche per debug

### Router System
```javascript
// Route configuration
const routes = {
    "/": { component: Home, requiresAuth: true },
    "/admin": { component: AdminDashboard, hideNavbar: true }
};

// Navigation
window.fitnessApp.navigateTo('/path');
```

---

## ⚙️ Sistemi Core

### 1. DataManager (Gestione Dati)
**Responsabilità:**
- CRUD operations per esercizi, allenamenti, logs
- Validazione e integrità dati
- Migrazione storage legacy
- Analytics integration automatica

**API Principale:**
```javascript
// Esercizi
dataManager.getExercises()
dataManager.addExercise(exercise)
dataManager.getExerciseById(id)

// Allenamenti  
dataManager.getWorkouts()
dataManager.getWorkoutById(id)
dataManager.addWorkout(workout)

// Logs attività
dataManager.getLogs()
dataManager.saveLog(log)
dataManager.getWeeklyStats()

// Utente
dataManager.getCurrentUser()
dataManager.saveUser(user)
```

### 2. AuthService (Autenticazione)
**Features:**
- Crittografia AES-256-GCM client-side
- Gestione sessioni con timeout
- Biometric authentication (WebAuthn ready)
- Account lockout dopo tentativi falliti
- Device fingerprinting

**API Principale:**
```javascript
authService.createAccount(userData)
authService.login(credentials)
authService.logout()
authService.updateUserProfile(updates)
authService.enableBiometricAuth()
authService.deleteAccount()
```

### 3. StateManager (State Management)
**Architettura:**
- Redux-like pattern con actions e dispatch
- Subscription system per componenti reattivi
- State persistence selettivo
- History tracking per debugging

**API Principale:**
```javascript
// State access
stateManager.getState('path.to.value')
stateManager.setState('path.to.value', newValue)
stateManager.updateState('path', partialUpdate)

// Subscriptions
stateManager.subscribe('user.profile', callback)

// Actions (Redux-style)
actions.setUserProfile(profile)
actions.startWorkout(workout)
actions.setLoading(true)
```

### 4. ErrorHandler (Gestione Errori)
**Features:**
- Cattura errori globali (JavaScript, Promise, Network)
- Classificazione automatica errori
- Recovery automatico per errori comuni
- Rate limiting e deduplication
- Reporting e analytics

### 5. PerformanceMonitor
**Metriche Monitorate:**
- Core Web Vitals (LCP, FID, CLS)
- Long tasks (>50ms)
- Memory usage e leaks
- Network performance
- User interaction responsiveness

---

## 💾 Database e Storage

### Schema Dati Logico

#### Entità Principali
```javascript
// User Profile
{
    id: string,
    name: string,
    age: number,
    goal: 'lose'|'gain'|'maintain',
    createdAt: ISO_Date,
    stats: {
        totalWorkouts: number,
        streakDays: number,
        totalXp: number,
        level: number
    }
}

// Exercise
{
    id: string,
    name: string,
    muscle_group: string,
    equipment: string,
    difficulty: 1-5,
    video_id: string,
    instructions: string
}

// Workout Template
{
    id: string,
    name: string,
    estimated_duration: number,
    difficulty_label: string,
    focus_label: string,
    exercises: [
        {
            exercise_id: string,
            order: number,
            sets: number,
            reps: string,
            rest_seconds: number
        }
    ]
}

// Workout Log
{
    id: string,
    workout_id: string,
    user_id: string,
    date: ISO_Date,
    duration_real: number,
    exercises: [
        {
            exercise_id: string,
            sets_completed: number,
            reps_completed: number[]
        }
    ]
}
```

### Storage Strategy
- **LocalStorage**: Configurazioni, preferenze, session data
- **IndexedDB** (future): Large datasets, offline sync queue
- **Memory**: Performance cache, temporary state

### Data Persistence
```javascript
// Storage Keys
const STORAGE_KEYS = {
    USERS: 'fitness_users',
    EXERCISES: 'fitness_exercises', 
    WORKOUTS: 'fitness_workouts',
    WORKOUT_LOGS: 'fitness_logs',
    PROGRESS: 'fitness_progress'
};
```

---

## 🌐 API e Integrazioni

### 1. Gemini AI Integration
**Endpoint:** `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent`
**Funzionalità:**
- Chat conversazionale con AI Coach "Aura"
- Consigli personalizzati fitness e nutrizione
- Analisi progressi e motivazione

**Implementazione:**
```javascript
// In AICoach.js
async askAura(userMessage) {
    const prompt = `Sei Aura, personal trainer AI...`;
    const response = await fetch(GEMINI_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }]
        })
    });
}
```

### 2. OpenFoodFacts Integration  
**Endpoint:** `https://world.openfoodfacts.org/api/v0/product/{barcode}.json`
**Funzionalità:**
- Scanner barcode prodotti alimentari
- Informazioni nutrizionali complete
- Nutri-Score e valutazioni salute

### 3. Mapbox Integration (Ready)
**Uso Futuro:**
- GPS tracking per corsa outdoor
- Mappe percorsi e statistiche
- Heatmap zone allenamento

### 4. Firebase Integration (Ready)
**Services Ready:**
- Authentication
- Firestore Database
- Cloud Functions
- Push Notifications

---

## 🔐 Sicurezza

### Client-Side Security
- **Crittografia**: AES-256-GCM per dati sensibili
- **Session Management**: Secure token con timeout
- **Input Validation**: Sanitizzazione completa input utente
- **XSS Protection**: Content Security Policy headers
- **Data Minimization**: Solo dati necessari in memoria

### Privacy
- **Data Local-First**: Tutti i dati rimangono sul dispositivo
- **Anonimization**: Analytics senza PII
- **User Control**: Export/delete completo dati
- **Opt-in**: Consenso esplicito per funzioni avanzate

### Security Headers (Production)
```javascript
// Recommended headers
{
    "Content-Security-Policy": "default-src 'self'; script-src 'self' 'unsafe-inline'",
    "X-Frame-Options": "DENY",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin"
}
```

---

## ⚡ Performance

### Core Web Vitals Targets
- **LCP (Largest Contentful Paint)**: < 2.5s
- **FID (First Input Delay)**: < 100ms  
- **CLS (Cumulative Layout Shift)**: < 0.1

### Ottimizzazioni Implementate
- **Service Worker**: Cache strategico risorse
- **Code Splitting**: Moduli ES6 con lazy loading
- **Image Optimization**: WebP + lazy loading
- **CSS Optimization**: Critical CSS inline
- **JavaScript**: Tree shaking e minification
- **Caching Strategy**: Multi-layer con TTL

### Performance Budget
- **Bundle Size**: < 500KB (gzipped)
- **Time to Interactive**: < 3s
- **Memory Usage**: < 50MB
- **Battery Impact**: Minimal (background sync only)

---

## 📱 PWA e Offline

### Progressive Web App Features
- **Installable**: Add to homescreen
- **App-like**: Standalone display mode
- **Responsive**: Mobile-first design
- **Fast**: Service Worker caching
- **Engaging**: Push notifications

### Service Worker Strategy
```javascript
// Cache Strategy
{
    'static-assets': 'cache-first',      // HTML, CSS, JS
    'api-requests': 'network-first',     // Dynamic content  
    'images': 'cache-first-fallback',    // Media assets
    'documents': 'fastest'               // Offline documents
}
```

### Offline Capabilities
- ✅ **Navigation**: Tutte le pagine disponibili offline
- ✅ **Workouts**: Esecuzione allenamenti senza connessione
- ✅ **Data Entry**: Logging offline con sync automatico
- ✅ **Progress**: Visualizzazione statistiche offline
- ⏸️ **AI Coach**: Richiede connessione (fallback a risposte predefinite)

### Background Sync
- Queue operazioni quando offline
- Sync automatico al ripristino connessione
- Conflict resolution per dati modificati

---

## 🧪 Testing

### Test Automatizzati
**Sistema Integrato**: `TestRunner.js`
- **14 test suite** completi
- **UI integrata** (Alt + Shift + T)
- **Export reports** in JSON
- **Performance benchmarks**

### Test Categories

#### Critical Tests (7)
1. **Config System**: Configurazione multi-environment
2. **State Manager**: Gestione stato reattivo  
3. **Data Manager**: CRUD e persistenza
4. **Auth Service**: Autenticazione e sicurezza
5. **Router System**: Navigazione e routing
6. **Local Storage**: Persistenza dati
7. **Full Integration**: Comunicazione tra sistemi

#### Extended Tests (7)
8. **Error Handler**: Gestione errori globale
9. **Performance Monitor**: Metriche e monitoraggio
10. **Backup Service**: Backup e sincronizzazione
11. **Notification Manager**: Sistema notifiche
12. **UI Components**: Elementi interfaccia
13. **PWA Features**: Funzionalità web app
14. **Network Handling**: Gestione rete

### Testing Commands
```javascript
// Test completi (14 test)
window.fitnessApp.test.run()

// Solo test critici (7 test)
window.fitnessApp.test.runCritical()

// Export risultati
window.fitnessApp.test.export()
```

### Manual Testing Checklist
- **Cross-browser**: Chrome, Firefox, Safari, Edge
- **Mobile devices**: iOS, Android (responsive)
- **PWA install**: Home screen installation
- **Offline functionality**: Complete offline workflow
- **Performance**: Lighthouse audit > 90 score

---

## 🚀 Deployment

### Development Environment
```bash
# Server locale
python -m http.server 8000

# Con Node.js
npx serve -s . -l 8000

# Con Live Server (VS Code)
# Right-click → "Open with Live Server"
```

### Production Build Process
1. **Minification**: CSS/JS compression
2. **Icon Generation**: PWA icons (72px-512px)
3. **Service Worker**: Cache versioning
4. **Manifest**: PWA configuration
5. **Analytics**: Production tracking setup

### Hosting Options
- **Static Hosting**: Netlify, Vercel, GitHub Pages
- **CDN**: CloudFlare, AWS CloudFront
- **Custom Domain**: HTTPS required for PWA features

### Environment Configuration
```javascript
// Automatic environment detection
const environment = {
    'localhost': 'development',
    '*.staging.*': 'staging', 
    'production.domain': 'production'
};
```

---

## ⚙️ Configurazione

### Environment Variables
```javascript
// API Keys (in Config.js)
const apiKeys = {
    GEMINI_API_KEY: 'your-gemini-key',
    MAPBOX_API_KEY: 'your-mapbox-key',
    FIREBASE_API_KEY: 'your-firebase-key'
};
```

### User Preferences
```javascript
// Stored in localStorage
const preferences = {
    theme: 'dark|light',
    language: 'it|en',
    notifications: boolean,
    audioGuide: boolean,
    animations: boolean,
    units: 'metric|imperial'
};
```

### Feature Flags
```javascript
// Enable/disable features per environment
const features = {
    aiCoach: true,
    nutrition: true,
    runTracking: false, // Future feature
    socialSharing: true,
    pushNotifications: true,
    offline: true,
    analytics: true
};
```

---

## 🔧 Setup Sviluppo

### Prerequisiti
- **Browser moderno** con DevTools
- **Server HTTP** (Python, Node.js, o Live Server)
- **Editor** con supporto ES6 modules
- **Git** per versioning

### Quick Start
```bash
# 1. Clone/download progetto
cd "programma fitness"

# 2. Avvia server locale
python -m http.server 8000

# 3. Apri browser
http://localhost:8000

# 4. Development tools
# - Admin Panel: http://localhost:8000/#/admin
# - Test Suite: Alt + Shift + T
# - Console API: window.fitnessApp
```

### Debug Tools
```javascript
// Global debug objects (localhost only)
window.fitnessApp._debug = {
    stateManager,     // State inspection
    dataManager,      // Data operations
    errorHandler,     // Error tracking
    performanceMonitor, // Performance metrics
    config           // Configuration access
};
```

---

## 📊 Metriche e KPI

### Technical KPIs
- **Performance Score**: Lighthouse > 90
- **Error Rate**: < 1% sessioni
- **Crash Free Rate**: > 99.5%
- **Load Time**: < 3s (3G network)
- **Bundle Size**: < 500KB total

### User Experience KPIs  
- **Time to Interactive**: < 3s
- **Offline Success Rate**: > 95%
- **PWA Install Rate**: Target 15%
- **Session Duration**: Workout completion rate
- **User Retention**: 7-day retention rate

### Monitoring Dashboard
- **Real-time**: Performance metrics live
- **Error Tracking**: Automatic error reports
- **User Analytics**: Funnel analysis
- **System Health**: Uptime monitoring

---

## 🔄 Roadmap Tecnica

### Fase 1 (MVP) - ✅ Completata
- [x] Core SPA architecture
- [x] Offline-first PWA
- [x] Basic workout tracking
- [x] AI Coach integration
- [x] Comprehensive testing

### Fase 2 (Enhancement) - 🚧 In Sviluppo
- [ ] GPS running tracker (Mapbox)
- [ ] Social sharing features
- [ ] Advanced analytics dashboard
- [ ] Multi-language support
- [ ] Dark/light theme switcher

### Fase 3 (Scale) - 📋 Pianificata
- [ ] Backend API integration
- [ ] Multi-user support
- [ ] Real-time sync
- [ ] Advanced AI coaching
- [ ] Wearable device integration

---

## 🤝 Team Guidelines

### Code Standards
- **ES6+**: Modern JavaScript features
- **Modular**: Component-based architecture
- **Documented**: JSDoc per funzioni pubbliche
- **Tested**: Unit test per logica critica
- **Responsive**: Mobile-first design

### Git Workflow
```bash
# Feature branches
git checkout -b feature/new-feature
git commit -m "feat: add new feature"

# Bug fixes
git checkout -b fix/bug-description  
git commit -m "fix: resolve bug issue"

# Documentation
git commit -m "docs: update technical spec"
```

### Performance Requirements
- **Code Review**: Obbligatorio per merge
- **Performance Budget**: Bundle size limits
- **Accessibility**: WCAG 2.1 AA compliance
- **Browser Testing**: Cross-browser compatibility

---

## 📞 Supporto e Manutenzione

### Issue Tracking
- **Bug Reports**: Template strutturato con repro steps
- **Feature Requests**: User story format
- **Performance Issues**: Include Lighthouse report
- **Security Concerns**: Private reporting channel

### Monitoring Alerts
- **Error Rate** > 2%
- **Performance Score** < 80
- **Bundle Size** > 600KB  
- **API Response Time** > 5s

### Maintenance Tasks
- **Weekly**: Dependencies update check
- **Monthly**: Performance audit
- **Quarterly**: Security review
- **Yearly**: Architecture review

---

## 📚 Risorse Aggiuntive

### Documentazione
- [`TESTING.md`](./TESTING.md) - Guida completa ai test
- [`README.md`](./README.md) - Setup e quick start
- **API Docs** - Endpoint documentation (TBD)

### Tools e Utilities
- **Admin Dashboard**: `/#/admin` (debug only)
- **Test Runner**: `Alt + Shift + T`
- **Performance Tools**: Chrome DevTools
- **PWA Audit**: Lighthouse

### External References
- [Gemini AI API](https://ai.google.dev/docs)
- [OpenFoodFacts API](https://wiki.openfoodfacts.org/API)
- [PWA Best Practices](https://web.dev/pwa/)
- [Web Performance](https://web.dev/performance/)

---

## 📦 Ciclo di Vita Dati e Logging

### Flusso Dati (End-to-End)
- **Ingestione**: input utente da UI e sensori (es. scanner) con normalizzazione iniziale.
- **Validazione**: sanitizzazione e controlli di schema prima della persistenza.
- **Persistenza**: salvataggio su `localStorage` (config/preferenze) e storage principale client-side.
- **Elaborazione**: calcolo statistiche, progressi e KPI in memoria.
- **Sincronizzazione**: queue offline con sincronizzazione al ripristino rete (quando abilitata).
- **Reporting**: analytics aggregati senza PII (opt-in).

### Logging Applicativo
- **Livelli**: `debug`, `info`, `warn`, `error`.
- **Canali**: UI events, network, storage, performance.
- **Privacy**: mai loggare PII o token; mascheramento di payload sensibili.
- **Persistenza log**: circolare (ring buffer) con limite dimensione.
- **Correlazione**: `sessionId` per correlare eventi (ruotato a ogni login).

### Retention, Export e Delete
- **Retention locale**: dati utente conservati finché non eliminati manualmente.
- **Export**: dump JSON completo da pannello Admin o funzione di export.
- **Delete**: wipe completo con cleanup di cache e storage.
- **Ripristino**: import JSON con validazione schema e migrazione versioni.

---

## 📎 Appendici Operative

### Backup & Restore
1. **Export** dati utente dal pannello Admin o dalla pagina Profilo.
2. **Verifica** file JSON (dimensione e checksum).
3. **Restore** tramite import con validazione.
4. **Post-check**: avvio test critici e verifica schermate principali.

### Runbook Incidenti (Client-Side)
- **Crash all'avvio**: pulire cache e verificare service worker.
- **Dati incoerenti**: eseguire `DataManager` integrity check e ripristino da backup.
- **Offline bloccato**: forzare refresh SW e riprovare sync.
- **Performance degradata**: aprire Performance Monitor e ridurre logging.

### Checklist Release
- [ ] Eseguire test critici e full integration
- [ ] Lighthouse > 90 su mobile e desktop
- [ ] Verifica offline (navigazione + logging)
- [ ] Validazione manifest e SW
- [ ] Aggiornamento versione e note release

---

## 🆕 Componenti Recenti

### Modal Component (`js/components/Modal.js`)
Sistema di dialog/modal riutilizzabile per tutta l'applicazione.

**Caratteristiche:**
- Supporto per tipi: alert, confirm, prompt, passphrase, custom, loading
- Animazioni fluide di apertura/chiusura
- Gestione tastiera (ESC per chiudere, Enter per conferma)
- Form validation integrata
- Stacking multiplo di modal

**API Principale:**
```javascript
// Alert semplice
modal.alert('Titolo', 'Contenuto');

// Conferma con azione
const result = await modal.confirm('Conferma', 'Sei sicuro?');
if (result.action === 'confirm') { /* ... */ }

// Prompt per input
const result = await modal.prompt('Nome', 'Inserisci il tuo nome');
console.log(result.values.value);

// Passphrase con validazione
const result = await modal.passphrase('Inserisci Passphrase');
if (result.action === 'submit') {
    const passphrase = result.values.passphrase;
}

// Loading non dismissabile
const loadingModal = await modal.loading('Caricamento...', 'Attendere');
// ... operazione async
modal.close(loadingModal.id);

// Modal personalizzato
modal.show({
    title: 'Titolo',
    content: '<p>HTML content</p>',
    icon: 'fa-info-circle',
    size: 'medium', // small, medium, large, fullscreen
    buttons: [
        { text: 'Annulla', type: 'secondary', action: 'cancel' },
        { text: 'Conferma', type: 'primary', action: 'confirm' }
    ],
    inputs: [
        { name: 'email', type: 'email', placeholder: 'Email', required: true }
    ]
});
```

### BackupService (`js/services/BackupService.js`)
Sistema completo di backup e ripristino dati con cifratura.

**Caratteristiche:**
- Compressione gzip (CompressionStream API)
- Cifratura AES-GCM con PBKDF2
- Export in JSON, CSV, XML
- Import con validazione e merge
- Gestione passphrase sicura
- Auto-sync programmabile

**API Principale:**
```javascript
// Creazione backup cifrato
const result = await backupService.createBackup({
    includePersonalData: true,
    includeWorkoutHistory: true,
    includeSettings: true,
    compress: true,
    encrypt: true
});

// Ripristino backup
await backupService.restoreBackup(backupId, {
    mergeWithExisting: false,
    confirmOverwrite: false
});

// Export in vari formati
await backupService.exportData('json', { filename: 'my-backup.json' });
await backupService.exportData('csv');

// Import da file
await backupService.importData(file, { mergeWithExisting: true });

// Gestione passphrase
backupService.setPassphrase('my-secure-passphrase');
backupService.setRememberPassphrase(true);
backupService.clearPassphrase();
backupService.getPassphraseStatus();

// Lista e statistiche backup
const backups = await backupService.getLocalBackups();
const stats = backupService.getBackupStats();
```

### RunTracker (`js/views/RunTracker.js`)
Tracking GPS per corsa outdoor con statistiche in tempo reale.

**Caratteristiche:**
- Tracking GPS con Geolocation API
- Calcolo distanza (formula Haversine)
- Passo attuale e medio
- Dislivello (gain/loss)
- Km splits automatici
- Visualizzazione percorso su canvas
- Wake lock per schermo sempre acceso
- Salvataggio automatico dei dati corsa

**Metriche Tracciate:**
- Distanza totale (km)
- Tempo totale (con pausa)
- Passo attuale e medio (min/km)
- Velocità massima
- Dislivello positivo e negativo
- Splits per ogni km completato
- Calorie stimate

**Funzioni Globali:**
```javascript
window.startRun()      // Avvia tracking GPS
window.togglePauseRun() // Pausa/Riprendi
window.stopRun()       // Termina e salva
```

---

**Fine Documentazione Tecnica**

*Ultimo aggiornamento: 2024*  
*Versione: 1.1.0*