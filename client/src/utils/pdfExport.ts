import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Product, StockMovement, Order, Waste, PersonalMeal, Recipe, Dish, EditableInventory, BudgetEntry } from '@shared/schema';

// Universal PDF export interface
interface PDFExportOptions {
  title: string;
  subtitle?: string;
  data: any[];
  columns: { header: string; dataKey: string; width?: number }[];
  filename: string;
  orientation?: 'portrait' | 'landscape';
  showDate?: boolean;
  footerText?: string;
}

// Enhanced PDF header setup
const setupPDFHeader = (doc: jsPDF, title: string, subtitle?: string) => {
  // Calculate center X position dynamically
  const centerX = doc.internal.pageSize.width / 2;
  
  // Header
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("FoodyFlow", centerX, 20, { align: "center" });
  
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(title, centerX, 30, { align: "center" });
  
  if (subtitle) {
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(subtitle, centerX, 40, { align: "center" });
  }
  
  // Date
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  const date = new Date().toLocaleDateString('it-IT', {
    year: 'numeric',
    month: 'long', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  doc.text(`Data generazione: ${date}`, centerX, subtitle ? 50 : 40, { align: "center" });
  
  // Add line separator
  const startY = subtitle ? 60 : 50;
  doc.setLineWidth(0.5);
  doc.line(20, startY, doc.internal.pageSize.width - 20, startY);
  
  return startY + 10;
};

// Unified footer system for all PDF reports  
const addUnifiedFooter = (doc: jsPDF, footerText?: string): void => {
  const totalPages = doc.getNumberOfPages();
  const pageHeight = doc.internal.pageSize.height;
  const centerX = doc.internal.pageSize.width / 2;
  
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    
    if (footerText) {
      doc.text(footerText, centerX, pageHeight - 15, { align: "center" });
    }
    
    const pageNumber = `Pagina ${i} di ${totalPages}`;
    doc.text(pageNumber, doc.internal.pageSize.width - 25, pageHeight - 10);
  }
};

// Universal table export function
export const exportTableToPDF = (options: PDFExportOptions): void => {
  const doc = new jsPDF({
    orientation: options.orientation || 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const startY = setupPDFHeader(doc, options.title, options.subtitle);

  // Prepare table data
  const tableData = options.data.map(row => 
    options.columns.map(col => {
      const value = row[col.dataKey];
      if (value === null || value === undefined) return '';
      if (typeof value === 'number') {
        // Format currency and percentages based on header content
        if (col.header.includes('€') || col.header.includes('Budget') || col.header.includes('Incasso') || col.header.includes('C.M.')) {
          return `€${value.toFixed(2)}`;
        }
        if (col.header.includes('%') || col.dataKey.includes('Percentage') || col.dataKey.includes('Delta')) {
          return `${value.toFixed(1)}%`;
        }
        return value.toFixed(2);
      }
      return String(value);
    })
  );

  // Generate table using autoTable
  autoTable(doc, {
    head: [options.columns.map(col => col.header)],
    body: tableData,
    startY: startY,
    margin: { left: 15, right: 15 },
    styles: {
      fontSize: 8,
      cellPadding: 2,
    },
    headStyles: {
      fillColor: [45, 90, 61], // FoodyFlow green
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245],
    },
    columnStyles: options.columns.reduce((acc, col, index) => {
      if (col.width) {
        acc[index] = { cellWidth: col.width };
      }
      return acc;
    }, {} as any),
  });

  // Use unified footer system
  addUnifiedFooter(doc, options.footerText);

  // Save the PDF
  doc.save(options.filename);
};

// Export Budget report with calculations
export const exportBudgetToPDF = (budgetEntries: BudgetEntry[], selectedYear: number, selectedMonth: number): void => {
  const monthNames = [
    'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
    'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
  ];

  const columns = [
    { header: 'Giorno', dataKey: 'day', width: 15 },
    { header: 'C.M. €', dataKey: 'copertoMedio', width: 20 },
    { header: 'Coperti', dataKey: 'coperti', width: 20 },
    { header: 'Sala Budget €', dataKey: 'salaBudget', width: 25 },
    { header: 'Delivery Budget €', dataKey: 'budgetDelivery', width: 30 },
    { header: 'Sala Incasso 25 €', dataKey: 'actualRevenue', width: 30 },
    { header: 'Delivery 25 €', dataKey: 'actualDelivery', width: 25 },
    { header: 'Consuntivo 26', dataKey: 'consuntivo', width: 25 },
    { header: 'Consuntivo 25', dataKey: 'consuntivo2025', width: 25 },
    { header: 'Delta %', dataKey: 'deltaPercentage', width: 20 }
  ];

  const exportData = budgetEntries.map(entry => {
    const salaBudget = (entry.coperti || 0) * (entry.copertoMedio || 0);
    const consuntivo2025 = (entry.actualRevenue || 0) + (entry.actualDelivery || 0);
    const consuntivo2026 = entry.consuntivo || 0;
    const deltaPercentage = consuntivo2025 > 0 ? ((consuntivo2026 - consuntivo2025) / consuntivo2025) * 100 : 0;

    return {
      day: entry.day,
      copertoMedio: entry.copertoMedio || 0,
      coperti: entry.coperti || 0,
      salaBudget: salaBudget,
      budgetDelivery: entry.budgetDelivery || 0,
      actualRevenue: entry.actualRevenue || 0,
      actualDelivery: entry.actualDelivery || 0,
      consuntivo: consuntivo2026,
      consuntivo2025: consuntivo2025,
      deltaPercentage: deltaPercentage
    };
  });

  exportTableToPDF({
    title: 'Budget Report',
    subtitle: `${monthNames[selectedMonth - 1]} ${selectedYear}`,
    data: exportData,
    columns: columns,
    filename: `budget-${monthNames[selectedMonth - 1].toLowerCase()}-${selectedYear}.pdf`,
    orientation: 'landscape',
    footerText: 'FoodyFlow - Sistema di Gestione Ristorante'
  });
};

// Export Dashboard KPI report
export const exportDashboardToPDF = (
  totalRevenue: number,
  totalFoodCost: number,
  foodCostPercentage: number,
  ebitda: number,
  ebitdaPercentage: number,
  selectedYear: number,
  selectedMonth: number
): void => {
  const monthNames = [
    'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
    'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
  ];

  const doc = new jsPDF();
  const startY = setupPDFHeader(doc, 'Dashboard KPI Report', `${monthNames[selectedMonth - 1]} ${selectedYear}`);

  // KPI Cards
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text('Indicatori Chiave di Performance', 20, startY);

  let currentY = startY + 15;

  // Revenue section
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text('Ricavi Totali', 20, currentY);
  doc.setFont("helvetica", "normal");
  doc.text(`€${totalRevenue.toFixed(2)}`, 120, currentY);
  currentY += 12;

  // Food Cost section
  doc.setFont("helvetica", "bold");
  doc.text('Costo del Cibo', 20, currentY);
  doc.setFont("helvetica", "normal");
  doc.text(`€${totalFoodCost.toFixed(2)} (${foodCostPercentage.toFixed(1)}%)`, 120, currentY);
  currentY += 12;

  // EBITDA section
  doc.setFont("helvetica", "bold");
  doc.text('EBITDA', 20, currentY);
  doc.setFont("helvetica", "normal");
  doc.text(`€${ebitda.toFixed(2)} (${ebitdaPercentage.toFixed(1)}%)`, 120, currentY);
  currentY += 20;

  // Performance Analysis
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text('Analisi Performance', 20, currentY);
  currentY += 10;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  
  // Food cost analysis
  if (foodCostPercentage <= 30) {
    doc.text('• Food Cost ottimale (≤30%)', 25, currentY);
  } else if (foodCostPercentage <= 35) {
    doc.text('• Food Cost accettabile (30-35%)', 25, currentY);
  } else {
    doc.text('• Food Cost elevato (>35%) - attenzione', 25, currentY);
  }
  currentY += 8;

  // EBITDA analysis
  if (ebitdaPercentage >= 15) {
    doc.text('• EBITDA eccellente (≥15%)', 25, currentY);
  } else if (ebitdaPercentage >= 10) {
    doc.text('• EBITDA buono (10-15%)', 25, currentY);
  } else {
    doc.text('• EBITDA basso (<10%) - miglioramenti necessari', 25, currentY);
  }

  // Use unified footer system after content is complete
  addUnifiedFooter(doc, 'FoodyFlow - Dashboard Report');

  doc.save(`dashboard-kpi-${monthNames[selectedMonth - 1].toLowerCase()}-${selectedYear}.pdf`);
};

// Export P&L Analysis report
export const exportPLToPDF = (
  economicParams: any,
  budgetTotals: any,
  foodCostMetrics: any,
  selectedYear: number,
  selectedMonth: number
): void => {
  const monthNames = [
    'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
    'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
  ];

  const doc = new jsPDF();
  const startY = setupPDFHeader(doc, 'Profit & Loss Analysis', `${monthNames[selectedMonth - 1]} ${selectedYear}`);

  let currentY = startY;

  // Economic Parameters Section
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text('Parametri Economici', 20, currentY);
  currentY += 12;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");

  const economicData = [
    ['Ricavi Budget', `€${budgetTotals.totalBudget.toFixed(2)}`],
    ['Ricavi Effettivi', `€${budgetTotals.totalConsuntivo.toFixed(2)}`],
    ['Food Cost', `€${foodCostMetrics.totalFoodCost.toFixed(2)}`],
    ['Food Cost %', `${foodCostMetrics.foodCostPercentage.toFixed(1)}%`],
    ['Costi Personale', `€${economicParams?.costiPersonale || 0}`],
    ['Costi Gestione', `€${economicParams?.costiGestione || 0}`],
    ['Affitti', `€${economicParams?.affitti || 0}`],
    ['Marketing', `€${economicParams?.marketing || 0}`],
    ['Ammortamenti', `€${economicParams?.ammortamenti || 0}`],
    ['Altri Costi', `€${economicParams?.altriCosti || 0}`]
  ];

  autoTable(doc, {
    body: economicData,
    startY: currentY,
    margin: { left: 20, right: 20 },
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 80 },
      1: { halign: 'right', cellWidth: 60 }
    }
  });

  // Save the PDF
  doc.save(`pl-analysis-${monthNames[selectedMonth - 1].toLowerCase()}-${selectedYear}.pdf`);
};

