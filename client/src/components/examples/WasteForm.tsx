import WasteForm from '../WasteForm';
import { Product, Dish } from '@shared/schema';

export default function WasteFormExample() {
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
      ],
      totalCost: 0.29,
      sellingPrice: 12.00,
      netPrice: 9.84,
      foodCost: 2.9,
      sold: 5,
    },
  ];

  return (
    <WasteForm 
      products={mockProducts}
      dishes={mockDishes}
      onSubmitWaste={(waste) => console.log('Waste submitted:', waste)}
      onSubmitPersonalMeal={(meal) => console.log('Personal meal submitted:', meal)}
    />
  );
}