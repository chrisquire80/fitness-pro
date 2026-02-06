import { nutritionService } from '../services/NutritionService.js';

export default function Nutrition() {
    window.scanProduct = async () => {
        const barcode = prompt("Inserisci il Codice a Barre (Esempio: 8001100063261 per Nutella):");
        if (!barcode) return;

        const results = document.getElementById('scan-results');
        results.innerHTML = '<div class="spinner"></div>';

        const product = await nutritionService.getProductByBarcode(barcode);

        if (product) {
            results.innerHTML = `
                <div class="card product-card-detailed">
                    <img src="${product.image}" class="product-thumb">
                    <div class="product-main">
                        <h4>${product.name}</h4>
                        <p class="brand">${product.brand}</p>
                        <div class="score-badge score-${product.nutriscore}">${product.nutriscore.toUpperCase()}</div>
                    </div>
                    <div class="product-stats">
                        <div class="stat"><span>Cal</span><strong>${Math.round(product.calories)}</strong></div>
                        <div class="stat"><span>Zucch</span><strong>${Math.round(product.sugars)}g</strong></div>
                        <div class="stat"><span>Prot</span><strong>${Math.round(product.proteins)}g</strong></div>
                    </div>
                </div>
            `;
        } else {
            results.innerHTML = '<p style="color:red">Prodotto non trovato.</p>';
        }
    };

    return `
        <div class="nutrition-page">
            <h1>Analisi Nutrizione 🍎</h1>
            <p class="subtitle">Scansiona un prodotto per vedere i valori nutrizionali e il Nutri-Score.</p>

            <div class="dash-grid">
                <div class="card scanner-hero" onclick="window.scanProduct()">
                    <i class="fas fa-barcode"></i>
                    <span>TOCCA PER SCANSIONARE</span>
                </div>
            </div>

            <div id="scan-results"></div>

            <div class="recent-scans">
                <h3>Ultime scansioni</h3>
                <div class="card product-card">
                    <div class="product-info">
                        <h4>Biscotti Integrali</h4>
                        <span class="nutri-score score-a">A</span>
                    </div>
                    <div class="product-meta">
                        <span>450 kcal / 100g</span>
                    </div>
                </div>
            </div>
        </div>

        <style>
            .scanner-hero {
                height: 200px;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                border: 2px dashed var(--accent-primary);
                background: rgba(139, 92, 246, 0.05);
                cursor: pointer;
                margin: var(--spacing-lg) 0;
            }
            .scanner-hero i { font-size: 3rem; margin-bottom: 1rem; color: var(--accent-primary); }
            
            .product-card {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-top: var(--spacing-sm);
            }
            .nutri-score {
                font-weight: 800;
                padding: 4px 10px;
                border-radius: 4px;
                color: white;
            }
            .score-a { background: #038141; }
            .score-b { background: #85bb2f; }
            .score-c { background: #fec902; }
            .product-card-detailed {
                display: flex;
                flex-direction: column;
                gap: var(--spacing-md);
                align-items: center;
                text-align: center;
                animation: fadeIn 0.4s ease;
            }
            .product-thumb { width:120px; height:120px; object-fit: contain; border-radius: var(--radius-sm); background: white; padding: 5px; }
            .score-badge { 
                display: inline-block; padding: 5px 15px; border-radius: 4px; 
                font-weight: bold; font-size: 1.2rem; color: white; margin-top: 10px;
            }
            .product-stats { 
                display: flex; justify-content: space-around; width: 100%; 
                border-top: 1px solid rgba(255,255,255,0.1); padding-top: var(--spacing-md);
            }
            .product-stats .stat { display: flex; flex-direction: column; }
            .product-stats span { font-size: 0.7rem; color: var(--text-secondary); }
            @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        </style>
    `;
}
