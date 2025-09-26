import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Calendar, Plus, Download, TrendingUp, TrendingDown, Save } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { exportBudgetToPDF } from "@/utils/pdfExport";
import type { BudgetEntry, InsertBudgetEntry, UpdateBudgetEntry } from "@shared/schema";

interface BudgetProps {}

export default function Budget({}: BudgetProps) {
  const queryClient = useQueryClient();
  // Load saved month/year from localStorage or use defaults
  const [selectedYear, setSelectedYear] = useState<number>(() => {
    const saved = localStorage.getItem('foodyflow-selected-year');
    return saved ? parseInt(saved) : 2026;
  });
  const [selectedMonth, setSelectedMonth] = useState<number>(() => {
    const saved = localStorage.getItem('foodyflow-selected-month');
    return saved ? parseInt(saved) : 1;
  });

  // Save to localStorage when month/year changes
  useEffect(() => {
    localStorage.setItem('foodyflow-selected-year', selectedYear.toString());
    localStorage.setItem('foodyflow-selected-month', selectedMonth.toString());
  }, [selectedYear, selectedMonth]);
  const [editingEntry, setEditingEntry] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<UpdateBudgetEntry>>({});

  // Fetch budget entries for selected month/year
  const { data: budgetEntries = [], isLoading } = useQuery({
    queryKey: ['/api/budget-entries', selectedYear, selectedMonth],
    queryFn: () => 
      fetch(`/api/budget-entries/${selectedYear}/${selectedMonth}`)
        .then(res => res.json()) as Promise<BudgetEntry[]>
  });





  // Create/update mutations
  const createMutation = useMutation({
    mutationFn: (data: InsertBudgetEntry) => apiRequest('POST', '/api/budget-entries', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/budget-entries', selectedYear, selectedMonth] });
    },
  });


  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateBudgetEntry }) => 
      apiRequest('PUT', `/api/budget-entries/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/budget-entries', selectedYear, selectedMonth] });
      setEditingEntry(null);
      setEditForm({});
    },
  });

  // Export to PDF function
  const handleExportPDF = () => {
    if (!budgetEntries || budgetEntries.length === 0) return;
    exportBudgetToPDF(budgetEntries, selectedYear, selectedMonth);
  };

  // Generate all days for the month
  const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
  const monthDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  // Convert budget entries to map for easier lookup
  const budgetMap = useMemo(() => {
    const map = new Map<number, BudgetEntry>();
    if (budgetEntries && Array.isArray(budgetEntries)) {
      budgetEntries.forEach(entry => {
        map.set(entry.day, entry);
      });
    }
    return map;
  }, [budgetEntries]);

  // Calculate totals
  const totals = useMemo(() => {
    let totalCopertoMedio = 0;
    let totalCoperti = 0;
    let totalBudgetRevenue = 0;
    let totalBudgetDelivery = 0;
    let totalActualRevenue = 0;
    let totalActualDelivery = 0;
    let totalConsuntivo2026 = 0;
    let validEntries = 0;

    if (budgetEntries && Array.isArray(budgetEntries)) {
      budgetEntries.forEach(entry => {
        totalCoperti += entry.coperti || 0;
        totalBudgetDelivery += entry.budgetDelivery || 0;
        totalActualRevenue += entry.actualRevenue || 0;
        totalActualDelivery += entry.actualDelivery || 0;
        totalConsuntivo2026 += entry.consuntivo || 0;
        
        if (entry.copertoMedio && entry.copertoMedio > 0) {
          totalCopertoMedio += entry.copertoMedio;
          validEntries++;
        }
        
        // Budget Revenue calcolato = Coperti * Coperto Medio
        const calculatedRevenue = (entry.coperti || 0) * (entry.copertoMedio || 0);
        totalBudgetRevenue += calculatedRevenue;
      });
    }

    // Media coperto medio
    const avgCopertoMedio = validEntries > 0 ? totalCopertoMedio / validEntries : 0;
    
    // Consuntivo 2025 = Incasso 2025 + Delivery 2025
    const totalConsuntivo2025 = totalActualRevenue + totalActualDelivery;
    
    // Delta % tra Consuntivo 2026 e 2025
    const deltaPercentage = totalConsuntivo2025 > 0 ? 
      (((totalConsuntivo2026 - totalConsuntivo2025) / totalConsuntivo2025) * 100) : 0;

    return {
      avgCopertoMedio,
      totalCoperti,
      totalBudgetRevenue,
      totalBudgetDelivery,
      totalBudget: totalBudgetRevenue + totalBudgetDelivery,
      totalActualRevenue,
      totalActualDelivery,
      totalActual: totalActualRevenue + totalActualDelivery,
      totalConsuntivo2026,
      totalConsuntivo2025,
      deltaPercentage
    };
  }, [budgetEntries]);

  const monthNames = [
    "Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno",
    "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"
  ];

  const dayNames = [
    "Dom", "Lun", "Mar", "Mer", "Gio", "Ven", "Sab"
  ];

  const getDayOfWeek = (year: number, month: number, day: number) => {
    const date = new Date(year, month - 1, day);
    return dayNames[date.getDay()];
  };

  const formatCurrency = (value: number | null | undefined) => {
    if (value === null || value === undefined) return "€0,0";
    if (Math.abs(value) >= 1000000) {
      return `${(value / 1000000).toFixed(1).replace('.', ',')}M€`;
    }
    return `€${value.toLocaleString('it-IT', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}`;
  };

  const formatPercentage = (value: number | null | undefined) => {
    if (value === null || value === undefined) return "0%";
    return `${value.toFixed(1)}%`;
  };

  const getPercentageColor = (value: number | null | undefined) => {
    if (!value) return "";
    if (value > 0) return "text-green-600"; // Positivo = verde
    if (value < 0) return "text-red-600"; // Negativo = rosso  
    return "text-gray-600";
  };

  const handleCellEdit = (day: number, field: keyof UpdateBudgetEntry, value: string) => {
    const entry = budgetMap.get(day);
    
    // Handle empty values and convert italian decimal format (comma to dot)
    let numericValue: number;
    if (value === '' || value === null || value === undefined) {
      numericValue = 0;
    } else {
      // Support both comma and dot as decimal separator
      const cleanValue = value.replace(',', '.');
      numericValue = parseFloat(cleanValue);
      if (isNaN(numericValue)) {
        numericValue = 0;
      }
      
      // Special handling for integer fields (coperti should be integer)
      if (field === 'coperti') {
        numericValue = Math.round(numericValue); // Convert decimals to integers for coperti
      }
    }

    if (entry) {
      // Update existing entry
      updateMutation.mutate({
        id: entry.id,
        data: { [field]: numericValue }
      });
    } else {
      // Create new entry
      const dateStr = `${selectedYear}-${selectedMonth.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
      createMutation.mutate({
        date: dateStr,
        year: selectedYear,
        month: selectedMonth,
        day: day,
        [field]: numericValue
      });
    }
  };

  if (isLoading) {
    return <div className="flex justify-center p-8">Caricamento...</div>;
  }

  return (
    <div className="space-y-6" data-testid="budget-main">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              <CardTitle>Budget {monthNames[selectedMonth - 1]} {selectedYear}</CardTitle>
            </div>
            <div className="flex items-center gap-3">
              <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
                <SelectTrigger className="w-24" data-testid="select-year">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2024">2024</SelectItem>
                  <SelectItem value="2025">2025</SelectItem>
                  <SelectItem value="2026">2026</SelectItem>
                  <SelectItem value="2027">2027</SelectItem>
                </SelectContent>
              </Select>
              <Select value={selectedMonth.toString()} onValueChange={(value) => setSelectedMonth(parseInt(value))}>
                <SelectTrigger className="w-32" data-testid="select-month">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {monthNames.map((name, index) => (
                    <SelectItem key={index} value={(index + 1).toString()}>{name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportPDF}
                disabled={isLoading || budgetEntries.length === 0}
                data-testid="button-export-pdf"
              >
                <Download className="h-4 w-4 mr-2" />
                Export PDF
              </Button>
            </div>
          </div>
          
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4 pt-4 border-t">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Budget {selectedYear}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="header-card-budget-2026">
                  {formatCurrency(totals.totalBudget)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Consuntivo {selectedYear}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="header-card-consuntivo-2026">
                  {formatCurrency(totals.totalConsuntivo2026)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Consuntivo {selectedYear - 1}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="header-card-consuntivo-2025">
                  {formatCurrency(totals.totalConsuntivo2025)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${getPercentageColor(totals.deltaPercentage)}`} data-testid="header-card-performance">
                  {totals.deltaPercentage > 0 ? '+' : ''}{totals.deltaPercentage.toFixed(1)}%
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {selectedYear} vs {selectedYear - 1}
                </p>
              </CardContent>
            </Card>
          </div>
        </CardHeader>
      </Card>

      {/* Budget Table */}
      <Card>
        <CardContent className="p-0">
          <div className="mobile-table-scroll">
            <Table>
              <TableHeader>
                <TableRow className="bg-red-600 text-white hover:bg-red-600">
                  <TableHead className="text-white font-semibold w-[60px] md:w-[90px] text-xs md:text-sm">Data</TableHead>
                  <TableHead className="text-white font-semibold text-right w-[50px] md:w-[70px] text-xs md:text-sm">C.M. €</TableHead>
                  <TableHead className="text-white font-semibold text-center w-[40px] md:w-[60px] text-xs md:text-sm">Cop.</TableHead>
                  <TableHead className="text-white font-semibold text-right w-[60px] md:w-[80px] text-xs md:text-sm mobile-hide">Budget €</TableHead>
                  <TableHead className="text-white font-semibold text-right w-[60px] md:w-[80px] text-xs md:text-sm mobile-hide">Del. €</TableHead>
                  <TableHead className="text-white font-semibold text-right w-[60px] md:w-[80px] bg-blue-100 dark:bg-blue-900/30 text-xs md:text-sm mobile-hide">Inc. 25 €</TableHead>
                  <TableHead className="text-white font-semibold text-right w-[60px] md:w-[80px] bg-blue-100 dark:bg-blue-900/30 text-xs md:text-sm mobile-hide">Del. 25 €</TableHead>
                  <TableHead className="text-white font-semibold text-center w-[60px] md:w-[80px] text-xs md:text-sm">Cons. 26</TableHead>
                  <TableHead className="text-white font-semibold text-center w-[60px] md:w-[80px] bg-blue-100 dark:bg-blue-900/30 text-xs md:text-sm">Cons. 25</TableHead>
                  <TableHead className="text-white font-semibold text-center w-[40px] md:w-[60px] text-xs md:text-sm">Δ%</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {monthDays.map(day => {
                  const entry = budgetMap.get(day);
                  
                  // Calcolo automatico Budget 2026 = Coperti * Coperto Medio
                  const calculatedBudgetRevenue = (entry?.coperti || 0) * (entry?.copertoMedio || 0);
                  
                  // Consuntivo 2026 = Valore editabile dall'utente
                  const rowConsuntivo = entry?.consuntivo ?? 0;
                  
                  // Consuntivo 2025 = Incasso 2025 + Delivery 2025
                  const consuntivo2025 = (entry?.actualRevenue || 0) + (entry?.actualDelivery || 0);
                  
                  // Delta % tra Consuntivo 2026 e Consuntivo 2025
                  const deltaPercentage = consuntivo2025 > 0 ? (((rowConsuntivo - consuntivo2025) / consuntivo2025) * 100) : 0;

                  return (
                    <TableRow 
                      key={day}
                      className="hover:bg-muted/50 transition-colors"
                    >
                      <TableCell className="font-medium text-xs">
                        {`${getDayOfWeek(selectedYear, selectedMonth, day).slice(0, 3)} ${day.toString().padStart(2, '0')}`}
                      </TableCell>
                      <TableCell className="text-right">
                        <Input
                          type="text"
                          value={entry?.copertoMedio ? entry.copertoMedio.toString() : ''}
                          placeholder="0,00"
                          className="w-16 text-right border-0 p-1 h-6 bg-yellow-100 dark:bg-yellow-900/30"
                          onChange={(e) => handleCellEdit(day, 'copertoMedio', e.target.value)}
                          data-testid={`input-coperto-medio-${day}`}
                        />
                      </TableCell>
                      <TableCell className="text-center">
                        <Input
                          type="text"
                          value={entry?.coperti ? entry.coperti.toString() : ''}
                          placeholder="0"
                          className="w-12 text-center border-0 p-1 h-6 bg-yellow-100 dark:bg-yellow-900/30"
                          onChange={(e) => handleCellEdit(day, 'coperti', e.target.value)}
                          data-testid={`input-coperti-${day}`}
                        />
                      </TableCell>
                      <TableCell className="text-right mobile-hide">
                        <span className="text-xs font-mono" data-testid={`calculated-budget-revenue-${day}`}>
                          {formatCurrency(calculatedBudgetRevenue)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right mobile-hide">
                        <Input
                          type="text"
                          value={entry?.budgetDelivery ? entry.budgetDelivery.toString() : ''}
                          placeholder="0,00"
                          className="w-16 text-right border-0 p-1 h-6 bg-yellow-100 dark:bg-yellow-900/30"
                          onChange={(e) => handleCellEdit(day, 'budgetDelivery', e.target.value)}
                          data-testid={`input-budget-delivery-${day}`}
                        />
                      </TableCell>
                      <TableCell className="text-right bg-blue-50 dark:bg-blue-950/20 mobile-hide">
                        <Input
                          type="text"
                          value={entry?.actualRevenue ? entry.actualRevenue.toString() : ''}
                          placeholder="0,00"
                          className="w-16 text-right border-0 p-1 h-6 bg-yellow-100 dark:bg-yellow-900/30"
                          onChange={(e) => handleCellEdit(day, 'actualRevenue', e.target.value)}
                          data-testid={`input-actual-revenue-${day}`}
                        />
                      </TableCell>
                      <TableCell className="text-right bg-blue-50 dark:bg-blue-950/20 mobile-hide">
                        <Input
                          type="text"
                          value={entry?.actualDelivery ? entry.actualDelivery.toString() : ''}
                          placeholder="0,00"
                          className="w-16 text-right border-0 p-1 h-6 bg-yellow-100 dark:bg-yellow-900/30"
                          onChange={(e) => handleCellEdit(day, 'actualDelivery', e.target.value)}
                          data-testid={`input-actual-delivery-${day}`}
                        />
                      </TableCell>
                      <TableCell className="text-center">
                        <Input
                          type="number"
                          step="0.1"
                          className="w-16 h-7 text-xs text-center border-gray-200 focus:border-primary"
                          value={entry?.consuntivo ?? ''}
                          placeholder="0.0"
                          onChange={(e) => handleCellEdit(day, 'consuntivo', e.target.value)}
                          data-testid={`input-consuntivo-${day}`}
                        />
                      </TableCell>
                      <TableCell className="text-center bg-blue-50 dark:bg-blue-950/20">
                        <span className="text-xs font-mono" data-testid={`consuntivo-2025-${day}`}>
                          {formatCurrency(consuntivo2025)}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge 
                          variant="secondary"
                          className={`font-mono text-[10px] px-1 py-0 ${getPercentageColor(deltaPercentage)}`}
                          data-testid={`badge-delta-${day}`}
                        >
                          {deltaPercentage > 0 ? '+' : ''}{deltaPercentage.toFixed(1)}%
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}

                {/* Totals Row */}
                <TableRow className="bg-gray-100 dark:bg-gray-800 font-semibold border-t-2">
                  <TableCell className="font-bold">Totale {monthNames[selectedMonth - 1]}</TableCell>
                  <TableCell className="text-right font-bold" data-testid="total-coperto-medio">{formatCurrency(totals.avgCopertoMedio)}</TableCell>
                  <TableCell className="text-center font-bold" data-testid="total-coperti">{totals.totalCoperti}</TableCell>
                  <TableCell className="text-right font-bold mobile-hide" data-testid="total-budget-revenue">{formatCurrency(totals.totalBudgetRevenue)}</TableCell>
                  <TableCell className="text-right font-bold mobile-hide" data-testid="total-budget-delivery">{formatCurrency(totals.totalBudgetDelivery)}</TableCell>
                  <TableCell className="text-right font-bold mobile-hide" data-testid="total-actual-revenue">{formatCurrency(totals.totalActualRevenue)}</TableCell>
                  <TableCell className="text-right font-bold mobile-hide" data-testid="total-actual-delivery">{formatCurrency(totals.totalActualDelivery)}</TableCell>
                  <TableCell className="text-center font-bold" data-testid="total-consuntivo-2026">{formatCurrency(totals.totalConsuntivo2026)}</TableCell>
                  <TableCell className="text-center font-bold" data-testid="total-consuntivo-2025">{formatCurrency(totals.totalConsuntivo2025)}</TableCell>
                  <TableCell className="text-center font-bold">
                    <Badge 
                      variant="secondary"
                      className={`font-mono ${getPercentageColor(totals.deltaPercentage)}`}
                      data-testid="total-delta-percentage"
                    >
                      {totals.deltaPercentage > 0 ? '+' : ''}{totals.deltaPercentage.toFixed(1)}%
                    </Badge>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Budget {selectedYear}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="summary-card-budget-2026">
              {formatCurrency(totals.totalBudgetRevenue + totals.totalBudgetDelivery)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Sala: {formatCurrency(totals.totalBudgetRevenue)} | Delivery: {formatCurrency(totals.totalBudgetDelivery)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Consuntivo {selectedYear}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="summary-card-consuntivo-2026">
              {formatCurrency(totals.totalConsuntivo2026)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Consuntivo {selectedYear - 1}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="summary-card-consuntivo-2025">
              {formatCurrency(totals.totalConsuntivo2025)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Sala: {formatCurrency(totals.totalActualRevenue)} | Delivery: {formatCurrency(totals.totalActualDelivery)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getPercentageColor(totals.deltaPercentage)}`} data-testid="summary-card-performance">
              {totals.deltaPercentage > 0 ? '+' : ''}{totals.deltaPercentage.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {selectedYear} vs {selectedYear - 1}
            </p>
          </CardContent>
        </Card>
      </div>

    </div>
  );
}