import { useState } from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeProvider } from "next-themes";
import { useAuth, AuthProvider } from "@/hooks/use-auth";

// PDF Export utilities
import {
  exportInventoryToPDF,
  exportProductsToPDF,
  exportOrdersToPDF,
  exportDishesToPDF,
  exportWasteToPDF,
  exportDashboardToPDF
} from "@/utils/pdfExport";

// Components
import AppHeader from "@/components/AppHeader";
import { AppSidebar } from "@/components/AppSidebar";
import { Dashboard } from "@/components/Dashboard";
import Budget from "@/components/Budget";
import PL from "@/pages/PL";
import Recipes from "@/pages/Recipes";
import Suppliers from "@/pages/Suppliers";
import Sales from "@/pages/Sales";
import { Users, Calculator } from "lucide-react";
import { Button } from "@/components/ui/button";
import ProductForm from "@/components/ProductForm";
import ProductList from "@/components/ProductList";
import WasteForm from "@/components/WasteForm";
import WasteRegistry from "@/components/WasteRegistry";
import SalesSummary from "@/components/SalesSummary";
import OrderForm from "@/components/OrderForm";
import OrderList from "@/components/OrderList";
import StockMovementForm from "@/components/StockMovementForm";
import StockMovementList from "@/components/StockMovementList";
import InventoryGrid from "@/components/InventoryGrid";
import SalesChart from "@/components/SalesChart";
import { FloatingAIBot } from "@/components/FloatingAIBot";
import PWAInstallBanner from "@/components/PWAInstallBanner";

// API Hooks
import {
  useProducts,
  useSuppliers,
  useDishes,
  useWaste,
  usePersonalMeals,
  useOrders,
  useStockMovements,
  useInventorySnapshots,
  useSales,
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
  useUpdateDish,
  useCreateWaste,
  useCreatePersonalMeal,
  useCreateOrder,
  useUpdateOrder,
  useDeleteOrder,
  useCreateStockMovement,
  useUpdateStockMovement,
  useDeleteStockMovement,
  useCreateInventorySnapshot,
  useUpdateInventorySnapshot,
  useDeleteInventorySnapshot,
  useCreateSale,
  useDeleteSale,
} from "@/hooks/useApi";

// Types
import type { Product, Dish, Order, StockMovement, InventorySnapshot, InsertProduct, InsertWaste, InsertPersonalMeal, InsertOrder, InsertStockMovement, InsertInventorySnapshot, InsertSales } from "@shared/schema";

