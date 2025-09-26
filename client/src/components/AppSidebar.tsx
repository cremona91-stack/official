import { 
  LayoutDashboard, 
  Calendar, 
  Calculator, 
  Users, 
  BarChart3, 
  Warehouse, 
  ChefHat, 
  Truck, 
  ArrowUpDown, 
  Trash2,
  Utensils,
  TrendingUp,
  Bot
} from "lucide-react";
import { useLocation } from "wouter";
import { 
  Sidebar, 
  SidebarContent, 
  SidebarGroup, 
  SidebarGroupContent, 
  SidebarGroupLabel, 
  SidebarMenu, 
  SidebarMenuButton, 
  SidebarMenuItem,
  SidebarHeader
} from "@/components/ui/sidebar";

// Primary operational tabs
const primaryTabs = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "budget", label: "Budget", icon: Calendar },
  { id: "profit-loss", label: "P&L", icon: TrendingUp },
  { id: "food-cost", label: "Food Cost", icon: Calculator },
  { id: "labour-cost", label: "Labour Cost", icon: Users },
  { id: "sales-detail", label: "Vendite", icon: BarChart3 },
];

// Management section tabs
const managementTabs = [
  { id: "suppliers", label: "Fornitori", icon: Users },
  { id: "inventory", label: "Inventario", icon: Warehouse },
  { id: "recipes", label: "Ricette", icon: ChefHat },
  { id: "orders", label: "Ordini", icon: Truck },
  { id: "waste", label: "Sprechi/Staff Food", icon: Trash2 },
  { id: "warehouse", label: "Magazzino", icon: ArrowUpDown },
];

interface AppSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function AppSidebar({ activeTab, onTabChange }: AppSidebarProps) {
  const [location, navigate] = useLocation();
  
  const handleNavigation = (item: any) => {
    // Ensure we're on the main route and just change the tab
    navigate("/");
    onTabChange(item.id);
  };

  const isActive = (item: any) => {
    return activeTab === item.id;
  };

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-border">
        <div className="flex items-center gap-2 px-4 py-3">
          <Utensils className="h-6 w-6 text-primary" />
          <div className="flex flex-col">
            <h1 className="text-lg font-bold text-foreground">FoodyFlow</h1>
            <p className="text-xs text-muted-foreground italic">Evolve Your Eatery</p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Operazioni</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {primaryTabs.map((item) => {
                const Icon = item.icon;
                return (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton 
                      onClick={() => handleNavigation(item)}
                      isActive={isActive(item)}
                      data-testid={`sidebar-${item.id}`}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        
        <SidebarGroup>
          <SidebarGroupLabel>Gestione</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {managementTabs.map((item) => {
                const Icon = item.icon;
                return (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton 
                      onClick={() => handleNavigation(item)}
                      isActive={isActive(item)}
                      data-testid={`sidebar-${item.id}`}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}