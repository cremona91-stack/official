import ProductForm from '../ProductForm';

export default function ProductFormExample() {
  return (
    <ProductForm 
      onSubmit={(product) => console.log('Product submitted:', product)}
    />
  );
}