// Export Inventory/Warehouse as PDF
export const exportInventoryToPDF = (
  products: Product[], 
  editableInventory: EditableInventory[],
  stockMovements: StockMovement[],
  waste: Waste[],
  personalMeals: PersonalMeal[],
  dishes: Dish[]
) => {
  const doc = new jsPDF();
  let yPos = setupPDFHeader(doc, "Report Magazzino Editabile");
  
  // Helper function to calculate OUT movements like in InventoryGrid
  const calculateAggregatedOutMovements = (productId: string): number => {
    // Calculate sales OUT (from stock movements with source = "sale")
    const salesOut = stockMovements
      .filter(m => m.productId === productId && m.movementType === "out" && m.source === "sale")
      .reduce((sum, m) => sum + m.quantity, 0);

    // Calculate waste OUT
    const wasteOut = waste
      .filter(w => w.productId === productId)
      .reduce((sum, w) => sum + w.quantity, 0);

    // Calculate personal meals OUT
    const personalMealsOut = personalMeals.reduce((sum, meal) => {
      const dish = dishes.find(d => d.id === meal.dishId);
      if (!dish) return sum;
      
      const ingredient = dish.ingredients?.find((ing: any) => ing.productId === productId);
      if (!ingredient) return sum;
      
      return sum + (ingredient.quantity * meal.quantity);
    }, 0);

    // Calculate dish sales OUT
    const dishSalesOut = dishes.reduce((sum, dish) => {
      if (!dish.sold || dish.sold <= 0) return sum;
      
      const ingredient = dish.ingredients?.find((ing: any) => ing.productId === productId);
      if (!ingredient) return sum;
      
      return sum + (ingredient.quantity * dish.sold);
    }, 0);

    return salesOut + wasteOut + personalMealsOut + dishSalesOut;
  };

  // Calculate statistics
  const inventoryData = products.map(product => {
    const editableRecord = editableInventory.find(ei => ei.productId === product.id);
    const initialQuantity = editableRecord?.initialQuantity || 0;
    const finalQuantity = editableRecord?.finalQuantity || 0;
    
    const inQuantity = stockMovements
      .filter(m => m.productId === product.id && m.movementType === "in")
      .reduce((sum, m) => sum + m.quantity, 0);
    
    const outQuantity = calculateAggregatedOutMovements(product.id);
    const variance = initialQuantity + inQuantity - outQuantity - finalQuantity;
    
    return {
      name: product.name,
      code: product.code,
      unit: product.unit,
      pricePerUnit: product.pricePerUnit,
      initialQuantity,
      inQuantity,
      outQuantity,
      finalQuantity,
      variance,
      finalValue: finalQuantity * product.pricePerUnit,
      varianceValue: variance * product.pricePerUnit
    };
  });

  // Summary statistics
  const totalFinalValue = inventoryData.reduce((sum, item) => sum + item.finalValue, 0);
  const totalVarianceValue = inventoryData.reduce((sum, item) => sum + item.varianceValue, 0);

  // Summary section
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("RIEPILOGO", 14, yPos);
  yPos += 10;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`Prodotti totali: ${products.length}`, 14, yPos);
  doc.text(`Valore Inventario: €${totalFinalValue.toFixed(1)}`, 14, yPos + 6);
  doc.text(`Valore Varianza: €${totalVarianceValue.toFixed(1)}`, 14, yPos + 12);
  yPos += 25;

  // Table data
  const tableColumns = [
    'Prodotto', 'Codice', 'Iniziale', 'IN', 'OUT', 'Finale', 'Varianza', 'Valore Finale', 'Valore Varianza'
  ];

  const tableRows = inventoryData.map(item => [
    item.name,
    item.code,
    `${item.initialQuantity.toFixed(1)} ${item.unit}`,
    `${item.inQuantity.toFixed(1)} ${item.unit}`,
    `${item.outQuantity.toFixed(1)} ${item.unit}`,
    `${item.finalQuantity.toFixed(1)} ${item.unit}`,
    `${item.variance >= 0 ? '+' : ''}${item.variance.toFixed(1)} ${item.unit}`,
    `€${item.finalValue.toFixed(1)}`,
    `€${item.varianceValue.toFixed(1)}`
  ]);

  autoTable(doc, {
    startY: yPos,
    head: [tableColumns],
    body: tableRows,
    styles: {
      fontSize: 8,
      cellPadding: 2
    },
    headStyles: {
      fillColor: [74, 144, 226],
      textColor: 255,
      fontStyle: 'bold'
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245]
    },
    didParseCell: (data: any) => {
      // Color variance columns (6 and 8) based on positive/negative values
      if (data.column.index === 6 || data.column.index === 8) {
        const text = data.cell.text[0] || '';
        const value = parseFloat(text.replace(/[+€]/g, ''));
        if (value < 0) {
          data.cell.styles.textColor = [220, 38, 27]; // Red for negative
        } else {
          data.cell.styles.textColor = [107, 114, 126]; // Gray for positive
        }
      }
    }
  });

  doc.save(`inventario-${new Date().toISOString().split('T')[0]}.pdf`);
};

