import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Calendar, Download } from "lucide-react";
import { exportTableToPDF, exportPLToPDF } from "@/utils/pdfExport";

// Types
import type { UpdateEconomicParameters, BudgetEntry, EconomicParameters } from "@shared/schema";

// Food cost metrics interface
interface FoodCostMetrics {
  totalFoodCost: number;
  foodCostPercentage: number;
  year: number;
  month: number;
}

export default function PL() {
  // Load saved month/year from localStorage or use defaults
  const [selectedYear, setSelectedYear] = useState(() => {
    const saved = localStorage.getItem('foodyflow-selected-year');
    return saved ? parseInt(saved) : new Date().getFullYear();
  });
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const saved = localStorage.getItem('foodyflow-selected-month');
    return saved ? parseInt(saved) : new Date().getMonth() + 1;
  });
  const [ecoEditingField, setEcoEditingField] = useState<keyof UpdateEconomicParameters | null>(null);
  const [ecoTempValue, setEcoTempValue] = useState<string>('');

  // Save to localStorage when month/year changes
  useEffect(() => {
    localStorage.setItem('foodyflow-selected-year', selectedYear.toString());
    localStorage.setItem('foodyflow-selected-month', selectedMonth.toString());
  }, [selectedYear, selectedMonth]);

  // Month names for display
  const monthNames = [
    "Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno",
    "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"
  ];

  // Query for economic parameters
  const { data: ecoParams, refetch: refetchEcoParams } = useQuery<EconomicParameters>({
    queryKey: ['/api/economic-parameters', selectedYear, selectedMonth]
  });

  // Query for food cost metrics
  const { data: foodCostMetrics } = useQuery<FoodCostMetrics>({
    queryKey: ['/api/metrics/food-cost', selectedYear, selectedMonth]
  });

  // Query for budget totals
  const { data: budgetEntries = [] } = useQuery<BudgetEntry[]>({
    queryKey: ['/api/budget-entries', selectedYear, selectedMonth]
  });

  // Calculate budget totals
  const totals = budgetEntries.reduce((acc, entry) => {
    const calculatedBudgetRevenue = (entry.coperti || 0) * (entry.copertoMedio || 0);
    const consuntivo2026 = calculatedBudgetRevenue + (entry.budgetDelivery || 0);
    const consuntivo2025 = (entry.actualRevenue || 0) + (entry.actualDelivery || 0);

    return {
      totalBudget: acc.totalBudget + consuntivo2026,
      totalActualRevenue: acc.totalActualRevenue + (entry.actualRevenue || 0),
      totalActualDelivery: acc.totalActualDelivery + (entry.actualDelivery || 0),
      totalConsuntivo: acc.totalConsuntivo + consuntivo2025  // Fixed: use actualRevenue + actualDelivery like Dashboard
    };
  }, {
    totalBudget: 0,
    totalActualRevenue: 0,
    totalActualDelivery: 0,
    totalConsuntivo: 0
  });

  // Economic parameters editing handlers
  const handleEcoEdit = (field: keyof UpdateEconomicParameters, currentValue: number) => {
    setEcoEditingField(field);
    setEcoTempValue(currentValue.toString().replace('.', ','));
  };

  const handleEcoSave = async (field: keyof UpdateEconomicParameters) => {
    const numericValue = parseFloat(ecoTempValue.replace(',', '.'));
    if (isNaN(numericValue)) return;

    try {
      // Handle bidirectional logic for materie prime and acquisti vari
      const updateData: Partial<UpdateEconomicParameters> = {};
      
      if (field === 'materieFirstePercent') {
        // Bidirectional: calculate budget from percent
        const totalCorrispettivi = Math.max(totals.totalBudget || 0, 1);
        updateData.materieFirstePercent = numericValue;
        updateData.materieFirsteBudget = (numericValue / 100) * totalCorrispettivi;
      } else if (field === 'acquistiVarPercent') {
        // Bidirectional: calculate budget from percent
        const totalCorrispettivi = Math.max(totals.totalBudget || 0, 1);
        updateData.acquistiVarPercent = numericValue;
        updateData.acquistiVarBudget = (numericValue / 100) * totalCorrispettivi;
      } else {
        // Regular field
        updateData[field] = numericValue;
      }

      const response = await fetch(`/api/economic-parameters/${selectedYear}/${selectedMonth}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
        credentials: 'include'
      });

      if (response.ok) {
        refetchEcoParams();
      }
    } catch (error) {
      console.error('Error updating economic parameter:', error);
    }
  };

  // Helper functions
  const formatCurrency = (value: number) => {
    if (Math.abs(value) >= 1000000) {
      return `${(value / 1000000).toFixed(1).replace('.', ',')}M€`;
    }
    return `€${value.toLocaleString('it-IT', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}`;
  };

  const formatPercent = (value: number) => `${value.toFixed(1).replace('.', ',')}%`;

  const getPercentageColor = (percentage: number) => {
    if (percentage > 0) return "text-green-600 dark:text-green-400";
    if (percentage < 0) return "text-red-600 dark:text-red-400";
    return "text-gray-600 dark:text-gray-400";
  };

  // Economic cost items configuration
  const totalCorrispettivi = Math.max(totals.totalBudget || 0, 1);
  
  const costItems = [
    { 
      code: '0110', 
      name: 'Consumi materie prime', 
      percent: (ecoParams?.materieFirsteBudget || 0) / totalCorrispettivi, 
      budgetValue: ecoParams?.materieFirsteBudget || 0,
      consuntivoValue: foodCostMetrics?.totalFoodCost || 0,
      consuntivoPercent: (totals.totalConsuntivo) > 0 ? (foodCostMetrics?.totalFoodCost || 0) / (totals.totalConsuntivo) : 0,
      foodCostPercent: foodCostMetrics?.foodCostPercentage || null,
      dataTestId: 'eco-materie', 
      highlight: false,
      editable: true,
      field: 'materieFirsteBudget',
      consuntivoField: null,
      consuntivoPercentField: null,
      isBidirectional: true,
      isConsuntivoPercentBidirectional: false,
      isFromDashboard: true
    },
    { 
      code: '0120', 
      name: 'Acquisti vari', 
      percent: (ecoParams?.acquistiVarBudget || 0) / totalCorrispettivi, 
      budgetValue: ecoParams?.acquistiVarBudget || 0,
      consuntivoValue: ecoParams?.acquistiVarConsuntivo || 0,
      consuntivoPercent: (totals.totalConsuntivo) > 0 ? (ecoParams?.acquistiVarConsuntivo || 0) / (totals.totalConsuntivo) : 0,
      dataTestId: null, 
      highlight: false,
      editable: true,
      field: 'acquistiVarBudget',
      consuntivoField: 'acquistiVarConsuntivo',
      consuntivoPercentField: 'acquistiVarConsuntivoPercent',
      isBidirectional: true,
      isConsuntivoPercentBidirectional: true
    },
    { 
      code: '0210', 
      name: 'Locazioni locali', 
      percent: (ecoParams?.locazioniBudget || 0) / totalCorrispettivi, 
      budgetValue: ecoParams?.locazioniBudget || 0,
      consuntivoValue: ecoParams?.locazioniConsuntivo || 0,
      consuntivoPercent: (totals.totalConsuntivo) > 0 ? (ecoParams?.locazioniConsuntivo || 0) / (totals.totalConsuntivo) : 0,
      dataTestId: null, 
      highlight: false,
      editable: true,
      field: 'locazioniBudget',
      consuntivoField: 'locazioniConsuntivo',
      consuntivoPercentField: 'locazioniConsuntivoPercent',
      isBidirectional: false,
      isConsuntivoPercentBidirectional: true
    },
    { 
      code: '0220', 
      name: 'Costi del personale', 
      percent: (ecoParams?.personaleBudget || 0) / totalCorrispettivi, 
      budgetValue: ecoParams?.personaleBudget || 0,
      consuntivoValue: ecoParams?.personaleConsuntivo || 0,
      consuntivoPercent: (totals.totalConsuntivo) > 0 ? (ecoParams?.personaleConsuntivo || 0) / (totals.totalConsuntivo) : 0,
      dataTestId: 'eco-personale', 
      highlight: true,
      editable: true,
      field: 'personaleBudget',
      consuntivoField: 'personaleConsuntivo',
      consuntivoPercentField: 'personaleConsuntivoPercent',
      isBidirectional: false,
      isConsuntivoPercentBidirectional: true
    },
    { 
      code: '0240', 
      name: 'Utenze', 
      percent: (ecoParams?.utenzeBudget || 0) / totalCorrispettivi, 
      budgetValue: ecoParams?.utenzeBudget || 0,
      consuntivoValue: ecoParams?.utenzeConsuntivo || 0,
      consuntivoPercent: (totals.totalConsuntivo) > 0 ? (ecoParams?.utenzeConsuntivo || 0) / (totals.totalConsuntivo) : 0,
      dataTestId: null, 
      highlight: false,
      editable: true,
      field: 'utenzeBudget',
      consuntivoField: 'utenzeConsuntivo',
      consuntivoPercentField: 'utenzeConsuntivoPercent',
      isBidirectional: false,
      isConsuntivoPercentBidirectional: true
    },
    { 
      code: '0250', 
      name: 'Manutenzioni', 
      percent: (ecoParams?.manutenzionibudget || 0) / totalCorrispettivi, 
      budgetValue: ecoParams?.manutenzionibudget || 0,
      consuntivoValue: ecoParams?.manutenzioniConsuntivo || 0,
      consuntivoPercent: (totals.totalConsuntivo) > 0 ? (ecoParams?.manutenzioniConsuntivo || 0) / (totals.totalConsuntivo) : 0,
      dataTestId: null, 
      highlight: false,
      editable: true,
      field: 'manutenzionibudget',
      consuntivoField: 'manutenzioniConsuntivo',
      consuntivoPercentField: 'manutenzioniConsuntivoPercent',
      isBidirectional: false,
      isConsuntivoPercentBidirectional: true
    },
    { 
      code: '0260', 
      name: 'Noleggi e Leasing', 
      percent: (ecoParams?.noleggibudget || 0) / totalCorrispettivi, 
      budgetValue: ecoParams?.noleggibudget || 0,
      consuntivoValue: ecoParams?.noleggiConsuntivo || 0,
      consuntivoPercent: (totals.totalConsuntivo) > 0 ? (ecoParams?.noleggiConsuntivo || 0) / (totals.totalConsuntivo) : 0,
      dataTestId: null, 
      highlight: false,
      editable: true,
      field: 'noleggibudget',
      consuntivoField: 'noleggiConsuntivo',
      consuntivoPercentField: 'noleggiConsuntivoPercent',
      isBidirectional: false,
      isConsuntivoPercentBidirectional: true
    },
    { 
      code: '0310', 
      name: 'Prestazioni di terzi', 
      percent: (ecoParams?.prestazioniTerziBudget || 0) / totalCorrispettivi, 
      budgetValue: ecoParams?.prestazioniTerziBudget || 0,
      consuntivoValue: ecoParams?.prestazioniTerziConsuntivo || 0,
      consuntivoPercent: (totals.totalConsuntivo) > 0 ? (ecoParams?.prestazioniTerziConsuntivo || 0) / (totals.totalConsuntivo) : 0,
      dataTestId: null, 
      highlight: false,
      editable: true,
      field: 'prestazioniTerziBudget',
      consuntivoField: 'prestazioniTerziConsuntivo',
      consuntivoPercentField: 'prestazioniTerziConsuntivoPercent',
      isBidirectional: false,
      isConsuntivoPercentBidirectional: true
    },
    { 
      code: '0320', 
      name: 'Consulenze e compensi a terzi', 
      percent: (ecoParams?.consulenzeBudget || 0) / totalCorrispettivi, 
      budgetValue: ecoParams?.consulenzeBudget || 0,
      consuntivoValue: ecoParams?.consulenzeConsuntivo || 0,
      consuntivoPercent: (totals.totalConsuntivo) > 0 ? (ecoParams?.consulenzeConsuntivo || 0) / (totals.totalConsuntivo) : 0,
      dataTestId: null, 
      highlight: false,
      editable: true,
      field: 'consulenzeBudget',
      consuntivoField: 'consulenzeConsuntivo',
      consuntivoPercentField: 'consulenzeConsuntivoPercent',
      isBidirectional: false,
      isConsuntivoPercentBidirectional: true
    },
    { 
      code: '0330', 
      name: 'Marketing', 
      percent: (ecoParams?.marketingBudget || 0) / totalCorrispettivi, 
      budgetValue: ecoParams?.marketingBudget || 0,
      consuntivoValue: ecoParams?.marketingConsuntivo || 0,
      consuntivoPercent: (totals.totalConsuntivo) > 0 ? (ecoParams?.marketingConsuntivo || 0) / (totals.totalConsuntivo) : 0,
      dataTestId: null, 
      highlight: false,
      editable: true,
      field: 'marketingBudget',
      consuntivoField: 'marketingConsuntivo',
      consuntivoPercentField: 'marketingConsuntivoPercent',
      isBidirectional: false,
      isConsuntivoPercentBidirectional: true
    },
    { 
      code: '0340', 
      name: 'Delivery', 
      percent: (ecoParams?.deliveryBudget || 0) / totalCorrispettivi, 
      budgetValue: ecoParams?.deliveryBudget || 0,
      consuntivoValue: ecoParams?.deliveryConsuntivo || 0,
      consuntivoPercent: (totals.totalConsuntivo) > 0 ? (ecoParams?.deliveryConsuntivo || 0) / (totals.totalConsuntivo) : 0,
      dataTestId: null, 
      highlight: false,
      editable: true,
      field: 'deliveryBudget',
      consuntivoField: 'deliveryConsuntivo',
      consuntivoPercentField: 'deliveryConsuntivoPercent',
      isBidirectional: false,
      isConsuntivoPercentBidirectional: true
    },
    { 
      code: '0410', 
      name: 'Trasferte e viaggi', 
      percent: (ecoParams?.trasferteBudget || 0) / totalCorrispettivi, 
      budgetValue: ecoParams?.trasferteBudget || 0,
      consuntivoValue: ecoParams?.trasferteConsuntivo || 0,
      consuntivoPercent: (totals.totalConsuntivo) > 0 ? (ecoParams?.trasferteConsuntivo || 0) / (totals.totalConsuntivo) : 0,
      dataTestId: null, 
      highlight: false,
      editable: true,
      field: 'trasferteBudget',
      consuntivoField: 'trasferteConsuntivo',
      consuntivoPercentField: 'trasferteConsuntivoPercent',
      isBidirectional: false,
      isConsuntivoPercentBidirectional: true
    },
    { 
      code: '0520', 
      name: 'Assicurazioni', 
      percent: (ecoParams?.assicurazioniBudget || 0) / totalCorrispettivi, 
      budgetValue: ecoParams?.assicurazioniBudget || 0,
      consuntivoValue: ecoParams?.assicurazioniConsuntivo || 0,
      consuntivoPercent: (totals.totalConsuntivo) > 0 ? (ecoParams?.assicurazioniConsuntivo || 0) / (totals.totalConsuntivo) : 0,
      dataTestId: null, 
      highlight: false,
      editable: true,
      field: 'assicurazioniBudget',
      consuntivoField: 'assicurazioniConsuntivo',
      consuntivoPercentField: 'assicurazioniConsuntivoPercent',
      isBidirectional: false,
      isConsuntivoPercentBidirectional: true
    },
    { 
      code: '0530', 
      name: 'Spese bancarie', 
      percent: (ecoParams?.speseBancarieBudget || 0) / totalCorrispettivi, 
      budgetValue: ecoParams?.speseBancarieBudget || 0,
      consuntivoValue: ecoParams?.speseBancarieConsuntivo || 0,
      consuntivoPercent: (totals.totalConsuntivo) > 0 ? (ecoParams?.speseBancarieConsuntivo || 0) / (totals.totalConsuntivo) : 0,
      dataTestId: null, 
      highlight: false,
      editable: true,
      field: 'speseBancarieBudget',
      consuntivoField: 'speseBancarieConsuntivo',
      consuntivoPercentField: 'speseBancarieConsuntivoPercent',
      isBidirectional: false,
      isConsuntivoPercentBidirectional: true
    }
  ];
  
  // Calculate total cost percentage and EBITDA
  const totalCostPercent = costItems.reduce((sum, item) => sum + item.percent, 0);
  const ebitdaPercent = 1 - totalCostPercent;
  
  // Calculate consuntivo cost percentage and EBITDA for consuntivo column
  const totalCostPercentConsuntivo = costItems.reduce((sum, item) => sum + item.consuntivoPercent, 0);
  const ebitdaPercentConsuntivo = 1 - totalCostPercentConsuntivo;
  
  // Calculate actual EBITDA values in euros
  const totalCostsBudgetEuros = costItems.reduce((sum, item) => sum + (item.budgetValue || 0), 0);
  const totalCostsConsuntivoEuros = costItems.reduce((sum, item) => sum + (item.consuntivoValue || 0), 0);
  const ebitdaBudgetEuros = totals.totalBudget - totalCostsBudgetEuros;
  const ebitdaConsuntivoEuros = (totals.totalConsuntivo) - totalCostsConsuntivoEuros;

  // Export to PDF function
  const handleExportPDF = () => {
    if (!ecoParams || !foodCostMetrics) return;

    exportPLToPDF(
      ecoParams,
      totals,
      foodCostMetrics,
      selectedYear,
      selectedMonth
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <h1 className="text-3xl font-bold">Conto Economico (P&L)</h1>
        <p className="text-muted-foreground">
          Gestione completa del conto economico con analisi dei costi e margini
        </p>
        
        {/* Month/Year Selector */}
        <div className="flex items-center gap-4 bg-card p-4 rounded-lg">
          <Calendar className="w-5 h-5 text-muted-foreground" />
          <div className="flex items-center gap-2">
            <Select 
              value={selectedMonth.toString()} 
              onValueChange={(value) => setSelectedMonth(parseInt(value))}
              data-testid="select-month"
            >
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {monthNames.map((month, index) => (
                  <SelectItem key={index + 1} value={(index + 1).toString()}>
                    {month}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select 
              value={selectedYear.toString()} 
              onValueChange={(value) => setSelectedYear(parseInt(value))}
              data-testid="select-year"
            >
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[2024, 2025, 2026, 2027].map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Badge variant="outline">
            {monthNames[selectedMonth - 1]} {selectedYear}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportPDF}
            className="ml-auto"
            data-testid="button-export-pdf"
          >
            <Download className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Economic Table */}
      <Card>
        <CardHeader>
          <CardTitle>Conto Economico Dettagliato</CardTitle>
          <CardDescription>
            Analisi economica con Target %, Budget €, Consuntivo € e Consuntivo % per tutte le voci di costo.
            Integrazione diretta con i dati di Food Cost dalla Dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="mobile-table-scroll">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-48 md:w-80 text-xs md:text-sm mobile-text-large">Voce</TableHead>
                  <TableHead className="text-center w-16 md:w-20 text-xs md:text-sm">Target %</TableHead>
                  <TableHead className="text-right w-20 md:w-32 text-xs md:text-sm">Budget €</TableHead>
                  <TableHead className="text-right w-20 md:w-32 text-xs md:text-sm">Consuntivo €</TableHead>
                  <TableHead className="text-center w-16 md:w-20 text-xs md:text-sm">Consuntivo %</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* Revenue Row */}
                <TableRow className="bg-blue-50 dark:bg-blue-950/20 font-semibold">
                  <TableCell>0010 - Corrispettivi</TableCell>
                  <TableCell className="text-center">100,00%</TableCell>
                  <TableCell className="text-right" data-testid="eco-corrispettivi-budget">{formatCurrency(totals.totalBudget)}</TableCell>
                  <TableCell className="text-right" data-testid="eco-corrispettivi-consuntivo">{formatCurrency(totals.totalConsuntivo)}</TableCell>
                  <TableCell className="text-center">100,00%</TableCell>
                </TableRow>
                
                {/* Cost Items */}
                {costItems.map((item) => (
                  <TableRow key={item.code} className={item.highlight ? "bg-yellow-50 dark:bg-yellow-950/20" : ""}>
                    <TableCell className={item.highlight ? "font-medium" : ""}>{item.code} - {item.name}</TableCell>
                    {/* Target % Column */}
                    <TableCell 
                      className={`text-center ${item.highlight ? "font-medium" : ""} ${item.isBidirectional ? 'cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20 bg-yellow-100 dark:bg-yellow-900/30' : ''}`}
                      data-testid={item.dataTestId ? `${item.dataTestId}-percent` : undefined}
                      onClick={item.isBidirectional ? () => {
                        const currentValue = item.percent * 100;
                        const percentField = item.field === 'materieFirsteBudget' ? 'materieFirstePercent' : 
                                            item.field === 'acquistiVarBudget' ? 'acquistiVarPercent' : item.field;
                        handleEcoEdit(percentField as keyof UpdateEconomicParameters, currentValue);
                      } : undefined}
                    >
                      {item.isBidirectional && (
                        (ecoEditingField === 'materieFirstePercent' && item.field === 'materieFirsteBudget') ||
                        (ecoEditingField === 'acquistiVarPercent' && item.field === 'acquistiVarBudget')
                      ) ? (
                        <Input
                          value={ecoTempValue}
                          onChange={(e) => setEcoTempValue(e.target.value)}
                          onBlur={() => {
                            const percentField = item.field === 'materieFirsteBudget' ? 'materieFirstePercent' : 
                                                item.field === 'acquistiVarBudget' ? 'acquistiVarPercent' : item.field;
                            handleEcoSave(percentField as keyof UpdateEconomicParameters);
                            setEcoEditingField(null);
                          }}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              const percentField = item.field === 'materieFirsteBudget' ? 'materieFirstePercent' : 
                                                  item.field === 'acquistiVarBudget' ? 'acquistiVarPercent' : item.field;
                              handleEcoSave(percentField as keyof UpdateEconomicParameters);
                              setEcoEditingField(null);
                            }
                          }}
                          className="h-6 text-center"
                          autoFocus
                        />
                      ) : (
                        formatPercent(item.percent * 100)
                      )}
                    </TableCell>
                    {/* Budget € Column */}
                    <TableCell 
                      className={`text-right ${item.highlight ? "font-medium" : ""} ${!item.isBidirectional && item.field ? 'cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20 bg-yellow-100 dark:bg-yellow-900/30' : ''}`}
                      data-testid={item.dataTestId ? `${item.dataTestId}-budget` : undefined}
                      onClick={!item.isBidirectional && item.field ? () => {
                        const currentValue = item.budgetValue || 0;
                        handleEcoEdit(item.field as keyof UpdateEconomicParameters, currentValue);
                      } : undefined}
                    >
                      {ecoEditingField === item.field && !item.isBidirectional ? (
                        <Input
                          value={ecoTempValue}
                          onChange={(e) => setEcoTempValue(e.target.value)}
                          onBlur={() => {
                            handleEcoSave(item.field as keyof UpdateEconomicParameters);
                            setEcoEditingField(null);
                          }}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              handleEcoSave(item.field as keyof UpdateEconomicParameters);
                              setEcoEditingField(null);
                            }
                          }}
                          className="h-6 text-right"
                          autoFocus
                        />
                      ) : (
                        formatCurrency(item.budgetValue || 0)
                      )}
                    </TableCell>
                    {/* Consuntivo € Column */}
                    <TableCell 
                      className={`text-right ${item.highlight ? "font-medium" : ""} ${item.editable && item.consuntivoField ? 'cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20 bg-yellow-100 dark:bg-yellow-900/30' : ''}`}
                      data-testid={item.dataTestId ? `${item.dataTestId}-consuntivo` : undefined}
                      onClick={item.editable && item.consuntivoField ? () => {
                        const currentValue = item.consuntivoValue || 0;
                        handleEcoEdit(item.consuntivoField as keyof UpdateEconomicParameters, currentValue);
                      } : undefined}
                    >
                      {ecoEditingField === item.consuntivoField && item.editable && item.consuntivoField ? (
                        <Input
                          value={ecoTempValue}
                          onChange={(e) => setEcoTempValue(e.target.value)}
                          onBlur={() => {
                            handleEcoSave(item.consuntivoField as keyof UpdateEconomicParameters);
                            setEcoEditingField(null);
                          }}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              handleEcoSave(item.consuntivoField as keyof UpdateEconomicParameters);
                              setEcoEditingField(null);
                            }
                          }}
                          className="h-6 text-right"
                          autoFocus
                        />
                      ) : (
                        formatCurrency(item.consuntivoValue || 0)
                      )}
                    </TableCell>
                    {/* Consuntivo % Column */}
                    <TableCell className={`text-center ${item.highlight ? "font-medium" : ""}`}>
                      {item.isFromDashboard && item.foodCostPercent !== null ? 
                        formatPercent(item.foodCostPercent) : 
                        formatPercent(item.consuntivoPercent * 100)
                      }
                    </TableCell>
                  </TableRow>
                ))}
                
                {/* EBITDA Row */}
                <TableRow className="bg-green-50 dark:bg-green-950/20 border-t-2 font-bold">
                  <TableCell className="font-bold">10 - EBITDA</TableCell>
                  <TableCell className="text-center font-bold">{formatPercent(ebitdaPercent * 100)}</TableCell>
                  <TableCell className="text-right font-bold" data-testid="eco-ebitda-budget">
                    {formatCurrency(ebitdaBudgetEuros)}
                  </TableCell>
                  <TableCell className="text-right font-bold" data-testid="eco-ebitda-consuntivo">
                    {formatCurrency(ebitdaConsuntivoEuros)}
                  </TableCell>
                  <TableCell className="text-center font-bold">
                    <Badge 
                      variant="secondary"
                      className={`font-mono text-xs ${getPercentageColor(ebitdaPercentConsuntivo * 100)}`}
                    >
                      {formatPercent(ebitdaPercentConsuntivo * 100)}
                    </Badge>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}