import { type Product } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ClipboardList, Edit, Trash2, Package } from "lucide-react";

interface ProductListProps {
  products: Product[];
  onEdit?: (product: Product) => void;
  onDelete?: (productId: string) => void;
}

export default function ProductList({ products, onEdit, onDelete }: ProductListProps) {
  const handleEdit = (product: Product) => {
    console.log("Edit product:", product.id);
    onEdit?.(product);
  };

  const handleDelete = (productId: string) => {
    console.log("Delete product:", productId);
    onDelete?.(productId);
  };

  if (products.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-primary" />
            Lista Materie Prime
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground italic">
            Nessun prodotto in magazzino.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ClipboardList className="h-5 w-5 text-primary" />
          Lista Materie Prime
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {products.map((product) => (
          <Card key={product.id} className="hover-elevate">
            <CardContent className="p-4">
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <span className="font-semibold text-foreground">{product.name}</span>
                    <Badge variant="secondary" className="text-xs">
                      {product.code}
                    </Badge>
                  </div>
                  
                  {product.supplier && (
                    <p className="text-sm text-muted-foreground">
                      Fornitore: {product.supplier}
                    </p>
                  )}
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Quantità:</span>{" "}
                      <span className="font-medium font-mono">
                        {product.quantity} {product.unit}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Prezzo Grezzo:</span>{" "}
                      <span className="font-medium font-mono">
                        €{product.pricePerUnit.toFixed(1)}/{product.unit}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Prezzo Effettivo:</span>{" "}
                      <span className="font-bold font-mono text-primary">
                        €{product.effectivePricePerUnit?.toFixed(1) || product.pricePerUnit.toFixed(1)}/{product.unit}
                      </span>
                      {product.waste > 0 && (
                        <div className="text-xs text-muted-foreground mt-1">
                          (con {product.waste}% sfrido)
                        </div>
                      )}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Costo Totale:</span>{" "}
                      <span className="font-bold font-mono text-destructive">
                        €{(product.quantity * (product.effectivePricePerUnit || product.pricePerUnit)).toFixed(1)}
                      </span>
                    </div>
                  </div>
                  
                  {product.notes && (
                    <p className="text-sm text-muted-foreground italic">
                      {product.notes}
                    </p>
                  )}
                </div>
                
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleEdit(product)}
                    data-testid={`button-edit-product-${product.id}`}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => handleDelete(product.id)}
                    data-testid={`button-delete-product-${product.id}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </CardContent>
    </Card>
  );
}