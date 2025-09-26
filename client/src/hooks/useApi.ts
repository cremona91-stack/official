import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import type { 
  Product, Supplier, Recipe, Dish, Waste, PersonalMeal, Order, StockMovement, InventorySnapshot, Sales,
  InsertProduct, InsertSupplier, InsertRecipe, InsertDish, InsertWaste, InsertPersonalMeal, InsertOrder, InsertStockMovement, InsertInventorySnapshot, InsertSales,
  UpdateProduct, UpdateSupplier, UpdateRecipe, UpdateDish, UpdateOrder, UpdateStockMovement, UpdateInventorySnapshot, UpdateSales
} from "@shared/schema";

// Products hooks
export function useProducts() {
  return useQuery({
    queryKey: ["/api/products"],
    queryFn: api.products.getProducts,
  });
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: ["/api/products", id],
    queryFn: () => api.products.getProduct(id),
    enabled: !!id,
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: api.products.createProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({
        title: "Successo",
        description: "Prodotto creato con successo",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Errore",
        description: error.message || "Errore durante la creazione del prodotto",
        variant: "destructive",
      });
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateProduct }) =>
      api.products.updateProduct(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({
        title: "Successo",
        description: "Prodotto aggiornato con successo",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Errore",
        description: error.message || "Errore durante l'aggiornamento del prodotto",
        variant: "destructive",
      });
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: api.products.deleteProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({
        title: "Successo",
        description: "Prodotto eliminato con successo",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Errore",
        description: error.message || "Errore durante l'eliminazione del prodotto",
        variant: "destructive",
      });
    },
  });
}

// Suppliers hooks
export function useSuppliers() {
  return useQuery({
    queryKey: ["/api/suppliers"],
    queryFn: api.suppliers.getSuppliers,
  });
}

export function useSupplier(id: string) {
  return useQuery({
    queryKey: ["/api/suppliers", id],
    queryFn: () => api.suppliers.getSupplier(id),
    enabled: !!id,
  });
}

export function useCreateSupplier() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: api.suppliers.createSupplier,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers"] });
      toast({
        title: "Successo",
        description: "Fornitore creato con successo",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Errore",
        description: error.message || "Errore durante la creazione del fornitore",
        variant: "destructive",
      });
    },
  });
}

export function useUpdateSupplier() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateSupplier }) =>
      api.suppliers.updateSupplier(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers"] });
      toast({
        title: "Successo",
        description: "Fornitore aggiornato con successo",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Errore",
        description: error.message || "Errore durante l'aggiornamento del fornitore",
        variant: "destructive",
      });
    },
  });
}

export function useDeleteSupplier() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: api.suppliers.deleteSupplier,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers"] });
      toast({
        title: "Successo",
        description: "Fornitore eliminato con successo",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Errore",
        description: error.message || "Errore durante l'eliminazione del fornitore",
        variant: "destructive",
      });
    },
  });
}

// Recipes hooks
export function useRecipes() {
  return useQuery({
    queryKey: ["/api/recipes"],
    queryFn: api.recipes.getRecipes,
  });
}

export function useRecipe(id: string) {
  return useQuery({
    queryKey: ["/api/recipes", id],
    queryFn: () => api.recipes.getRecipe(id),
    enabled: !!id,
  });
}

export function useCreateRecipe() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: api.recipes.createRecipe,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recipes"] });
      toast({
        title: "Successo",
        description: "Ricetta creata con successo",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Errore",
        description: error.message || "Errore durante la creazione della ricetta",
        variant: "destructive",
      });
    },
  });
}

export function useUpdateRecipe() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateRecipe }) =>
      api.recipes.updateRecipe(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recipes"] });
      toast({
        title: "Successo",
        description: "Ricetta aggiornata con successo",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Errore",
        description: error.message || "Errore durante l'aggiornamento della ricetta",
        variant: "destructive",
      });
    },
  });
}

export function useDeleteRecipe() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: api.recipes.deleteRecipe,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recipes"] });
      toast({
        title: "Successo",
        description: "Ricetta eliminata con successo",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Errore",
        description: error.message || "Errore durante l'eliminazione della ricetta",
        variant: "destructive",
      });
    },
  });
}

// Dishes hooks
export function useDishes() {
  return useQuery({
    queryKey: ["/api/dishes"],
    queryFn: api.dishes.getDishes,
  });
}

export function useDish(id: string) {
  return useQuery({
    queryKey: ["/api/dishes", id],
    queryFn: () => api.dishes.getDish(id),
    enabled: !!id,
  });
}

