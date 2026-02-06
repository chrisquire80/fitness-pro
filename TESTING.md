# 🧪 Testing Guide - Fitness Pro App

Guida completa per testare tutte le funzionalità dell'app Fitness Pro.

## 🚀 Setup Iniziale

### 1. Avvio del Server
```bash
# Metodo 1: Usa il batch file incluso
start_server.bat

# Metodo 2: Python diretto
python -m http.server 8000

# Metodo 3: Node.js (se installato)
npm install -g serve
serve -s . -l 8000
```

### 2. Accesso all'App
Apri il browser e vai su: `http://localhost:8000`

## 🧪 Sistema di Test Automatizzato

### Accesso Rapido ai Test
- **Shortcut Keyboard**: `Ctrl + Shift + T` (su localhost)
- **Console**: `window.testRunner.showTestUI()`
- **API**: `window.fitnessApp.test.run()`

### Tipi di Test Disponibili

#### 1. **Test Critici** (Funzionalità Core)
```javascript
window.fitnessApp.test.runCritical()
```
- ✅ Sistema di Configurazione
- ✅ Gestione dello Stato
- ✅ Data Manager
- ✅ Autenticazione
- ✅ Router
- ✅ Storage Locale
- ✅ Integrazione Completa

#### 2. **Test Completi** (Tutte le Funzionalità)
```javascript
window.fitnessApp.test.run()
```
Include tutti i test critici più:
- ⚡ Performance Monitor
- 💾 Backup Service
- 🚨 Error Handler
- 💬 Notification Manager
- 🎨 UI Components
- 📱 PWA Features
- 🌐 Network Handling

### Export dei Risultati
```javascript
window.fitnessApp.test.export()
```
Genera un file JSON con tutti i risultati dei test.

## ✋ Test Manuali Essenziali

### 1. **Test Onboarding** 
- [ ] Vai su `http://localhost:8000`
- [ ] Verifica che parta l'onboarding (se primo accesso)
- [ ] Compila: Nome, Età (es: 25), Obiettivo (Dimagrire/Massa)
- [ ] Clicca "Inizia il Percorso"
- [ ] Verifica redirect alla home

### 2. **Test Navigazione**
- [ ] Clicca tab "Home" - verifica caricamento
- [ ] Clicca tab "Esplora" - verifica lista esercizi
- [ ] Clicca tab "Progressi" - verifica dashboard
- [ ] Clicca tab "Profilo" - verifica dati utente
- [ ] URL diretti funzionano (es: `/#/progress`)

### 3. **Test AI Coach**
- [ ] Clicca il bot floating (basso destra)
- [ ] Verifica apertura chat
- [ ] Scrivi un messaggio (es: "Ciao")
- [ ] Premi Invio o clicca invia
- [ ] Verifica risposta (sarà mock senza API key)

### 4. **Test Nutrition Scanner**
- [ ] Vai su Nutrizione
- [ ] Clicca "TOCCA PER SCANSIONARE"
- [ ] Inserisci codice: `8001100063261` (Nutella)
- [ ] Verifica caricamento dati prodotto

### 5. **Test Performance e Storage**
```javascript
// Controlla memoria
performance.memory

// Controlla storage
window.dataManager.getStorageStats()

// Verifica backup
window.fitnessApp.backup.getStats()
```

## 🔧 Test Dashboard Admin

### Accesso
- URL: `http://localhost:8000/#/admin`
- Solo in modalità debug (localhost)

### Sezioni da Verificare
- [ ] **System Status** - Versione, memoria, storage
- [ ] **Error Monitoring** - Lista errori
- [ ] **Performance Metrics** - Metriche real-time
- [ ] **Backup System** - Statistiche backup
- [ ] **User Information** - Dati utente corrente
- [ ] **Diagnostics** - Clicca "Run Diagnostics"

### Quick Actions Funzionanti
- [ ] 🔄 Refresh Router
- [ ] ⏳ Test Loading (mostra spinner)
- [ ] 💬 Test Notification
- [ ] 📊 Export Logs
- [ ] 🗑️ Clear Storage (ATTENZIONE: resetta app)

## 🏃‍♂️ Test Workout Flow

### Simulazione Allenamento Completo
```javascript
// 1. Crea un workout mock
window.fitnessApp.setState('workout.current', {
    id: 'test_workout',
    name: 'Test Workout',
    exercises: [
        { exercise_id: 'ex_001', sets: 3, reps: '10' }
    ]
});

// 2. Avvia workout
window.fitnessApp.setState('workout.isActive', true);
window.fitnessApp.setState('workout.startTime', Date.now());

// 3. Vai alla pagina active
window.fitnessApp.navigateTo('/active');

// 4. Termina workout dopo test
window.fitnessApp.setState('workout.isActive', false);
```

## 📱 Test PWA

### Installazione
- [ ] Chrome: Icona installa nella barra indirizzo
- [ ] Mobile: "Aggiungi alla Home Screen"
- [ ] Verifica funzionamento offline

### Service Worker
```javascript
// Controlla registrazione
navigator.serviceWorker.getRegistrations()

// Verifica cache
caches.keys()
```

