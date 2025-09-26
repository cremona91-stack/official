import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./replitAuth";
import { setupTraditionalAuth } from "./auth";
import { analyzeRestaurantData, analyzeFoodCostOptimization, generateMenuSuggestions } from "./gemini";
import { 
  insertProductSchema, 
  insertSupplierSchema,
  updateSupplierSchema,
  insertRecipeSchema, 
  insertDishSchema, 
  insertSalesSchema,
  insertWasteSchema, 
  insertPersonalMealSchema,
  insertOrderSchema,
  insertStockMovementSchema,
  insertInventorySnapshotSchema,
  insertEditableInventorySchema,
  insertBudgetEntrySchema,
  insertEconomicParametersSchema,
  updateProductSchema,
  updateRecipeSchema,
  updateDishSchema,
  updateSalesSchema,
  updateOrderSchema,
  updateStockMovementSchema,
  updateInventorySnapshotSchema,
  updateEditableInventorySchema,
  updateBudgetEntrySchema,
  updateEconomicParametersSchema,
  upsertEditableInventorySchema,
  insertUserSchema
} from "@shared/schema";
import { z } from "zod";

// Simple authentication middleware for Traditional Auth
const requireAuth = (req: any, res: any, next: any) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
};

export async function registerRoutes(app: Express): Promise<Server> {

  // Replit Auth setup - registers /api/login, /api/logout, /api/callback  
  await setupAuth(app);
  
  // Traditional Auth setup - registers /api/login, /api/register, /api/logout, /api/user
  setupTraditionalAuth(app);

  // Products API Routes
  app.get("/api/products", async (req, res) => {
    try {
      const products = await storage.getProducts();
      res.json(products);
    } catch (error) {
      console.error("Error fetching products:", error);
      res.status(500).json({ error: "Failed to fetch products" });
    }
  });

  app.get("/api/products/:id", async (req, res) => {
    try {
      const product = await storage.getProduct(req.params.id);
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }
      res.json(product);
    } catch (error) {
      console.error("Error fetching product:", error);
      res.status(500).json({ error: "Failed to fetch product" });
    }
  });

  app.post("/api/products", async (req, res) => {
    try {
      const validatedData = insertProductSchema.parse(req.body);
      const product = await storage.createProduct(validatedData);
      res.status(201).json(product);
    } catch (error) {
      console.error("Error creating product:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create product" });
    }
  });

  app.put("/api/products/:id", async (req, res) => {
    try {
      const validatedData = updateProductSchema.parse(req.body);
      const product = await storage.updateProduct(req.params.id, validatedData);
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }
      res.json(product);
    } catch (error) {
      console.error("Error updating product:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      res.status(500).json({ error: "Failed to update product" });
    }
  });

  app.delete("/api/products/:id", async (req, res) => {
    try {
      const success = await storage.deleteProduct(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Product not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting product:", error);
      res.status(500).json({ error: "Failed to delete product" });
    }
  });

  // Suppliers API Routes
  app.get("/api/suppliers", requireAuth, async (req, res) => {
    try {
      const suppliers = await storage.getSuppliers();
      res.json(suppliers);
    } catch (error) {
      console.error("Error fetching suppliers:", error);
      res.status(500).json({ error: "Failed to fetch suppliers" });
    }
  });

  app.get("/api/suppliers/:id", requireAuth, async (req, res) => {
    try {
      const supplier = await storage.getSupplier(req.params.id);
      if (!supplier) {
        return res.status(404).json({ error: "Supplier not found" });
      }
      res.json(supplier);
    } catch (error) {
      console.error("Error fetching supplier:", error);
      res.status(500).json({ error: "Failed to fetch supplier" });
    }
  });

  app.post("/api/suppliers", requireAuth, async (req, res) => {
    try {
      const validatedData = insertSupplierSchema.parse(req.body);
      const supplier = await storage.createSupplier(validatedData);
      res.status(201).json(supplier);
    } catch (error) {
      console.error("Error creating supplier:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create supplier" });
    }
  });

  app.put("/api/suppliers/:id", requireAuth, async (req, res) => {
    try {
      const validatedData = updateSupplierSchema.parse(req.body);
      const supplier = await storage.updateSupplier(req.params.id, validatedData);
      if (!supplier) {
        return res.status(404).json({ error: "Supplier not found" });
      }
      res.json(supplier);
    } catch (error) {
      console.error("Error updating supplier:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      res.status(500).json({ error: "Failed to update supplier" });
    }
  });

  app.delete("/api/suppliers/:id", requireAuth, async (req, res) => {
    try {
      const success = await storage.deleteSupplier(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Supplier not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting supplier:", error);
      res.status(500).json({ error: "Failed to delete supplier" });
    }
  });

  // Recipes API Routes
  app.get("/api/recipes", async (req, res) => {
    try {
      const recipes = await storage.getRecipes();
      res.json(recipes);
    } catch (error) {
      console.error("Error fetching recipes:", error);
      res.status(500).json({ error: "Failed to fetch recipes" });
    }
  });

  app.get("/api/recipes/:id", async (req, res) => {
    try {
      const recipe = await storage.getRecipe(req.params.id);
      if (!recipe) {
        return res.status(404).json({ error: "Recipe not found" });
      }
      res.json(recipe);
    } catch (error) {
      console.error("Error fetching recipe:", error);
      res.status(500).json({ error: "Failed to fetch recipe" });
    }
  });

  app.post("/api/recipes", async (req, res) => {
    try {
      const validatedData = insertRecipeSchema.parse(req.body);
      const recipe = await storage.createRecipe(validatedData);
      res.status(201).json(recipe);
    } catch (error) {
      console.error("Error creating recipe:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create recipe" });
    }
  });

  app.put("/api/recipes/:id", async (req, res) => {
    try {
      const validatedData = updateRecipeSchema.parse(req.body);
      const recipe = await storage.updateRecipe(req.params.id, validatedData);
      if (!recipe) {
        return res.status(404).json({ error: "Recipe not found" });
      }
      res.json(recipe);
    } catch (error) {
      console.error("Error updating recipe:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      res.status(500).json({ error: "Failed to update recipe" });
    }
  });

  app.delete("/api/recipes/:id", async (req, res) => {
    try {
      const success = await storage.deleteRecipe(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Recipe not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting recipe:", error);
      res.status(500).json({ error: "Failed to delete recipe" });
    }
  });

  // Dishes API Routes
  app.get("/api/dishes", async (req, res) => {
    try {
      const dishes = await storage.getDishes();
      res.json(dishes);
    } catch (error) {
      console.error("Error fetching dishes:", error);
      res.status(500).json({ error: "Failed to fetch dishes" });
    }
  });

  app.get("/api/dishes/:id", async (req, res) => {
    try {
      const dish = await storage.getDish(req.params.id);
      if (!dish) {
        return res.status(404).json({ error: "Dish not found" });
      }
      res.json(dish);
    } catch (error) {
      console.error("Error fetching dish:", error);
      res.status(500).json({ error: "Failed to fetch dish" });
    }
  });

  app.post("/api/dishes", async (req, res) => {
    try {
      const validatedData = insertDishSchema.parse(req.body);
      const dish = await storage.createDish(validatedData);
      res.status(201).json(dish);
    } catch (error) {
      console.error("Error creating dish:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create dish" });
    }
  });

  app.put("/api/dishes/:id", async (req, res) => {
    try {
      const validatedData = updateDishSchema.parse(req.body);
      const dish = await storage.updateDish(req.params.id, validatedData);
      if (!dish) {
        return res.status(404).json({ error: "Dish not found" });
      }
      res.json(dish);
    } catch (error) {
      console.error("Error updating dish:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      res.status(500).json({ error: "Failed to update dish" });
    }
  });

  app.delete("/api/dishes/:id", async (req, res) => {
    try {
      const success = await storage.deleteDish(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Dish not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting dish:", error);
      res.status(500).json({ error: "Failed to delete dish" });
    }
  });

  // Sales API Routes
  app.get("/api/sales", async (req, res) => {
    try {
      const sales = await storage.getSales();
      res.json(sales);
    } catch (error) {
      console.error("Error fetching sales:", error);
      res.status(500).json({ error: "Failed to fetch sales" });
    }
  });

  app.get("/api/sales/:id", async (req, res) => {
    try {
      const sale = await storage.getSale(req.params.id);
      if (!sale) {
        return res.status(404).json({ error: "Sale not found" });
      }
      res.json(sale);
    } catch (error) {
      console.error("Error fetching sale:", error);
      res.status(500).json({ error: "Failed to fetch sale" });
    }
  });

  app.get("/api/sales/dish/:dishId", async (req, res) => {
    try {
      const sales = await storage.getSalesByDish(req.params.dishId);
      res.json(sales);
    } catch (error) {
      console.error("Error fetching sales by dish:", error);
      res.status(500).json({ error: "Failed to fetch sales by dish" });
    }
  });

  app.post("/api/sales", async (req, res) => {
    try {
      const validatedData = insertSalesSchema.parse(req.body);
      
      // Calculate totalCost and totalRevenue automatically
      const saleData = {
        ...validatedData,
        totalCost: validatedData.unitCost * validatedData.quantitySold,
        totalRevenue: validatedData.unitRevenue * validatedData.quantitySold,
      };
      
      const sale = await storage.createSale(saleData);
      res.status(201).json(sale);
    } catch (error) {
      console.error("Error creating sale:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create sale" });
    }
  });

  app.put("/api/sales/:id", async (req, res) => {
    try {
      const validatedData = updateSalesSchema.parse(req.body);
      
      // Calculate totalCost and totalRevenue if needed data is provided
      const updateData = { ...validatedData };
      if (validatedData.unitCost !== undefined && validatedData.quantitySold !== undefined) {
        updateData.totalCost = validatedData.unitCost * validatedData.quantitySold;
      }
      if (validatedData.unitRevenue !== undefined && validatedData.quantitySold !== undefined) {
        updateData.totalRevenue = validatedData.unitRevenue * validatedData.quantitySold;
      }
      
      const sale = await storage.updateSale(req.params.id, updateData);
      if (!sale) {
        return res.status(404).json({ error: "Sale not found" });
      }
      res.json(sale);
    } catch (error) {
      console.error("Error updating sale:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      res.status(500).json({ error: "Failed to update sale" });
    }
  });

  app.delete("/api/sales/:id", async (req, res) => {
    try {
      const success = await storage.deleteSale(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Sale not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting sale:", error);
      res.status(500).json({ error: "Failed to delete sale" });
    }
  });

  // Waste API Routes
  app.get("/api/waste", async (req, res) => {
    try {
      const waste = await storage.getWaste();
      res.json(waste);
    } catch (error) {
      console.error("Error fetching waste:", error);
      res.status(500).json({ error: "Failed to fetch waste" });
    }
  });

  app.post("/api/waste", async (req, res) => {
    try {
      const validatedData = insertWasteSchema.parse(req.body);
      const waste = await storage.createWaste(validatedData);
      res.status(201).json(waste);
    } catch (error) {
      console.error("Error creating waste:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create waste" });
    }
  });

  app.delete("/api/waste/:id", async (req, res) => {
    try {
      const success = await storage.deleteWaste(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Waste record not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting waste:", error);
      res.status(500).json({ error: "Failed to delete waste" });
    }
  });

  // Personal Meals API Routes
  app.get("/api/personal-meals", async (req, res) => {
    try {
      const meals = await storage.getPersonalMeals();
      res.json(meals);
    } catch (error) {
      console.error("Error fetching personal meals:", error);
      res.status(500).json({ error: "Failed to fetch personal meals" });
    }
  });

  app.post("/api/personal-meals", async (req, res) => {
    try {
      const validatedData = insertPersonalMealSchema.parse(req.body);
      const meal = await storage.createPersonalMeal(validatedData);
      res.status(201).json(meal);
    } catch (error) {
      console.error("Error creating personal meal:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create personal meal" });
    }
  });

  app.delete("/api/personal-meals/:id", async (req, res) => {
    try {
      const success = await storage.deletePersonalMeal(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Personal meal not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting personal meal:", error);
      res.status(500).json({ error: "Failed to delete personal meal" });
    }
  });

  // Orders API Routes (Ricevimento Merci)
  app.get("/api/orders", async (req, res) => {
    try {
      const orders = await storage.getOrders();
      res.json(orders);
    } catch (error) {
      console.error("Error fetching orders:", error);
      res.status(500).json({ error: "Failed to fetch orders" });
    }
  });

  app.get("/api/orders/:id", async (req, res) => {
    try {
      const order = await storage.getOrder(req.params.id);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }
      res.json(order);
    } catch (error) {
      console.error("Error fetching order:", error);
      res.status(500).json({ error: "Failed to fetch order" });
    }
  });

  app.post("/api/orders", async (req, res) => {
    try {
      const validatedData = insertOrderSchema.parse(req.body);
      const order = await storage.createOrder(validatedData);
      res.status(201).json(order);
    } catch (error) {
      console.error("Error creating order:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create order" });
    }
  });

  app.put("/api/orders/:id", async (req, res) => {
    try {
      const validatedData = updateOrderSchema.parse(req.body);
      const order = await storage.updateOrder(req.params.id, validatedData);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }
      res.json(order);
    } catch (error) {
      console.error("Error updating order:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      res.status(500).json({ error: "Failed to update order" });
    }
  });

  app.patch("/api/orders/:id/status", async (req, res) => {
    try {
      const statusSchema = z.object({
        status: z.enum(["pending", "confirmed", "cancelled", "pendente"])
      });
      const validatedData = statusSchema.parse(req.body);
      const order = await storage.updateOrder(req.params.id, validatedData);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }
      res.json(order);
    } catch (error) {
      console.error("Error updating order status:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      res.status(500).json({ error: "Failed to update order status" });
    }
  });

  app.delete("/api/orders/:id", async (req, res) => {
    try {
      const success = await storage.deleteOrder(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Order not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting order:", error);
      res.status(500).json({ error: "Failed to delete order" });
    }
  });

  // Email order endpoint
  app.post("/api/orders/:id/send-email", async (req, res) => {
    try {
      const { sendOrderEmail } = await import("./email.js");
      
      // Get the order
      const order = await storage.getOrder(req.params.id);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }

      // Get all products to find supplier emails
      const products = await storage.getProducts();
      const productMap = new Map(products.map(p => [p.id, p]));
      
      // Find supplier emails from order items
      const supplierEmails = new Set<string>();
      for (const item of order.items) {
        const product = productMap.get(item.productId);
        if (product?.supplierEmail && product.supplierEmail.includes('@')) {
          supplierEmails.add(product.supplierEmail);
        }
      }

      if (supplierEmails.size === 0) {
        return res.status(400).json({ 
          error: "Nessuna email fornitore trovata",
          message: "Nessuno dei prodotti in questo ordine ha un'email fornitore valida configurata."
        });
      }

      // Send email to each supplier
      const emailResults = [];
      for (const supplierEmail of supplierEmails) {
        const success = await sendOrderEmail(order, supplierEmail);
        emailResults.push({
          email: supplierEmail,
          success,
          timestamp: new Date().toISOString()
        });
      }

      const successCount = emailResults.filter(r => r.success).length;
      const totalCount = emailResults.length;

      if (successCount === totalCount) {
        res.json({
          success: true,
          message: `Email inviata con successo a ${successCount} fornitore${successCount > 1 ? 'i' : ''}`,
          results: emailResults
        });
      } else {
        res.status(207).json({
          success: false,
          message: `${successCount}/${totalCount} email inviate con successo`,
          results: emailResults
        });
      }
    } catch (error) {
      console.error("Error sending order email:", error);
      res.status(500).json({ error: "Failed to send order email" });
    }
  });

  // Stock Movements API Routes (Magazzino In/Out)
  app.get("/api/stock-movements", async (req, res) => {
    try {
      const movements = await storage.getStockMovements();
      res.json(movements);
    } catch (error) {
      console.error("Error fetching stock movements:", error);
      res.status(500).json({ error: "Failed to fetch stock movements" });
    }
  });

  app.get("/api/stock-movements/product/:productId", async (req, res) => {
    try {
      const movements = await storage.getStockMovementsByProduct(req.params.productId);
      res.json(movements);
    } catch (error) {
      console.error("Error fetching stock movements by product:", error);
      res.status(500).json({ error: "Failed to fetch stock movements by product" });
    }
  });

  app.get("/api/stock-movements/:id", async (req, res) => {
    try {
      const movement = await storage.getStockMovement(req.params.id);
      if (!movement) {
        return res.status(404).json({ error: "Stock movement not found" });
      }
      res.json(movement);
    } catch (error) {
      console.error("Error fetching stock movement:", error);
      res.status(500).json({ error: "Failed to fetch stock movement" });
    }
  });

  app.post("/api/stock-movements", async (req, res) => {
    try {
      const validatedData = insertStockMovementSchema.parse(req.body);
      const movement = await storage.createStockMovement(validatedData);
      res.status(201).json(movement);
    } catch (error) {
      console.error("Error creating stock movement:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create stock movement" });
    }
  });

  app.put("/api/stock-movements/:id", async (req, res) => {
    try {
      const validatedData = updateStockMovementSchema.parse(req.body);
      const movement = await storage.updateStockMovement(req.params.id, validatedData);
      if (!movement) {
        return res.status(404).json({ error: "Stock movement not found" });
      }
      res.json(movement);
    } catch (error) {
      console.error("Error updating stock movement:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      res.status(500).json({ error: "Failed to update stock movement" });
    }
  });

  app.delete("/api/stock-movements/:id", async (req, res) => {
    try {
      const success = await storage.deleteStockMovement(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Stock movement not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting stock movement:", error);
      res.status(500).json({ error: "Failed to delete stock movement" });
    }
  });

  // Inventory Snapshots API Routes
  app.get("/api/inventory-snapshots", async (req, res) => {
    try {
      const snapshots = await storage.getInventorySnapshots();
      res.json(snapshots);
    } catch (error) {
      console.error("Error fetching inventory snapshots:", error);
      res.status(500).json({ error: "Failed to fetch inventory snapshots" });
    }
  });

  app.get("/api/inventory-snapshots/product/:productId", async (req, res) => {
    try {
      const snapshots = await storage.getInventorySnapshotsByProduct(req.params.productId);
      res.json(snapshots);
    } catch (error) {
      console.error("Error fetching inventory snapshots by product:", error);
      res.status(500).json({ error: "Failed to fetch inventory snapshots by product" });
    }
  });

  app.get("/api/inventory-snapshots/:id", async (req, res) => {
    try {
      const snapshot = await storage.getInventorySnapshot(req.params.id);
      if (!snapshot) {
        return res.status(404).json({ error: "Inventory snapshot not found" });
      }
      res.json(snapshot);
    } catch (error) {
      console.error("Error fetching inventory snapshot:", error);
      res.status(500).json({ error: "Failed to fetch inventory snapshot" });
    }
  });

  app.post("/api/inventory-snapshots", async (req, res) => {
    try {
      const validatedData = insertInventorySnapshotSchema.parse(req.body);
      const snapshot = await storage.createInventorySnapshot(validatedData);
      res.status(201).json(snapshot);
    } catch (error) {
      console.error("Error creating inventory snapshot:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create inventory snapshot" });
    }
  });

  app.put("/api/inventory-snapshots/:id", async (req, res) => {
    try {
      const validatedData = updateInventorySnapshotSchema.parse(req.body);
      const snapshot = await storage.updateInventorySnapshot(req.params.id, validatedData);
      if (!snapshot) {
        return res.status(404).json({ error: "Inventory snapshot not found" });
      }
      res.json(snapshot);
    } catch (error) {
      console.error("Error updating inventory snapshot:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      res.status(500).json({ error: "Failed to update inventory snapshot" });
    }
  });

  app.delete("/api/inventory-snapshots/:id", async (req, res) => {
    try {
      const success = await storage.deleteInventorySnapshot(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Inventory snapshot not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting inventory snapshot:", error);
      res.status(500).json({ error: "Failed to delete inventory snapshot" });
    }
  });

  // Editable Inventory API Routes
  app.get("/api/editable-inventory", async (req, res) => {
    try {
      const inventory = await storage.getEditableInventory();
      res.json(inventory);
    } catch (error) {
      console.error("Error fetching editable inventory:", error);
      res.status(500).json({ error: "Failed to fetch editable inventory" });
    }
  });

  app.get("/api/editable-inventory/product/:productId", async (req, res) => {
    try {
      const inventory = await storage.getEditableInventoryByProduct(req.params.productId);
      if (!inventory) {
        return res.status(404).json({ error: "Editable inventory not found" });
      }
      res.json(inventory);
    } catch (error) {
      console.error("Error fetching editable inventory by product:", error);
      res.status(500).json({ error: "Failed to fetch editable inventory by product" });
    }
  });

  app.post("/api/editable-inventory", async (req, res) => {
    try {
      const validatedData = insertEditableInventorySchema.parse(req.body);
      const inventory = await storage.createEditableInventory(validatedData);
      res.status(201).json(inventory);
    } catch (error) {
      console.error("Error creating editable inventory:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create editable inventory" });
    }
  });

  app.put("/api/editable-inventory/:id", async (req, res) => {
    try {
      const validatedData = updateEditableInventorySchema.parse(req.body);
      const inventory = await storage.updateEditableInventory(req.params.id, validatedData);
      if (!inventory) {
        return res.status(404).json({ error: "Editable inventory record not found" });
      }
      res.json(inventory);
    } catch (error) {
      console.error("Error updating editable inventory:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      res.status(500).json({ error: "Failed to update editable inventory" });
    }
  });

  app.delete("/api/editable-inventory/:id", async (req, res) => {
    try {
      const success = await storage.deleteEditableInventory(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Editable inventory record not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting editable inventory:", error);
      res.status(500).json({ error: "Failed to delete editable inventory" });
    }
  });

  app.post("/api/editable-inventory/upsert", async (req, res) => {
    try {
      const validatedData = upsertEditableInventorySchema.parse(req.body);
      const inventory = await storage.upsertEditableInventory(validatedData);
      res.json(inventory);
    } catch (error) {
      console.error("Error upserting editable inventory:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      res.status(500).json({ error: "Failed to upsert editable inventory" });
    }
  });

  // Budget Entries API Routes
  app.get("/api/budget-entries", async (req, res) => {
    try {
      const budgetEntries = await storage.getBudgetEntries();
      res.json(budgetEntries);
    } catch (error) {
      console.error("Error fetching budget entries:", error);
      res.status(500).json({ error: "Failed to fetch budget entries" });
    }
  });

  app.get("/api/budget-entries/:id", async (req, res) => {
    try {
      const budgetEntry = await storage.getBudgetEntry(req.params.id);
      if (!budgetEntry) {
        return res.status(404).json({ error: "Budget entry not found" });
      }
      res.json(budgetEntry);
    } catch (error) {
      console.error("Error fetching budget entry:", error);
      res.status(500).json({ error: "Failed to fetch budget entry" });
    }
  });

  app.get("/api/budget-entries/:year/:month", async (req, res) => {
    try {
      const year = parseInt(req.params.year);
      const month = parseInt(req.params.month);
      const budgetEntries = await storage.getBudgetEntriesByMonth(year, month);
      res.json(budgetEntries);
    } catch (error) {
      console.error("Error fetching budget entries by month:", error);
      res.status(500).json({ error: "Failed to fetch budget entries" });
    }
  });

  app.post("/api/budget-entries", async (req, res) => {
    try {
      const validatedData = insertBudgetEntrySchema.parse(req.body);
      const budgetEntry = await storage.createBudgetEntry(validatedData);
      res.status(201).json(budgetEntry);
    } catch (error) {
      console.error("Error creating budget entry:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create budget entry" });
    }
  });

  app.put("/api/budget-entries/:id", async (req, res) => {
    try {
      const validatedData = updateBudgetEntrySchema.parse(req.body);
      const budgetEntry = await storage.updateBudgetEntry(req.params.id, validatedData);
      if (!budgetEntry) {
        return res.status(404).json({ error: "Budget entry not found" });
      }
      res.json(budgetEntry);
    } catch (error) {
      console.error("Error updating budget entry:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      res.status(500).json({ error: "Failed to update budget entry" });
    }
  });

  app.delete("/api/budget-entries/:id", async (req, res) => {
    try {
      const success = await storage.deleteBudgetEntry(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Budget entry not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting budget entry:", error);
      res.status(500).json({ error: "Failed to delete budget entry" });
    }
  });

  // Economic Parameters API Routes
  app.get("/api/economic-parameters", async (req, res) => {
    try {
      const parameters = await storage.getEconomicParameters();
      res.json(parameters);
    } catch (error) {
      console.error("Error fetching economic parameters:", error);
      res.status(500).json({ error: "Failed to fetch economic parameters" });
    }
  });

  app.get("/api/economic-parameters/:id", async (req, res) => {
    try {
      const parameters = await storage.getEconomicParameter(req.params.id);
      if (!parameters) {
        return res.status(404).json({ error: "Economic parameters not found" });
      }
      res.json(parameters);
    } catch (error) {
      console.error("Error fetching economic parameters:", error);
      res.status(500).json({ error: "Failed to fetch economic parameters" });
    }
  });

  app.get("/api/economic-parameters/:year/:month", async (req, res) => {
    try {
      const year = parseInt(req.params.year);
      const month = parseInt(req.params.month);
      const parameters = await storage.getEconomicParametersByMonth(year, month);
      if (!parameters) {
        return res.status(404).json({ error: "Economic parameters not found for this month" });
      }
      res.json(parameters);
    } catch (error) {
      console.error("Error fetching economic parameters by month:", error);
      res.status(500).json({ error: "Failed to fetch economic parameters" });
    }
  });

  app.post("/api/economic-parameters", async (req, res) => {
    try {
      const validatedData = insertEconomicParametersSchema.parse(req.body);
      const parameters = await storage.createEconomicParameters(validatedData);
      res.status(201).json(parameters);
    } catch (error) {
      console.error("Error creating economic parameters:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create economic parameters" });
    }
  });

  app.put("/api/economic-parameters/:id", async (req, res) => {
    try {
      const validatedData = updateEconomicParametersSchema.parse(req.body);
      const parameters = await storage.updateEconomicParameters(req.params.id, validatedData);
      if (!parameters) {
        return res.status(404).json({ error: "Economic parameters not found" });
      }
      res.json(parameters);
    } catch (error) {
      console.error("Error updating economic parameters:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      res.status(500).json({ error: "Failed to update economic parameters" });
    }
  });

  app.put("/api/economic-parameters/:year/:month", async (req, res) => {
    try {
      const year = parseInt(req.params.year);
      const month = parseInt(req.params.month);
      const validatedData = updateEconomicParametersSchema.parse(req.body);
      const parameters = await storage.upsertEconomicParametersByMonth(year, month, validatedData);
      res.json(parameters);
    } catch (error) {
      console.error("Error upserting economic parameters:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      res.status(500).json({ error: "Failed to upsert economic parameters" });
    }
  });

  app.delete("/api/economic-parameters/:id", async (req, res) => {
    try {
      const success = await storage.deleteEconomicParameters(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Economic parameters not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting economic parameters:", error);
      res.status(500).json({ error: "Failed to delete economic parameters" });
    }
  });

  // Food Cost Metrics API Routes
  app.get("/api/metrics/food-cost/:year/:month", async (req, res) => {
    try {
      const year = parseInt(req.params.year);
      const month = parseInt(req.params.month);
      
      // Get all required data for food cost calculation
      const [dishes, sales, products, editableInventory, stockMovements] = await Promise.all([
        storage.getDishes(),
        storage.getSales(),
        storage.getProducts(),
        storage.getEditableInventory(),
        storage.getStockMovements()
      ]);

      // Create date range for the requested month
      const startDate = new Date(year, month - 1, 1); // month - 1 because Date month is 0-based
      const endDate = new Date(year, month, 0); // Last day of the month
      
      // Filter stock movements for the requested period
      const monthlyStockMovements = stockMovements.filter(movement => {
        const movementDate = new Date(movement.movementDate);
        return movementDate >= startDate && movementDate <= endDate;
      });

      // Create product map for quick lookup
      const productMap = new Map(products.map(p => [p.id, p]));

      // Calculate food cost metrics using sales data
      // Filter sales for the requested period
      const monthlySales = sales.filter(sale => {
        const saleDate = new Date(sale.saleDate);
        return saleDate >= startDate && saleDate <= endDate;
      });

      // 1. Calculate NET REVENUE from sales data
      const totalFoodSales = monthlySales.reduce((sum, sale) => sum + sale.totalRevenue, 0);
      
      // 2. Calculate THEORETICAL food cost from sales data
      const totalCostOfSales = monthlySales.reduce((sum, sale) => sum + sale.totalCost, 0);
      const theoreticalFoodCostPercentage = totalFoodSales > 0 ? (totalCostOfSales / totalFoodSales) * 100 : 0;
      
      // 3. Calculate REAL food cost: (totale iniziale + totale IN - totale finale)
      // Note: editableInventory represents current state, not period-specific
      // Totale iniziale magazzino
      const totaleInizialeM = editableInventory.reduce((sum, inventory) => {
        const product = productMap.get(inventory.productId);
        return sum + (product ? inventory.initialQuantity * product.pricePerUnit : 0);
      }, 0);
      
      // Totale IN magazzino - filtered for the requested month
      const totaleInM = monthlyStockMovements
        .filter(movement => movement.movementType === 'in')
        .reduce((sum, movement) => sum + (movement.totalCost || 0), 0);
      
      // Totale finale magazzino
      const totaleFinaleM = editableInventory.reduce((sum, inventory) => {
        const product = productMap.get(inventory.productId);
        return sum + (product ? inventory.finalQuantity * product.pricePerUnit : 0);
      }, 0);
      
      // REAL Food cost calculation
      const totalFoodCost = totaleInizialeM + totaleInM - totaleFinaleM;
      const realFoodCostPercentage = totalFoodSales > 0 ? (totalFoodCost / totalFoodSales) * 100 : 0;
      
      // Calculate differential: Real - Theoretical
      const realVsTheoreticalDiff = realFoodCostPercentage - theoreticalFoodCostPercentage;

      res.json({
        year,
        month,
        totalFoodSales,
        totalFoodCost,
        foodCostPercentage: realFoodCostPercentage,
        theoreticalFoodCostPercentage,
        realVsTheoreticalDiff,
        calculatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error calculating food cost metrics:", error);
      res.status(500).json({ error: "Failed to calculate food cost metrics" });
    }
  });

  // Temporary route to create admin user (secure, one-time use)
  app.post("/api/setup-admin", async (req, res) => {
    try {
      // Check if admin user already exists
      const existingAdmin = await storage.getUserByUsername("admin");
      if (existingAdmin) {
        return res.status(409).json({ 
          error: "Admin user already exists",
          message: "Admin user has already been created"
        });
      }

      // Create admin user with default credentials
      const adminData = {
        username: "admin",
        email: "admin@foodyflow.com", 
        password: "admin", // Will be hashed by auth system
        isAdmin: true
      };

      const validatedData = insertUserSchema.parse(adminData);
      const adminUser = await storage.createUser(validatedData);
      
      // Remove password from response
      const { password, ...safeUser } = adminUser;
      
      res.status(201).json({
        success: true,
        message: "Admin user created successfully",
        user: safeUser
      });
    } catch (error) {
      console.error("Error creating admin user:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create admin user" });
    }
  });

  // AI Assistant Routes usando Gemini
  app.post("/api/ai/analyze", async (req, res) => {
    try {
      const { query } = req.body;
      
      if (!query) {
        return res.status(400).json({ error: "Query is required" });
      }

      // Raccogli tutti i dati del ristorante
      const [products, dishes, waste, orders, budgetEntries] = await Promise.all([
        storage.getProducts(),
        storage.getDishes(),
        storage.getWaste(),
        storage.getOrders(),
        storage.getBudgetEntries() // Anno e mese correnti
      ]);

      const restaurantData = {
        products: products.slice(0, 10), // Limita i dati per non superare i token
        dishes: dishes.slice(0, 10),
        waste: waste.slice(0, 5),
        orders: orders.slice(0, 5),
        budgetEntries: budgetEntries.slice(0, 5)
      };

      const analysis = await analyzeRestaurantData(restaurantData, query);
      
      res.json({ 
        success: true, 
        analysis,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error("Errore analisi AI:", error);
      res.status(500).json({ 
        error: "Errore nell'analisi AI", 
        message: "Riprova più tardi" 
      });
    }
  });

  app.post("/api/ai/food-cost-optimization", async (req, res) => {
    try {
      // Raccogli dati food cost
      const [products, dishes, waste] = await Promise.all([
        storage.getProducts(),
        storage.getDishes(),
        storage.getWaste()
      ]);

      const foodCostData = {
        totalProducts: products.length,
        totalDishes: dishes.length,
        totalWaste: waste.length,
        averageProductPrice: products.reduce((sum, p) => sum + (p.pricePerUnit || 0), 0) / products.length || 0,
        products: products.slice(0, 5),
        dishes: dishes.slice(0, 5),
        waste: waste.slice(0, 3)
      };

      const optimization = await analyzeFoodCostOptimization(foodCostData);
      
      res.json({ 
        success: true, 
        optimization,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error("Errore ottimizzazione food cost:", error);
      res.status(500).json({ 
        error: "Errore nell'ottimizzazione food cost", 
        message: "Riprova più tardi" 
      });
    }
  });

  app.post("/api/ai/menu-suggestions", async (req, res) => {
    try {
      const { marketTrends } = req.body;
      
      const dishes = await storage.getDishes();
      const dishData = dishes.slice(0, 10);

      const suggestions = await generateMenuSuggestions(dishData, marketTrends || "");
      
      res.json({ 
        success: true, 
        suggestions,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error("Errore suggerimenti menu:", error);
      res.status(500).json({ 
        error: "Errore nei suggerimenti menu", 
        message: "Riprova più tardi" 
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}