export function useCreateDish() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: api.dishes.createDish,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dishes"] });
      toast({
        title: "Successo",
        description: "Piatto creato con successo",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Errore",
        description: error.message || "Errore durante la creazione del piatto",
        variant: "destructive",
      });
    },
  });
}

export function useUpdateDish() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateDish }) =>
      api.dishes.updateDish(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dishes"] });
      toast({
        title: "Successo",
        description: "Piatto aggiornato con successo",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Errore",
        description: error.message || "Errore durante l'aggiornamento del piatto",
        variant: "destructive",
      });
    },
  });
}

export function useDeleteDish() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: api.dishes.deleteDish,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dishes"] });
      toast({
        title: "Successo",
        description: "Piatto eliminato con successo",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Errore",
        description: error.message || "Errore durante l'eliminazione del piatto",
        variant: "destructive",
      });
    },
  });
}

// Waste hooks
export function useWaste() {
  return useQuery({
    queryKey: ["/api/waste"],
    queryFn: api.waste.getWaste,
  });
}

export function useCreateWaste() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: api.waste.createWaste,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/waste"] });
      toast({
        title: "Successo",
        description: "Scarto registrato con successo",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Errore",
        description: error.message || "Errore durante la registrazione dello scarto",
        variant: "destructive",
      });
    },
  });
}

export function useDeleteWaste() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: api.waste.deleteWaste,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/waste"] });
      toast({
        title: "Successo",
        description: "Scarto eliminato con successo",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Errore",
        description: error.message || "Errore durante l'eliminazione dello scarto",
        variant: "destructive",
      });
    },
  });
}

// Personal Meals hooks
export function usePersonalMeals() {
  return useQuery({
    queryKey: ["/api/personal-meals"],
    queryFn: api.personalMeals.getPersonalMeals,
  });
}

export function useCreatePersonalMeal() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: api.personalMeals.createPersonalMeal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/personal-meals"] });
      toast({
        title: "Successo",
        description: "Pasto personale registrato con successo",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Errore",
        description: error.message || "Errore durante la registrazione del pasto personale",
        variant: "destructive",
      });
    },
  });
}

export function useDeletePersonalMeal() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: api.personalMeals.deletePersonalMeal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/personal-meals"] });
      toast({
        title: "Successo",
        description: "Pasto personale eliminato con successo",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Errore",
        description: error.message || "Errore durante l'eliminazione del pasto personale",
        variant: "destructive",
      });
    },
  });
}

// Orders hooks
export function useOrders() {
  return useQuery({
    queryKey: ["/api/orders"],
    queryFn: api.orders.getOrders,
  });
}

export function useOrder(id: string) {
  return useQuery({
    queryKey: ["/api/orders", id],
    queryFn: () => api.orders.getOrder(id),
    enabled: !!id,
  });
}

export function useCreateOrder() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: api.orders.createOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({
        title: "Successo",
        description: "Ordine creato con successo",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Errore",
        description: error.message || "Errore durante la creazione dell'ordine",
        variant: "destructive",
      });
    },
  });
}

export function useUpdateOrder() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateOrder }) =>
      api.orders.updateOrder(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({
        title: "Successo",
        description: "Ordine aggiornato con successo",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Errore",
        description: error.message || "Errore durante l'aggiornamento dell'ordine",
        variant: "destructive",
      });
    },
  });
}

export function useDeleteOrder() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: api.orders.deleteOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({
        title: "Successo",
        description: "Ordine eliminato con successo",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Errore",
        description: error.message || "Errore durante l'eliminazione dell'ordine",
        variant: "destructive",
      });
    },
  });
}

// Stock Movements hooks
export function useStockMovements() {
  return useQuery({
    queryKey: ["/api/stock-movements"],
    queryFn: api.stockMovements.getStockMovements,
  });
}

export function useStockMovement(id: string) {
  return useQuery({
    queryKey: ["/api/stock-movements", id],
    queryFn: () => api.stockMovements.getStockMovement(id),
    enabled: !!id,
  });
}

export function useStockMovementsByProduct(productId: string) {
  return useQuery({
    queryKey: ["/api/stock-movements", "product", productId],
    queryFn: () => api.stockMovements.getStockMovementsByProduct(productId),
    enabled: !!productId,
  });
}

