import DishList from '../DishList';
import { Dish, Product } from '@shared/schema';

export default function DishListExample() {
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

  const mockDishes: Dish[] = [
    {
      id: '1',
      name: 'Spaghetti alla Carbonara',
      ingredients: [
        { productId: '1', quantity: 0.1, cost: 0.12 },
        { productId: '2', quantity: 0.02, cost: 0.17 },
      ],
      totalCost: 0.29,
      sellingPrice: 12.00,
      netPrice: 9.84,
      foodCost: 2.9,
      sold: 5,
    },
    {
      id: '2',
      name: 'Pizza Margherita',
      ingredients: [
        { productId: '1', quantity: 0.25, cost: 0.30 },
        { productId: '2', quantity: 0.01, cost: 0.09 },
      ],
      totalCost: 0.39,
      sellingPrice: 8.00,
      netPrice: 6.56,
      foodCost: 5.9,
      sold: 12,
    },
  ];

  return (
    <DishList 
      dishes={mockDishes}
      products={mockProducts}
      onEdit={(dish) => console.log('Edit dish:', dish)}
      onDelete={(id) => console.log('Delete dish:', id)}
      onUpdateSold={(id, sold) => console.log('Update sold:', id, sold)}
      onClearSales={() => console.log('Clear sales')}
    />
  );
}