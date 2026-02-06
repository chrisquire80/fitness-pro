import { aiCoach } from "../services/AICoach.js";

export default function FloatCoach() {
    const suggestion = aiCoach.analyzeState();
    if (!suggestion) return "";

    // Simple markdown-ish bold replacer - handle both string and object format
    const suggestionText =
        typeof suggestion === "string" ? suggestion : suggestion.text || suggestion;
    const formattedText = suggestionText.replace(
        /\*\*(.*?)\*\*/g,
        "<strong>$1</strong>",
    );

    return `
        <div id="ai-coach-bubble" class="ai-bubble hide">
            <div class="ai-content">
                <div class="ai-header">
                    <i class="fas ${(typeof suggestion === "object" ? suggestion.icon : null) || "fa-robot"}"></i> Aura AI Coach
                    <button class="close-bubble" onclick="document.getElementById('ai-coach-bubble').classList.add('hide')">&times;</button>
                </div>
                <div class="ai-body chat-mode">
                    <div id="ai-messages" class="ai-messages">
                        <p class="ai-msg bot">${formattedText}</p>
                    </div>
                </div>
                <div class="ai-chat-input">
                    <input type="text" id="ai-input" placeholder="Chiedi ad Aura..." onkeypress="if(event.key === 'Enter') window.sendToAura()">
                    <button onclick="window.sendToAura()"><i class="fas fa-paper-plane"></i></button>
                </div>
            </div>
        </div>

        <script>
            window.sendToAura = async () => {
                const input = document.getElementById('ai-input');
                const msg = input.value.trim();
                if (!msg) return;

                const list = document.getElementById('ai-messages');
                list.innerHTML += \`<p class="ai-msg user">\${msg}</p>\`;
                input.value = '';
                list.scrollTop = list.scrollHeight;

                const response = await aiCoach.askAura(msg);
                list.innerHTML += \`<p class="ai-msg bot">\${response}</p>\`;
                list.scrollTop = list.scrollHeight;
            };
        </script>

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
            
            .ai-messages {
                max-height: 200px;
                overflow-y: auto;
                display: flex;
                flex-direction: column;
                gap: 8px;
            }
            .ai-msg {
                padding: 8px 12px;
                border-radius: 12px;
                max-width: 85%;
                font-size: 0.85rem;
            }
            .ai-msg.bot { background: rgba(255,255,255,0.05); align-self: flex-start; }
            .ai-msg.user { background: var(--accent-primary); color: white; align-self: flex-end; }

            .ai-chat-input {
                padding: var(--spacing-sm);
                border-top: 1px solid rgba(255,255,255,0.1);
                display: flex;
                gap: 5px;
            }
            .ai-chat-input input {
                flex: 1;
                background: rgba(0,0,0,0.2);
                border: 1px solid rgba(255,255,255,0.1);
                border-radius: 20px;
                padding: 5px 12px;
                color: white;
                font-size: 0.85rem;
            }
            .ai-chat-input button {
                background: none; border: none; color: var(--accent-primary); cursor: pointer;
            }

            .ai-actions { padding: 0 var(--spacing-md) var(--spacing-md) var(--spacing-md); }

            @keyframes slideIn {
                from { opacity: 0; transform: translateY(20px); }
                to { opacity: 1; transform: translateY(0); }
            }
        </style>
    `;
}
