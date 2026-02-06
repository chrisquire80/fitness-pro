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
                    <button class="close-bubble" onclick="window.toggleAIBubble && window.toggleAIBubble()" aria-label="Chiudi chat">&times;</button>
                </div>
                <div class="ai-body chat-mode">
                    <div id="ai-messages" class="ai-messages">
                        <p class="ai-msg bot">${formattedText}</p>
                    </div>
                </div>
                <div class="ai-chat-input">
                    <input type="text" id="ai-input" placeholder="Chiedi ad Aura..." maxlength="200">
                    <button onclick="window.sendToAura && window.sendToAura()" aria-label="Invia messaggio">
                        <i class="fas fa-paper-plane"></i>
                    </button>
                </div>
            </div>
        </div>



        <button class="ai-trigger" onclick="window.toggleAIBubble && window.toggleAIBubble()">
            <i class="fas fa-comment-dots"></i>
            <span class="notification-dot"></span>
        </button>

        <script>
            // Initialize AI Coach functions safely
            window.toggleAIBubble = () => {
                const bubble = document.getElementById('ai-coach-bubble');
                if (bubble) {
                    bubble.classList.toggle('hide');
                }
            };

            window.sendToAura = async () => {
                try {
                    const input = document.getElementById('ai-input');
                    const list = document.getElementById('ai-messages');

                    if (!input || !list) {
                        console.error('AI Chat elements not found');
                        return;
                    }

                    const msg = input.value.trim();
                    if (!msg) return;

                    // Add user message
                    const userMsg = document.createElement('p');
                    userMsg.className = 'ai-msg user';
                    userMsg.textContent = msg;
                    list.appendChild(userMsg);

                    input.value = '';
                    list.scrollTop = list.scrollHeight;

                    // Show typing indicator
                    const typingMsg = document.createElement('p');
                    typingMsg.className = 'ai-msg bot typing';
                    typingMsg.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Aura sta pensando...';
                    list.appendChild(typingMsg);
                    list.scrollTop = list.scrollHeight;

                    // Get AI response
                    const { aiCoach } = await import('../services/AICoach.js');
                    const response = await aiCoach.askAura(msg);

                    // Remove typing indicator
                    typingMsg.remove();

                    // Add bot response
                    const botMsg = document.createElement('p');
                    botMsg.className = 'ai-msg bot';
                    botMsg.innerHTML = response.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
                    list.appendChild(botMsg);
                    list.scrollTop = list.scrollHeight;

                } catch (error) {
                    console.error('Error in AI chat:', error);
                    const list = document.getElementById('ai-messages');
                    if (list) {
                        const errorMsg = document.createElement('p');
                        errorMsg.className = 'ai-msg bot error';
                        errorMsg.textContent = 'Ops! Qualcosa è andato storto. Riprova più tardi.';
                        list.appendChild(errorMsg);
                        list.scrollTop = list.scrollHeight;
                    }
                }
            };

            // Handle enter key in input
            document.addEventListener('DOMContentLoaded', () => {
                const input = document.getElementById('ai-input');
                if (input) {
                    input.addEventListener('keypress', (e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            window.sendToAura();
                        }
                    });
                }
            });
        </script>

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
            .ai-msg.typing { opacity: 0.7; font-style: italic; }
            .ai-msg.error { background: rgba(239, 68, 68, 0.2); border-left: 2px solid var(--danger); }

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
                padding: 8px 12px;
                color: white;
                font-size: 0.85rem;
                transition: border-color 0.2s;
            }
            .ai-chat-input input:focus {
                outline: none;
                border-color: var(--accent-primary);
            }
            .ai-chat-input input::placeholder {
                color: rgba(255,255,255,0.5);
            }
            .ai-chat-input button {
                background: none;
                border: none;
                color: var(--accent-primary);
                cursor: pointer;
                padding: 8px;
                border-radius: 50%;
                transition: background-color 0.2s;
            }
            .ai-chat-input button:hover {
                background: rgba(139, 92, 246, 0.1);
            }
            .ai-chat-input button:disabled {
                opacity: 0.5;
                cursor: not-allowed;
            }

            .ai-actions { padding: 0 var(--spacing-md) var(--spacing-md) var(--spacing-md); }

            @keyframes slideIn {
                from { opacity: 0; transform: translateY(20px); }
                to { opacity: 1; transform: translateY(0); }
            }
        </style>
    `;
}