### Manifest
- [ ] Controlla DevTools → Application → Manifest
- [ ] Verifica tutte le proprietà

## 🚨 Test Gestione Errori

### Errori Forzati per Test
```javascript
// Test errore JavaScript
throw new Error("Test error handling");

// Test errore di rete
fetch('https://invalid-url-test.com');

// Test errore promise
Promise.reject(new Error("Test promise rejection"));

// Visualizza statistiche errori
window.errorHandler.getErrorStats();
```

### Test Recovery
- [ ] Disconnetti internet → verifica notifica offline
- [ ] Riconnetti → verifica notifica online
- [ ] Riempie storage → verifica cleanup automatico

## 💾 Test Backup e Sincronizzazione

### Test Backup Locale
```javascript
// Crea backup
const backup = await window.fitnessApp.backup.create();
console.log('Backup creato:', backup);

// Lista backup
const backups = await window.fitnessApp.backup.getList();
console.log('Backup disponibili:', backups);

// Export dati
await window.fitnessApp.backup.export('json');
```

### Test Import/Export
- [ ] Export → download file JSON
- [ ] Cancella dati locali
- [ ] Import → carica file precedente
- [ ] Verifica ripristino dati

## 🔐 Test Autenticazione

### Profilo Utente
```javascript
// Dati correnti
window.fitnessApp.auth.getCurrentUser();

// Test aggiornamento profilo
await window.fitnessApp.auth.updateProfile({
    name: "Nome Test",
    age: 30
});

// Verifica sicurezza
window.authService.getSecurityReport();
```

### Test Sessioni
- [ ] Chiudi tab → riapri → verifica sessione mantenuta
- [ ] Cancella storage → verifica redirect onboarding

## 📊 Test Performance

### Metriche Disponibili
```javascript
// Sommario performance
window.performanceMonitor.getPerformanceSummary();

// Raccomandazioni
window.performanceMonitor.getRecommendations();

// Esporta dati completi
window.performanceMonitor.exportData();
```

### Test Carico
```javascript
// Simula carico pesante
for(let i = 0; i < 1000; i++) {
    window.fitnessApp.setState(`test.item${i}`, 'data');
}

// Verifica impatto performance
window.performanceMonitor.getPerformanceSummary();
```

## 🐛 Problemi Comuni e Soluzioni

### ❌ "Cannot read property of undefined"
**Causa**: Servizi non inizializzati
**Soluzione**: Ricarica pagina, verifica console errori

### ❌ "Service Worker registration failed"
**Causa**: Non su HTTPS/localhost
**Soluzione**: Usa server locale

### ❌ "Module not found"
**Causa**: Path errati o file mancanti
**Soluzione**: Verifica tutti i file sono presenti

### ❌ "LocalStorage quota exceeded"
**Causa**: Storage pieno
**Soluzione**: `localStorage.clear()` o cleanup automatico

### ❌ Font Awesome icons non mostrate
**Causa**: CDN non caricato
**Soluzione**: Verifica connessione internet

## 📋 Checklist Test Completa

### ✅ Funzionalità Base
- [ ] Onboarding completo
- [ ] Navigazione funzionante
- [ ] Dati persistenti
- [ ] UI responsive
- [ ] Console senza errori critici

### ✅ Sistemi Avanzati
- [ ] Test automatizzati passano (>90%)
- [ ] Dashboard admin accessibile
- [ ] Performance metrics disponibili
- [ ] Error handling funziona
- [ ] Backup creabile

### ✅ Integrazione
- [ ] Tutti i servizi inizializzati
- [ ] State management funziona
- [ ] Router gestisce tutti i path
- [ ] Notifiche visualizzabili
- [ ] PWA installabile

### ✅ Produzione Ready
- [ ] No errori console in produzione
- [ ] Performance accettabili
- [ ] Offline functionality
- [ ] Security measures attive
- [ ] Analytics configurabile

## 🎯 Comandi Console Utili

```javascript
// Stato completo app
window.fitnessApp.exportState()

// Reset completo (ATTENZIONE)
localStorage.clear(); location.reload()

// Info debug
console.table(window.fitnessApp.config)

// Performance snapshot
console.table(window.performanceMonitor.getPerformanceSummary())

// Test notifica
window.fitnessApp.showNotification('success', 'Test OK', 'Sistema funzionante')

// Forza backup
await window.fitnessApp.backup.create()

// Verifica integrità
window.testRunner.runAllTests()
```

## 📞 Supporto

Se riscontri problemi:
1. **Controlla console browser** (F12)
2. **Esegui test automatizzati** (`Ctrl+Shift+T`)
3. **Esporta report errori** (Dashboard Admin)
4. **Verifica file presenti** (tutti i .js importati)
5. **Testa su browser diverso**

## 🏆 Test di Accettazione Finale

L'app è pronta per produzione se:
- ✅ **Test Critici**: 100% passati
- ✅ **Test Completi**: >90% passati  
- ✅ **Performance**: <3s load time
- ✅ **Errori**: <5 errori non critici in console
- ✅ **PWA**: Installabile e funzionante offline
- ✅ **Mobile**: Responsive su device <768px

---

**Fitness Pro App** - Test Suite v1.0.0
**Ultimo aggiornamento**: 2024