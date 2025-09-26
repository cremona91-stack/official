import { apiRequest } from "./queryClient";
import type { 
  Product, Supplier, Recipe, Dish, Waste, PersonalMeal, Order, StockMovement, InventorySnapshot, Sales,
  InsertProduct, InsertSupplier, InsertRecipe, InsertDish, InsertWaste, InsertPersonalMeal, InsertOrder, InsertStockMovement, InsertInventorySnapshot, InsertSales,
  UpdateProduct, UpdateSupplier, UpdateRecipe, UpdateDish, UpdateOrder, UpdateStockMovement, UpdateInventorySnapshot, UpdateSales
} from "@shared/schema";

// Products API
export const productsApi = {
  async getProducts(): Promise<Product[]> {
    const response = await fetch("/api/products", { credentials: "include" });
    if (!response.ok) {
      throw new Error(`Failed to fetch products: ${response.statusText}`);
    }
    return response.json();
  },

  async getProduct(id: string): Promise<Product> {
    const response = await fetch(`/api/products/${id}`, { credentials: "include" });
    if (!response.ok) {
      throw new Error(`Failed to fetch product: ${response.statusText}`);
    }
    return response.json();
  },

  async createProduct(data: InsertProduct): Promise<Product> {
    const response = await apiRequest("POST", "/api/products", data);
    return response.json();
  },

  async updateProduct(id: string, data: UpdateProduct): Promise<Product> {
    const response = await apiRequest("PUT", `/api/products/${id}`, data);
    return response.json();
  },

  async deleteProduct(id: string): Promise<void> {
    await apiRequest("DELETE", `/api/products/${id}`);
  },
};

// Suppliers API
export const suppliersApi = {
  async getSuppliers(): Promise<Supplier[]> {
    const response = await fetch("/api/suppliers", { credentials: "include" });
    if (!response.ok) {
      throw new Error(`Failed to fetch suppliers: ${response.statusText}`);
    }
    return response.json();
  },

  async getSupplier(id: string): Promise<Supplier> {
    const response = await fetch(`/api/suppliers/${id}`, { credentials: "include" });
    if (!response.ok) {
      throw new Error(`Failed to fetch supplier: ${response.statusText}`);
    }
    return response.json();
  },

  async createSupplier(data: InsertSupplier): Promise<Supplier> {
    const response = await apiRequest("POST", "/api/suppliers", data);
    return response.json();
  },

  async updateSupplier(id: string, data: UpdateSupplier): Promise<Supplier> {
    const response = await apiRequest("PUT", `/api/suppliers/${id}`, data);
    return response.json();
  },

  async deleteSupplier(id: string): Promise<void> {
    await apiRequest("DELETE", `/api/suppliers/${id}`);
  },
};

// Recipes API
export const recipesApi = {
  async getRecipes(): Promise<Recipe[]> {
    const response = await fetch("/api/recipes", { credentials: "include" });
    if (!response.ok) {
      throw new Error(`Failed to fetch recipes: ${response.statusText}`);
    }
    return response.json();
  },

  async getRecipe(id: string): Promise<Recipe> {
    const response = await fetch(`/api/recipes/${id}`, { credentials: "include" });
    if (!response.ok) {
      throw new Error(`Failed to fetch recipe: ${response.statusText}`);
    }
    return response.json();
  },

  async createRecipe(data: InsertRecipe): Promise<Recipe> {
    const response = await apiRequest("POST", "/api/recipes", data);
    return response.json();
  },

  async updateRecipe(id: string, data: UpdateRecipe): Promise<Recipe> {
    const response = await apiRequest("PUT", `/api/recipes/${id}`, data);
    return response.json();
  },

  async deleteRecipe(id: string): Promise<void> {
    await apiRequest("DELETE", `/api/recipes/${id}`);
  },
};

// Dishes API
export const dishesApi = {
  async getDishes(): Promise<Dish[]> {
    const response = await fetch("/api/dishes", { credentials: "include" });
    if (!response.ok) {
      throw new Error(`Failed to fetch dishes: ${response.statusText}`);
    }
    return response.json();
  },

  async getDish(id: string): Promise<Dish> {
    const response = await fetch(`/api/dishes/${id}`, { credentials: "include" });
    if (!response.ok) {
      throw new Error(`Failed to fetch dish: ${response.statusText}`);
    }
    return response.json();
  },

  async createDish(data: InsertDish): Promise<Dish> {
    const response = await apiRequest("POST", "/api/dishes", data);
    return response.json();
  },

  async updateDish(id: string, data: UpdateDish): Promise<Dish> {
    const response = await apiRequest("PUT", `/api/dishes/${id}`, data);
    return response.json();
  },

  async deleteDish(id: string): Promise<void> {
    await apiRequest("DELETE", `/api/dishes/${id}`);
  },
};

// Waste API
export const wasteApi = {
  async getWaste(): Promise<Waste[]> {
    const response = await fetch("/api/waste", { credentials: "include" });
    if (!response.ok) {
      throw new Error(`Failed to fetch waste: ${response.statusText}`);
    }
    return response.json();
  },

  async createWaste(data: InsertWaste): Promise<Waste> {
    const response = await apiRequest("POST", "/api/waste", data);
    return response.json();
  },

  async deleteWaste(id: string): Promise<void> {
    await apiRequest("DELETE", `/api/waste/${id}`);
  },
};

// Personal Meals API
export const personalMealsApi = {
  async getPersonalMeals(): Promise<PersonalMeal[]> {
    const response = await fetch("/api/personal-meals", { credentials: "include" });
    if (!response.ok) {
      throw new Error(`Failed to fetch personal meals: ${response.statusText}`);
    }
    return response.json();
  },

  async createPersonalMeal(data: InsertPersonalMeal): Promise<PersonalMeal> {
    const response = await apiRequest("POST", "/api/personal-meals", data);
    return response.json();
  },

  async deletePersonalMeal(id: string): Promise<void> {
    await apiRequest("DELETE", `/api/personal-meals/${id}`);
  },
};

