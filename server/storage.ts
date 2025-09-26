import { 
  type Product, 
  type Recipe, 
  type Dish, 
  type Sales,
  type Waste, 
  type PersonalMeal,
  type Order,
  type StockMovement,
  type InventorySnapshot,
  type EditableInventory,
  type BudgetEntry,
  type EconomicParameters,
  type User,
  type Supplier,
  type InsertProduct,
  type InsertRecipe,
  type InsertDish,
  type InsertSales,
  type InsertWaste,
  type InsertPersonalMeal,
  type InsertOrder,
  type InsertStockMovement,
  type InsertInventorySnapshot,
  type InsertEditableInventory,
  type InsertBudgetEntry,
  type InsertEconomicParameters,
  type InsertUser,
  type InsertSupplier,
  type UpdateProduct,
  type UpdateSupplier,
  type UpdateRecipe,
  type UpdateDish,
  type UpdateSales,
  type UpdateOrder,
  type UpdateStockMovement,
  type UpdateInventorySnapshot,
  type UpdateEditableInventory,
  type UpdateBudgetEntry,
  type UpdateEconomicParameters,
  type UpsertEditableInventory,
  type UpsertUser,
  type SelectUser,
  products,
  suppliers,
  recipes,
  dishes,
  sales,
  waste,
  personalMeals,
  orders,
  stockMovements,
  inventorySnapshots,
  editableInventory,
  budgetEntries,
  economicParameters,
  users
} from "@shared/schema";
import { drizzle } from "drizzle-orm/neon-serverless";
import { eq, and } from "drizzle-orm";
import { Pool, neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import session from "express-session";
import connectPg from "connect-pg-simple";

// Configure WebSocket for Node.js environment
if (typeof WebSocket === 'undefined') {
  neonConfig.webSocketConstructor = ws;
}

// Database connection with transaction support
const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL!
});
const db = drizzle(pool);

// Storage interface for Food Cost Manager
export interface IStorage {
  // Suppliers
  getSuppliers(): Promise<Supplier[]>;
  getSupplier(id: string): Promise<Supplier | undefined>;
  createSupplier(supplier: InsertSupplier): Promise<Supplier>;
  updateSupplier(id: string, supplier: UpdateSupplier): Promise<Supplier | undefined>;
  deleteSupplier(id: string): Promise<boolean>;
  