// Export Products as PDF
export const exportProductsToPDF = (products: Product[]) => {
  const doc = new jsPDF();
  let yPos = setupPDFHeader(doc, "Lista Prodotti");

  const tableColumns = ['Nome', 'Codice', 'Fornitore', 'Unità', 'Prezzo/Unità'];
  
  const tableRows = products.map(product => [
    product.name,
    product.code,
    product.supplier || 'N/A',
    product.unit,
    `€${product.pricePerUnit.toFixed(1)}`
  ]);

  autoTable(doc, {
    startY: yPos,
    head: [tableColumns],
    body: tableRows,
    styles: {
      fontSize: 10,
      cellPadding: 3
    },
    headStyles: {
      fillColor: [74, 144, 226],
      textColor: 255,
      fontStyle: 'bold'
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245]
    }
  });

  doc.save(`prodotti-${new Date().toISOString().split('T')[0]}.pdf`);
};

// Export Orders as PDF
export const exportOrdersToPDF = (orders: Order[]) => {
  const doc = new jsPDF();
  let yPos = setupPDFHeader(doc, "Lista Ordini");

  const tableColumns = ['Data', 'Fornitore', 'Stato', 'Totale', 'Note'];
  
  const tableRows = orders.map(order => [
    new Date(order.orderDate).toLocaleDateString('it-IT'),
    order.supplier,
    order.status === 'pending' ? 'In Attesa' : 
    order.status === 'confirmed' ? 'Confermato' : 'Annullato',
    `€${order.totalAmount.toFixed(1)}`,
    order.notes || 'N/A'
  ]);

  autoTable(doc, {
    startY: yPos,
    head: [tableColumns],
    body: tableRows,
    styles: {
      fontSize: 10,
      cellPadding: 3
    },
    headStyles: {
      fillColor: [74, 144, 226],
      textColor: 255,
      fontStyle: 'bold'
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245]
    },
  });

  doc.save(`ordini-${new Date().toISOString().split('T')[0]}.pdf`);
};

