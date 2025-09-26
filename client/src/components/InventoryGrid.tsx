import { useMemo, useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Package, 
  TrendingUp, 
  TrendingDown, 
  Edit2, 
  Save,
  X,
  Calendar,
  Filter
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { 
  Product, 
  StockMovement, 
  EditableInventory, 
  Waste, 
  PersonalMeal,
  InsertEditableInventory,
  UpdateEditableInventory,
  UpsertEditableInventory 
} from "@shared/schema";
import { useSales } from "@/hooks/useApi";

interface InventoryGridProps {
  products: Product[];
  stockMovements: StockMovement[];
  waste: Waste[];
  personalMeals: PersonalMeal[];
  onViewMovements?: (productId: string) => void;
}

interface InventoryRowData {
  product: Product;
  editableInventory: EditableInventory | undefined;
  initialQuantity: number;
  inQuantity: number;
  outQuantity: number;
  finalQuantity: number;
  variance: number;
  isEditing: boolean;
  editValues: {
    initialQuantity: string;
    finalQuantity: string;
  };
  validationErrors: {
    initialQuantity?: string;
    finalQuantity?: string;
  };
}

export default function InventoryGrid({ 
  products, 
  stockMovements, 
  waste,
  personalMeals,
  onViewMovements
}: InventoryGridProps) {
  // Fetch sales data for calculating dish sales out
  const { data: salesData = [] } = useSales();
  
  const { toast } = useToast();
  const [editingRows, setEditingRows] = useState<Set<string>>(new Set());
  const [editValues, setEditValues] = useState<Record<string, { initialQuantity: string; finalQuantity: string }>>({});
  const [validationErrors, setValidationErrors] = useState<Record<string, { initialQuantity?: string; finalQuantity?: string }>>({});

  // Helper function to extract year and month from date string (timezone-safe)
  const getDateParts = (dateString: string) => {
    // Parse ISO date string directly without timezone conversion
    const [year, month] = dateString.split('-').map(Number);
    return { year, month };
  };

  // Date filtering state - synchronized with dashboard selection
  const [selectedYear, setSelectedYear] = useState(() => {
    const saved = localStorage.getItem('foodyflow-selected-year');
    return saved ? parseInt(saved) : new Date().getFullYear();
  });
  
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const saved = localStorage.getItem('foodyflow-selected-month');
    return saved ? parseInt(saved) : new Date().getMonth() + 1;
  });

  // Persist date selection to localStorage
  useEffect(() => {
    localStorage.setItem('foodyflow-selected-year', selectedYear.toString());
    localStorage.setItem('foodyflow-selected-month', selectedMonth.toString());
  }, [selectedYear, selectedMonth]);

  // Filter data by selected month/year
  const filteredStockMovements = useMemo(() => {
    return stockMovements.filter(movement => {
      const { year, month } = getDateParts(movement.movementDate);
      return year === selectedYear && month === selectedMonth;
    });
  }, [stockMovements, selectedYear, selectedMonth]);

  const filteredWaste = useMemo(() => {
    return waste.filter(w => {
      const { year, month } = getDateParts(w.date);
      return year === selectedYear && month === selectedMonth;
    });
  }, [waste, selectedYear, selectedMonth]);

  const filteredPersonalMeals = useMemo(() => {
    return personalMeals.filter(pm => {
      const { year, month } = getDateParts(pm.date);
      return year === selectedYear && month === selectedMonth;
    });
  }, [personalMeals, selectedYear, selectedMonth]);

  const filteredSalesData = useMemo(() => {
    return salesData.filter(sale => {
      const { year, month } = getDateParts(sale.saleDate);
      return year === selectedYear && month === selectedMonth;
    });
  }, [salesData, selectedYear, selectedMonth]);

  // Fetch editable inventory data
  const { data: editableInventoryData = [] } = useQuery<EditableInventory[]>({
    queryKey: ["/api/editable-inventory"],
    enabled: products.length > 0
  });

  // Upsert editable inventory mutation (replaces separate create/update)
  const upsertEditableInventoryMutation = useMutation({
    mutationFn: (data: UpsertEditableInventory) => apiRequest("POST", "/api/editable-inventory/upsert", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/editable-inventory"] });
      toast({ title: "Inventario aggiornato", description: "Quantità salvate con successo" });
    },
    onError: (error) => {
      console.error("Error upserting editable inventory:", error);
      toast({ 
        title: "Errore", 
        description: "Impossibile salvare le quantità", 
        variant: "destructive" 
      });
    }
  });

  // Calculate aggregated OUT movements for each product (using filtered data)
  const calculateAggregatedOutMovements = (productId: string): number => {
    // Get all dishes that use this product
    const dishesQuery = queryClient.getQueryData(["/api/dishes"]) as any[];
    const dishes = dishesQuery || [];
    
    // Calculate sales OUT (from filtered stock movements with source = "sale")
    const salesOut = filteredStockMovements
      .filter(m => m.productId === productId && m.movementType === "out" && m.source === "sale")
      .reduce((sum, m) => sum + m.quantity, 0);

    // Calculate waste OUT (sum all filtered waste for this product)
    const wasteOut = filteredWaste
      .filter(w => w.productId === productId)
      .reduce((sum, w) => sum + w.quantity, 0);

    // Calculate personal meals OUT (dishes using this product * filtered personal meal quantities)
    const personalMealsOut = filteredPersonalMeals.reduce((sum, meal) => {
      const dish = dishes.find(d => d.id === meal.dishId);
      if (!dish) return sum;
      
      // Find ingredient quantity of this product in the dish
      const ingredient = dish.ingredients?.find((ing: any) => ing.productId === productId);
      if (!ingredient) return sum;
      
      return sum + (ingredient.quantity * meal.quantity);
    }, 0);

    // Calculate dish sales OUT (sold dishes * ingredient quantities) from filtered sales table
    const dishSalesOut = filteredSalesData.reduce((sum, sale) => {
      // Find the dish for this sale
      const dish = dishes.find(d => d.id === sale.dishId);
      if (!dish) return sum;
      
      // Find ingredient quantity of this product in the dish
      const ingredient = dish.ingredients?.find((ing: any) => ing.productId === productId);
      if (!ingredient) return sum;
      
      return sum + (ingredient.quantity * sale.quantitySold);
    }, 0);

    return salesOut + wasteOut + personalMealsOut + dishSalesOut;
  };

  const inventoryRows: InventoryRowData[] = useMemo(() => {
    return products.map(product => {
      // Find existing editable inventory record for this product
      const editableInventory = editableInventoryData.find(
        (ei: EditableInventory) => ei.productId === product.id
      );

      // Calculate IN movements (from filtered stock movements)
      const inQuantity = filteredStockMovements
        .filter(m => m.productId === product.id && m.movementType === "in")
        .reduce((sum, m) => sum + m.quantity, 0);

      // Calculate aggregated OUT movements (sales + waste + personal meals)
      const outQuantity = calculateAggregatedOutMovements(product.id);

      // Get current values (either from editable inventory or defaults)
      const initialQuantity = editableInventory?.initialQuantity || 0;
      const finalQuantity = editableInventory?.finalQuantity || 0;

      // Calculate VARIANCE = INICIAL + IN - OUT - FINAL
      const variance = initialQuantity + inQuantity - outQuantity - finalQuantity;

      const isEditing = editingRows.has(product.id);
      const productEditValues = editValues[product.id] || {
        initialQuantity: initialQuantity.toString(),
        finalQuantity: finalQuantity.toString()
      };

      return {
        product,
        editableInventory,
        initialQuantity,
        inQuantity,
        outQuantity,
        finalQuantity,
        variance,
        isEditing,
        editValues: productEditValues,
        validationErrors: validationErrors[product.id] || {}
      };
    });
  }, [products, editableInventoryData, filteredStockMovements, filteredWaste, filteredPersonalMeals, filteredSalesData, editingRows, editValues]);

  // Helper function to check if inputs are valid for Save button
  const isInputValid = (productId: string): boolean => {
    const errors = validationErrors[productId];
    const values = editValues[productId];
    
    if (!values || !errors) return false;
    
    // Check if there are any validation errors
    const hasErrors = Object.keys(errors).length > 0 && Object.values(errors).some(error => error !== undefined);
    
    // Check if inputs are empty
    const hasEmptyValues = !values.initialQuantity.trim() || !values.finalQuantity.trim();
    
    return !hasErrors && !hasEmptyValues;
  };

  const startEditing = (productId: string, row: InventoryRowData) => {
    setEditingRows(prev => new Set([...Array.from(prev), productId]));
    setEditValues(prev => ({
      ...prev,
      [productId]: {
        initialQuantity: row.initialQuantity.toString(),
        finalQuantity: row.finalQuantity.toString()
      }
    }));
  };

  const cancelEditing = (productId: string) => {
    setEditingRows(prev => {
      const newSet = new Set(prev);
      newSet.delete(productId);
      return newSet;
    });
    setEditValues(prev => {
      const newValues = { ...prev };
      delete newValues[productId];
      return newValues;
    });
    setValidationErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[productId];
      return newErrors;
    });
  };

  const saveEditing = async (productId: string, row: InventoryRowData) => {
    const values = editValues[productId];
    if (!values) return;

    // Validate inputs before saving
    const errors = validateInputs(productId, values);
    if (Object.keys(errors).length > 0) {
      setValidationErrors(prev => ({ ...prev, [productId]: errors }));
      toast({ 
        title: "Errore di validazione", 
        description: "Correggi gli errori prima di salvare", 
        variant: "destructive" 
      });
      return;
    }

    const initialQuantity = parseFloat(values.initialQuantity);
    const finalQuantity = parseFloat(values.finalQuantity);

    const upsertData: UpsertEditableInventory = {
      productId,
      initialQuantity,
      finalQuantity,
      notes: `Aggiornato il ${new Date().toLocaleDateString()}`
    };

    try {
      await upsertEditableInventoryMutation.mutateAsync(upsertData);
      // Exit editing mode
      cancelEditing(productId);
    } catch (error) {
      console.error("Error saving inventory:", error);
    }
  };

  const validateInputs = (productId: string, values: { initialQuantity: string; finalQuantity: string }) => {
    const errors: { initialQuantity?: string; finalQuantity?: string } = {};
    
    // Check if values are empty or invalid
    if (!values.initialQuantity || values.initialQuantity.trim() === '') {
      errors.initialQuantity = "Quantità iniziale richiesta";
    } else if (isNaN(parseFloat(values.initialQuantity)) || parseFloat(values.initialQuantity) < 0) {
      errors.initialQuantity = "Deve essere un numero positivo";
    }
    
    if (!values.finalQuantity || values.finalQuantity.trim() === '') {
      errors.finalQuantity = "Quantità finale richiesta";
    } else if (isNaN(parseFloat(values.finalQuantity)) || parseFloat(values.finalQuantity) < 0) {
      errors.finalQuantity = "Deve essere un numero positivo";
    }
    
    return errors;
  };

  const updateEditValue = (productId: string, field: 'initialQuantity' | 'finalQuantity', value: string) => {
    // Allow only valid numeric input - no empty strings
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setEditValues(prev => ({
        ...prev,
        [productId]: {
          ...prev[productId],
          [field]: value
        }
      }));
      
      // Clear validation error for this field when user starts typing
      if (validationErrors[productId]?.[field]) {
        setValidationErrors(prev => ({
          ...prev,
          [productId]: {
            ...prev[productId],
            [field]: undefined
          }
        }));
      }
    }
  };

  const handleInputBlur = (productId: string, field: 'initialQuantity' | 'finalQuantity') => {
    const values = editValues[productId];
    if (!values) return;
    
    let normalizedValue = values[field].trim();
    
    // If empty, set to "0"
    if (normalizedValue === '') {
      normalizedValue = '0';
      setEditValues(prev => ({
        ...prev,
        [productId]: {
          ...prev[productId],
          [field]: normalizedValue
        }
      }));
    }
    
    // Validate after normalization
    const errors = validateInputs(productId, {
      ...values,
      [field]: normalizedValue
    });
    
    setValidationErrors(prev => ({
      ...prev,
      [productId]: errors
    }));
  };

  const getVarianceColor = (variance: number): string => {
    if (variance > 0) {
      return "text-red-600 dark:text-red-400"; // Rosso per positivo (perdita)
    } else if (variance < 0) {
      return "text-green-600 dark:text-green-400"; // Verde per negativo (risparmio)
    }
    return "text-muted-foreground"; // Neutro per zero
  };

  const getTotalValue = () => {
    return inventoryRows.reduce((sum, row) => {
      return sum + (row.finalQuantity * row.product.pricePerUnit);
    }, 0);
  };

  const getTotalVarianceValue = () => {
    return inventoryRows.reduce((sum, row) => {
      return sum + (row.variance * row.product.pricePerUnit);
    }, 0);
  };

  if (products.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Nessun prodotto trovato</p>
          <p className="text-sm text-muted-foreground mt-1">
            Aggiungi dei prodotti per visualizzare l'inventario editabile
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Prodotti</p>
                <p className="text-lg font-semibold" data-testid="stat-total-products">
                  {products.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">Valore Inventario</p>
                <p className="text-lg font-semibold" data-testid="stat-total-value">
                  €{getTotalValue().toFixed(1)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-orange-600" />
              <div>
                <p className="text-sm text-muted-foreground">Valore Varianza</p>
                <p className={`text-lg font-semibold ${getTotalVarianceValue() >= 0 ? 'text-red-600' : 'text-green-600'}`} data-testid="stat-variance-value">
                  €{getTotalVarianceValue() >= 0 ? `-${getTotalVarianceValue().toFixed(1)}` : `+${Math.abs(getTotalVarianceValue()).toFixed(1)}`}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Date Filter Controls */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Periodo di Riferimento:</span>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Anno:</span>
              <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
                <SelectTrigger className="w-24" data-testid="select-year">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2024">2024</SelectItem>
                  <SelectItem value="2025">2025</SelectItem>
                  <SelectItem value="2026">2026</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Mese:</span>
              <Select value={selectedMonth.toString()} onValueChange={(value) => setSelectedMonth(parseInt(value))}>
                <SelectTrigger className="w-32" data-testid="select-month">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Gennaio</SelectItem>
                  <SelectItem value="2">Febbraio</SelectItem>
                  <SelectItem value="3">Marzo</SelectItem>
                  <SelectItem value="4">Aprile</SelectItem>
                  <SelectItem value="5">Maggio</SelectItem>
                  <SelectItem value="6">Giugno</SelectItem>
                  <SelectItem value="7">Luglio</SelectItem>
                  <SelectItem value="8">Agosto</SelectItem>
                  <SelectItem value="9">Settembre</SelectItem>
                  <SelectItem value="10">Ottobre</SelectItem>
                  <SelectItem value="11">Novembre</SelectItem>
                  <SelectItem value="12">Dicembre</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Badge variant="outline" className="flex items-center gap-1" data-testid="badge-period">
              <Filter className="h-3 w-3" />
              {new Date(selectedYear, selectedMonth - 1).toLocaleDateString('it-IT', { month: 'long', year: 'numeric' })}
            </Badge>
          </div>
          
          <div className="mt-3 text-sm text-muted-foreground">
            <span>
              I dati mostrati (movimenti di magazzino, sprechi, pasti personali) si riferiscono al periodo selezionato. 
              Le quantità iniziali e finali sono sempre le più recenti.
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Inventory Grid */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Magazzino Editabile - VARIANZA = INIZIALE + IN - OUT - FINALE
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <div className="min-w-full">
              {/* Header */}
              <div className="grid grid-cols-7 gap-2 p-4 bg-muted/50 rounded-t-lg font-medium text-sm">
                <div className="col-span-2">Prodotto</div>
                <div className="text-center">Iniziale</div>
                <div className="text-center text-green-600">IN</div>
                <div className="text-center text-red-600">OUT</div>
                <div className="text-center">Finale</div>
                <div className="text-center">Varianza</div>
              </div>

              {/* Rows */}
              {inventoryRows.map((row) => (
                <div 
                  key={row.product.id} 
                  className="grid grid-cols-7 gap-2 p-4 border-b hover:bg-muted/25 transition-colors"
                  data-testid={`inventory-row-${row.product.id}`}
                >
                  {/* Product Info */}
                  <div className="col-span-2">
                    <div className="font-medium" data-testid={`product-name-${row.product.id}`}>
                      {row.product.name}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {row.product.code} • {row.product.unit}
                    </div>
                    <div className="flex gap-1 mt-1">
                      {!row.isEditing ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => startEditing(row.product.id, row)}
                          data-testid={`button-edit-${row.product.id}`}
                          className="h-6 text-xs"
                        >
                          <Edit2 className="h-3 w-3 mr-1" />
                          Modifica
                        </Button>
                      ) : (
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => saveEditing(row.product.id, row)}
                            data-testid={`button-save-${row.product.id}`}
                            className="h-6 text-xs text-green-600"
                            disabled={upsertEditableInventoryMutation.isPending || !isInputValid(row.product.id)}
                          >
                            <Save className="h-3 w-3 mr-1" />
                            {upsertEditableInventoryMutation.isPending ? "Salvando..." : "Salva"}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => cancelEditing(row.product.id)}
                            data-testid={`button-cancel-${row.product.id}`}
                            className="h-6 text-xs text-red-600"
                            disabled={upsertEditableInventoryMutation.isPending}
                          >
                            <X className="h-3 w-3 mr-1" />
                            Annulla
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Iniziale (Editable) */}
                  <div className="text-center" data-testid={`initial-${row.product.id}`}>
                    {row.isEditing ? (
                      <div className="space-y-1">
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={row.editValues.initialQuantity}
                          onChange={(e) => updateEditValue(row.product.id, 'initialQuantity', e.target.value)}
                          onBlur={() => handleInputBlur(row.product.id, 'initialQuantity')}
                          className={`w-20 text-center font-mono text-sm bg-yellow-100 dark:bg-yellow-900/30 ${
                            row.validationErrors.initialQuantity ? 'border-red-500' : ''
                          }`}
                          placeholder="0.00"
                          data-testid={`input-initial-${row.product.id}`}
                        />
                        {row.validationErrors.initialQuantity && (
                          <div className="text-xs text-red-500" data-testid={`error-initial-${row.product.id}`}>
                            {row.validationErrors.initialQuantity}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="font-mono">{row.initialQuantity.toFixed(2)}</div>
                    )}
                  </div>

                  {/* IN (Calculated) */}
                  <div className="text-center" data-testid={`in-${row.product.id}`}>
                    <div className="font-mono text-green-600 flex items-center justify-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      {row.inQuantity.toFixed(2)}
                    </div>
                  </div>

                  {/* OUT (Calculated - Aggregated) */}
                  <div className="text-center" data-testid={`out-${row.product.id}`}>
                    <div className="font-mono text-red-600 flex items-center justify-center gap-1">
                      <TrendingDown className="h-3 w-3" />
                      {row.outQuantity.toFixed(2)}
                    </div>
                  </div>

                  {/* Finale (Editable) */}
                  <div className="text-center" data-testid={`final-${row.product.id}`}>
                    {row.isEditing ? (
                      <div className="space-y-1">
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={row.editValues.finalQuantity}
                          onChange={(e) => updateEditValue(row.product.id, 'finalQuantity', e.target.value)}
                          onBlur={() => handleInputBlur(row.product.id, 'finalQuantity')}
                          className={`w-20 text-center font-mono text-sm bg-yellow-100 dark:bg-yellow-900/30 ${
                            row.validationErrors.finalQuantity ? 'border-red-500' : ''
                          }`}
                          placeholder="0.00"
                          data-testid={`input-final-${row.product.id}`}
                        />
                        {row.validationErrors.finalQuantity && (
                          <div className="text-xs text-red-500" data-testid={`error-final-${row.product.id}`}>
                            {row.validationErrors.finalQuantity}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div>
                        <div className="font-mono font-semibold">{row.finalQuantity.toFixed(2)}</div>
                        <div className="text-xs text-muted-foreground">
                          €{(row.finalQuantity * row.product.pricePerUnit).toFixed(2)}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Varianza (Calculated) */}
                  <div className="text-center" data-testid={`variance-${row.product.id}`}>
                    <div className={`font-mono font-semibold flex items-center justify-center gap-1 ${getVarianceColor(row.variance)}`}>
                      {row.variance > 0 ? <TrendingUp className="h-3 w-3" /> : 
                       row.variance < 0 ? <TrendingDown className="h-3 w-3" /> : null}
                      {row.variance >= 0 ? '+' : ''}{row.variance.toFixed(2)}
                    </div>
                    <div className={`text-xs ${getVarianceColor(row.variance)}`}>
                      €{row.variance >= 0 ? `-${(row.variance * row.product.pricePerUnit).toFixed(2)}` : `+${Math.abs(row.variance * row.product.pricePerUnit).toFixed(2)}`}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}