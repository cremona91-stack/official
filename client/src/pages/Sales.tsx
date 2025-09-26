import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { TrendingUp, ShoppingCart, Plus, Save, Edit, Trash2, Euro, Package, Rocket, Calendar, Filter } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  useSales,
  useDishes,
  useCreateSale,
  useUpdateSale,
  useDeleteSale,
} from "@/hooks/useApi";
import type { Sales, Dish, InsertSales } from "@shared/schema";
import { insertSalesSchema } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export default function Sales() {
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [savingDishId, setSavingDishId] = useState<string | null>(null);
  const [editingSale, setEditingSale] = useState<Sales | undefined>();
  const [showForm, setShowForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [dateFromFilter, setDateFromFilter] = useState<string>('');
  const [dateToFilter, setDateToFilter] = useState<string>('');
  const { toast } = useToast();

  // Data fetching
  const { data: sales = [], isLoading: salesLoading } = useSales();
  const { data: dishes = [], isLoading: dishesLoading, isError: dishesError } = useDishes();

  // Mutations
  const createSaleMutation = useCreateSale();
  const updateSaleMutation = useUpdateSale();
  const deleteSaleMutation = useDeleteSale();

  // Form setup
  const form = useForm<InsertSales>({
    resolver: zodResolver(insertSalesSchema),
    defaultValues: {
      dishId: "",
      dishName: "",
      quantitySold: 1,
      unitCost: 0,
      unitRevenue: 0,
      saleDate: selectedDate,
      notes: "",
    },
  });

  // Filter sales based on date range filter
  const filteredSales = sales.filter(sale => {
    // If no filters are set, show all sales
    if (!dateFromFilter && !dateToFilter) return true;
    
    const saleDate = new Date(sale.saleDate);
    const fromDate = dateFromFilter ? new Date(dateFromFilter) : null;
    const toDate = dateToFilter ? new Date(dateToFilter) : null;
    
    // If only "from" date is set
    if (fromDate && !toDate) {
      return saleDate >= fromDate;
    }
    
    // If only "to" date is set
    if (!fromDate && toDate) {
      return saleDate <= toDate;
    }
    
    // If both dates are set
    if (fromDate && toDate) {
      return saleDate >= fromDate && saleDate <= toDate;
    }
    
    return true;
  });

  // Smart quantity handlers
  const handleQuantityChange = (dishId: string, quantity: number) => {
    setQuantities(prev => ({
      ...prev,
      [dishId]: quantity
    }));
  };

  const handleQuickSave = (dish: Dish, quantity: number) => {
    if (quantity <= 0) {
      toast({
        title: "Errore",
        description: "La quantità deve essere maggiore di 0",
        variant: "destructive"
      });
      return;
    }

    setSavingDishId(dish.id);

    const saleData: InsertSales = {
      dishId: dish.id,
      dishName: dish.name,
      quantitySold: quantity,
      unitCost: dish.totalCost,
      unitRevenue: dish.netPrice,
      saleDate: selectedDate,
      notes: `Vendita rapida del ${new Date(selectedDate).toLocaleDateString()}`
    };

    createSaleMutation.mutate(saleData, {
      onSuccess: () => {
        setQuantities(prev => ({ ...prev, [dish.id]: 0 }));
        setSavingDishId(null);
        toast({
          title: "Vendita registrata",
          description: `${quantity} ${dish.name} venduti con successo`
        });
      },
      onError: () => {
        setSavingDishId(null);
        toast({
          title: "Errore",
          description: "Errore nel salvataggio della vendita",
          variant: "destructive"
        });
      }
    });
  };

  // Original form handlers for advanced editing
  const handleCreateSale = (data: InsertSales) => {
    createSaleMutation.mutate(data);
    setShowForm(false);
    form.reset();
  };

  const handleUpdateSale = (data: InsertSales) => {
    if (editingSale) {
      updateSaleMutation.mutate({ 
        id: editingSale.id, 
        data: {
          ...data,
          notes: data.notes || undefined
        }
      });
      setEditingSale(undefined);
      setShowForm(false);
      form.reset();
    }
  };

  const handleDeleteSale = (id: string) => {
    deleteSaleMutation.mutate(id);
  };

  const handleEdit = (sale: Sales) => {
    setEditingSale(sale);
    setShowForm(true);
    form.reset({
      dishId: sale.dishId,
      dishName: sale.dishName,
      quantitySold: sale.quantitySold,
      unitCost: sale.unitCost,
      unitRevenue: sale.unitRevenue,
      saleDate: sale.saleDate,
      notes: sale.notes || "",
    });
  };

  const handleDishSelect = (dishId: string) => {
    const selectedDish = dishes.find(d => d.id === dishId);
    if (selectedDish) {
      form.setValue("dishName", selectedDish.name);
      form.setValue("unitCost", selectedDish.totalCost);
      form.setValue("unitRevenue", selectedDish.netPrice);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingSale(undefined);
    form.reset();
  };

  // Calculate totals based on filtered or all sales
  const salesForCalculation = (dateFromFilter || dateToFilter) ? filteredSales : sales;
  const totalQuantitySold = salesForCalculation.reduce((sum, sale) => sum + sale.quantitySold, 0);
  const totalCostOfSales = salesForCalculation.reduce((sum, sale) => sum + sale.totalCost, 0);
  const totalRevenue = salesForCalculation.reduce((sum, sale) => sum + sale.totalRevenue, 0);
  const totalProfit = totalRevenue - totalCostOfSales;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header and Summary */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <ShoppingCart className="h-8 w-8 text-primary" />
          Vendite
        </h1>
        <p className="text-muted-foreground">
          Gestisci le vendite dei piatti e monitora le performance
        </p>
      </div>

      {/* Date Filters Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-primary" />
            Filtri Data
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="selectedDate" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Data di Riferimento per Inserimento
              </Label>
              <Input
                id="selectedDate"
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  form.setValue("saleDate", e.target.value);
                }}
                data-testid="input-selected-date"
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                Data che verrà utilizzata per le nuove vendite inserite rapidamente
              </p>
            </div>
            
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Filtra Vendite per Periodo
              </Label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="dateFromFilter" className="text-xs text-muted-foreground">
                    DA
                  </Label>
                  <Input
                    id="dateFromFilter"
                    type="date"
                    value={dateFromFilter}
                    onChange={(e) => setDateFromFilter(e.target.value)}
                    data-testid="input-date-from-filter"
                    className="w-full"
                  />
                </div>
                <div>
                  <Label htmlFor="dateToFilter" className="text-xs text-muted-foreground">
                    A
                  </Label>
                  <Input
                    id="dateToFilter"
                    type="date"
                    value={dateToFilter}
                    onChange={(e) => setDateToFilter(e.target.value)}
                    data-testid="input-date-to-filter"
                    className="w-full"
                  />
                </div>
              </div>
              {(dateFromFilter || dateToFilter) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setDateFromFilter('');
                    setDateToFilter('');
                  }}
                  data-testid="button-clear-date-filters"
                  className="w-full"
                >
                  Mostra Tutto
                </Button>
              )}
              <p className="text-xs text-muted-foreground">
                Imposta DA e/o A per filtrare le vendite per periodo
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Smart Quick Sales Grid */}
      {dishesLoading && (
        <Card>
          <CardContent className="text-center py-12">
            <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-muted-foreground">Caricamento piatti...</p>
          </CardContent>
        </Card>
      )}

      {dishesError && (
        <Card>
          <CardContent className="text-center py-12">
            <Package className="h-12 w-12 mx-auto text-destructive mb-4" />
            <h3 className="text-lg font-semibold mb-2">Errore nel caricamento</h3>
            <p className="text-muted-foreground mb-4">
              Non è stato possibile caricare i piatti. Riprova più tardi.
            </p>
          </CardContent>
        </Card>
      )}

      {!dishesLoading && !dishesError && dishes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Rocket className="h-5 w-5" />
              Inserimento Rapido Vendite
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Inserisci la quantità venduta per ogni piatto
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {dishes.map((dish) => {
                const profit = dish.netPrice - dish.totalCost;
                const margin = dish.netPrice > 0 ? (profit / dish.netPrice * 100) : 0;
                
                return (
                  <div key={dish.id} className="flex items-center gap-3 p-2 rounded-md bg-muted/30 hover-elevate text-sm">
                    {/* Nome Piatto */}
                    <div className="flex-1 font-medium truncate min-w-0">
                      {dish.name}
                    </div>
                    
                    {/* Costo */}
                    <div className="w-16 text-right font-mono text-muted-foreground">
                      €{dish.totalCost.toFixed(1)}
                    </div>
                    
                    {/* Ricavo */}
                    <div className="w-16 text-right font-mono">
                      €{dish.netPrice.toFixed(1)}
                    </div>
                    
                    {/* Profitto */}
                    <div className={`w-16 text-right font-mono ${
                      profit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-destructive'
                    }`}>
                      €{profit.toFixed(1)}
                    </div>
                    
                    {/* Margine */}
                    <div className="w-12 text-right font-mono text-xs">
                      {margin.toFixed(0)}%
                    </div>
                    
                    {/* Campo Quantità Editabile */}
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min="0"
                        max="999"
                        value={quantities[dish.id] || 0}
                        onChange={(e) => handleQuantityChange(dish.id, parseInt(e.target.value) || 0)}
                        className="w-16 h-8 text-center"
                        data-testid={`input-quantity-${dish.id}`}
                        placeholder="0"
                        disabled={savingDishId === dish.id}
                        onBlur={() => {
                          const qty = quantities[dish.id];
                          if (qty && qty > 0) {
                            handleQuickSave(dish, qty);
                          }
                        }}
                      />
                      {savingDishId === dish.id && (
                        <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {!dishesLoading && !dishesError && dishes.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nessun piatto disponibile</h3>
            <p className="text-muted-foreground mb-4">
              Crea prima dei piatti nella sezione "Ricette" per poter registrare delle vendite.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-primary" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Unità Vendute
                </p>
                <p className="text-2xl font-bold font-mono">{totalQuantitySold}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Euro className="h-4 w-4 text-destructive" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Costo Totale
                </p>
                <p className="text-2xl font-bold font-mono">€{totalCostOfSales.toFixed(1)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Ricavo Totale
                </p>
                <p className="text-2xl font-bold font-mono">€{totalRevenue.toFixed(1)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-chart-2" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Profitto Totale
                </p>
                <p className={`text-2xl font-bold font-mono ${totalProfit >= 0 ? 'text-green-600' : 'text-destructive'}`}>
                  €{totalProfit.toFixed(1)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingSale ? "Modifica Vendita" : "Nuova Vendita"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(editingSale ? handleUpdateSale : handleCreateSale)}
                className="space-y-4"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="dishId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Piatto</FormLabel>
                        <FormControl>
                          <Select 
                            value={field.value} 
                            onValueChange={(value) => {
                              field.onChange(value);
                              handleDishSelect(value);
                            }}
                            data-testid="select-dish"
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Seleziona piatto" />
                            </SelectTrigger>
                            <SelectContent>
                              {dishes.map((dish) => (
                                <SelectItem key={dish.id} value={dish.id}>
                                  {dish.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="dishName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome Piatto</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-dish-name" readOnly />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="quantitySold"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quantità Venduta</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="1"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                            data-testid="input-quantity-sold"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="saleDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data Vendita</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} data-testid="input-sale-date" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="unitCost"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Costo Unitario (€)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            data-testid="input-unit-cost"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="unitRevenue"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ricavo Unitario (€)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            data-testid="input-unit-revenue"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Note (opzionale)</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field}
                          value={field.value ?? ""}
                          data-testid="textarea-notes" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex gap-2">
                  <Button
                    type="submit"
                    disabled={createSaleMutation.isPending || updateSaleMutation.isPending}
                    data-testid="button-submit-sale"
                  >
                    {editingSale ? "Aggiorna" : "Crea"} Vendita
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancel}
                    data-testid="button-cancel-sale"
                  >
                    Annulla
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}

      {/* Sales List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Vendite Registrate
          </CardTitle>
        </CardHeader>
        <CardContent>
          {salesLoading ? (
            <p className="text-center text-muted-foreground">Caricamento vendite...</p>
          ) : (
            <>
              {(dateFromFilter || dateToFilter) && (
                <div className="mb-4 p-3 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    {dateFromFilter && dateToFilter && (
                      <>Mostrando vendite dal {new Date(dateFromFilter).toLocaleDateString()} al {new Date(dateToFilter).toLocaleDateString()}</>
                    )}
                    {dateFromFilter && !dateToFilter && (
                      <>Mostrando vendite dal {new Date(dateFromFilter).toLocaleDateString()} in poi</>
                    )}
                    {!dateFromFilter && dateToFilter && (
                      <>Mostrando vendite fino al {new Date(dateToFilter).toLocaleDateString()}</>
                    )}
                  </p>
                  <Badge variant="secondary" className="mt-2">
                    {filteredSales.length} di {sales.length} vendite
                  </Badge>
                </div>
              )}
              {!dateFromFilter && !dateToFilter && sales.length > 0 && (
                <div className="mb-4 p-3 bg-muted rounded-lg">
                  <Badge variant="secondary">
                    Totale: {sales.length} vendite
                  </Badge>
                </div>
              )}
              {((dateFromFilter || dateToFilter) ? filteredSales : sales).length === 0 ? (
                <p className="text-center text-muted-foreground italic">
                  {(dateFromFilter || dateToFilter) ? `Nessuna vendita registrata per il periodo selezionato` : "Nessuna vendita ancora registrata."}
                </p>
              ) : (
                <div className="space-y-3">
                  {((dateFromFilter || dateToFilter) ? filteredSales : sales).map((sale) => (
                <div
                  key={sale.id}
                  className="flex justify-between items-center p-4 bg-muted rounded-lg hover-elevate"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-semibold">{sale.dishName}</span>
                      <Badge variant="outline">x{sale.quantitySold}</Badge>
                      <Badge variant="secondary" className="text-xs">
                        {sale.saleDate}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Costo Tot:</span>{" "}
                        <span className="font-mono">€{sale.totalCost.toFixed(1)}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Ricavo Tot:</span>{" "}
                        <span className="font-mono">€{sale.totalRevenue.toFixed(1)}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Profitto:</span>{" "}
                        <span className={`font-mono ${(sale.totalRevenue - sale.totalCost) >= 0 ? 'text-green-600' : 'text-destructive'}`}>
                          €{(sale.totalRevenue - sale.totalCost).toFixed(1)}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Margine:</span>{" "}
                        <span className="font-mono">
                          {sale.totalRevenue > 0 ? ((sale.totalRevenue - sale.totalCost) / sale.totalRevenue * 100).toFixed(1) : '0.0'}%
                        </span>
                      </div>
                    </div>
                    {sale.notes && (
                      <p className="text-sm text-muted-foreground mt-2">
                        {sale.notes}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleEdit(sale)}
                      data-testid={`button-edit-sale-${sale.id}`}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => handleDeleteSale(sale.id)}
                      data-testid={`button-delete-sale-${sale.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}