export function useCreateStockMovement() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: api.stockMovements.createStockMovement,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/stock-movements"] });
      queryClient.invalidateQueries({ queryKey: ["/api/inventory-snapshots"] });
      toast({
        title: "Successo",
        description: "Movimento di magazzino registrato con successo",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Errore",
        description: error.message || "Errore durante la registrazione del movimento",
        variant: "destructive",
      });
    },
  });
}

export function useUpdateStockMovement() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateStockMovement }) =>
      api.stockMovements.updateStockMovement(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/stock-movements"] });
      queryClient.invalidateQueries({ queryKey: ["/api/inventory-snapshots"] });
      toast({
        title: "Successo",
        description: "Movimento di magazzino aggiornato con successo",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Errore",
        description: error.message || "Errore durante l'aggiornamento del movimento",
        variant: "destructive",
      });
    },
  });
}

export function useDeleteStockMovement() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: api.stockMovements.deleteStockMovement,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/stock-movements"] });
      queryClient.invalidateQueries({ queryKey: ["/api/inventory-snapshots"] });
      toast({
        title: "Successo",
        description: "Movimento di magazzino eliminato con successo",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Errore",
        description: error.message || "Errore durante l'eliminazione del movimento",
        variant: "destructive",
      });
    },
  });
}

// Inventory Snapshots hooks
export function useInventorySnapshots() {
  return useQuery({
    queryKey: ["/api/inventory-snapshots"],
    queryFn: api.inventorySnapshots.getInventorySnapshots,
  });
}

export function useInventorySnapshot(id: string) {
  return useQuery({
    queryKey: ["/api/inventory-snapshots", id],
    queryFn: () => api.inventorySnapshots.getInventorySnapshot(id),
    enabled: !!id,
  });
}

export function useInventorySnapshotsByProduct(productId: string) {
  return useQuery({
    queryKey: ["/api/inventory-snapshots", "product", productId],
    queryFn: () => api.inventorySnapshots.getInventorySnapshotsByProduct(productId),
    enabled: !!productId,
  });
}

export function useCreateInventorySnapshot() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: api.inventorySnapshots.createInventorySnapshot,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inventory-snapshots"] });
      toast({
        title: "Successo",
        description: "Snapshot inventario creato con successo",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Errore",
        description: error.message || "Errore durante la creazione dello snapshot",
        variant: "destructive",
      });
    },
  });
}

export function useUpdateInventorySnapshot() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateInventorySnapshot }) =>
      api.inventorySnapshots.updateInventorySnapshot(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inventory-snapshots"] });
      toast({
        title: "Successo",
        description: "Snapshot inventario aggiornato con successo",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Errore",
        description: error.message || "Errore durante l'aggiornamento dello snapshot",
        variant: "destructive",
      });
    },
  });
}

export function useDeleteInventorySnapshot() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: api.inventorySnapshots.deleteInventorySnapshot,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inventory-snapshots"] });
      toast({
        title: "Successo",
        description: "Snapshot inventario eliminato con successo",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Errore",
        description: error.message || "Errore durante l'eliminazione dello snapshot",
        variant: "destructive",
      });
    },
  });
}

// Sales hooks
export function useSales() {
  return useQuery({
    queryKey: ["/api/sales"],
    queryFn: api.sales.getSales,
  });
}

export function useSale(id: string) {
  return useQuery({
    queryKey: ["/api/sales", id],
    queryFn: () => api.sales.getSale(id),
    enabled: !!id,
  });
}

export function useCreateSale() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: api.sales.createSale,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sales"] });
      queryClient.invalidateQueries({ queryKey: ["/api/metrics/food-cost"] });
      toast({
        title: "Successo",
        description: "Vendita creata con successo",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Errore",
        description: error.message || "Errore durante la creazione della vendita",
        variant: "destructive",
      });
    },
  });
}

export function useUpdateSale() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateSales }) =>
      api.sales.updateSale(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sales"] });
      queryClient.invalidateQueries({ queryKey: ["/api/metrics/food-cost"] });
      toast({
        title: "Successo",
        description: "Vendita aggiornata con successo",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Errore",
        description: error.message || "Errore durante l'aggiornamento della vendita",
        variant: "destructive",
      });
    },
  });
}

export function useDeleteSale() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: api.sales.deleteSale,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sales"] });
      queryClient.invalidateQueries({ queryKey: ["/api/metrics/food-cost"] });
      toast({
        title: "Successo",
        description: "Vendita eliminata con successo",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Errore",
        description: error.message || "Errore durante l'eliminazione della vendita",
        variant: "destructive",
      });
    },
  });
}