// Export all APIs for convenience
// Orders API
export const ordersApi = {
  async getOrders(): Promise<Order[]> {
    const response = await fetch("/api/orders", { credentials: "include" });
    if (!response.ok) {
      throw new Error(`Failed to fetch orders: ${response.statusText}`);
    }
    return response.json();
  },

  async getOrder(id: string): Promise<Order> {
    const response = await fetch(`/api/orders/${id}`, { credentials: "include" });
    if (!response.ok) {
      throw new Error(`Failed to fetch order: ${response.statusText}`);
    }
    return response.json();
  },

  async createOrder(data: InsertOrder): Promise<Order> {
    const response = await apiRequest("POST", "/api/orders", data);
    return response.json();
  },

  async updateOrder(id: string, data: UpdateOrder): Promise<Order> {
    const response = await apiRequest("PUT", `/api/orders/${id}`, data);
    return response.json();
  },

  async deleteOrder(id: string): Promise<void> {
    await apiRequest("DELETE", `/api/orders/${id}`);
  },
};

// Stock Movements API
export const stockMovementsApi = {
  async getStockMovements(): Promise<StockMovement[]> {
    const response = await fetch("/api/stock-movements", { credentials: "include" });
    if (!response.ok) {
      throw new Error(`Failed to fetch stock movements: ${response.statusText}`);
    }
    return response.json();
  },

  async getStockMovement(id: string): Promise<StockMovement> {
    const response = await fetch(`/api/stock-movements/${id}`, { credentials: "include" });
    if (!response.ok) {
      throw new Error(`Failed to fetch stock movement: ${response.statusText}`);
    }
    return response.json();
  },

  async getStockMovementsByProduct(productId: string): Promise<StockMovement[]> {
    const response = await fetch(`/api/stock-movements/product/${productId}`, { credentials: "include" });
    if (!response.ok) {
      throw new Error(`Failed to fetch stock movements for product: ${response.statusText}`);
    }
    return response.json();
  },

  async createStockMovement(data: InsertStockMovement): Promise<StockMovement> {
    const response = await apiRequest("POST", "/api/stock-movements", data);
    return response.json();
  },

  async updateStockMovement(id: string, data: UpdateStockMovement): Promise<StockMovement> {
    const response = await apiRequest("PUT", `/api/stock-movements/${id}`, data);
    return response.json();
  },

  async deleteStockMovement(id: string): Promise<void> {
    await apiRequest("DELETE", `/api/stock-movements/${id}`);
  },
};

// Inventory Snapshots API
export const inventorySnapshotsApi = {
  async getInventorySnapshots(): Promise<InventorySnapshot[]> {
    const response = await fetch("/api/inventory-snapshots", { credentials: "include" });
    if (!response.ok) {
      throw new Error(`Failed to fetch inventory snapshots: ${response.statusText}`);
    }
    return response.json();
  },

  async getInventorySnapshot(id: string): Promise<InventorySnapshot> {
    const response = await fetch(`/api/inventory-snapshots/${id}`, { credentials: "include" });
    if (!response.ok) {
      throw new Error(`Failed to fetch inventory snapshot: ${response.statusText}`);
    }
    return response.json();
  },

  async getInventorySnapshotsByProduct(productId: string): Promise<InventorySnapshot[]> {
    const response = await fetch(`/api/inventory-snapshots/product/${productId}`, { credentials: "include" });
    if (!response.ok) {
      throw new Error(`Failed to fetch inventory snapshots for product: ${response.statusText}`);
    }
    return response.json();
  },

  async createInventorySnapshot(data: InsertInventorySnapshot): Promise<InventorySnapshot> {
    const response = await apiRequest("POST", "/api/inventory-snapshots", data);
    return response.json();
  },

  async updateInventorySnapshot(id: string, data: UpdateInventorySnapshot): Promise<InventorySnapshot> {
    const response = await apiRequest("PUT", `/api/inventory-snapshots/${id}`, data);
    return response.json();
  },

  async deleteInventorySnapshot(id: string): Promise<void> {
    await apiRequest("DELETE", `/api/inventory-snapshots/${id}`);
  },
};

// Sales API
export const salesApi = {
  async getSales(): Promise<Sales[]> {
    const response = await fetch("/api/sales", { credentials: "include" });
    if (!response.ok) {
      throw new Error(`Failed to fetch sales: ${response.statusText}`);
    }
    return response.json();
  },

  async getSale(id: string): Promise<Sales> {
    const response = await fetch(`/api/sales/${id}`, { credentials: "include" });
    if (!response.ok) {
      throw new Error(`Failed to fetch sale: ${response.statusText}`);
    }
    return response.json();
  },

  async createSale(data: InsertSales): Promise<Sales> {
    const response = await apiRequest("POST", "/api/sales", data);
    return response.json();
  },

  async updateSale(id: string, data: UpdateSales): Promise<Sales> {
    const response = await apiRequest("PATCH", `/api/sales/${id}`, data);
    return response.json();
  },

  async deleteSale(id: string): Promise<void> {
    await apiRequest("DELETE", `/api/sales/${id}`);
  },
};

export const api = {
  products: productsApi,
  suppliers: suppliersApi,
  recipes: recipesApi,
  dishes: dishesApi,
  waste: wasteApi,
  personalMeals: personalMealsApi,
  orders: ordersApi,
  stockMovements: stockMovementsApi,
  inventorySnapshots: inventorySnapshotsApi,
  sales: salesApi,
};