import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard,
  Warehouse, 
  Calculator, 
  Trash2, 
  TrendingUp, 
  Truck, 
  ArrowUpDown, 
  BarChart3,
  Users,
  TrendingUp as ProfitIcon,
  Calendar,
  ChefHat,
  Utensils
} from "lucide-react";

interface TabNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

// Primary operational tabs
const primaryTabs = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "budget", label: "Budget", icon: Calendar },
  { id: "profit-loss", label: "P&L", icon: ProfitIcon },
  { id: "food-cost", label: "Food Cost", icon: Calculator },
  { id: "labour-cost", label: "Labour Cost", icon: Users },
  { id: "sales-detail", label: "Vendite", icon: BarChart3 },
];

// Management section tabs (after separator)
const managementTabs = [
  { id: "inventory", label: "Inventario", icon: Warehouse },
  { id: "recipes", label: "Ricette", icon: ChefHat },
  { id: "suppliers", label: "Fornitori", icon: Users },
  { id: "orders", label: "Ordini", icon: Truck },
  { id: "warehouse", label: "Magazzino", icon: ArrowUpDown },
  { id: "waste", label: "Sprechi/Staff Food", icon: Trash2 },
];

export default function TabNavigation({ activeTab, onTabChange }: TabNavigationProps) {  
  const renderTab = (tab: any, key: string) => {
    const Icon = tab.icon;
    const isActive = activeTab === tab.id;
    
    return (
      <Button
        key={key}
        variant="ghost"
        size="default"
        onClick={() => onTabChange(tab.id)}
        data-testid={`tab-${tab.id}`}
        className={`flex-1 min-w-0 rounded-none py-3 px-2 md:px-4 text-xs md:text-sm hover-elevate transition-colors flex items-center justify-center gap-1 md:gap-2 mobile-touch-target ${
          isActive 
            ? "bg-background border-b-2 border-primary text-primary font-medium" 
            : "text-muted-foreground"
        }`}
        aria-label={tab.label}
        title={tab.label}
      >
        <Icon className="h-4 w-4 flex-shrink-0" />
        <span className="hidden sm:inline mobile-text-large">{tab.label}</span>
      </Button>
    );
  };
  
  return (
    <nav className="flex bg-muted border-b border-border mobile-table-scroll">
      {/* Primary operational tabs */}
      {primaryTabs.map((tab, index) => renderTab(tab, `primary-${index}`))}
      
      {/* Visual separator with fork icon */}
      <div className="flex items-center justify-center px-1 md:px-2 flex-shrink-0">
        <Utensils className="h-4 w-4 text-red-500" />
      </div>
      
      {/* Management section tabs */}
      {managementTabs.map((tab, index) => renderTab(tab, `management-${index}`))}
    </nav>
  );
}