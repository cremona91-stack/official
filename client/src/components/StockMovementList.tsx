import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Edit2, 
  Trash2, 
  ArrowUp,
  ArrowDown,
  Package,
  Calendar,
  User,
  FileText,
  Euro,
  Filter,
  X
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { StockMovement, Product } from "@shared/schema";

interface StockMovementListProps {
  movements: StockMovement[];
  products: Product[];
  onEdit: (movement: StockMovement) => void;
  onDelete: (movementId: string) => void;
  selectedProductId?: string;
  onFilterByProduct?: (productId: string | null) => void;
}

export default function StockMovementList({ 
  movements, 
  products, 
  onEdit, 
  onDelete,
  selectedProductId,
  onFilterByProduct 
}: StockMovementListProps) {
  const [sortBy, setSortBy] = useState<"date" | "product" | "type">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const getProductName = (productId: string) => {
    const product = products.find(p => p.id === productId);
    return product ? `${product.name} (${product.code})` : "Prodotto non trovato";
  };

  const getMovementTypeColor = (type: string) => {
    switch (type) {
      case "in":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100";
      case "out":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100";
    }
  };

  const getMovementTypeLabel = (type: string) => {
    switch (type) {
      case "in":
        return "Entrata";
      case "out":
        return "Uscita";
      default:
        return type;
    }
  };

  const getMovementTypeIcon = (type: string) => {
    switch (type) {
      case "in":
        return <ArrowUp className="h-4 w-4" />;
      case "out":
        return <ArrowDown className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getSourceLabel = (source: string) => {
    switch (source) {
      case "order":
        return "Ordine";
      case "sale":
        return "Vendita";
      case "waste":
        return "Scarto";
      case "adjustment":
        return "Aggiustamento";
      default:
        return source;
    }
  };

  // Filter movements
  const filteredMovements = selectedProductId 
    ? movements.filter(m => m.productId === selectedProductId)
    : movements;

  // Sort movements
  const sortedMovements = [...filteredMovements].sort((a, b) => {
    let comparison = 0;
    
    switch (sortBy) {
      case "date":
        comparison = new Date(a.movementDate).getTime() - new Date(b.movementDate).getTime();
        break;
      case "product":
        comparison = getProductName(a.productId).localeCompare(getProductName(b.productId));
        break;
      case "type":
        comparison = a.movementType.localeCompare(b.movementType);
        break;
    }

    return sortOrder === "desc" ? -comparison : comparison;
  });

  const getTotals = () => {
    const totalIn = sortedMovements
      .filter(m => m.movementType === "in")
      .reduce((sum, m) => sum + m.quantity, 0);
    const totalOut = sortedMovements
      .filter(m => m.movementType === "out")
      .reduce((sum, m) => sum + m.quantity, 0);
    const totalValue = sortedMovements
      .reduce((sum, m) => sum + (m.totalCost || (m.quantity * (m.unitPrice || 0))), 0);
    
    return { totalIn, totalOut, totalValue };
  };

  const totals = getTotals();

  if (movements.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Movimenti di Magazzino
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-12">
          <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Nessun movimento registrato</p>
          <p className="text-sm text-muted-foreground mt-1">
            Registra il primo movimento per iniziare il tracking
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Movimenti di Magazzino ({sortedMovements.length})
          </CardTitle>
          <div className="flex items-center gap-2">
            {/* Filter */}
            {onFilterByProduct && (
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                <Select 
                  value={selectedProductId || "all"} 
                  onValueChange={(value) => onFilterByProduct(value === "all" ? null : value)}
                >
                  <SelectTrigger className="w-48" data-testid="select-filter-product">
                    <SelectValue placeholder="Filtra per prodotto" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tutti i prodotti</SelectItem>
                    {products.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name} ({product.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedProductId && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onFilterByProduct(null)}
                    data-testid="button-clear-filter"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            )}
            
            {/* Sort */}
            <Select value={sortBy} onValueChange={(value) => setSortBy(value as any)}>
              <SelectTrigger className="w-32" data-testid="select-sort-by">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Data</SelectItem>
                <SelectItem value="product">Prodotto</SelectItem>
                <SelectItem value="type">Tipo</SelectItem>
              </SelectContent>
            </Select>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
              data-testid="button-sort-order"
            >
              {sortOrder === "asc" ? "↑" : "↓"}
            </Button>
          </div>
        </div>

        {/* Summary Stats */}
        {sortedMovements.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div className="flex items-center gap-2 text-sm">
              <ArrowUp className="h-4 w-4 text-green-600" />
              <span>Entrate: <span className="font-semibold" data-testid="total-in">{totals.totalIn.toFixed(1)}</span></span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <ArrowDown className="h-4 w-4 text-red-600" />
              <span>Uscite: <span className="font-semibold" data-testid="total-out">{totals.totalOut.toFixed(1)}</span></span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Euro className="h-4 w-4 text-primary" />
              <span>Valore: <span className="font-semibold" data-testid="total-value">€{totals.totalValue.toFixed(1)}</span></span>
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {sortedMovements.map((movement) => (
          <Card key={movement.id} className="border">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-medium" data-testid={`movement-product-${movement.id}`}>
                      {getProductName(movement.productId)}
                    </h3>
                    <Badge 
                      className={getMovementTypeColor(movement.movementType)}
                      data-testid={`movement-type-${movement.id}`}
                    >
                      <div className="flex items-center gap-1">
                        {getMovementTypeIcon(movement.movementType)}
                        {getMovementTypeLabel(movement.movementType)}
                      </div>
                    </Badge>
                    <Badge variant="outline" data-testid={`movement-source-${movement.id}`}>
                      {getSourceLabel(movement.source)}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span data-testid={`movement-date-${movement.id}`}>
                        {new Date(movement.movementDate).toLocaleDateString('it-IT')}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <Package className="h-4 w-4" />
                      <span data-testid={`movement-quantity-${movement.id}`}>
                        {movement.quantity} unità
                      </span>
                    </div>
                    
                    {movement.unitPrice && movement.unitPrice > 0 && (
                      <div className="flex items-center gap-1">
                        <Euro className="h-4 w-4" />
                        <span data-testid={`movement-unit-price-${movement.id}`}>
                          €{movement.unitPrice.toFixed(2)}/unità
                        </span>
                      </div>
                    )}
                    
                    {movement.totalCost && movement.totalCost > 0 && (
                      <div className="flex items-center gap-1">
                        <Euro className="h-4 w-4" />
                        <span className="font-semibold" data-testid={`movement-total-${movement.id}`}>
                          €{movement.totalCost.toFixed(2)}
                        </span>
                      </div>
                    )}
                  </div>

                  {movement.notes && (
                    <div className="flex items-start gap-1 mt-2 text-sm text-muted-foreground">
                      <FileText className="h-4 w-4 mt-0.5" />
                      <span data-testid={`movement-notes-${movement.id}`}>
                        {movement.notes}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-1 ml-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(movement)}
                    data-testid={`button-edit-movement-${movement.id}`}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(movement.id)}
                    className="text-destructive hover:text-destructive"
                    data-testid={`button-delete-movement-${movement.id}`}
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