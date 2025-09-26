import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { BarChart3, PieChart as PieChartIcon, Percent, Euro, TrendingUp, Filter, X } from "lucide-react";
import { type Dish } from "@shared/schema";

interface SalesChartProps {
  dishes: Dish[];
}

interface FilterState {
  nameFilter: string;
  minRevenue: string;
  maxRevenue: string;
  minQuantity: string;
  maxQuantity: string;
  sortBy: "name" | "revenue" | "quantity" | "percentage";
  sortOrder: "asc" | "desc";
}

interface SalesDataItem {
  id: string;
  name: string;
  quantity: number;
  revenue: number;
  cost: number;
  profit: number;
  revenuePercentage: number;
  quantityPercentage: number;
  unitPrice: number;
  foodCost: number;
  filteredRevenuePercentage?: number;
  filteredQuantityPercentage?: number;
}

const CHART_COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

export default function SalesChart({ dishes }: SalesChartProps) {
  const [chartType, setChartType] = useState<"bar" | "pie">("bar");
  const [filters, setFilters] = useState<FilterState>({
    nameFilter: "",
    minRevenue: "",
    maxRevenue: "",
    minQuantity: "",
    maxQuantity: "",
    sortBy: "revenue",
    sortOrder: "desc",
  });

  // Sales data now tracked separately in the Sales section
  const salesData = useMemo((): SalesDataItem[] => {
    // TODO: Replace with data from sales table
    return [];
  }, [dishes]);

  // Applica filtri e ricalcola percentuali sui dati filtrati
  const filteredData = useMemo((): SalesDataItem[] => {
    let filtered = salesData.filter(item => {
      const nameMatch = !filters.nameFilter || 
        item.name.toLowerCase().includes(filters.nameFilter.toLowerCase());
      
      const revenueMin = filters.minRevenue ? parseFloat(filters.minRevenue) : -Infinity;
      const revenueMax = filters.maxRevenue ? parseFloat(filters.maxRevenue) : Infinity;
      const revenueMatch = item.revenue >= revenueMin && item.revenue <= revenueMax;
      
      const quantityMin = filters.minQuantity ? parseInt(filters.minQuantity) : -Infinity;
      const quantityMax = filters.maxQuantity ? parseInt(filters.maxQuantity) : Infinity;
      const quantityMatch = item.quantity >= quantityMin && item.quantity <= quantityMax;
      
      return nameMatch && revenueMatch && quantityMatch;
    });
    
    // Ricalcola percentuali sui dati filtrati per grafici accurati
    const filteredTotalRevenue = filtered.reduce((sum, item) => sum + item.revenue, 0);
    const filteredTotalQuantity = filtered.reduce((sum, item) => sum + item.quantity, 0);
    
    filtered = filtered.map(item => ({
      ...item,
      filteredRevenuePercentage: filteredTotalRevenue > 0 ? (item.revenue / filteredTotalRevenue) * 100 : 0,
      filteredQuantityPercentage: filteredTotalQuantity > 0 ? (item.quantity / filteredTotalQuantity) * 100 : 0,
    }));

    // Applica ordinamento
    filtered.sort((a, b) => {
      let aValue: number, bValue: number;
      
      switch (filters.sortBy) {
        case "name":
          return filters.sortOrder === "asc" 
            ? a.name.localeCompare(b.name)
            : b.name.localeCompare(a.name);
        case "revenue":
          aValue = a.revenue;
          bValue = b.revenue;
          break;
        case "quantity":
          aValue = a.quantity;
          bValue = b.quantity;
          break;
        case "percentage":
          aValue = a.filteredRevenuePercentage || a.revenuePercentage;
          bValue = b.filteredRevenuePercentage || b.revenuePercentage;
          break;
        default:
          aValue = a.revenue;
          bValue = b.revenue;
      }
      
      return filters.sortOrder === "asc" ? aValue - bValue : bValue - aValue;
    });
    
    return filtered;
  }, [salesData, filters]);

  const clearFilters = () => {
    setFilters({
      nameFilter: "",
      minRevenue: "",
      maxRevenue: "",
      minQuantity: "",
      maxQuantity: "",
      sortBy: "revenue",
      sortOrder: "desc",
    });
  };

  const hasActiveFilters = filters.nameFilter || filters.minRevenue || filters.maxRevenue || 
                          filters.minQuantity || filters.maxQuantity || 
                          filters.sortBy !== "revenue" || filters.sortOrder !== "desc";

  // Tooltip personalizzato
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border border-border rounded-md p-3 shadow-lg">
          <h4 className="font-semibold text-sm">{data.name}</h4>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span>Quantità:</span>
              <span className="font-mono font-medium">{data.quantity}</span>
            </div>
            <div className="flex justify-between">
              <span>Ricavo:</span>
              <span className="font-mono font-medium text-chart-2">€{data.revenue.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Costo:</span>
              <span className="font-mono font-medium text-destructive">€{data.cost.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Profitto:</span>
              <span className={`font-mono font-medium ${data.profit >= 0 ? 'text-chart-2' : 'text-destructive'}`}>
                €{data.profit.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between">
              <span>% Ricavo (filtrato):</span>
              <span className="font-mono font-medium">{(data.filteredRevenuePercentage || data.revenuePercentage).toFixed(1)}%</span>
            </div>
            <div className="flex justify-between">
              <span>% Ricavo (totale):</span>
              <span className="font-mono font-medium text-muted-foreground">{data.revenuePercentage.toFixed(1)}%</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  if (salesData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Dettaglio Vendite
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nessun piatto venduto ancora</p>
            <p className="text-sm">I dati delle vendite appariranno qui quando ci saranno piatti venduti</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Controlli grafici */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Dettaglio Vendite
            </div>
            <div className="flex gap-2">
              <Button
                variant={chartType === "bar" ? "default" : "outline"}
                size="sm"
                onClick={() => setChartType("bar")}
                data-testid="button-bar-chart"
              >
                <BarChart3 className="h-4 w-4 mr-1" />
                Istogramma
              </Button>
              <Button
                variant={chartType === "pie" ? "default" : "outline"}
                size="sm"
                onClick={() => setChartType("pie")}
                data-testid="button-pie-chart"
              >
                <PieChartIcon className="h-4 w-4 mr-1" />
                Torta
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Filtri */}
          <div className="mb-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                <Label className="text-sm font-medium">Filtri</Label>
                {hasActiveFilters && (
                  <Badge variant="secondary" className="text-xs">
                    {filteredData.length} di {salesData.length}
                  </Badge>
                )}
              </div>
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="text-muted-foreground hover:text-foreground"
                  data-testid="button-clear-filters"
                >
                  <X className="h-4 w-4 mr-1" />
                  Pulisci
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              <div className="space-y-2">
                <Label className="text-xs">Nome Piatto</Label>
                <Input
                  placeholder="Cerca per nome..."
                  value={filters.nameFilter}
                  onChange={(e) => setFilters(prev => ({ ...prev, nameFilter: e.target.value }))}
                  className="h-8 text-sm"
                  data-testid="input-name-filter"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Ricavo Min (€)</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={filters.minRevenue}
                  onChange={(e) => setFilters(prev => ({ ...prev, minRevenue: e.target.value }))}
                  className="h-8 text-sm"
                  data-testid="input-min-revenue"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Ricavo Max (€)</Label>
                <Input
                  type="number"
                  placeholder="999"
                  value={filters.maxRevenue}
                  onChange={(e) => setFilters(prev => ({ ...prev, maxRevenue: e.target.value }))}
                  className="h-8 text-sm"
                  data-testid="input-max-revenue"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Quantità Min</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={filters.minQuantity}
                  onChange={(e) => setFilters(prev => ({ ...prev, minQuantity: e.target.value }))}
                  className="h-8 text-sm"
                  data-testid="input-min-quantity"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Quantità Max</Label>
                <Input
                  type="number"
                  placeholder="999"
                  value={filters.maxQuantity}
                  onChange={(e) => setFilters(prev => ({ ...prev, maxQuantity: e.target.value }))}
                  className="h-8 text-sm"
                  data-testid="input-max-quantity"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Ordina per</Label>
                <Select
                  value={`${filters.sortBy}-${filters.sortOrder}`}
                  onValueChange={(value) => {
                    const [sortBy, sortOrder] = value.split('-') as [FilterState['sortBy'], FilterState['sortOrder']];
                    setFilters(prev => ({ ...prev, sortBy, sortOrder }));
                  }}
                >
                  <SelectTrigger className="h-8 text-sm" data-testid="select-sort">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="revenue-desc">Ricavo (Alto-Basso)</SelectItem>
                    <SelectItem value="revenue-asc">Ricavo (Basso-Alto)</SelectItem>
                    <SelectItem value="quantity-desc">Quantità (Alto-Basso)</SelectItem>
                    <SelectItem value="quantity-asc">Quantità (Basso-Alto)</SelectItem>
                    <SelectItem value="percentage-desc">% Ricavo (Alto-Basso)</SelectItem>
                    <SelectItem value="percentage-asc">% Ricavo (Basso-Alto)</SelectItem>
                    <SelectItem value="name-asc">Nome (A-Z)</SelectItem>
                    <SelectItem value="name-desc">Nome (Z-A)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Grafico */}
          <div className="h-[400px] w-full">
            {chartType === "bar" ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={filteredData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis 
                    dataKey="name" 
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    className="text-xs"
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis className="text-xs" tick={{ fontSize: 12 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar 
                    dataKey="revenue" 
                    fill="hsl(var(--chart-2))" 
                    name="Ricavo (€)"
                    radius={[2, 2, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={filteredData}
                    dataKey="filteredRevenuePercentage"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={120}
                    label={({ name, filteredRevenuePercentage }) => 
                      `${name}: ${filteredRevenuePercentage.toFixed(1)}%`
                    }
                  >
                    {filteredData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={CHART_COLORS[index % CHART_COLORS.length]} 
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tabella dettagliata */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Dettaglio Vendite per Piatto</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-2 text-sm font-medium">Piatto</th>
                  <th className="text-right py-2 px-2 text-sm font-medium">Quantità</th>
                  <th className="text-right py-2 px-2 text-sm font-medium">Ricavo €</th>
                  <th className="text-right py-2 px-2 text-sm font-medium">Costo €</th>
                  <th className="text-right py-2 px-2 text-sm font-medium">Profitto €</th>
                  <th className="text-right py-2 px-2 text-sm font-medium">% Ricavo</th>
                  <th className="text-right py-2 px-2 text-sm font-medium">% Quantità</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((item) => (
                  <tr key={item.id} className="border-b hover:bg-muted/30" data-testid={`row-dish-${item.id}`}>
                    <td className="py-3 px-2">
                      <div>
                        <span className="font-medium text-sm">{item.name}</span>
                        <div className="text-xs text-muted-foreground">
                          €{item.unitPrice.toFixed(2)}/pezzo • FC: {item.foodCost.toFixed(1)}%
                        </div>
                      </div>
                    </td>
                    <td className="text-right py-3 px-2 font-mono text-sm">{item.quantity}</td>
                    <td className="text-right py-3 px-2 font-mono text-sm text-chart-2">€{item.revenue.toFixed(2)}</td>
                    <td className="text-right py-3 px-2 font-mono text-sm text-destructive">€{item.cost.toFixed(2)}</td>
                    <td className={`text-right py-3 px-2 font-mono text-sm ${item.profit >= 0 ? 'text-chart-2' : 'text-destructive'}`}>
                      €{item.profit.toFixed(2)}
                    </td>
                    <td className="text-right py-3 px-2">
                      <Badge variant="secondary" className="font-mono text-xs">
                        {(item.filteredRevenuePercentage || item.revenuePercentage).toFixed(1)}%
                      </Badge>
                    </td>
                    <td className="text-right py-3 px-2">
                      <Badge variant="outline" className="font-mono text-xs">
                        {(item.filteredQuantityPercentage || item.quantityPercentage).toFixed(1)}%
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}