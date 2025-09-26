import SalesSummary from '../SalesSummary';
import { Dish, Product, Waste, PersonalMeal } from '@shared/schema';

export default function SalesSummaryExample() {
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
  ];

  const mockDishes: Dish[] = [
    {
      id: '1',
      name: 'Spaghetti alla Carbonara',
      ingredients: [
        { productId: '1', quantity: 0.1, cost: 0.12 },
      ],
      totalCost: 0.29,
      sellingPrice: 12.00,
      netPrice: 9.84,
      foodCost: 2.9,
      sold: 15,
    },
    {
      id: '2',
      name: 'Pizza Margherita',
      ingredients: [
        { productId: '1', quantity: 0.25, cost: 0.30 },
      ],
      totalCost: 0.39,
      sellingPrice: 8.00,
      netPrice: 6.56,
      foodCost: 5.9,
      sold: 22,
    },
  ];

  const mockWaste: Waste[] = [
    {
      id: '1',
      productId: '1',
      quantity: 2,
      cost: 2.40,
      date: '2024-01-15',
      notes: 'Farina scaduta',
    },
  ];

  const mockPersonalMeals: PersonalMeal[] = [
    {
      id: '1',
      dishId: '1',
      quantity: 2,
      cost: 0.58,
      date: '2024-01-15',
      notes: 'Pranzo staff',
    },
  ];

  return (
    <SalesSummary 
      dishes={mockDishes}
      products={mockProducts}
      waste={mockWaste}
      personalMeals={mockPersonalMeals}
      maxFoodCost={30}
      onMaxFoodCostChange={(value) => console.log('Max food cost changed:', value)}
    />
  );
}