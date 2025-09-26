import { useMemo, useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  ChefHat, 
  Users, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Clock,
  Calculator,
  PieChart as PieChartIcon,
  Calendar
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";

// Types for dashboard data
import type { Product, Dish, Order, StockMovement, EconomicParameters, BudgetEntry, Sales } from "@shared/schema";
import { useSales } from "@/hooks/useApi";

// Chart colors for pie chart
const CHART_COLORS = [
  '#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1', 
  '#d084d0', '#ffb347', '#87ceeb', '#dda0dd', '#98fb98'
];

// Helper functions for date handling
const getWeekNumber = (date: Date) => {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
};

const getWeekStartEnd = (year: number, weekNumber: number) => {
  const firstDayOfYear = new Date(year, 0, 1);
  const daysToAdd = (weekNumber - 1) * 7 - firstDayOfYear.getDay() + 1;
  const weekStart = new Date(year, 0, 1 + daysToAdd);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  return { weekStart, weekEnd };
};

const formatDateForAPI = (date: Date) => {
  // Use local date to avoid timezone issues
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

interface DashboardProps {
  products: Product[];
  dishes: Dish[];
  orders: Order[];
  stockMovements: StockMovement[];
  inventorySnapshots: any[];
  editableInventory: any[];
  waste: any[];
  personalMeals: any[];
  onNavigateToSection: (section: string) => void;
}

interface KPICardProps {
  title: string;
  value: string;
  change?: number;
  changeLabel?: string | React.ReactNode;
  icon: React.ReactNode;
  trend?: "up" | "down" | "stable";
  status?: "good" | "warning" | "danger";
  onClick?: () => void;
}

function KPICard({ title, value, change, changeLabel, icon, trend, status = "good", onClick }: KPICardProps) {
  const getBadgeVariant = () => {
    // For change/differential: we'll use custom classes, not variants
    if (change !== undefined) {
      return "outline"; // Use outline as base, then override with custom classes
    }
    // For regular status
    switch (status) {
      case "good": return "default";
      case "warning": return "secondary";
      case "danger": return "destructive";
      default: return "default";
    }
  };

  const getChangeClasses = () => {
    if (change === undefined) return "";
    // Negative = green (good), Positive = red (bad)
    return change < 0 
      ? "!bg-green-100 dark:!bg-green-900 !text-green-800 dark:!text-green-200 !border-green-200 dark:!border-green-700"
      : "!bg-red-100 dark:!bg-red-900 !text-red-800 dark:!text-red-200 !border-red-200 dark:!border-red-700";
  };

  const getTrendIcon = () => {
    if (change === undefined) return null;
    return trend === "up" ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />;
  };

  return (
    <Card 
      className={`hover-elevate ${onClick ? 'cursor-pointer' : ''}`} 
      onClick={onClick}
      data-testid={`kpi-card-${title.toLowerCase().replace(/\s+/g, '-')}`}
    >
      <CardContent className="p-6">
        <div className="flex items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
          {icon}
        </div>
        <div className="flex items-center gap-2">
          <div className="text-2xl font-bold">{value}</div>
          {change !== undefined && (
            <Badge variant={getBadgeVariant()} className={`flex items-center gap-1 ${getChangeClasses()}`}>
              {getTrendIcon()}
              <span className="text-xs">
                {changeLabel ? changeLabel : `${change > 0 ? '+' : ''}${change.toFixed(1)}%`}
              </span>
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface PillarOverviewProps {
  title: string;
  description: string;
  currentValue: string;
  targetValue: string;
  progress: number;
  status: "good" | "warning" | "danger";
  icon: React.ReactNode;
  onExplore: () => void;
  isComingSoon?: boolean;
}

function PillarOverview({ 
  title, 
  description, 
  currentValue, 
  targetValue, 
  progress, 
  status, 
  icon, 
  onExplore,
  isComingSoon = false
}: PillarOverviewProps) {
  const getStatusColor = () => {
    switch (status) {
      case "good": return "text-green-600 dark:text-green-400";
      case "warning": return "text-yellow-600 dark:text-yellow-400";
      case "danger": return "text-red-600 dark:text-red-400";
    }
  };

  const getProgressColor = () => {
    switch (status) {
      case "good": return "bg-green-500";
      case "warning": return "bg-yellow-500";
      case "danger": return "bg-red-500";
    }
  };

  return (
    <Card className="hover-elevate">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg bg-muted ${getStatusColor()}`}>
            {icon}
          </div>
          <div>
            <CardTitle className="text-lg">{title}</CardTitle>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        </div>
        {isComingSoon && (
          <Badge variant="secondary" className="ml-2">
            <Clock className="h-3 w-3 mr-1" />
            In Sviluppo
          </Badge>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-2xl font-bold">{currentValue}</div>
            <div className="text-sm text-muted-foreground">Target: {targetValue}</div>
          </div>
          <div className="text-right">
            <div className={`text-sm font-medium ${getStatusColor()}`}>
              {progress}% del target
            </div>
          </div>
        </div>
        
        <div className="space-y-2">
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Attuale</span>
            <span>Target</span>
          </div>
        </div>

        <Button 
          onClick={onExplore} 
          className="w-full" 
          variant={isComingSoon ? "outline" : "default"}
          disabled={isComingSoon}
          data-testid={`button-explore-${title.toLowerCase().replace(/\s+/g, '-')}`}
        >
          {isComingSoon ? "Disponibile Presto" : `Esplora ${title}`}
        </Button>
      </CardContent>
    </Card>
  );
}

export function Dashboard({ 
  products, 
  dishes, 
  orders, 
  stockMovements, 
  inventorySnapshots,
  editableInventory,
  waste, 
  personalMeals, 
  onNavigateToSection 
}: DashboardProps) {
  // Time filter state
  const today = new Date();
  const [selectedYear, setSelectedYear] = useState(() => {
    const saved = localStorage.getItem('foodyflow-dashboard-year');
    return saved ? parseInt(saved) : today.getFullYear();
  });
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const saved = localStorage.getItem('foodyflow-dashboard-month');
    return saved ? parseInt(saved) : today.getMonth() + 1;
  });
  const [selectedWeek, setSelectedWeek] = useState(() => {
    const saved = localStorage.getItem('foodyflow-dashboard-week');
    return saved ? parseInt(saved) : getWeekNumber(today);
  });
  const [selectedDay, setSelectedDay] = useState(() => {
    const saved = localStorage.getItem('foodyflow-dashboard-day');
    if (saved) {
      // Parse date safely to avoid timezone issues
      const [year, month, day] = saved.split('-').map(Number);
      return new Date(year, month - 1, day);
    }
    return today;
  });
  const [timeFilter, setTimeFilter] = useState<'day' | 'week' | 'month'>(() => {
    const saved = localStorage.getItem('foodyflow-dashboard-timefilter');
    return (saved as 'day' | 'week' | 'month') || 'month';
  });

  // Persist filter state to localStorage
  useEffect(() => {
    localStorage.setItem('foodyflow-dashboard-year', selectedYear.toString());
    localStorage.setItem('foodyflow-dashboard-month', selectedMonth.toString());
    localStorage.setItem('foodyflow-dashboard-week', selectedWeek.toString());
    localStorage.setItem('foodyflow-dashboard-day', formatDateForAPI(selectedDay));
    localStorage.setItem('foodyflow-dashboard-timefilter', timeFilter);
  }, [selectedYear, selectedMonth, selectedWeek, selectedDay, timeFilter]);

  // Fetch sales data
  const { data: salesData = [] } = useSales();
  
  // Use dashboard selected time period for queries - align with active filter
  const { queryYear, queryMonth } = useMemo(() => {
    switch (timeFilter) {
      case 'day':
        return {
          queryYear: selectedDay.getFullYear(),
          queryMonth: selectedDay.getMonth() + 1
        };
      case 'week': {
        const { weekStart } = getWeekStartEnd(selectedYear, selectedWeek);
        return {
          queryYear: weekStart.getFullYear(),
          queryMonth: weekStart.getMonth() + 1
        };
      }
      case 'month':
      default:
        return {
          queryYear: selectedYear,
          queryMonth: selectedMonth
        };
    }
  }, [timeFilter, selectedDay, selectedYear, selectedWeek, selectedMonth]);

  // Fetch economic parameters for EBITDA calculation
  const { data: ecoParams } = useQuery({
    queryKey: ['/api/economic-parameters', queryYear, queryMonth],
    queryFn: async () => {
      const response = await fetch(`/api/economic-parameters/${queryYear}/${queryMonth}`);
      if (!response.ok) {
        return null; // Return null if not found instead of throwing
      }
      return response.json() as Promise<EconomicParameters>;
    },
    retry: false
  });

  // Query for food cost metrics (use dashboard selected period)
  const { data: foodCostMetrics } = useQuery({
    queryKey: ['/api/metrics/food-cost', queryYear, queryMonth]
  });

  // Fetch budget entries for corrispettivi calculation
  const { data: budgetEntries = [] } = useQuery({
    queryKey: ['/api/budget-entries', queryYear, queryMonth],
    queryFn: () => 
      fetch(`/api/budget-entries/${queryYear}/${queryMonth}`)
        .then(res => res.json()) as Promise<BudgetEntry[]>
  });

  // Create product lookup map for performance
  const productMap = useMemo(() => 
    new Map(products.map(p => [p.id, p])), 
    [products]
  );

  // Filter sales data based on selected time period
  const filteredSalesData = useMemo(() => {
    if (!salesData.length) return [];

    const filterDate = (saleDate: string) => {
      const sale = new Date(saleDate);
      
      switch (timeFilter) {
        case 'day':
          return sale.toDateString() === selectedDay.toDateString();
        
        case 'week': {
          const { weekStart, weekEnd } = getWeekStartEnd(selectedYear, selectedWeek);
          return sale >= weekStart && sale <= weekEnd;
        }
        
        case 'month':
          return sale.getFullYear() === selectedYear && 
                 sale.getMonth() + 1 === selectedMonth;
        
        default:
          return true;
      }
    };

    return salesData.filter(sale => filterDate(sale.saleDate));
  }, [salesData, timeFilter, selectedDay, selectedYear, selectedWeek, selectedMonth]);

  // Create sales map by dish ID for performance (using filtered data)
  const salesByDish = useMemo(() => {
    const salesMap = new Map<string, { totalQuantity: number; totalRevenue: number; totalCost: number }>();
    
    filteredSalesData.forEach(sale => {
      const existing = salesMap.get(sale.dishId) || { totalQuantity: 0, totalRevenue: 0, totalCost: 0 };
      salesMap.set(sale.dishId, {
        totalQuantity: existing.totalQuantity + sale.quantitySold,
        totalRevenue: existing.totalRevenue + sale.totalRevenue,
        totalCost: existing.totalCost + sale.totalCost
      });
    });
    
    return salesMap;
  }, [filteredSalesData]);
  
  // Calculate food cost metrics using the new formula: (totale iniziale + totale IN - totale finale)
  const { totalFoodSales, totalFoodCost, foodCostPercentage, theoreticalFoodCostPercentage, realVsTheoreticalDiff } = useMemo(() => {
    // Use sales data from the filtered sales table
    const sales = Array.from(salesByDish.values()).reduce((sum, dishSales) => sum + dishSales.totalRevenue, 0);
    
    // Calculate THEORETICAL food cost (based on recipes)
    const totalCostOfSales = Array.from(salesByDish.values()).reduce((sum, dishSales) => sum + dishSales.totalCost, 0);
    const theoreticalPercentage = sales > 0 ? (totalCostOfSales / sales) * 100 : 0;
    
    // Calculate REAL food cost according to formula: (totale iniziale magazzino + totale IN magazzino - totale finale magazzino)
    // Filter inventory and stock movements by selected period for accuracy
    
    // For day/week filters, disable real cost calculation or show warning
    let foodCostValue = 0;
    let realPercentage = 0;
    
    if (timeFilter === 'month') {
      // 1. Totale iniziale magazzino (from editableInventory - monthly data)
      const totaleInizialeM = editableInventory.reduce((sum, inventory) => {
        const product = productMap.get(inventory.productId);
        return sum + (product ? inventory.initialQuantity * product.pricePerUnit : 0);
      }, 0);
      
      // 2. Totale IN magazzino (from stockMovements with movementType = 'in' in selected month)
      const totaleInM = stockMovements
        .filter(movement => {
          if (movement.movementType !== 'in') return false;
          const movementDate = new Date(movement.movementDate);
          return movementDate.getFullYear() === queryYear && 
                 movementDate.getMonth() + 1 === queryMonth;
        })
        .reduce((sum, movement) => sum + (movement.totalCost || 0), 0);
      
      // 3. Totale finale magazzino (from editableInventory - monthly data)
      const totaleFinaleM = editableInventory.reduce((sum, inventory) => {
        const product = productMap.get(inventory.productId);
        return sum + (product ? inventory.finalQuantity * product.pricePerUnit : 0);
      }, 0);
      
      // REAL Food cost calculation (only for month view)
      foodCostValue = totaleInizialeM + totaleInM - totaleFinaleM;
      realPercentage = sales > 0 ? (foodCostValue / sales) * 100 : 0;
    } else {
      // For day/week: use theoretical cost as placeholder since inventory is monthly
      foodCostValue = totalCostOfSales;
      realPercentage = theoreticalPercentage;
    }
    
    // Calculate differential: Real - Theoretical
    const differential = realPercentage - theoreticalPercentage;
    
    return {
      totalFoodSales: sales,
      totalFoodCost: foodCostValue,
      foodCostPercentage: realPercentage,
      theoreticalFoodCostPercentage: theoreticalPercentage,
      realVsTheoreticalDiff: differential
    };
  }, [salesByDish, productMap, editableInventory, stockMovements, timeFilter, queryYear, queryMonth]);
  
  const wasteValue = useMemo(() => 
    waste.reduce((sum, w) => sum + (w.totalCost || 0), 0), 
    [waste]
  );
  
  const personalMealsCost = useMemo(() => 
    personalMeals.reduce((sum, p) => sum + (p.totalCost || 0), 0), 
    [personalMeals]
  );

  // Labour cost impostato a 0 come richiesto dall'utente
  const labourCostPercentage = 0;

  // Chart data for sales pie chart
  const dishSalesChartData = useMemo(() => {
    const chartData: Array<{name: string; revenue: number; quantity: number; fullName: string}> = [];
    salesByDish.forEach((salesInfo, dishId) => {
      const dish = dishes.find(d => d.id === dishId);
      if (dish && salesInfo.totalRevenue > 0) {
        chartData.push({
          name: dish.name.length > 15 ? dish.name.substring(0, 15) + '...' : dish.name,
          fullName: dish.name,
          revenue: salesInfo.totalRevenue,
          quantity: salesInfo.totalQuantity
        });
      }
    });
    // Sort by revenue descending and take top 8
    return chartData.sort((a, b) => b.revenue - a.revenue).slice(0, 8);
  }, [salesByDish, dishes]);

  // Daily revenue comparison data for bar chart
  const weeklyComparisonData = useMemo(() => {
    // Align current week to selected time filter
    let currentWeekStart: Date;
    
    if (timeFilter === 'week') {
      const { weekStart } = getWeekStartEnd(selectedYear, selectedWeek);
      currentWeekStart = weekStart;
    } else if (timeFilter === 'day') {
      // Use the week containing the selected day
      const dayOfWeek = selectedDay.getDay();
      const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Monday = 1
      currentWeekStart = new Date(selectedDay);
      currentWeekStart.setDate(selectedDay.getDate() + mondayOffset);
    } else {
      // Month filter: use first week of selected month
      const firstDayOfMonth = new Date(selectedYear, selectedMonth - 1, 1);
      const dayOfWeek = firstDayOfMonth.getDay();
      const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      currentWeekStart = new Date(firstDayOfMonth);
      currentWeekStart.setDate(firstDayOfMonth.getDate() + mondayOffset);
    }
    
    // Get previous week start
    const previousWeekStart = new Date(currentWeekStart);
    previousWeekStart.setDate(currentWeekStart.getDate() - 7);
    
    const days = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];
    const chartData: Array<{day: string; currentWeek: number; previousWeek: number}> = [];
    
    // Initialize data for each day
    for (let i = 0; i < 7; i++) {
      const currentDay = new Date(currentWeekStart);
      currentDay.setDate(currentWeekStart.getDate() + i);
      
      const previousDay = new Date(previousWeekStart);
      previousDay.setDate(previousWeekStart.getDate() + i);
      
      let currentDayRevenue = 0;
      let previousDayRevenue = 0;
      
      salesData.forEach(sale => {
        const saleDate = new Date(sale.saleDate);
        const saleDateString = saleDate.toDateString();
        
        if (saleDateString === currentDay.toDateString()) {
          currentDayRevenue += sale.totalRevenue;
        } else if (saleDateString === previousDay.toDateString()) {
          previousDayRevenue += sale.totalRevenue;
        }
      });
      
      chartData.push({
        day: days[i],
        currentWeek: currentDayRevenue,
        previousWeek: previousDayRevenue
      });
    }
    
    return chartData;
  }, [salesData, timeFilter, selectedYear, selectedWeek]);

  // Calcolo EBITDA dal budget E consuntivo (using same logic as P&L)
  const { ebitdaBudget, ebitdaPercentageBudget, ebitdaPercentageConsuntivo, ebitdaDifference, totalCorrispettivi } = useMemo(() => {
    if (!ecoParams || !foodCostMetrics) {
      return { ebitdaBudget: 0, ebitdaPercentageBudget: 0, ebitdaPercentageConsuntivo: 0, ebitdaDifference: 0, totalCorrispettivi: 0 };
    }

    // Calculate totals exactly like P&L
    const totals = budgetEntries.reduce((acc, entry) => {
      const calculatedBudgetRevenue = (entry.coperti || 0) * (entry.copertoMedio || 0);
      const consuntivo2026 = calculatedBudgetRevenue + (entry.budgetDelivery || 0);
      const consuntivo2025 = (entry.actualRevenue || 0) + (entry.actualDelivery || 0);

      return {
        totalBudget: acc.totalBudget + consuntivo2026,
        totalActualRevenue: acc.totalActualRevenue + (entry.actualRevenue || 0),
        totalActualDelivery: acc.totalActualDelivery + (entry.actualDelivery || 0)
      };
    }, {
      totalBudget: 0,
      totalActualRevenue: 0,
      totalActualDelivery: 0
    });

    const totalCorrispettivi = totals.totalBudget;
    const totalConsuntivoRevenue = totals.totalActualRevenue + totals.totalActualDelivery;
    
    // Use food cost calculated locally
    const foodCostFromAPI = totalFoodCost || 0;
    const foodCostPercent = totalConsuntivoRevenue > 0 ? (foodCostFromAPI / totalConsuntivoRevenue) : 0;

    // Build cost items exactly like P&L to ensure consistency
    const costItems = [
      {
        percent: (ecoParams?.materieFirsteBudget || 0) / totalCorrispettivi,
        budgetValue: ecoParams?.materieFirsteBudget || 0,
        consuntivoValue: foodCostFromAPI, // Use API value like P&L
        consuntivoPercent: foodCostPercent,
      },
      {
        percent: (ecoParams?.acquistiVarBudget || 0) / totalCorrispettivi,
        budgetValue: ecoParams?.acquistiVarBudget || 0,
        consuntivoValue: ecoParams?.acquistiVarConsuntivo || 0,
        consuntivoPercent: totalConsuntivoRevenue > 0 ? (ecoParams?.acquistiVarConsuntivo || 0) / totalConsuntivoRevenue : 0,
      },
      // Add all other cost items like P&L
      {
        percent: (ecoParams?.locazioniBudget || 0) / totalCorrispettivi,
        budgetValue: ecoParams?.locazioniBudget || 0,
        consuntivoValue: ecoParams?.locazioniConsuntivo || 0,
        consuntivoPercent: totalConsuntivoRevenue > 0 ? (ecoParams?.locazioniConsuntivo || 0) / totalConsuntivoRevenue : 0,
      },
      {
        percent: (ecoParams?.personaleBudget || 0) / totalCorrispettivi,
        budgetValue: ecoParams?.personaleBudget || 0,
        consuntivoValue: ecoParams?.personaleConsuntivo || 0,
        consuntivoPercent: totalConsuntivoRevenue > 0 ? (ecoParams?.personaleConsuntivo || 0) / totalConsuntivoRevenue : 0,
      },
      {
        percent: (ecoParams?.utenzeBudget || 0) / totalCorrispettivi,
        budgetValue: ecoParams?.utenzeBudget || 0,
        consuntivoValue: ecoParams?.utenzeConsuntivo || 0,
        consuntivoPercent: totalConsuntivoRevenue > 0 ? (ecoParams?.utenzeConsuntivo || 0) / totalConsuntivoRevenue : 0,
      },
      {
        percent: (ecoParams?.manutenzionibudget || 0) / totalCorrispettivi,
        budgetValue: ecoParams?.manutenzionibudget || 0,
        consuntivoValue: ecoParams?.manutenzioniConsuntivo || 0,
        consuntivoPercent: totalConsuntivoRevenue > 0 ? (ecoParams?.manutenzioniConsuntivo || 0) / totalConsuntivoRevenue : 0,
      },
      {
        percent: (ecoParams?.noleggibudget || 0) / totalCorrispettivi,
        budgetValue: ecoParams?.noleggibudget || 0,
        consuntivoValue: ecoParams?.noleggiConsuntivo || 0,
        consuntivoPercent: totalConsuntivoRevenue > 0 ? (ecoParams?.noleggiConsuntivo || 0) / totalConsuntivoRevenue : 0,
      },
      {
        percent: (ecoParams?.prestazioniTerziBudget || 0) / totalCorrispettivi,
        budgetValue: ecoParams?.prestazioniTerziBudget || 0,
        consuntivoValue: ecoParams?.prestazioniTerziConsuntivo || 0,
        consuntivoPercent: totalConsuntivoRevenue > 0 ? (ecoParams?.prestazioniTerziConsuntivo || 0) / totalConsuntivoRevenue : 0,
      },
      {
        percent: (ecoParams?.consulenzeBudget || 0) / totalCorrispettivi,
        budgetValue: ecoParams?.consulenzeBudget || 0,
        consuntivoValue: ecoParams?.consulenzeConsuntivo || 0,
        consuntivoPercent: totalConsuntivoRevenue > 0 ? (ecoParams?.consulenzeConsuntivo || 0) / totalConsuntivoRevenue : 0,
      },
      {
        percent: (ecoParams?.marketingBudget || 0) / totalCorrispettivi,
        budgetValue: ecoParams?.marketingBudget || 0,
        consuntivoValue: ecoParams?.marketingConsuntivo || 0,
        consuntivoPercent: totalConsuntivoRevenue > 0 ? (ecoParams?.marketingConsuntivo || 0) / totalConsuntivoRevenue : 0,
      },
      {
        percent: (ecoParams?.deliveryBudget || 0) / totalCorrispettivi,
        budgetValue: ecoParams?.deliveryBudget || 0,
        consuntivoValue: ecoParams?.deliveryConsuntivo || 0,
        consuntivoPercent: totalConsuntivoRevenue > 0 ? (ecoParams?.deliveryConsuntivo || 0) / totalConsuntivoRevenue : 0,
      },
      {
        percent: (ecoParams?.trasferteBudget || 0) / totalCorrispettivi,
        budgetValue: ecoParams?.trasferteBudget || 0,
        consuntivoValue: ecoParams?.trasferteConsuntivo || 0,
        consuntivoPercent: totalConsuntivoRevenue > 0 ? (ecoParams?.trasferteConsuntivo || 0) / totalConsuntivoRevenue : 0,
      },
      {
        percent: (ecoParams?.assicurazioniBudget || 0) / totalCorrispettivi,
        budgetValue: ecoParams?.assicurazioniBudget || 0,
        consuntivoValue: ecoParams?.assicurazioniConsuntivo || 0,
        consuntivoPercent: totalConsuntivoRevenue > 0 ? (ecoParams?.assicurazioniConsuntivo || 0) / totalConsuntivoRevenue : 0,
      },
      {
        percent: (ecoParams?.speseBancarieBudget || 0) / totalCorrispettivi,
        budgetValue: ecoParams?.speseBancarieBudget || 0,
        consuntivoValue: ecoParams?.speseBancarieConsuntivo || 0,
        consuntivoPercent: totalConsuntivoRevenue > 0 ? (ecoParams?.speseBancarieConsuntivo || 0) / totalConsuntivoRevenue : 0,
      }
    ];

    // Calculate EBITDA exactly like P&L
    const totalCostPercent = costItems.reduce((sum, item) => sum + item.percent, 0);
    const totalCostPercentConsuntivo = costItems.reduce((sum, item) => sum + item.consuntivoPercent, 0);
    
    const ebitdaPercent = 1 - totalCostPercent;
    const ebitdaPercentConsuntivo = 1 - totalCostPercentConsuntivo;
    
    // Calculate actual EBITDA values in euros exactly like P&L
    const totalCostsBudgetEuros = costItems.reduce((sum, item) => sum + (item.budgetValue || 0), 0);
    const totalCostsConsuntivoEuros = costItems.reduce((sum, item) => sum + (item.consuntivoValue || 0), 0);
    const ebitdaBudgetEuros = totals.totalBudget - totalCostsBudgetEuros;
    const ebitdaConsuntivoEuros = (totals.totalActualRevenue + totals.totalActualDelivery) - totalCostsConsuntivoEuros;

    // Differenza in EURO = EBITDA Consuntivo Euro - EBITDA Budget Euro
    const differenceEuro = ebitdaConsuntivoEuros - ebitdaBudgetEuros;

    return {
      ebitdaBudget: ebitdaBudgetEuros,
      ebitdaPercentageBudget: ebitdaPercent * 100,
      ebitdaPercentageConsuntivo: ebitdaPercentConsuntivo * 100,
      ebitdaDifference: differenceEuro,
      totalCorrispettivi: totalCorrispettivi
    };
  }, [ecoParams, budgetEntries, foodCostMetrics]);

  // Calculate real profit margin using actual costs from economic parameters
  const mockRevenue = totalFoodSales || 42000;
  const otherCosts = ecoParams ? (
    (ecoParams.acquistiVarConsuntivo || 0) +
    (ecoParams.locazioniConsuntivo || 0) +
    (ecoParams.personaleConsuntivo || 0) +
    (ecoParams.utenzeConsuntivo || 0) +
    (ecoParams.manutenzioniConsuntivo || 0) +
    (ecoParams.noleggiConsuntivo || 0) +
    (ecoParams.prestazioniTerziConsuntivo || 0) +
    (ecoParams.consulenzeConsuntivo || 0) +
    (ecoParams.marketingConsuntivo || 0) +
    (ecoParams.deliveryConsuntivo || 0) +
    (ecoParams.trasferteConsuntivo || 0) +
    (ecoParams.assicurazioniConsuntivo || 0) +
    (ecoParams.speseBancarieConsuntivo || 0)
  ) : 0;
  const mockProfit = mockRevenue - totalFoodCost - otherCosts;
  const mockProfitMargin = mockRevenue > 0 ? (mockProfit / mockRevenue) * 100 : 0;

  return (
    <div className="space-y-6" data-testid="dashboard-main">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-4">
          <h1 className="text-3xl font-bold">Dashboard Gestione Ristorante</h1>
        </div>
        <p className="text-muted-foreground">
          Controllo completo di Food Cost, Labour Cost e Performance Finanziaria
        </p>
        
        {/* Time Filters */}
        <div className="flex flex-col items-center gap-4 pt-4 border-t">
          <div className="flex items-center justify-center gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Filtri Temporali:</span>
            </div>
          
          <Select value={timeFilter} onValueChange={(value: 'day' | 'week' | 'month') => setTimeFilter(value)}>
            <SelectTrigger className="w-32" data-testid="select-time-filter">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Giorno</SelectItem>
              <SelectItem value="week">Settimana</SelectItem>
              <SelectItem value="month">Mese</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
            <SelectTrigger className="w-20" data-testid="select-year">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[2023, 2024, 2025, 2026].map(year => (
                <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {timeFilter === 'month' && (
            <Select value={selectedMonth.toString()} onValueChange={(value) => setSelectedMonth(parseInt(value))}>
              <SelectTrigger className="w-32" data-testid="select-month">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[
                  { value: 1, label: 'Gennaio' },
                  { value: 2, label: 'Febbraio' },
                  { value: 3, label: 'Marzo' },
                  { value: 4, label: 'Aprile' },
                  { value: 5, label: 'Maggio' },
                  { value: 6, label: 'Giugno' },
                  { value: 7, label: 'Luglio' },
                  { value: 8, label: 'Agosto' },
                  { value: 9, label: 'Settembre' },
                  { value: 10, label: 'Ottobre' },
                  { value: 11, label: 'Novembre' },
                  { value: 12, label: 'Dicembre' }
                ].map(month => (
                  <SelectItem key={month.value} value={month.value.toString()}>
                    {month.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {timeFilter === 'week' && (
            <Select value={selectedWeek.toString()} onValueChange={(value) => setSelectedWeek(parseInt(value))}>
              <SelectTrigger className="w-32" data-testid="select-week">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 52 }, (_, i) => i + 1).map(week => (
                  <SelectItem key={week} value={week.toString()}>
                    Settimana {week}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {timeFilter === 'day' && (
            <input
              type="date"
              value={formatDateForAPI(selectedDay)}
              onChange={(e) => setSelectedDay(new Date(e.target.value))}
              className="px-3 py-2 border border-input bg-background text-sm rounded-md"
              data-testid="input-selected-day"
            />
          )}
          </div>
          
          {(timeFilter === 'day' || timeFilter === 'week') && (
            <div className="text-xs text-orange-600 dark:text-orange-400 max-w-2xl text-center">
              ℹ️ I dati di magazzino e costi reali non sono filtrati per giorno/settimana. 
              Usa il filtro mensile per metriche complete di Food Cost e EBITDA.
            </div>
          )}
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Ricavo Totale"
          value={`€${totalFoodSales.toFixed(2)}`}
          icon={<DollarSign className="h-4 w-4" />}
          status="good"
          data-testid="kpi-ricavo-totale"
        />
        
        <KPICard
          title="Food Cost %"
          value={`${foodCostPercentage.toFixed(1)}%`}
          change={realVsTheoreticalDiff}
          changeLabel={
            <div className="flex flex-col text-xs leading-tight">
              <span>cfr FCT {realVsTheoreticalDiff > 0 ? '+' : ''}{realVsTheoreticalDiff.toFixed(1)}%</span>
              <span className={`${ecoParams?.materieFirsteBudget && totalCorrispettivi > 0 && ((ecoParams.materieFirsteBudget / totalCorrispettivi) * 100) > 0 ? 'text-red-600 dark:text-red-400' : ''}`}>
                cfr FCB {ecoParams?.materieFirsteBudget && totalCorrispettivi > 0 ? ((ecoParams.materieFirsteBudget / totalCorrispettivi) * 100).toFixed(1) : '0.0'}%
              </span>
            </div>
          }
          trend={realVsTheoreticalDiff > 0 ? "up" : "down"}
          status={foodCostPercentage > 30 ? "danger" : foodCostPercentage > 25 ? "warning" : "good"}
          icon={<ChefHat className="h-4 w-4" />}
          onClick={() => onNavigateToSection("food-cost")}
        />
        
        <KPICard
          title="Labour Cost %"
          value={`${labourCostPercentage.toFixed(1)}%`}
          change={1.2}
          trend="up"
          status={labourCostPercentage > 35 ? "danger" : labourCostPercentage > 30 ? "warning" : "good"}
          icon={<Users className="h-4 w-4" />}
          onClick={() => onNavigateToSection("labour-cost")}
        />
        
        <KPICard
          title="EBITDA"
          value={`${ebitdaPercentageConsuntivo.toFixed(1)}%`}
          change={ebitdaPercentageConsuntivo - ebitdaPercentageBudget}
          changeLabel={`${(ebitdaPercentageConsuntivo - ebitdaPercentageBudget).toFixed(1).replace('.', ',')}% vs budget`}
          trend={(ebitdaPercentageConsuntivo - ebitdaPercentageBudget) >= 0 ? "up" : "down"}
          status={ebitdaPercentageConsuntivo > 20 ? "good" : ebitdaPercentageConsuntivo > 10 ? "warning" : "danger"}
          icon={<TrendingUp className="h-4 w-4" />}
          onClick={() => onNavigateToSection("profit-loss")}
        />
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Sales Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChartIcon className="h-5 w-5 text-primary" />
              Vendite per Piatto
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80 space-y-4">
              {dishSalesChartData.length > 0 ? (
                <>
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={dishSalesChartData}
                          cx="50%"
                          cy="50%"
                          outerRadius={70}
                          fill="#8884d8"
                          dataKey="revenue"
                        >
                          {dishSalesChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          formatter={(value: number) => [`€${value.toFixed(1)}`, 'Ricavo']}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  
                  {/* Legend */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {dishSalesChartData.map((entry, index) => {
                      const totalRevenue = dishSalesChartData.reduce((sum, item) => sum + item.revenue, 0);
                      const percentage = ((entry.revenue / totalRevenue) * 100).toFixed(1);
                      return (
                        <div key={index} className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded" 
                            style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                          />
                          <span className="truncate text-muted-foreground">
                            {entry.fullName} ({percentage}%)
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <p>Nessuna vendita da mostrare</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Weekly Comparison Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Andamento Settimanale (Lun-Dom)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80 space-y-4">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyComparisonData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis 
                      dataKey="day" 
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis 
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => `€${value.toFixed(0)}`}
                    />
                    <Tooltip 
                      formatter={(value: number, name: string) => [
                        `€${value.toFixed(1)}`, 
                        name === 'currentWeek' ? 'Settimana Corrente' : 'Settimana Precedente'
                      ]}
                    />
                    <Bar 
                      dataKey="previousWeek" 
                      fill="#94a3b8" 
                      name="previousWeek"
                      radius={[2, 2, 0, 0]}
                    />
                    <Bar 
                      dataKey="currentWeek" 
                      fill="#3b82f6" 
                      name="currentWeek"
                      radius={[2, 2, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              
              {/* Summary */}
              <div className="grid grid-cols-2 gap-4 text-center text-sm">
                <div>
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-3 h-3 bg-slate-400 rounded"></div>
                    <span className="text-muted-foreground">Settimana Precedente</span>
                  </div>
                  <p className="font-mono font-bold mt-1">
                    €{weeklyComparisonData.reduce((sum, day) => sum + day.previousWeek, 0).toFixed(1)}
                  </p>
                </div>
                <div>
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-3 h-3 bg-blue-500 rounded"></div>
                    <span className="text-muted-foreground">Settimana Corrente</span>
                  </div>
                  <p className="font-mono font-bold mt-1">
                    €{weeklyComparisonData.reduce((sum, day) => sum + day.currentWeek, 0).toFixed(1)}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

    </div>
  );
}