import ProductList from '../ProductList';
import { Product } from '@shared/schema';

export default function ProductListExample() {
  // TODO: remove mock data functionality
  const mockProducts: Product[] = [
    {
      id: '1',
      code: 'FAR-001',
      name: 'Farina Tipo 00',
      supplier: 'Molino Bianco',
      waste: 2,
      notes: 'Farina di qualità per pasta fresca',
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

  return (
    <ProductList 
      products={mockProducts}
      onEdit={(product) => console.log('Edit product:', product)}
      onDelete={(id) => console.log('Delete product:', id)}
    />
  );
}