/**
 * NutritionService.js
 * Integration with OpenFoodFacts API.
 */

class NutritionService {
    async getProductByBarcode(barcode) {
        const url = `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`;
        try {
            const response = await fetch(url);
            const data = await response.json();

            if (data.status === 1) {
                const p = data.product;
                return {
                    name: p.product_name || 'Prodotto Sconosciuto',
                    brand: p.brands || '',
                    nutriscore: p.nutrition_grades || '?',
                    calories: p.nutriments['energy-kcal_100g'] || 0,
                    sugars: p.nutriments.sugars_100g || 0,
                    proteins: p.nutriments.proteins_100g || 0,
                    image: p.image_url || ''
                };
            }
            return null;
        } catch (error) {
            console.error("OpenFoodFacts API Error:", error);
            return null;
        }
    }
}

export const nutritionService = new NutritionService();
