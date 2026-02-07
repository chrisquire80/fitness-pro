export default function Navbar() {
  const currentPath = window.location.hash.slice(1) || "/";

  const navItems = [
    { path: "/", icon: "fas fa-home", label: "Home" },
    { path: "/exercises", icon: "fas fa-search", label: "Esplora" },
    { path: "/videos", icon: "fas fa-video", label: "Video" },
    { path: "/progress", icon: "fas fa-chart-line", label: "Progressi" },
    { path: "/gamification", icon: "fas fa-trophy", label: "Risultati" },
    { path: "/profile", icon: "fas fa-user", label: "Profilo" },
  ];

  return `
        <div class="nav-links">
            ${navItems
              .map(
                (item) => `
                <a href="#${item.path}"
                   class="nav-link ${currentPath === item.path ? "active-nav" : ""}"
                   data-path="${item.path}"
                   role="tab"
                   aria-label="Naviga a ${item.label}">
                    <i class="${item.icon}" aria-hidden="true"></i>
                    <span>${item.label}</span>
                </a>
            `,
              )
              .join("")}
        </div>
        <style>
            .nav-links {
                display: flex;
                justify-content: space-around;
                width: 100%;
                background: rgba(30, 41, 59, 0.95);
                padding: 0.8rem 0;
                position: fixed;
                bottom: 0;
                left: 0;
                right: 0;
                border-top: 1px solid rgba(255,255,255,0.08);
                backdrop-filter: blur(15px);
                -webkit-backdrop-filter: blur(15px);
                z-index: 100;
                box-shadow: 0 -4px 20px rgba(0,0,0,0.3);
            }

            .nav-link {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 4px;
                color: var(--text-secondary);
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                font-weight: 500;
                text-decoration: none;
                font-size: 0.75rem;
                padding: 0.5rem 0.8rem;
                border-radius: var(--radius-sm);
                position: relative;
                overflow: hidden;
                cursor: pointer;
                min-width: 60px;
            }

            .nav-link i {
                font-size: 1.3rem;
                transition: transform 0.3s ease;
            }

            .nav-link span {
                margin-top: 2px;
                font-size: 0.7rem;
                opacity: 0.9;
            }

            .nav-link:hover {
                color: var(--accent-primary);
                background: rgba(139, 92, 246, 0.1);
                transform: translateY(-2px);
            }

            .nav-link:hover i {
                transform: scale(1.1);
            }

            .nav-link.active-nav {
                color: var(--accent-primary);
                background: rgba(139, 92, 246, 0.15);
                position: relative;
            }

            .nav-link.active-nav::before {
                content: '';
                position: absolute;
                top: 0;
                left: 50%;
                transform: translateX(-50%);
                width: 20px;
                height: 3px;
                background: var(--accent-primary);
                border-radius: 0 0 4px 4px;
                animation: slideIn 0.3s ease-out;
            }

            .nav-link.active-nav i {
                transform: scale(1.1);
            }

            @keyframes slideIn {
                from {
                    width: 0;
                    opacity: 0;
                }
                to {
                    width: 20px;
                    opacity: 1;
                }
            }

            /* Add safe area for devices with notches */
            @supports (padding-bottom: env(safe-area-inset-bottom)) {
                .nav-links {
                    padding-bottom: calc(0.8rem + env(safe-area-inset-bottom));
                }
            }

            /* Tablet styles */
            @media (min-width: 768px) {
                .nav-links {
                    max-width: 600px;
                    left: 50%;
                    transform: translateX(-50%);
                    border-radius: var(--radius-lg) var(--radius-lg) 0 0;
                }
            }
        </style>
    `;
}
