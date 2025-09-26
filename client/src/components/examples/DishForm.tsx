import DishForm from '../DishForm';
import { Product, Recipe } from '@shared/schema';

export default function DishFormExample() {
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
    {
      id: '3',
      code: 'TOM-001',
      name: 'Pomodori San Marzano',
      waste: 5,
      quantity: 10,
      unit: 'kg',
      pricePerUnit: 3.20,
    },
  ];

  const mockRecipes: Recipe[] = [
    {
      id: '1',
      name: 'Salsa di Base',
      ingredients: [
        { productId: '3', quantity: 2, cost: 6.40 }
      ],
      totalCost: 6.40,
      createdAt: null,
      updatedAt: null,
    },
    {
      id: '2', 
      name: 'Mix Spezie',
      ingredients: [
        { productId: '1', quantity: 0.1, cost: 0.12 }
      ],
      totalCost: 0.12,
      createdAt: null,
      updatedAt: null,
    },
  ];

  return (
    <DishForm 
      products={mockProducts}
      recipes={mockRecipes}
      onSubmit={(dish) => console.log('Dish submitted:', dish)}
    />
  );
}