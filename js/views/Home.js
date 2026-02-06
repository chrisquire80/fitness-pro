import { dataManager } from '../services/DataManager.js';
import { emailService } from '../services/EmailService.js';

export default function Home() {
    const user = dataManager.getCurrentUser();

    // Simulate Weekly Recap trigger on Home load
    setTimeout(() => emailService.sendWeeklyRecap(), 2000);
    // Get a recommendation (taking the first one for now)
    const workouts = dataManager.getWorkouts();
    const recommended = workouts[0] || {};

    // Determine greeting based on time
    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Buongiorno' : (hour < 18 ? 'Buon pomeriggio' : 'Buonasera');

    return `
        <!-- Zone 1: Header -->
        <div class="home-header sticky-top">
            <div class="user-greeting">
                <div class="avatar-circle">${user.name ? user.name[0] : 'U'}</div>
                <div class="greeting-text">
                    <h2>${greeting}, ${user.name || 'Atleta'} 👋</h2>
                    <p class="subtitle">Pronto a sudare?</p>
                </div>
            </div>
            <div class="streak-badge">
                <i class="fas fa-fire"></i> <span>${user.streak_days || 0}</span>
            </div>
        </div>

        <!-- Zone 2: Hero Card -->
        <div class="hero-section">
            <div class="card hero-card" onclick="window.location.hash='#/active'">
                <div class="hero-bg" style="background-image: linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.8)), url('${recommended.thumbnail_url || ''}');"></div>
                
                <div class="hero-content">
                    <span class="focus-badge">${recommended.focus_label || 'Consigliato'}</span>
                    <h1 class="hero-title">${recommended.name || 'Allenamento del Giorno'}</h1>
                    
                    <div class="hero-meta">
                        <span><i class="far fa-clock"></i> ${recommended.estimated_duration} min</span>
                        <span><i class="fas fa-bolt"></i> ${recommended.difficulty_label || 'Medio'}</span>
                        <span><i class="fas fa-dumbbell"></i> ${recommended.equipment_label || 'No attrezzi'}</span>
                    </div>

                    <button class="btn btn-primary hero-cta">
                        INIZIA ORA <i class="fas fa-play"></i>
                    </button>
                </div>
            </div>
        </div>

        <!-- Zone 3: Categories -->
        <div class="categories-section">
            <h3>Scegli per Categoria</h3>
            <div class="categories-carousel">
                <div class="cat-pill active">🔥 Dimagrimento</div>
                <div class="cat-pill">💪 Massa</div>
                <div class="cat-pill">🧘 Stretching</div>
                <div class="cat-pill" onclick="window.location.hash='#/run'">🏃 Corsa</div>
            </div>
        </div>

        <style>
            .sticky-top {
                position: sticky;
                top: 0;
                background: var(--bg-primary);
                z-index: 10;
                padding-bottom: var(--spacing-sm);
                padding-top: var(--spacing-sm); /* Safe area */
            }
            .home-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: var(--spacing-md);
            }
            .user-greeting { display: flex; gap: var(--spacing-sm); align-items: center; }
            .avatar-circle {
                width: 40px; height: 40px;
                background: var(--bg-card);
                border-radius: 50%;
                display: flex; align-items: center; justify-content: center;
                font-weight: bold; color: var(--accent-secondary);
                border: 2px solid var(--accent-secondary);
            }
            .greeting-text h2 { font-size: 1.1rem; margin: 0; }
            .greeting-text .subtitle { font-size: 0.85rem; color: var(--text-secondary); margin: 0; }
            
            .streak-badge {
                display: flex; align-items: center; gap: 5px;
                background: rgba(255, 126, 5, 0.15); /* Orange tint */
                color: #ff7e05;
                padding: 0.5rem 0.8rem;
                border-radius: 20px;
                font-weight: bold;
            }

            .hero-card {
                position: relative;
                height: 300px; /* Big impact */
                padding: 0;
                overflow: hidden;
                border: none;
                cursor: pointer;
            }
            .hero-bg {
                position: absolute; top:0; left:0; right:0; bottom:0;
                background-size: cover; background-position: center;
                transition: transform 0.5s;
            }
            .hero-card:hover .hero-bg { transform: scale(1.05); }
            
            .hero-content {
                position: absolute; bottom: 0; padding: var(--spacing-lg);
                width: 100%;
                background: linear-gradient(to top, rgba(0,0,0,0.9), transparent);
            }
            .focus-badge {
                background: var(--accent-primary);
                color: white;
                padding: 0.2rem 0.6rem;
                border-radius: 4px;
                font-size: 0.8rem;
                text-transform: uppercase;
                font-weight: 700;
                margin-bottom: var(--spacing-sm);
                display: inline-block;
            }
            .hero-title {
                font-size: 1.8rem;
                margin: var(--spacing-xs) 0 var(--spacing-md) 0;
                line-height: 1.1;
                text-shadow: 0 2px 4px rgba(0,0,0,0.5);
            }
            .hero-meta {
                display: flex; gap: var(--spacing-md);
                font-size: 0.8rem; color: rgba(255,255,255,0.9);
                margin-bottom: var(--spacing-lg);
            }
            .hero-meta span { display: flex; align-items: center; gap: 5px; }
            
            .hero-cta {
                width: 100%;
                padding: 1rem;
                font-weight: 700;
                letter-spacing: 1px;
                background: var(--accent-secondary); /* Electric Orange/Cyan */
                border: none;
                color: #000; /* Contrast */
            }

            .categories-section { margin-top: var(--spacing-lg); }
            .categories-section h3 { font-size: 1rem; color: var(--text-secondary); margin-bottom: var(--spacing-md); }
            .categories-carousel {
                display: flex;
                overflow-x: auto;
                gap: var(--spacing-sm);
                padding-bottom: var(--spacing-sm);
                scrollbar-width: none; /* Hide scrollbar Firefox */
            }
            .categories-carousel::-webkit-scrollbar { display: none; }
            
            .cat-pill {
                white-space: nowrap;
                background: var(--bg-card);
                padding: 0.6rem 1.2rem;
                border-radius: 50px;
                color: var(--text-primary);
                border: 1px solid transparent;
                cursor: pointer;
            }
            .cat-pill.active {
                background: rgba(255,255,255,0.1);
                border-color: var(--accent-primary);
                color: var(--accent-primary);
            }
        </style>
    `;
}