function FoodCostManager() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [maxFoodCost, setMaxFoodCost] = useState(30);
  const [, navigate] = useLocation();
  
  // Handle tab changes with navigation for special tabs
  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
  };
  
  // Edit state - keep as local state
  const [editingProduct, setEditingProduct] = useState<Product | undefined>();
  const [editingOrder, setEditingOrder] = useState<Order | undefined>();
  const [editingStockMovement, setEditingStockMovement] = useState<StockMovement | undefined>();
  const [selectedProductForMovements, setSelectedProductForMovements] = useState<string | null>(null);
  
  // React Query hooks for data fetching
  const { data: products = [], isLoading: isLoadingProducts } = useProducts();
  const { data: dishes = [], isLoading: isLoadingDishes } = useDishes();
  const { data: waste = [], isLoading: isLoadingWaste } = useWaste();
  const { data: personalMeals = [], isLoading: isLoadingPersonalMeals } = usePersonalMeals();
  const { data: orders = [], isLoading: isLoadingOrders } = useOrders();
  const { data: stockMovements = [], isLoading: isLoadingStockMovements } = useStockMovements();
  const { data: inventorySnapshots = [], isLoading: isLoadingInventorySnapshots } = useInventorySnapshots();
  const { data: salesData = [] } = useSales();
  const { data: editableInventory = [] } = useQuery({
    queryKey: ["/api/editable-inventory"],
    enabled: products.length > 0
  });

  // React Query mutations
  const createProductMutation = useCreateProduct();
  const updateProductMutation = useUpdateProduct();
  const deleteProductMutation = useDeleteProduct();
  
  const updateDishMutation = useUpdateDish();
  
  // Sales mutations
  const createSaleMutation = useCreateSale();
  const deleteSaleMutation = useDeleteSale();
  
  const createWasteMutation = useCreateWaste();
  const createPersonalMealMutation = useCreatePersonalMeal();
  
  const createOrderMutation = useCreateOrder();
  const updateOrderMutation = useUpdateOrder();
  const deleteOrderMutation = useDeleteOrder();
  
  const createStockMovementMutation = useCreateStockMovement();
  const updateStockMovementMutation = useUpdateStockMovement();
  const deleteStockMovementMutation = useDeleteStockMovement();
  
  const createInventorySnapshotMutation = useCreateInventorySnapshot();
  const updateInventorySnapshotMutation = useUpdateInventorySnapshot();
  const deleteInventorySnapshotMutation = useDeleteInventorySnapshot();

  // Product handlers
  const handleAddProduct = (product: InsertProduct) => {
    createProductMutation.mutate(product);
    console.log("Product creation submitted:", product);
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    console.log("Editing product:", product);
  };

  const handleUpdateProduct = (updatedProduct: InsertProduct) => {
    if (!editingProduct) return;
    
    updateProductMutation.mutate(
      { id: editingProduct.id, data: updatedProduct },
      {
        onSuccess: () => {
          setEditingProduct(undefined);
        },
      }
    );
    console.log("Product update submitted:", updatedProduct);
  };

  const handleCancelEditProduct = () => {
    setEditingProduct(undefined);
    console.log("Product edit cancelled");
  };

  const handleDeleteProduct = (productId: string) => {
    deleteProductMutation.mutate(productId);
    console.log("Product deletion submitted:", productId);
  };


  const handleUpdateSold = (dishId: string, sold: number) => {
    const dish = dishes.find(d => d.id === dishId);
    if (!dish || sold <= 0) return;
    
    // Create a sales record instead of updating dish.sold
    const saleData: InsertSales = {
      dishId: dishId,
      dishName: dish.name,
      quantitySold: sold,
      unitCost: dish.totalCost,
      unitRevenue: dish.netPrice,
      saleDate: new Date().toISOString().split('T')[0], // Today's date
      notes: `Vendita registrata tramite dashboard`
    };
    
    createSaleMutation.mutate(saleData);
    console.log("Sale record created:", saleData);
  };

  const handleClearSales = () => {
    // Delete all sales records from the sales table
    salesData.forEach(sale => {
      deleteSaleMutation.mutate(sale.id);
    });
    console.log("All sales records cleared");
  };

  // Waste and Personal Meal handlers
  const handleAddWaste = (wasteData: InsertWaste) => {
    createWasteMutation.mutate(wasteData);
    console.log("Waste creation submitted:", wasteData);
  };

  const handleAddPersonalMeal = (mealData: InsertPersonalMeal) => {
    createPersonalMealMutation.mutate(mealData);
    console.log("Personal meal creation submitted:", mealData);
  };

  // Order handlers
  const handleAddOrder = (order: InsertOrder) => {
    createOrderMutation.mutate(order);
    console.log("Order creation submitted:", order);
  };

  const handleEditOrder = (order: Order) => {
    setEditingOrder(order);
    console.log("Editing order:", order);
  };

  const handleUpdateOrder = (updatedOrder: InsertOrder) => {
    if (!editingOrder) return;
    
    updateOrderMutation.mutate(
      { id: editingOrder.id, data: { ...updatedOrder, notes: updatedOrder.notes || undefined, operatorName: updatedOrder.operatorName || undefined } },
      {
        onSuccess: () => {
          setEditingOrder(undefined);
        },
      }
    );
    console.log("Order update submitted:", updatedOrder);
  };

  const handleCancelEditOrder = () => {
    setEditingOrder(undefined);
    console.log("Order edit cancelled");
  };

  const handleDeleteOrder = (orderId: string) => {
    deleteOrderMutation.mutate(orderId);
    console.log("Order deletion submitted:", orderId);
  };

  // Stock Movement handlers
  const handleAddStockMovement = (movement: InsertStockMovement) => {
    createStockMovementMutation.mutate(movement);
    console.log("Stock movement creation submitted:", movement);
  };

  const handleEditStockMovement = (movement: StockMovement) => {
    setEditingStockMovement(movement);
    console.log("Editing stock movement:", movement);
  };

  const handleUpdateStockMovement = (updatedMovement: InsertStockMovement) => {
    if (!editingStockMovement) return;
    
    updateStockMovementMutation.mutate(
      { id: editingStockMovement.id, data: { ...updatedMovement, notes: updatedMovement.notes || undefined } },
      {
        onSuccess: () => {
          setEditingStockMovement(undefined);
        },
      }
    );
    console.log("Stock movement update submitted:", updatedMovement);
  };

  const handleCancelEditStockMovement = () => {
    setEditingStockMovement(undefined);
    console.log("Stock movement edit cancelled");
  };

  const handleDeleteStockMovement = (movementId: string) => {
    deleteStockMovementMutation.mutate(movementId);
    console.log("Stock movement deletion submitted:", movementId);
  };

  const handleViewMovements = (productId: string) => {
    setSelectedProductForMovements(productId);
  };

  const handleCreateSnapshot = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    // Calculate current theoretical quantity using SAME logic as InventoryGrid
    const latestSnapshot = inventorySnapshots
      .filter(s => s.productId === productId)
      .sort((a, b) => new Date(b.snapshotDate).getTime() - new Date(a.snapshotDate).getTime())[0];

    // FIXED BASELINE LOGIC: Use same logic as InventoryGrid
    let initialQuantity: number;
    let relevantMovements: StockMovement[];

    if (latestSnapshot) {
      // BASELINE FIX: Use finalQuantity as the baseline (actual counted stock at snapshot time)
      initialQuantity = latestSnapshot.finalQuantity;
      
      // Filter movements to only those AFTER the latest snapshot date
      const cutoffDate = new Date(latestSnapshot.snapshotDate);
      relevantMovements = stockMovements.filter(m => 
        m.productId === productId && new Date(m.movementDate) > cutoffDate
      );
    } else {
      // NO-SNAPSHOT FIX: No historic movements, just use current product quantity
      initialQuantity = product.quantity;
      relevantMovements = []; // No movements to consider
    }
    
    // Calculate IN/OUT quantities from relevant movements only
    const inQuantity = relevantMovements
      .filter(m => m.movementType === "in")
      .reduce((sum, m) => sum + m.quantity, 0);
    const outQuantity = relevantMovements
      .filter(m => m.movementType === "out")
      .reduce((sum, m) => sum + m.quantity, 0);
    
    // CORRECT SEMANTICS: Teorico = computed theoretical quantity (initial + IN - OUT)
    const theoreticalQuantity = initialQuantity + inQuantity - outQuantity;
    
    // Prompt user for actual measured quantity
    const actualQuantityStr = window.prompt(
      `Crea snapshot per: ${product.name}\n\n` +
      `Quantità teorica: ${theoreticalQuantity.toFixed(1)} ${product.unit}\n` +
      `Inserisci la quantità reale misurata:`,
      theoreticalQuantity.toFixed(1)
    );
    
    if (actualQuantityStr === null) return; // User cancelled
    
    const actualQuantity = parseFloat(actualQuantityStr);
    if (isNaN(actualQuantity) || actualQuantity < 0) {
      alert("Quantità non valida");
      return;
    }
    
    const variance = actualQuantity - theoreticalQuantity;
    const currentDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    
    // Create the snapshot with CORRECT semantics
    createInventorySnapshotMutation.mutate({
      productId,
      snapshotDate: currentDate,
      initialQuantity: initialQuantity, // FIXED: Use the baseline we started with
      finalQuantity: actualQuantity,   // User-entered actual measured quantity
      theoreticalQuantity: theoreticalQuantity, // Computed theoretical (baseline + IN - OUT)
      variance: variance // actualQuantity - theoreticalQuantity
    });
    
    console.log("Snapshot creation submitted:", {
      productId,
      theoretical: theoreticalQuantity,
      actual: actualQuantity,
      variance
    });
  };

  const handleExportPDF = () => {
    try {
      switch (activeTab) {
        case "inventory":
          // Get editable inventory data from queryClient
          const editableInventoryData = queryClient.getQueryData(["/api/editable-inventory"]) as any[] || [];
          exportInventoryToPDF(
            products, 
            editableInventoryData,
            stockMovements, 
            waste, 
            personalMeals, 
            dishes
          );
          break;
          
        case "food-cost":
          exportDishesToPDF(dishes, products);
          break;
          
        case "dishes":
          exportDishesToPDF(dishes, products);
          break;
        
        case "dashboard":
          // Dashboard PDF export with KPI data - use current selection
          const currentYear = parseInt(localStorage.getItem('foodyflow-selected-year') || new Date().getFullYear().toString());
          const currentMonth = parseInt(localStorage.getItem('foodyflow-selected-month') || (new Date().getMonth() + 1).toString());
          
          const dashboardData = queryClient.getQueryData(['/api/metrics/food-cost', currentYear, currentMonth]) as any;
          const ecoParams = queryClient.getQueryData(['/api/economic-parameters', currentYear, currentMonth]) as any;
          const budgetData = queryClient.getQueryData(['/api/budget-entries', currentYear, currentMonth]) as any[] || [];
          
          // Calculate totals for dashboard
          const totalRevenue = budgetData.reduce((sum, entry) => 
            sum + (entry.actualRevenue || 0) + (entry.actualDelivery || 0), 0);
          const ebitda = totalRevenue - (dashboardData?.totalFoodCost || 0) - 
            (ecoParams?.costiPersonale || 0) - (ecoParams?.costiGestione || 0) - 
            (ecoParams?.affitti || 0) - (ecoParams?.marketing || 0) - 
            (ecoParams?.ammortamenti || 0) - (ecoParams?.altriCosti || 0);
          const ebitdaPercentage = totalRevenue > 0 ? (ebitda / totalRevenue) * 100 : 0;
          
          exportDashboardToPDF(
            totalRevenue,
            dashboardData?.totalFoodCost || 0,
            dashboardData?.foodCostPercentage || 0,
            ebitda,
            ebitdaPercentage,
            currentYear,
            currentMonth
          );
          break;
          
        case "orders":
          exportOrdersToPDF(orders);
          break;
          
        case "warehouse":
          // Get editable inventory data for warehouse export
          const warehouseInventoryData = queryClient.getQueryData(["/api/editable-inventory"]) as any[] || [];
          exportInventoryToPDF(
            products, 
            warehouseInventoryData,
            stockMovements, 
            waste, 
            personalMeals, 
            dishes
          );
          break;
          
        case "waste":
          exportWasteToPDF(waste, products);
          break;
          
        case "products":
          exportProductsToPDF(products);
          break;
          
          
        case "sales-detail":
          // Usa la stessa funzione dei piatti ma con focus sulle vendite
          exportDishesToPDF(dishes, products);
          break;
          
        default:
          // Default to comprehensive inventory export
          const defaultInventoryData = queryClient.getQueryData(["/api/editable-inventory"]) as any[] || [];
          exportInventoryToPDF(
            products, 
            defaultInventoryData,
            stockMovements, 
            waste, 
            personalMeals, 
            dishes
          );
          break;
      }
      
      console.log(`PDF export completed for section: ${activeTab}`);
    } catch (error) {
      console.error("PDF export failed:", error);
      alert("Errore durante l'esportazione PDF. Riprova.");
    }
  };

  // Show loading state while data is being fetched
  const isLoading = isLoadingProducts || isLoadingDishes || isLoadingWaste || isLoadingPersonalMeals || isLoadingOrders || isLoadingStockMovements || isLoadingInventorySnapshots;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg font-medium">Caricamento dati...</div>
          <div className="text-sm text-muted-foreground mt-2">
            Connessione al database in corso
          </div>
        </div>
      </div>
    );
  }

  const sidebarStyle = {
    "--sidebar-width": "20rem",
    "--sidebar-width-icon": "4rem",
  };

  return (
    <SidebarProvider style={sidebarStyle as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar activeTab={activeTab} onTabChange={handleTabChange} />
        <div className="flex flex-col flex-1">
          <header className="flex items-center justify-between p-2 border-b">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <AppHeader onExportPDF={handleExportPDF} />
          </header>
          <main className="flex-1 overflow-auto p-4 sm:p-8">
          {/* Dashboard Tab */}
          {activeTab === "dashboard" && (
            <Dashboard
              products={products}
              dishes={dishes}
              orders={orders}
              stockMovements={stockMovements}
              inventorySnapshots={inventorySnapshots}
              editableInventory={editableInventory as any[]}
              waste={waste}
              personalMeals={personalMeals}
              onNavigateToSection={setActiveTab}
            />
          )}

          {/* Budget Tab */}
          {activeTab === "budget" && (
            <Budget />
          )}

          {/* Labour Cost Tab (Coming Soon) */}
          {activeTab === "labour-cost" && (
            <div className="text-center space-y-6 py-12">
              <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center">
                <Users className="h-12 w-12 text-muted-foreground" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold">Labour Cost Management</h2>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Gestione del personale, turni, produttività e costi del lavoro. 
                  Questa funzionalità sarà disponibile nelle prossime versioni.
                </p>
              </div>
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3 max-w-2xl mx-auto">
                  <div className="bg-card p-4 rounded-lg border">
                    <h3 className="font-semibold mb-2">Gestione Turni</h3>
                    <p className="text-sm text-muted-foreground">
                      Pianificazione e monitoraggio turni del personale
                    </p>
                  </div>
                  <div className="bg-card p-4 rounded-lg border">
                    <h3 className="font-semibold mb-2">Costi del Lavoro</h3>
                    <p className="text-sm text-muted-foreground">
                      Calcolo automatico stipendi e costi orari
                    </p>
                  </div>
                  <div className="bg-card p-4 rounded-lg border">
                    <h3 className="font-semibold mb-2">Produttività</h3>
                    <p className="text-sm text-muted-foreground">
                      Analisi performance e KPI del personale
                    </p>
                  </div>
                </div>
                <Button onClick={() => setActiveTab("dashboard")} variant="outline">
                  Torna alla Dashboard
                </Button>
              </div>
            </div>
          )}

          {/* Profit & Loss Tab */}
          {activeTab === "profit-loss" && (
            <PL />
          )}

          {/* Recipes Tab */}
          {activeTab === "recipes" && (
            <Recipes />
          )}

          {/* Suppliers Tab */}
          {activeTab === "suppliers" && (
            <Suppliers />
          )}

          {/* Inventory Tab */}
          {activeTab === "inventory" && (
            <div className="md:flex md:gap-6 space-y-6 md:space-y-0">
              <div className="md:w-1/2 space-y-6">
                <ProductForm 
                  onSubmit={editingProduct ? handleUpdateProduct : handleAddProduct}
                  editProduct={editingProduct}
                  onCancel={editingProduct ? handleCancelEditProduct : undefined}
                />
              </div>
              <div className="md:w-1/2 space-y-6">
                <ProductList 
                  products={products} 
                  onEdit={handleEditProduct}
                  onDelete={handleDeleteProduct}
                />
              </div>
            </div>
          )}

          {/* Food Cost Tab */}
          {activeTab === "food-cost" && (
            <div className="space-y-6">
              <SalesSummary 
                dishes={dishes}
                products={products}
                waste={waste}
                personalMeals={personalMeals}
                maxFoodCost={maxFoodCost}
                onMaxFoodCostChange={setMaxFoodCost}
                showSalesDetails={false}
              />
            </div>
          )}

          {/* Orders Tab */}
          {activeTab === "orders" && (
            <div className="md:flex md:gap-6 space-y-6 md:space-y-0">
              <div className="md:w-1/2">
                <OrderForm 
                  products={products} 
                  onSubmit={editingOrder ? handleUpdateOrder : handleAddOrder}
                  editOrder={editingOrder}
                  onCancel={editingOrder ? handleCancelEditOrder : undefined}
                />
              </div>
              <div className="md:w-1/2">
                <OrderList 
                  orders={orders} 
                  products={products}
                  onEdit={handleEditOrder}
                  onDelete={handleDeleteOrder}
                />
              </div>
            </div>
          )}

          {/* Warehouse Tab */}
          {activeTab === "warehouse" && (
            <div className="space-y-6">
              {/* Inventory Overview with 5 columns */}
              <InventoryGrid 
                products={products}
                stockMovements={stockMovements}
                waste={waste}
                personalMeals={personalMeals}
                onViewMovements={handleViewMovements}
              />
            </div>
          )}

          {/* Waste Tab */}
          {activeTab === "waste" && (
            <div className="space-y-6">
              <div className="max-w-2xl mx-auto">
                <WasteForm 
                  products={products}
                  dishes={dishes}
                  onSubmitWaste={handleAddWaste}
                  onSubmitPersonalMeal={handleAddPersonalMeal}
                />
              </div>
              
              <WasteRegistry 
                waste={waste}
                personalMeals={personalMeals}
                products={products}
                dishes={dishes}
              />
            </div>
          )}



          {/* Sales Detail Tab */}
          {activeTab === "sales-detail" && (
            <Sales />
          )}
          </main>
        </div>
      </div>
      
      {/* Bot Assistente IA sempre visibile */}
      <FloatingAIBot />
    </SidebarProvider>
  );
}

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      {isLoading || !isAuthenticated ? (
        <Route path="/" component={Landing} />
      ) : (
        <Route path="/" component={FoodCostManager} />
      )}
      {isAuthenticated && <Route component={FoodCostManager} />}
    </Switch>
  );
}

