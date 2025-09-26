import { type Dish, type Product, type Waste, type PersonalMeal } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, DollarSign, AlertTriangle, Users, Info, Calendar } from "lucide-react";
import { useSales } from "@/hooks/useApi";
import { useMemo, useState, useEffect } from "react";

interface SalesSummaryProps {
  dishes: Dish[];
  products: Product[];
  waste: Waste[];
  personalMeals: PersonalMeal[];
  maxFoodCost?: number;
  onMaxFoodCostChange?: (value: number) => void;
  showSalesDetails?: boolean;
}

export default function SalesSummary({ 
  dishes, 
  products, 
  waste, 
  personalMeals, 
  maxFoodCost = 30,
  onMaxFoodCostChange,
  showSalesDetails = true 
}: SalesSummaryProps) {
  
  // Read selected year and month from localStorage (same as Dashboard)
  const [selectedYear, setSelectedYear] = useState(() => {
    const saved = localStorage.getItem('foodyflow-selected-year');
    return saved ? parseInt(saved) : new Date().getFullYear();
  });
  
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const saved = localStorage.getItem('foodyflow-selected-month');
    return saved ? parseInt(saved) : new Date().getMonth() + 1;
  });

  // Update localStorage when values change
  useEffect(() => {
    localStorage.setItem('foodyflow-selected-year', selectedYear.toString());
  }, [selectedYear]);

  useEffect(() => {
    localStorage.setItem('foodyflow-selected-month', selectedMonth.toString());
  }, [selectedMonth]);
  
  // Fetch sales data
  const { data: allSalesData = [] } = useSales();
  
  // Filter sales data by selected month/year
  const filteredSalesData = useMemo(() => {
    return allSalesData.filter(sale => {
      const saleDate = new Date(sale.saleDate);
      return saleDate.getFullYear() === selectedYear && 
             saleDate.getMonth() + 1 === selectedMonth;
    });
  }, [allSalesData, selectedYear, selectedMonth]);
  
  // Calculate totals from filtered sales data
  const { totalCostOfSales, totalGrossSales, totalNetSales } = useMemo(() => {
    const totalCost = filteredSalesData.reduce((sum, sale) => sum + sale.totalCost, 0);
    const totalNetRevenue = filteredSalesData.reduce((sum, sale) => sum + sale.totalRevenue, 0);
    // Gross sales = net revenue + 10% (IVA)
    const totalGrossRevenue = totalNetRevenue * 1.10;
    return {
      totalCostOfSales: totalCost,
      totalGrossSales: totalGrossRevenue,
      totalNetSales: totalNetRevenue
    };
  }, [filteredSalesData]);
  
  // Filter waste and personal meals by selected month/year (same as sales)
  const filteredWaste = useMemo(() => {
    return waste.filter(w => {
      const wasteDate = new Date(w.date);
      return wasteDate.getFullYear() === selectedYear && 
             wasteDate.getMonth() + 1 === selectedMonth;
    });
  }, [waste, selectedYear, selectedMonth]);

  const filteredPersonalMeals = useMemo(() => {
    return personalMeals.filter(pm => {
      const mealDate = new Date(pm.date);
      return mealDate.getFullYear() === selectedYear && 
             mealDate.getMonth() + 1 === selectedMonth;
    });
  }, [personalMeals, selectedYear, selectedMonth]);

  const totalWasteCost = filteredWaste.reduce((sum, w) => sum + w.cost, 0);
  const totalPersonalMealsCost = filteredPersonalMeals.reduce((sum, pm) => sum + pm.cost, 0);
  
  // Calculate weighted food cost
  const weightedFoodCost = totalNetSales > 0 ? (totalCostOfSales / totalNetSales) * 100 : 0;
  const isOverThreshold = weightedFoodCost > maxFoodCost;

  const handleMaxFoodCostChange = (value: string) => {
    const numValue = Math.max(0, Math.min(100, parseFloat(value) || 0));
    console.log("Max food cost changed:", numValue);
    onMaxFoodCostChange?.(numValue);
  };

  // Month names in Italian
  const monthNames = [
    "Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno",
    "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"
  ];

  return (
    <div className="space-y-6">
      {/* Month Reference Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            <span className="text-lg font-semibold">Food Cost - Mese di Riferimento:</span>
            <Badge variant="secondary" className="text-lg px-3 py-1">
              {monthNames[selectedMonth - 1]} {selectedYear}
            </Badge>
          </div>
          <p className="text-center text-sm text-muted-foreground mt-2">
            I dati mostrati si riferiscono al mese selezionato nella dashboard
          </p>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Riepilogo Generale
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-4">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-destructive" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Costo Totale Materiali
                  </p>
                  <p className="text-xl font-bold text-destructive font-mono">
                    €{totalCostOfSales.toFixed(1)}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Ricavo Totale
                  </p>
                  <p className="text-sm font-bold text-primary font-mono">
                    €{totalGrossSales.toFixed(1)} / €{totalNetSales.toFixed(1)}
                  </p>
                  <p className="text-xs text-muted-foreground">Lordo / Netto</p>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Totale Sprechi
                  </p>
                  <p className="text-xl font-bold text-destructive font-mono">
                    €{totalWasteCost.toFixed(1)}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-destructive" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Totale Pasti Personali
                  </p>
                  <p className="text-xl font-bold text-destructive font-mono">
                    €{totalPersonalMealsCost.toFixed(1)}
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Food Cost Analysis */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="maxFoodCost">Soglia Food Cost</Label>
              <div className="relative mt-1">
                <Input
                  id="maxFoodCost"
                  type="number"
                  min="0"
                  max="100"
                  value={maxFoodCost}
                  onChange={(e) => handleMaxFoodCostChange(e.target.value)}
                  className="pr-8"
                  data-testid="input-max-food-cost"
                />
                <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground font-medium">
                  %
                </span>
              </div>
            </div>

            <Card className={`p-4 ${isOverThreshold ? 'bg-destructive/10 border-destructive' : 'bg-chart-2/10 border-chart-2'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-foreground">
                    Food Cost Teorico Ponderato:
                  </span>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5 p-0 hover:bg-transparent"
                          data-testid="button-food-cost-info"
                        >
                          <Info className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-md p-4">
                        <div className="space-y-3 text-sm">
                          <p>
                            Il <strong>Food Cost Teorico</strong>, noto anche come Food Cost Preventivo o Attivo, rappresenta il costo ideale che un'attività di ristorazione dovrebbe sostenere per la preparazione di un singolo piatto in condizioni perfette e senza sprechi. A differenza del costo reale, che si calcola a consuntivo, quello teorico viene stabilito in via preventiva, prima che il piatto venga preparato.
                          </p>
                          <p>
                            Questo calcolo si basa su ricette analitiche e standardizzate, che specificano con precisione la quantità esatta di ogni ingrediente e il suo costo unitario. L'obiettivo è creare una "distinta base" che elenchi tutti i componenti necessari per una porzione standard, eliminando la gestione a "occhio".
                          </p>
                          <div>
                            <p className="font-medium mb-2">Il valore che si ottiene è un benchmark che serve a:</p>
                            <ul className="list-disc list-inside space-y-1 pl-2">
                              <li><strong>Determinare il prezzo di vendita</strong>: fornisce una base razionale per definire un prezzo che assicuri il margine di profitto desiderato.</li>
                              <li><strong>Misurare l'efficienza</strong>: viene confrontato con il Food Cost Consuntivo (o reale) per individuare perdite di profitto dovute a sprechi, porzionamento impreciso o altri problemi operativi.</li>
                            </ul>
                          </div>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <span className={`text-2xl font-bold font-mono ${isOverThreshold ? 'text-destructive' : 'text-chart-2'}`}>
                  {weightedFoodCost.toFixed(1)}%
                </span>
              </div>
              {isOverThreshold && (
                <p className="text-sm text-destructive mt-2">
                  ⚠️ Il food cost supera la soglia impostata del {maxFoodCost}%
                </p>
              )}
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Sales Breakdown - TODO: Update to use sales table data */}
      {showSalesDetails && false && (
        <Card>
          <CardHeader>
            <CardTitle>Dettaglio Vendite</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <p className="text-center text-muted-foreground italic">
                Le vendite sono ora gestite nella sezione dedicata "Vendite".
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}