  // Products
  getProducts(): Promise<Product[]>;
  getProduct(id: string): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: string, product: UpdateProduct): Promise<Product | undefined>;
  deleteProduct(id: string): Promise<boolean>;

  // Recipes
  getRecipes(): Promise<Recipe[]>;
  getRecipe(id: string): Promise<Recipe | undefined>;
  createRecipe(recipe: InsertRecipe): Promise<Recipe>;
  updateRecipe(id: string, recipe: UpdateRecipe): Promise<Recipe | undefined>;
  deleteRecipe(id: string): Promise<boolean>;

  // Dishes
  getDishes(): Promise<Dish[]>;
  getDish(id: string): Promise<Dish | undefined>;
  createDish(dish: InsertDish): Promise<Dish>;
  updateDish(id: string, dish: UpdateDish): Promise<Dish | undefined>;
  deleteDish(id: string): Promise<boolean>;

  // Sales (Vendite)
  getSales(): Promise<Sales[]>;
  getSale(id: string): Promise<Sales | undefined>;
  getSalesByDish(dishId: string): Promise<Sales[]>;
  createSale(sale: InsertSales): Promise<Sales>;
  updateSale(id: string, sale: UpdateSales): Promise<Sales | undefined>;
  deleteSale(id: string): Promise<boolean>;

  // Waste
  getWaste(): Promise<Waste[]>;
  createWaste(waste: InsertWaste): Promise<Waste>;
  deleteWaste(id: string): Promise<boolean>;

  // Personal Meals
  getPersonalMeals(): Promise<PersonalMeal[]>;
  createPersonalMeal(meal: InsertPersonalMeal): Promise<PersonalMeal>;
  deletePersonalMeal(id: string): Promise<boolean>;

  // Orders (Ricevimento Merci)
  getOrders(): Promise<Order[]>;
  getOrder(id: string): Promise<Order | undefined>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrder(id: string, order: UpdateOrder): Promise<Order | undefined>;
  deleteOrder(id: string): Promise<boolean>;

  // Stock Movements (Magazzino In/Out)
  getStockMovements(): Promise<StockMovement[]>;
  getStockMovement(id: string): Promise<StockMovement | undefined>;
  getStockMovementsByProduct(productId: string): Promise<StockMovement[]>;
  createStockMovement(movement: InsertStockMovement): Promise<StockMovement>;
  updateStockMovement(id: string, movement: UpdateStockMovement): Promise<StockMovement | undefined>;
  deleteStockMovement(id: string): Promise<boolean>;

  // Inventory Snapshots
  getInventorySnapshots(): Promise<InventorySnapshot[]>;
  getInventorySnapshot(id: string): Promise<InventorySnapshot | undefined>;
  getInventorySnapshotsByProduct(productId: string): Promise<InventorySnapshot[]>;
  createInventorySnapshot(snapshot: InsertInventorySnapshot): Promise<InventorySnapshot>;
  updateInventorySnapshot(id: string, snapshot: UpdateInventorySnapshot): Promise<InventorySnapshot | undefined>;
  deleteInventorySnapshot(id: string): Promise<boolean>;

  // Editable Inventory
  getEditableInventory(): Promise<EditableInventory[]>;
  getEditableInventoryByProduct(productId: string): Promise<EditableInventory | undefined>;
  createEditableInventory(inventory: InsertEditableInventory): Promise<EditableInventory>;
  updateEditableInventory(id: string, inventory: UpdateEditableInventory): Promise<EditableInventory | undefined>;
  upsertEditableInventory(inventory: UpsertEditableInventory): Promise<EditableInventory>;
  deleteEditableInventory(id: string): Promise<boolean>;

  // Budget Entries
  getBudgetEntries(): Promise<BudgetEntry[]>;
  getBudgetEntry(id: string): Promise<BudgetEntry | undefined>;
  getBudgetEntriesByMonth(year: number, month: number): Promise<BudgetEntry[]>;
  createBudgetEntry(budgetEntry: InsertBudgetEntry): Promise<BudgetEntry>;
  updateBudgetEntry(id: string, budgetEntry: UpdateBudgetEntry): Promise<BudgetEntry | undefined>;
  deleteBudgetEntry(id: string): Promise<boolean>;

  // Economic Parameters (Editable P&L values)
  getEconomicParameters(): Promise<EconomicParameters[]>;
  getEconomicParameter(id: string): Promise<EconomicParameters | undefined>;
  getEconomicParametersByMonth(year: number, month: number): Promise<EconomicParameters | undefined>;
  createEconomicParameters(parameters: InsertEconomicParameters): Promise<EconomicParameters>;
  updateEconomicParameters(id: string, parameters: UpdateEconomicParameters): Promise<EconomicParameters | undefined>;
  upsertEconomicParametersByMonth(year: number, month: number, parameters: UpdateEconomicParameters): Promise<EconomicParameters>;
  deleteEconomicParameters(id: string): Promise<boolean>;

  // Users authentication methods  
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  // (IMPORTANT) upsertUser method is mandatory for Replit Auth
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Session store for authentication
  sessionStore: session.Store;
}

export class DatabaseStorage implements IStorage {
  // Suppliers
  async getSuppliers(): Promise<Supplier[]> {
    return await db.select().from(suppliers);
  }

  async getSupplier(id: string): Promise<Supplier | undefined> {
    const result = await db.select().from(suppliers).where(eq(suppliers.id, id));
    return result[0];
  }

  async createSupplier(insertSupplier: InsertSupplier): Promise<Supplier> {
    const result = await db.insert(suppliers).values({
      ...insertSupplier,
      email: insertSupplier.email || null,
      notes: insertSupplier.notes || null,
    }).returning();
    return result[0];
  }

  async updateSupplier(id: string, updates: UpdateSupplier): Promise<Supplier | undefined> {
    const sanitizedUpdates: any = {};
    if (updates.name !== undefined) sanitizedUpdates.name = updates.name;
    if (updates.email !== undefined) sanitizedUpdates.email = updates.email || null;
    if (updates.notes !== undefined) sanitizedUpdates.notes = updates.notes || null;
    
    // Always update the updatedAt timestamp
    sanitizedUpdates.updatedAt = new Date();
    
    const result = await db.update(suppliers)
      .set(sanitizedUpdates)
      .where(eq(suppliers.id, id))
      .returning();
    return result[0];
  }