// Export Recipes as PDF
export const exportRecipesToPDF = (recipes: Recipe[], products: Product[]) => {
  const doc = new jsPDF();
  let yPos = setupPDFHeader(doc, "Lista Ricette");

  // Create detailed recipe data
  const recipeData = recipes.map(recipe => {
    const totalCost = recipe.ingredients.reduce((sum, ingredient) => {
      const product = products.find(p => p.id === ingredient.productId);
      return sum + (ingredient.quantity * (product?.pricePerUnit || 0));
    }, 0);

    return {
      name: recipe.name,
      ingredientsCount: recipe.ingredients.length,
      totalCost: totalCost,
      ingredients: recipe.ingredients.map(ingredient => {
        const product = products.find(p => p.id === ingredient.productId);
        return {
          name: product?.name || 'Prodotto sconosciuto',
          quantity: ingredient.quantity,
          unit: product?.unit || '',
          cost: ingredient.quantity * (product?.pricePerUnit || 0)
        };
      })
    };
  });

  const tableColumns = ['Nome Ricetta', 'Ingredienti', 'Costo Totale'];
  
  const tableRows = recipeData.map(recipe => [
    recipe.name,
    recipe.ingredientsCount.toString(),
    `€${recipe.totalCost.toFixed(1)}`
  ]);

  autoTable(doc, {
    startY: yPos,
    head: [tableColumns],
    body: tableRows,
    styles: {
      fontSize: 10,
      cellPadding: 3
    },
    headStyles: {
      fillColor: [74, 144, 226],
      textColor: 255,
      fontStyle: 'bold'
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245]
    }
  });

  doc.save(`ricette-${new Date().toISOString().split('T')[0]}.pdf`);
};

