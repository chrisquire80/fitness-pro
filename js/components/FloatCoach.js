import { aiCoach } from '../services/AICoach.js';

export default function FloatCoach() {
    const suggestion = aiCoach.analyzeState();
    if (!suggestion) return '';

    // Simple markdown-ish bold replacer
    const formattedText = suggestion.text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    return `
        <div id="ai-coach-bubble" class="ai-bubble hide">
            <div class="ai-content">
                <div class="ai-header">
                    <i class="fas ${suggestion.icon || 'fa-robot'}"></i> Aura AI Coach
                    <button class="close-bubble" onclick="document.getElementById('ai-coach-bubble').classList.add('hide')">&times;</button>
                </div>
                <div class="ai-body">
                    <p>${formattedText}</p>
                </div>
                <div class="ai-actions">
                    <button class="btn btn-sm btn-primary" onclick="window.location.hash='#/active'">VAI AL WORKOUT</button>
                </div>
            </div>
        </div>

        <button class="ai-trigger" onclick="document.getElementById('ai-coach-bubble').classList.toggle('hide')">
            <i class="fas fa-comment-dots"></i>
            <span class="notification-dot"></span>
        </button>

        <style>
            .ai-trigger {
                position: fixed;
                bottom: 80px; /* Above Bottom Nav */
                right: var(--spacing-md);
                width: 60px;
                height: 60px;
                border-radius: 50%;
                background: var(--accent-primary);
                color: white;
                border: none;
                box-shadow: 0 4px 15px rgba(139, 92, 246, 0.4);
                cursor: pointer;
                z-index: 200;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 1.5rem;
                transition: transform 0.3s;
            }
            .ai-trigger:hover { transform: scale(1.1); }
            
            .notification-dot {
                position: absolute; top: 5px; right: 5px;
                width: 12px; height: 12px;
                background: #ef4444;
                border-radius: 50%;
                border: 2px solid white;
            }

            .ai-bubble {
                position: fixed;
                bottom: 150px;
                right: var(--spacing-md);
                width: 280px;
                background: var(--bg-card);
                border-radius: var(--radius-md);
                border: 1px solid var(--accent-primary);
                box-shadow: 0 10px 25px rgba(0,0,0,0.5);
                z-index: 200;
                animation: slideIn 0.3s ease-out;
            }
            .ai-bubble.hide { display: none; }

            .ai-header {
                padding: var(--spacing-sm) var(--spacing-md);
                background: var(--accent-primary);
                color: white;
                font-size: 0.9rem;
                font-weight: bold;
                display: flex;
                justify-content: space-between;
                align-items: center;
                border-radius: var(--radius-md) var(--radius-md) 0 0;
            }
            .close-bubble { background: none; border: none; color: white; cursor: pointer; font-size: 1.2rem; }
            
            .ai-body { padding: var(--spacing-md); font-size: 0.9rem; line-height: 1.4; color: var(--text-primary); }
            .ai-body p { margin: 0; }
            .ai-actions { padding: 0 var(--spacing-md) var(--spacing-md) var(--spacing-md); }
            
            @keyframes slideIn {
                from { opacity: 0; transform: translateY(20px); }
                to { opacity: 1; transform: translateY(0); }
            }
        </style>
    `;
}