function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-sage-50 to-sage-100 dark:from-sage-950 dark:to-sage-900 flex items-center justify-center p-4">
      <div className="max-w-2xl mx-auto text-center space-y-8">
        <div className="space-y-4">
          <h1 className="text-5xl font-bold text-sage-900 dark:text-sage-100">
            FoodyFlow
          </h1>
          <p className="text-xl text-sage-700 dark:text-sage-300 font-medium">
            Evolve Your Eatery
          </p>
          <p className="text-lg text-muted-foreground max-w-lg mx-auto">
            Sistema completo di gestione ristorante per tracciare inventario, calcolare costi alimentari, gestire ricette e ottimizzare la redditività.
          </p>
        </div>
        
        <div className="space-y-4">
          <a 
            href="/api/login"
            className="inline-flex items-center justify-center px-8 py-3 text-lg font-medium text-gray-900 bg-sage-600 hover:bg-sage-700 hover:text-white rounded-lg transition-colors"
            data-testid="button-login"
          >
            Accedi al Tuo Ristorante
          </a>
          <p className="text-sm text-muted-foreground">
            Accedi con Google, GitHub, X, Apple o email/password
          </p>
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
        <TooltipProvider>
          <AuthProvider>
            <Router />
            <PWAInstallBanner />
          </AuthProvider>
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;