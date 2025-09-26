import RecipeList from '../RecipeList';
import { Recipe, Product } from '@shared/schema';

export default function RecipeListExample() {
  // TODO: remove mock data functionality
  const mockProducts: Product[] = [
    {
      id: '1',
      code: 'FAR-001',
      name: 'Farina Tipo 00',
      supplier: 'Molino Bianco',
      waste: 2,
      quantity: 25,
      unit: 'kg',
      pricePerUnit: 1.20,
    },
    {
      id: '2',
      code: 'OLI-001', 
      name: 'Olio Extravergine',
      supplier: 'Frantoio Rossi',
      waste: 0,
      quantity: 5,
      unit: 'l',
      pricePerUnit: 8.50,
    },
  ];

  const mockRecipes: Recipe[] = [
    {
      id: '1',
      name: 'Pasta Frolla Base',
      ingredients: [
        { productId: '1', quantity: 0.5, cost: 0.60 },
        { productId: '2', quantity: 0.1, cost: 0.85 },
      ],
      totalCost: 1.45,
    },
  ];

  return (
    <RecipeList 
      recipes={mockRecipes}
      products={mockProducts}
      onEdit={(recipe) => console.log('Edit recipe:', recipe)}
      onDelete={(id) => console.log('Delete recipe:', id)}
    />
  );
}