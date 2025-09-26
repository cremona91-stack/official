import { useState, useMemo } from "react";
import { type Waste, type PersonalMeal, type Product, type Dish } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { CalendarDays, Trash2, Users, Search, Filter, X } from "lucide-react";
import { format, parseISO } from "date-fns";
import { it } from "date-fns/locale";
import { useDeleteWaste, useDeletePersonalMeal } from "@/hooks/useApi";

interface WasteRegistryProps {
  waste: Waste[];
  personalMeals: PersonalMeal[];
  products: Product[];
  dishes: Dish[];
}

export default function WasteRegistry({ waste, personalMeals, products, dishes }: WasteRegistryProps) {
  const [dateFilter, setDateFilter] = useState("");
  const [minCost, setMinCost] = useState("");
  const [maxCost, setMaxCost] = useState("");
  const [productFilter, setProductFilter] = useState("");
  
  // Delete mutations
  const deleteWasteMutation = useDeleteWaste();
  const deletePersonalMealMutation = useDeletePersonalMeal();
  
  const handleDeleteItem = (item: any) => {
    if (item.type === "waste") {
      deleteWasteMutation.mutate(item.id);
    } else {
      deletePersonalMealMutation.mutate(item.id);
    }
  };

  // Combine waste and personal meals into a single list with type distinction
  const combinedItems = useMemo(() => {
    const wasteItems = waste.map(w => ({
      ...w,
      type: "waste" as const,
      itemName: products.find(p => p.id === w.productId)?.name || "Prodotto sconosciuto",
      displayDate: w.date,
    }));

    const mealItems = personalMeals.map(m => ({
      ...m,
      type: "meal" as const,
      itemName: dishes.find(d => d.id === m.dishId)?.name || "Piatto sconosciuto",
      displayDate: m.date,
      productId: m.dishId, // Use dishId for filtering consistency
    }));

    return [...wasteItems, ...mealItems].sort((a, b) => 
      new Date(b.displayDate).getTime() - new Date(a.displayDate).getTime()
    );
  }, [waste, personalMeals, products, dishes]);

  // Apply filters
  const filteredItems = useMemo(() => {
    return combinedItems.filter(item => {
      // Date filter
      if (dateFilter && item.displayDate !== dateFilter) {
        return false;
      }

      // Cost range filter
      if (minCost && item.cost < parseFloat(minCost)) {
        return false;
      }
      if (maxCost && item.cost > parseFloat(maxCost)) {
        return false;
      }

      // Product/Dish name filter
      if (productFilter && !item.itemName.toLowerCase().includes(productFilter.toLowerCase())) {
        return false;
      }

      return true;
    });
  }, [combinedItems, dateFilter, minCost, maxCost, productFilter]);

  // Calculate totals
  const totalWasteCost = filteredItems
    .filter(item => item.type === "waste")
    .reduce((sum, item) => sum + item.cost, 0);
  const totalMealCost = filteredItems
    .filter(item => item.type === "meal")
    .reduce((sum, item) => sum + item.cost, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-primary" />
          Registro Sprechi e Pasti Personali
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-muted rounded-lg">
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">
              Filtra per data
            </label>
            <Input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full"
              data-testid="input-date-filter"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">
              Costo minimo (€)
            </label>
            <Input
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={minCost}
              onChange={(e) => setMinCost(e.target.value)}
              data-testid="input-min-cost-filter"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">
              Costo massimo (€)
            </label>
            <Input
              type="number"
              step="0.01"
              min="0"
              placeholder="∞"
              value={maxCost}
              onChange={(e) => setMaxCost(e.target.value)}
              data-testid="input-max-cost-filter"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">
              Nome prodotto/piatto
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cerca..."
                value={productFilter}
                onChange={(e) => setProductFilter(e.target.value)}
                className="pl-10"
                data-testid="input-product-filter"
              />
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-2">
              <Trash2 className="h-4 w-4 text-destructive" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Totale Sprechi
                </p>
                <p className="text-xl font-bold text-destructive font-mono">
                  €{totalWasteCost.toFixed(2)}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Totale Pasti Personali
                </p>
                <p className="text-xl font-bold text-primary font-mono">
                  €{totalMealCost.toFixed(2)}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-chart-2" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Elementi Filtrati
                </p>
                <p className="text-xl font-bold text-chart-2 font-mono">
                  {filteredItems.length}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Registry List */}
        <div>
          <h3 className="font-semibold text-foreground mb-4">
            Registro ({filteredItems.length} elementi)
          </h3>
          
          {filteredItems.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">
                Nessun elemento trovato con i filtri applicati.
              </p>
            </Card>
          ) : (
            <ScrollArea className="h-96 w-full">
              <div className="space-y-2">
                {filteredItems.map((item, index) => (
                  <Card key={`${item.type}-${item.id || index}`} className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {item.type === "waste" ? (
                            <Trash2 className="h-4 w-4 text-destructive" />
                          ) : (
                            <Users className="h-4 w-4 text-primary" />
                          )}
                          <Badge variant={item.type === "waste" ? "destructive" : "default"}>
                            {item.type === "waste" ? "Spreco" : "Pasto Personale"}
                          </Badge>
                        </div>
                        
                        <h4 className="font-medium text-foreground">
                          {item.itemName}
                        </h4>
                        
                        <div className="text-sm text-muted-foreground mt-1">
                          <div>
                            Quantità: <span className="font-mono">{item.quantity}</span>
                            {item.type === "waste" && (
                              <>
                                {" "}
                                {products.find(p => p.id === item.productId)?.unit || ""}
                              </>
                            )}
                          </div>
                          <div>
                            Data: {format(parseISO(item.displayDate), "dd/MM/yyyy", { locale: it })}
                          </div>
                          {item.notes && (
                            <div className="mt-1 text-xs">
                              Note: {item.notes}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          <div className="text-lg font-bold font-mono text-destructive">
                            €{item.cost.toFixed(2)}
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleDeleteItem(item)}
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          data-testid={`button-delete-${item.type}-${item.id}`}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
      </CardContent>
    </Card>
  );
}