  async deleteSupplier(id: string): Promise<boolean> {
    const result = await db.delete(suppliers).where(eq(suppliers.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Products
  async getProducts(): Promise<Product[]> {
    return await db.select().from(products);
  }

  async getProduct(id: string): Promise<Product | undefined> {
    const result = await db.select().from(products).where(eq(products.id, id));
    return result[0];
  }

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    // Calculate effective price per unit considering waste
    const wastePercentage = insertProduct.waste || 0;
    const effectivePricePerUnit = insertProduct.pricePerUnit / (1 - wastePercentage / 100);
    
    const result = await db.insert(products).values({
      ...insertProduct,
      supplier: insertProduct.supplier || null,
      notes: insertProduct.notes || null,
      effectivePricePerUnit: effectivePricePerUnit,
    }).returning();
    return result[0];
  }

  async updateProduct(id: string, updates: UpdateProduct): Promise<Product | undefined> {
    // Filter out undefined values and ensure only safe fields are updated
    const sanitizedUpdates: any = {};
    if (updates.code !== undefined) sanitizedUpdates.code = updates.code;
    if (updates.name !== undefined) sanitizedUpdates.name = updates.name;
    if (updates.supplier !== undefined) sanitizedUpdates.supplier = updates.supplier;
    if (updates.supplierEmail !== undefined) sanitizedUpdates.supplierEmail = updates.supplierEmail;
    if (updates.waste !== undefined) sanitizedUpdates.waste = updates.waste;
    if (updates.notes !== undefined) sanitizedUpdates.notes = updates.notes;
    if (updates.quantity !== undefined) sanitizedUpdates.quantity = updates.quantity;
    if (updates.unit !== undefined) sanitizedUpdates.unit = updates.unit;
    if (updates.pricePerUnit !== undefined) sanitizedUpdates.pricePerUnit = updates.pricePerUnit;
    
    // Recalculate effective price when pricePerUnit or waste changes
    if (updates.pricePerUnit !== undefined || updates.waste !== undefined) {
      // Get current product data
      const currentProduct = await this.getProduct(id);
      if (!currentProduct) return undefined;
      
      // Use new values if provided, otherwise use current values
      const newPricePerUnit = updates.pricePerUnit ?? currentProduct.pricePerUnit;
      const newWaste = updates.waste ?? currentProduct.waste;
      
      // Calculate new effective price
      sanitizedUpdates.effectivePricePerUnit = newPricePerUnit / (1 - newWaste / 100);
    }
    
    // Always update the updatedAt timestamp
    sanitizedUpdates.updatedAt = new Date();
    
    const result = await db.update(products)
      .set(sanitizedUpdates)
      .where(eq(products.id, id))
      .returning();
    return result[0];
  }

  async deleteProduct(id: string): Promise<boolean> {
    const result = await db.delete(products).where(eq(products.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Recipes
  async getRecipes(): Promise<Recipe[]> {
    return await db.select().from(recipes);
  }

  async getRecipe(id: string): Promise<Recipe | undefined> {
    const result = await db.select().from(recipes).where(eq(recipes.id, id));
    return result[0];
  }

  async createRecipe(insertRecipe: InsertRecipe): Promise<Recipe> {
    const result = await db.insert(recipes).values(insertRecipe).returning();
    return result[0];
  }

  async updateRecipe(id: string, updates: UpdateRecipe): Promise<Recipe | undefined> {
    // Filter out undefined values and ensure only safe fields are updated
    const sanitizedUpdates: any = {};
    if (updates.name !== undefined) sanitizedUpdates.name = updates.name;
    if (updates.ingredients !== undefined) sanitizedUpdates.ingredients = updates.ingredients;
    if (updates.weightAdjustment !== undefined) sanitizedUpdates.weightAdjustment = updates.weightAdjustment;
    if (updates.totalCost !== undefined) sanitizedUpdates.totalCost = updates.totalCost;
    
    // Always update the updatedAt timestamp
    sanitizedUpdates.updatedAt = new Date();
    
    const result = await db.update(recipes)
      .set(sanitizedUpdates)
      .where(eq(recipes.id, id))
      .returning();
    return result[0];
  }

  async deleteRecipe(id: string): Promise<boolean> {
    const result = await db.delete(recipes).where(eq(recipes.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Dishes
  async getDishes(): Promise<Dish[]> {
    return await db.select().from(dishes);
  }

  async getDish(id: string): Promise<Dish | undefined> {
    const result = await db.select().from(dishes).where(eq(dishes.id, id));
    return result[0];
  }

  async createDish(insertDish: InsertDish): Promise<Dish> {
    const result = await db.insert(dishes).values({
      ...insertDish
    }).returning();
    return result[0];
  }

  async updateDish(id: string, updates: UpdateDish): Promise<Dish | undefined> {
    // Filter out undefined values and ensure only safe fields are updated
    const sanitizedUpdates: any = {};
    if (updates.name !== undefined) sanitizedUpdates.name = updates.name;
    if (updates.ingredients !== undefined) sanitizedUpdates.ingredients = updates.ingredients;
    if (updates.totalCost !== undefined) sanitizedUpdates.totalCost = updates.totalCost;
    if (updates.sellingPrice !== undefined) sanitizedUpdates.sellingPrice = updates.sellingPrice;
    if (updates.netPrice !== undefined) sanitizedUpdates.netPrice = updates.netPrice;
    if (updates.foodCost !== undefined) sanitizedUpdates.foodCost = updates.foodCost;
    
    // Always update the updatedAt timestamp
    sanitizedUpdates.updatedAt = new Date();
    
    const result = await db.update(dishes)
      .set(sanitizedUpdates)
      .where(eq(dishes.id, id))
      .returning();
    return result[0];
  }

  async deleteDish(id: string): Promise<boolean> {
    const result = await db.delete(dishes).where(eq(dishes.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Sales (Vendite)
  async getSales(): Promise<Sales[]> {
    return await db.select().from(sales);
  }

  async getSale(id: string): Promise<Sales | undefined> {
    const result = await db.select().from(sales).where(eq(sales.id, id));
    return result[0];
  }

  async getSalesByDish(dishId: string): Promise<Sales[]> {
    return await db.select().from(sales).where(eq(sales.dishId, dishId));
  }

  async createSale(insertSale: InsertSales): Promise<Sales> {
    const result = await db.insert(sales).values({
      ...insertSale,
      totalCost: insertSale.quantitySold * insertSale.unitCost,
      totalRevenue: insertSale.quantitySold * insertSale.unitRevenue,
      notes: insertSale.notes || null,
    }).returning();
    return result[0];
  }

  async updateSale(id: string, updates: UpdateSales): Promise<Sales | undefined> {
    // Filter out undefined values and ensure only safe fields are updated
    const sanitizedUpdates: any = {};
    if (updates.dishName !== undefined) sanitizedUpdates.dishName = updates.dishName;
    if (updates.quantitySold !== undefined) sanitizedUpdates.quantitySold = updates.quantitySold;
    if (updates.unitCost !== undefined) sanitizedUpdates.unitCost = updates.unitCost;
    if (updates.unitRevenue !== undefined) sanitizedUpdates.unitRevenue = updates.unitRevenue;
    if (updates.saleDate !== undefined) sanitizedUpdates.saleDate = updates.saleDate;
    if (updates.notes !== undefined) sanitizedUpdates.notes = updates.notes;
    
    // Recalculate totals if quantity or unit prices change
    if (updates.quantitySold !== undefined || updates.unitCost !== undefined || updates.unitRevenue !== undefined) {
      const currentSale = await this.getSale(id);
      if (currentSale) {
        const quantity = updates.quantitySold ?? currentSale.quantitySold;
        const unitCost = updates.unitCost ?? currentSale.unitCost;
        const unitRevenue = updates.unitRevenue ?? currentSale.unitRevenue;
        sanitizedUpdates.totalCost = quantity * unitCost;
        sanitizedUpdates.totalRevenue = quantity * unitRevenue;
      }
    }
    
    // Always update the updatedAt timestamp
    sanitizedUpdates.updatedAt = new Date();
    
    const result = await db.update(sales)
      .set(sanitizedUpdates)
      .where(eq(sales.id, id))
      .returning();
    return result[0];
  }

  async deleteSale(id: string): Promise<boolean> {
    const result = await db.delete(sales).where(eq(sales.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Waste
  async getWaste(): Promise<Waste[]> {
    return await db.select().from(waste);
  }

  async createWaste(insertWaste: InsertWaste): Promise<Waste> {
    const result = await db.insert(waste).values({
      ...insertWaste,
      notes: insertWaste.notes || null,
    }).returning();
    return result[0];
  }

  async deleteWaste(id: string): Promise<boolean> {
    const result = await db.delete(waste).where(eq(waste.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Personal Meals
  async getPersonalMeals(): Promise<PersonalMeal[]> {
    return await db.select().from(personalMeals);
  }

  async createPersonalMeal(insertMeal: InsertPersonalMeal): Promise<PersonalMeal> {
    const result = await db.insert(personalMeals).values({
      ...insertMeal,
      notes: insertMeal.notes || null,
    }).returning();
    return result[0];
  }

  async deletePersonalMeal(id: string): Promise<boolean> {
    const result = await db.delete(personalMeals).where(eq(personalMeals.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Orders (Ricevimento Merci)
  async getOrders(): Promise<Order[]> {
    return await db.select().from(orders);
  }

  async getOrder(id: string): Promise<Order | undefined> {
    const result = await db.select().from(orders).where(eq(orders.id, id));
    return result[0];
  }

  async createOrder(insertOrder: InsertOrder): Promise<Order> {
    const result = await db.insert(orders).values({
      ...insertOrder,
      notes: insertOrder.notes || null,
      operatorName: insertOrder.operatorName || null,
    }).returning();
    return result[0];
  }

  async updateOrder(id: string, updates: UpdateOrder): Promise<Order | undefined> {
    // Use transaction for atomic order updates with stock movements
    return await db.transaction(async (tx) => {
      // First, get the current order to check status change
      const currentOrderResult = await tx.select().from(orders).where(eq(orders.id, id));
      const currentOrder = currentOrderResult[0];
      
      if (!currentOrder) {
        console.log(`[AUTOMATISMO] Ordine ${id} non trovato`);
        return undefined;
      }

      const sanitizedUpdates: any = {};
      if (updates.supplier !== undefined) sanitizedUpdates.supplier = updates.supplier;
      if (updates.orderDate !== undefined) sanitizedUpdates.orderDate = updates.orderDate;
      if (updates.items !== undefined) sanitizedUpdates.items = updates.items;
      if (updates.totalAmount !== undefined) sanitizedUpdates.totalAmount = updates.totalAmount;
      if (updates.status !== undefined) sanitizedUpdates.status = updates.status;
      if (updates.notes !== undefined) sanitizedUpdates.notes = updates.notes;
      if (updates.operatorName !== undefined) sanitizedUpdates.operatorName = updates.operatorName;
      
      sanitizedUpdates.updatedAt = new Date();
      
      // AUTOMATISMO: Rilevazione transizione a "confirmed"
      const isTransitionToConfirmed = updates.status === "confirmed" && 
                                     currentOrder.status !== "confirmed";
      
      if (isTransitionToConfirmed) {
        console.log(`[TRANSAZIONE] Rilevata transizione di stato per ordine ${id}: "${currentOrder.status}" → "confirmed"`);
        
        // CONTROLLO ANTI-DUPLICAZIONE: Verifica che non esistano già movimenti per questo ordine
        const existingMovements = await tx.select()
          .from(stockMovements)
          .where(and(
            eq(stockMovements.source, "order"),
            eq(stockMovements.sourceId, id)
          ));
          
        if (existingMovements.length > 0) {
          console.log(`[TRANSAZIONE] ⚠️  SKIP - Esistono già ${existingMovements.length} movimenti per ordine ${id}:`);
          existingMovements.forEach(mov => {
            console.log(`[TRANSAZIONE]    - ${mov.movementType.toUpperCase()}: ${mov.quantity} x ${mov.productId} (ID: ${mov.id})`);
          });
          
          // Aggiorna comunque l'ordine ma salta la creazione movimenti
          const result = await tx.update(orders)
            .set(sanitizedUpdates)
            .where(eq(orders.id, id))
            .returning();
          return result[0];
        }
        
        console.log(`[TRANSAZIONE] ✅ Nessun movimento esistente trovato - procedo con creazione automatica atomica`);
      }
      
      // Aggiorna l'ordine DENTRO la transazione
      const result = await tx.update(orders)
        .set(sanitizedUpdates)
        .where(eq(orders.id, id))
        .returning();
      
      const updatedOrder = result[0];
      
      // Se abbiamo una transizione a confirmed e nessun movimento esistente, crea i movimenti ATOMICAMENTE
      if (isTransitionToConfirmed && updatedOrder) {
        console.log(`[TRANSAZIONE] 🚀 Iniziando creazione movimenti IN atomica per ordine ${id}`);
        console.log(`[TRANSAZIONE]    Supplier: ${updatedOrder.supplier}`);
        console.log(`[TRANSAZIONE]    Items: ${updatedOrder.items.length}`);
        console.log(`[TRANSAZIONE]    Totale: €${updatedOrder.totalAmount}`);
        
        // Crea movimenti di stock IN per ogni item dell'ordine DENTRO la stessa transazione
        const createdMovements = [];
        for (let i = 0; i < updatedOrder.items.length; i++) {
          const item = updatedOrder.items[i];
          console.log(`[TRANSAZIONE]    Processando item ${i+1}/${updatedOrder.items.length}: ${item.quantity} x ${item.productId}`);
          
          // Crea il movimento DENTRO la transazione
          const stockMovementResult = await tx.insert(stockMovements).values({
            productId: item.productId,
            movementType: "in",
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalCost: item.totalPrice,
            source: "order",
            sourceId: updatedOrder.id,
            movementDate: updatedOrder.orderDate,
            notes: `Ricevimento automatico da ordine ${updatedOrder.supplier} - ${updatedOrder.operatorName || 'Sistema'}`,
          }).returning();
          
          const created = stockMovementResult[0];
          createdMovements.push(created);
          console.log(`[TRANSAZIONE]    ✅ Creato movimento IN #${i+1}: ${item.quantity} x ${item.productId} (ID: ${created.id})`);
        }
        
        console.log(`[TRANSAZIONE] 🎉 COMMIT: creati ${createdMovements.length} movimenti atomici per ordine ${id}`);
        console.log(`[TRANSAZIONE]    Riepilogo movimenti:`);
        createdMovements.forEach((mov, idx) => {
          console.log(`[TRANSAZIONE]      ${idx+1}. ${mov.movementType.toUpperCase()}: ${mov.quantity} x ${mov.productId} = €${mov.totalCost || 'N/A'} (${mov.id})`);
        });
      }
      
      // La transazione fa commit automaticamente se arriva qui
      return updatedOrder;
    });
    // Se c'è un errore, la transazione fa rollback automaticamente
  }

  async deleteOrder(id: string): Promise<boolean> {
    const result = await db.delete(orders).where(eq(orders.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Stock Movements (Magazzino In/Out)
  async getStockMovements(): Promise<StockMovement[]> {
    return await db.select().from(stockMovements);
  }

  async getStockMovement(id: string): Promise<StockMovement | undefined> {
    const result = await db.select().from(stockMovements).where(eq(stockMovements.id, id));
    return result[0];
  }

  async getStockMovementsByProduct(productId: string): Promise<StockMovement[]> {
    return await db.select().from(stockMovements).where(eq(stockMovements.productId, productId));
  }

  async createStockMovement(insertMovement: InsertStockMovement): Promise<StockMovement> {
    const result = await db.insert(stockMovements).values({
      ...insertMovement,
      unitPrice: insertMovement.unitPrice || null,
      totalCost: insertMovement.totalCost || null,
      sourceId: insertMovement.sourceId || null,
      notes: insertMovement.notes || null,
    }).returning();
    return result[0];
  }

  async updateStockMovement(id: string, updates: UpdateStockMovement): Promise<StockMovement | undefined> {
    const sanitizedUpdates: any = {};
    if (updates.quantity !== undefined) sanitizedUpdates.quantity = updates.quantity;
    if (updates.unitPrice !== undefined) sanitizedUpdates.unitPrice = updates.unitPrice;
    if (updates.totalCost !== undefined) sanitizedUpdates.totalCost = updates.totalCost;
    if (updates.movementDate !== undefined) sanitizedUpdates.movementDate = updates.movementDate;
    if (updates.notes !== undefined) sanitizedUpdates.notes = updates.notes;
    
    const result = await db.update(stockMovements)
      .set(sanitizedUpdates)
      .where(eq(stockMovements.id, id))
      .returning();
    return result[0];
  }

  async deleteStockMovement(id: string): Promise<boolean> {
    const result = await db.delete(stockMovements).where(eq(stockMovements.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Inventory Snapshots
  async getInventorySnapshots(): Promise<InventorySnapshot[]> {
    return await db.select().from(inventorySnapshots);
  }

  async getInventorySnapshot(id: string): Promise<InventorySnapshot | undefined> {
    const result = await db.select().from(inventorySnapshots).where(eq(inventorySnapshots.id, id));
    return result[0];
  }

  async getInventorySnapshotsByProduct(productId: string): Promise<InventorySnapshot[]> {
    return await db.select().from(inventorySnapshots).where(eq(inventorySnapshots.productId, productId));
  }

  async createInventorySnapshot(insertSnapshot: InsertInventorySnapshot): Promise<InventorySnapshot> {
    const result = await db.insert(inventorySnapshots).values({
      ...insertSnapshot,
      theoreticalQuantity: insertSnapshot.theoreticalQuantity || null,
      variance: insertSnapshot.variance || null,
    }).returning();
    return result[0];
  }

  async updateInventorySnapshot(id: string, updates: UpdateInventorySnapshot): Promise<InventorySnapshot | undefined> {
    const sanitizedUpdates: any = {};
    if (updates.snapshotDate !== undefined) sanitizedUpdates.snapshotDate = updates.snapshotDate;
    if (updates.initialQuantity !== undefined) sanitizedUpdates.initialQuantity = updates.initialQuantity;
    if (updates.finalQuantity !== undefined) sanitizedUpdates.finalQuantity = updates.finalQuantity;
    if (updates.theoreticalQuantity !== undefined) sanitizedUpdates.theoreticalQuantity = updates.theoreticalQuantity;
    if (updates.variance !== undefined) sanitizedUpdates.variance = updates.variance;
    
    const result = await db.update(inventorySnapshots)
      .set(sanitizedUpdates)
      .where(eq(inventorySnapshots.id, id))
      .returning();
    return result[0];
  }

  async deleteInventorySnapshot(id: string): Promise<boolean> {
    const result = await db.delete(inventorySnapshots).where(eq(inventorySnapshots.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Editable Inventory methods
  async getEditableInventory(): Promise<EditableInventory[]> {
    return await db.select().from(editableInventory);
  }

  async getEditableInventoryByProduct(productId: string): Promise<EditableInventory | undefined> {
    const result = await db.select().from(editableInventory).where(eq(editableInventory.productId, productId));
    return result[0];
  }

  async createEditableInventory(inventory: InsertEditableInventory): Promise<EditableInventory> {
    const result = await db.insert(editableInventory).values({
      ...inventory,
      notes: inventory.notes || null,
    }).returning();
    return result[0];
  }

  async updateEditableInventory(id: string, updates: UpdateEditableInventory): Promise<EditableInventory | undefined> {
    const sanitizedUpdates: any = {};
    if (updates.initialQuantity !== undefined) sanitizedUpdates.initialQuantity = updates.initialQuantity;
    if (updates.finalQuantity !== undefined) sanitizedUpdates.finalQuantity = updates.finalQuantity;
    if (updates.notes !== undefined) sanitizedUpdates.notes = updates.notes;
    
    // Always update lastUpdated when modifying
    sanitizedUpdates.lastUpdated = new Date();
    
    const result = await db.update(editableInventory)
      .set(sanitizedUpdates)
      .where(eq(editableInventory.id, id))
      .returning();
    return result[0];
  }

  async upsertEditableInventory(inventory: UpsertEditableInventory): Promise<EditableInventory> {
    // Check if a record exists for this product
    const existingRecord = await this.getEditableInventoryByProduct(inventory.productId);
    
    if (existingRecord) {
      // Update existing record
      const updateData: UpdateEditableInventory = {
        initialQuantity: inventory.initialQuantity,
        finalQuantity: inventory.finalQuantity,
        notes: inventory.notes || `Aggiornato il ${new Date().toLocaleDateString()}`
      };
      
      const result = await this.updateEditableInventory(existingRecord.id, updateData);
      if (!result) {
        throw new Error("Failed to update editable inventory record");
      }
      return result;
    } else {
      // Create new record
      const insertData: InsertEditableInventory = {
        productId: inventory.productId,
        initialQuantity: inventory.initialQuantity,
        finalQuantity: inventory.finalQuantity,
        notes: inventory.notes || `Creato il ${new Date().toLocaleDateString()}`
      };
      
      return await this.createEditableInventory(insertData);
    }
  }

  async deleteEditableInventory(id: string): Promise<boolean> {
    const result = await db.delete(editableInventory).where(eq(editableInventory.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Budget Entries implementation
  async getBudgetEntries(): Promise<BudgetEntry[]> {
    return await db.select().from(budgetEntries);
  }

  async getBudgetEntry(id: string): Promise<BudgetEntry | undefined> {
    const result = await db.select().from(budgetEntries).where(eq(budgetEntries.id, id));
    return result[0];
  }

  async getBudgetEntriesByMonth(year: number, month: number): Promise<BudgetEntry[]> {
    return await db.select().from(budgetEntries)
      .where(and(eq(budgetEntries.year, year), eq(budgetEntries.month, month)));
  }

  async createBudgetEntry(insertBudgetEntry: InsertBudgetEntry): Promise<BudgetEntry> {
    const result = await db.insert(budgetEntries).values({
      ...insertBudgetEntry,
      notes: insertBudgetEntry.notes || null,
    }).returning();
    return result[0];
  }

  async updateBudgetEntry(id: string, updates: UpdateBudgetEntry): Promise<BudgetEntry | undefined> {
    // Filter out undefined values
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, value]) => value !== undefined)
    );

    if (Object.keys(filteredUpdates).length === 0) {
      return await this.getBudgetEntry(id);
    }

    const result = await db.update(budgetEntries)
      .set({ ...filteredUpdates, updatedAt: new Date() })
      .where(eq(budgetEntries.id, id))
      .returning();
    return result[0];
  }

  async deleteBudgetEntry(id: string): Promise<boolean> {
    const result = await db.delete(budgetEntries).where(eq(budgetEntries.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Economic Parameters implementation
  async getEconomicParameters(): Promise<EconomicParameters[]> {
    return await db.select().from(economicParameters);
  }

  async getEconomicParameter(id: string): Promise<EconomicParameters | undefined> {
    const result = await db.select().from(economicParameters).where(eq(economicParameters.id, id));
    return result[0];
  }

  async getEconomicParametersByMonth(year: number, month: number): Promise<EconomicParameters | undefined> {
    const result = await db.select().from(economicParameters)
      .where(and(eq(economicParameters.year, year), eq(economicParameters.month, month)));
    return result[0];
  }

  async createEconomicParameters(insertParameters: InsertEconomicParameters): Promise<EconomicParameters> {
    const result = await db.insert(economicParameters).values({
      ...insertParameters,
    }).returning();
    return result[0];
  }

  async updateEconomicParameters(id: string, updates: UpdateEconomicParameters): Promise<EconomicParameters | undefined> {
    // Filter out undefined values
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, value]) => value !== undefined)
    );

    if (Object.keys(filteredUpdates).length === 0) {
      return await this.getEconomicParameter(id);
    }

    const result = await db.update(economicParameters)
      .set(filteredUpdates)
      .where(eq(economicParameters.id, id))
      .returning();
    return result[0];
  }

  async upsertEconomicParametersByMonth(year: number, month: number, updates: UpdateEconomicParameters): Promise<EconomicParameters> {
    // Try to find existing record
    const existing = await this.getEconomicParametersByMonth(year, month);
    
    if (existing) {
      // Update existing record
      const updated = await this.updateEconomicParameters(existing.id, updates);
      return updated!;
    } else {
      // Create new record
      const insertData: InsertEconomicParameters = {
        year,
        month,
        ...updates,
      };
      return await this.createEconomicParameters(insertData);
    }
  }

  async deleteEconomicParameters(id: string): Promise<boolean> {
    const result = await db.delete(economicParameters).where(eq(economicParameters.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Users authentication methods
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username));
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email));
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await db.insert(users).values(insertUser).returning();
    return result[0];
  }

  // (IMPORTANT) upsertUser method is mandatory for Replit Auth  
  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Session store initialized in constructor
  sessionStore: session.Store;

  constructor() {
    // Initialize PostgreSQL session store
    const PostgresSessionStore = connectPg(session);
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      createTableIfMissing: true 
    });
  }
}

export const storage = new DatabaseStorage();