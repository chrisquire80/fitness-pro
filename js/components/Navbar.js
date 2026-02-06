export default function Navbar() {
    return `
        <div class="nav-links">
            <a href="#/" class="nav-link active-nav">
                <i class="fas fa-home"></i>
                <span>Home</span>
            </a>
            <a href="#/nutrition" class="nav-link">
                <i class="fas fa-apple-alt"></i>
                <span>Nutrizione</span>
            </a>
            <a href="#/progress" class="nav-link">
                <i class="fas fa-chart-line"></i>
                <span>Progressi</span>
            </a>
            <a href="#/profile" class="nav-link">
                <i class="fas fa-user"></i>
                <span>Profilo</span>
            </a>
        </div>
        <style>
            .nav-links {
                display: flex;
                justify-content: space-around;
                width: 100%;
                background: var(--bg-secondary); /* or bottom bar color */
                padding: 0.8rem 0;
                /* Fixed bottom logic usually handled by parent, but let's ensure it looks like a bar */
                position: fixed;
                bottom: 0;
                left: 0;
                right: 0;
                border-top: 1px solid rgba(255,255,255,0.05);
                backdrop-filter: blur(10px);
                z-index: 100;
            }
            .nav-link {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 4px;
                color: var(--text-secondary);
                transition: color var(--transition-fast);
                font-weight: 500;
                text-decoration: none;
                font-size: 0.75rem;
            }
            .nav-link i {
                font-size: 1.2rem;
            }
            .nav-link.active-nav, .nav-link:hover {
                color: var(--accent-primary);
            }
            /* Add padding to body to prevent content being hidden behind nav */
            /* This style is global/contextual but might be needed here or in main css */
        </style>
    `;
}