// Export Dishes as PDF
export const exportDishesToPDF = (dishes: Dish[], products: Product[]) => {
  const doc = new jsPDF();
  let yPos = setupPDFHeader(doc, "Lista Piatti");

  const tableColumns = ['Nome Piatto', 'Prezzo Vendita', 'Costo Ingredienti', 'Food Cost %', 'Venduti'];
  
  const tableRows = dishes.map(dish => [
    dish.name,
    `€${dish.sellingPrice.toFixed(1)}`,
    `€${dish.totalCost.toFixed(1)}`,
    `${dish.foodCost.toFixed(1)}%`,
    (dish.sold || 0).toString()
  ]);

  autoTable(doc, {
    startY: yPos,
    head: [tableColumns],
    body: tableRows,
    styles: {
      fontSize: 10,
      cellPadding: 3
    },
    headStyles: {
      fillColor: [74, 144, 226],
      textColor: 255,
      fontStyle: 'bold'
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245]
    },
  });

  doc.save(`piatti-${new Date().toISOString().split('T')[0]}.pdf`);
};

// Export Waste as PDF
export const exportWasteToPDF = (waste: Waste[], products: Product[]) => {
  const doc = new jsPDF();
  let yPos = setupPDFHeader(doc, "Registro Sprechi");

  // Calculate total waste cost
  const totalWasteCost = waste.reduce((sum, w) => {
    const product = products.find(p => p.id === w.productId);
    return sum + (w.quantity * (product?.pricePerUnit || 0));
  }, 0);

  // Summary
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("RIEPILOGO SPRECHI", 14, yPos);
  yPos += 10;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`Totale registrazioni: ${waste.length}`, 14, yPos);
  doc.text(`Valore totale sprechi: €${totalWasteCost.toFixed(1)}`, 14, yPos + 6);
  yPos += 20;

  const tableColumns = ['Data', 'Prodotto', 'Quantità', 'Motivo', 'Costo'];
  
  const tableRows = waste.map(w => {
    const product = products.find(p => p.id === w.productId);
    const cost = w.quantity * (product?.pricePerUnit || 0);
    
    return [
      new Date(w.date).toLocaleDateString('it-IT'),
      product?.name || 'Prodotto sconosciuto',
      `${w.quantity.toFixed(1)} ${product?.unit || ''}`,
      w.notes || 'N/A',
      `€${cost.toFixed(1)}`
    ];
  });

  autoTable(doc, {
    startY: yPos,
    head: [tableColumns],
    body: tableRows,
    styles: {
      fontSize: 10,
      cellPadding: 3
    },
    headStyles: {
      fillColor: [220, 38, 27], // Red theme for waste
      textColor: 255,
      fontStyle: 'bold'
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245]
    }
  });

  doc.save(`sprechi-${new Date().toISOString().split('T')[0]}.pdf`);
};