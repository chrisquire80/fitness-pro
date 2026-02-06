import { analytics } from '../services/Analytics.js';

export default function Onboarding() {
    // Internal State
    let step = 0;
    const profileData = { gender: '', goal: '', level: '', age: '', weight: '', height: '' };

    // Steps Configuration
    const steps = [
        // Step 0: Medical Disclaimer (Legal)
        {
            type: 'disclaimer',
            title: "Disclaimer Medico",
            content: `
                <div class="legal-text">
                    <p>Prima di iniziare, per favore conferma:</p>
                    <ul style="text-align: left; margin: 1rem 0; font-size: 0.9rem; color: var(--text-secondary);">
                        <li>Dichiaro di essere in buona salute fisica.</li>
                        <li>L'uso di questa app è a mio esclusivo rischio.</li>
                        <li>Consulterò un medico prima di iniziare nuovi allenamenti.</li>
                    </ul>
                    <div class="checkbox-wrapper">
                        <input type="checkbox" id="legal-check" onchange="window.toggleLegalBtn(this)">
                        <label for="legal-check">Ho letto e accetto i termini.</label>
                    </div>
                </div>
            `,
            cta: "Accetta e Continua",
            disabled: true
        },
        // Step 1: Splash / Carousel
        {
            type: 'intro',
            title: "Benvenuto in Fitness Pro",
            content: `
                <div class="carousel">
                    <div class="slide">
                        <i class="fas fa-dumbbell slide-icon"></i>
                        <p>Allenati dove vuoi e quando vuoi.</p>
                    </div>
                </div>
            `,
            cta: "Inizia Ora"
        },
        // Step 1: Gender
        {
            type: 'selection',
            field: 'gender',
            title: "Chi sei?",
            subtitle: "Per calibrare il metabolismo.",
            options: [
                { val: 'man', label: 'Uomo', icon: 'fa-mars' },
                { val: 'woman', label: 'Donna', icon: 'fa-venus' }
            ]
        },
        // Step 2: Goal
        {
            type: 'selection',
            field: 'goal',
            title: "Il tuo Obiettivo",
            subtitle: "Cosa vuoi ottenere?",
            options: [
                { val: 'lose', label: 'Dimagrire', icon: 'fa-fire' },
                { val: 'muscle', label: 'Massa', icon: 'fa-layer-group' },
                { val: 'endurance', label: 'Resistenza', icon: 'fa-running' }
            ]
        },
        // Step 3: Level
        {
            type: 'selection',
            field: 'level',
            title: "Livello Fitness",
            subtitle: "Sii onesto con te stesso.",
            options: [
                { val: 'beginner', label: 'Sedentario', icon: 'fa-couch' },
                { val: 'intermediate', label: 'Attivo', icon: 'fa-walking' },
                { val: 'advanced', label: 'Atleta', icon: 'fa-medal' }
            ]
        },
        // Step 4: Biometrics
        {
            type: 'input',
            title: "Ultime info",
            subtitle: "I tuoi numeri.",
            fields: [
                { id: 'age', label: 'Età', type: 'number', placeholder: 'Anni' },
                { id: 'weight', label: 'Peso (Kg)', type: 'number', placeholder: 'Kg' },
                { id: 'height', label: 'Altezza (cm)', type: 'number', placeholder: 'cm' }
            ],
            cta: "Crea il mio Piano"
        },
        // Step 5: Loading (Labor Illusion)
        {
            type: 'loading',
            messages: [
                "Analisi del profilo...",
                "Calcolo metabolismo basale...",
                "Selezione esercizi...",
                "Il tuo piano è pronto!"
            ]
        },
        // Step 6: Soft Registration (NEW)
        {
            type: 'soft-reg',
            title: "Tutto Pronto! 🎉",
            subtitle: "Il tuo piano è gratuito. Salva i progressi per non perderli.",
            guestCta: "Continua come Ospite"
        }
    ];

    // Helper to render current step
    const renderStep = () => {
        const current = steps[step];
        const container = document.getElementById('onboarding-content');
        if (!container) return;

        let html = '';

        if (current.type === 'disclaimer') {
            html = `
                <div class="step-intro">
                    <h1>${current.title}</h1>
                    ${current.content}
                    <button id="legal-btn" class="btn btn-primary full-width" onclick="window.nextStep()" disabled>${current.cta}</button>
                </div>
            `;
        } else if (current.type === 'intro') {
            html = `
                <div class="step-intro">
                    <h1>${current.title}</h1>
                    ${current.content}
                    <button class="btn btn-primary full-width" onclick="window.nextStep()">${current.cta}</button>
                </div>
            `;
        } else if (current.type === 'selection') {
            html = `
                <div class="step-selection">
                    <h2>${current.title}</h2>
                    <p class="subtitle">${current.subtitle}</p>
                    <div class="options-grid">
                        ${current.options.map(opt => `
                            <div class="card option-card" onclick="window.selectOption('${current.field}', '${opt.val}')">
                                <i class="fas ${opt.icon}"></i>
                                <span>${opt.label}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        } else if (current.type === 'input') {
            html = `
                <div class="step-input">
                    <h2>${current.title}</h2>
                    <p class="subtitle">${current.subtitle}</p>
                    <div class="inputs-stack">
                        ${current.fields.map(f => `
                            <div class="form-group">
                                <label>${f.label}</label>
                                <input type="${f.type}" id="inp-${f.id}" placeholder="${f.placeholder}" class="onb-input">
                            </div>
                        `).join('')}
                    </div>
                    <button class="btn btn-primary full-width" onclick="window.submitBiometrics()">${current.cta}</button>
                </div>
            `;
        } else if (current.type === 'loading') {
            html = `
                <div class="step-loading">
                    <div class="spinner"></div>
                    <h3 id="loading-text">${current.messages[0]}</h3>
                </div>
            `;
            setTimeout(() => runLoadingSequence(current.messages), 500);
        } else if (current.type === 'soft-reg') {
            html = `
                <div class="step-reg">
                    <h1>${current.title}</h1>
                    <p class="subtitle">${current.subtitle}</p>
                    
                    <div class="auth-buttons">
                        <button class="btn btn-google full-width" onclick="alert('Google Auth Mock')">
                            <i class="fab fa-google"></i> Continua con Google
                        </button>
                        <button class="btn btn-apple full-width" onclick="alert('Apple Auth Mock')">
                            <i class="fab fa-apple"></i> Continua con Apple
                        </button>
                    </div>

                    <div class="guest-option">
                        <button class="btn-text" onclick="window.finishOnboarding()">
                            ${current.guestCta}
                        </button>
                    </div>
                </div>
            `;
        }

        container.innerHTML = html;
    };

    // Logic Functions attached to window
    window.nextStep = () => {
        step++;
        renderStep();
    };

    window.toggleLegalBtn = (checkbox) => {
        const btn = document.getElementById('legal-btn');
        if (btn) btn.disabled = !checkbox.checked;
    };

    window.selectOption = (field, val) => {
        profileData[field] = val;
        window.nextStep();
    };

    window.submitBiometrics = () => {
        profileData.age = document.getElementById('inp-age').value;
        profileData.weight = document.getElementById('inp-weight').value;
        profileData.height = document.getElementById('inp-height').value;

        if (!profileData.age || !profileData.weight) {
            alert("Per favore inserisci i dati richiesti.");
            return;
        }

        window.nextStep();
    };

    const runLoadingSequence = (messages) => {
        let msgIndex = 0;
        const textEl = document.getElementById('loading-text');

        const interval = setInterval(() => {
            msgIndex++;
            if (msgIndex < messages.length) {
                if (textEl) textEl.textContent = messages[msgIndex];
            } else {
                clearInterval(interval);
                window.nextStep(); // Go to Soft Reg
            }
        }, 1500);
    };

    window.finishOnboarding = () => {
        profileData.name = "Campione";
        localStorage.setItem('fitness_profile', JSON.stringify(profileData));
        analytics.logTutorialComplete();
        window.location.hash = '#/';
        window.location.reload();
    };

    setTimeout(renderStep, 0);

    return `
        <div id="onboarding-content" class="onboarding-container"></div>
        <style>
            .onboarding-container {
                max-width: 500px;
                margin: 0 auto;
                text-align: center;
                min-height: 80vh;
                display: flex;
                flex-direction: column;
                justify-content: center;
            }
            .step-intro .slide-icon {
                font-size: 5rem;
                color: var(--accent-primary);
                margin-bottom: var(--spacing-md);
            }
            .options-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: var(--spacing-md);
                margin-top: var(--spacing-lg);
            }
            .option-card {
                cursor: pointer;
                padding: var(--spacing-lg);
                transition: transform 0.2s, border-color 0.2s;
            }
            .option-card:hover {
                border-color: var(--accent-secondary);
                background-color: rgba(6, 182, 212, 0.1);
            }
            .option-card i {
                font-size: 2rem;
                display: block;
                margin-bottom: var(--spacing-sm);
                color: var(--accent-secondary);
            }
            .inputs-stack {
                text-align: left;
                margin-bottom: var(--spacing-lg);
            }
            .onb-input {
                width: 100%;
                padding: 1rem;
                border-radius: var(--radius-sm);
                border: 1px solid rgba(255,255,255,0.1);
                background: var(--bg-card);
                color: white;
                font-size: 1.1rem;
            }
            .spinner {
                width: 50px;
                height: 50px;
                border: 5px solid rgba(255,255,255,0.1);
                border-top-color: var(--accent-primary);
                border-radius: 50%;
                animation: spin 1s linear infinite;
                margin: 0 auto var(--spacing-md);
            }
            @keyframes spin {
                to { transform: rotate(360deg); }
            }
            .full-width {
                width: 100%;
                padding: 1rem;
                font-size: 1.2rem;
            }
            
            /* Social Buttons */
            .auth-buttons {
                display: flex;
                flex-direction: column;
                gap: 1rem;
                margin-bottom: 2rem;
            }
            .btn-google {
                background: white;
                color: #333;
            }
            .btn-apple {
                background: #000;
                color: white;
                border: 1px solid #333;
            }
            .btn-text {
                background: none;
                border: none;
                color: var(--text-secondary);
                text-decoration: underline;
                cursor: pointer;
                font-size: 1rem;
            }
        </style>
    `;
}
