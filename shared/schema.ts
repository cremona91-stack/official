import { sql } from "drizzle-orm";
import { pgTable, text, varchar, real, integer, json, timestamp, boolean, uniqueIndex, index, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Recipe ingredient schema
export const recipeIngredientSchema = z.object({
  productId: z.string(),
  quantity: z.number().min(0),
  cost: z.number().min(0),
  weightAdjustment: z.number().min(-100).max(1000).default(0), // Peso +/- percentage for this ingredient
});

// Dish ingredient schema - can be either a product or a recipe
export const dishIngredientSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("product"),
    productId: z.string(),
    quantity: z.number().min(0),
    cost: z.number().min(0),
  }),
  z.object({
    type: z.literal("recipe"),
    recipeId: z.string(),
    quantity: z.number().min(0),
    cost: z.number().min(0),
  }),
]);

// Suppliers table
export const suppliers = pgTable("suppliers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Product/Ingredient table
export const products = pgTable("products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  code: varchar("code").notNull().unique(),
  name: text("name").notNull(),
  supplierId: varchar("supplier_id").references(() => suppliers.id, { onDelete: "set null" }),
  // Keep legacy fields for backward compatibility during migration
  supplier: text("supplier"),
  supplierEmail: text("supplier_email"),
  waste: real("waste").notNull().default(0),
  notes: text("notes"),
  quantity: real("quantity").notNull(),
  unit: varchar("unit").notNull(), // kg, l, pezzo
  pricePerUnit: real("price_per_unit").notNull(),
  effectivePricePerUnit: real("effective_price_per_unit").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Recipe table
export const recipes = pgTable("recipes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  ingredients: json("ingredients").$type<z.infer<typeof recipeIngredientSchema>[]>().notNull(),
  weightAdjustment: real("weight_adjustment").notNull().default(0), // Peso +/- percentage
  totalCost: real("total_cost").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Dish table
export const dishes = pgTable("dishes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  ingredients: json("ingredients").$type<z.infer<typeof dishIngredientSchema>[]>().notNull(),
  totalCost: real("total_cost").notNull(),
  sellingPrice: real("selling_price").notNull(),
  netPrice: real("net_price").notNull(),
  foodCost: real("food_cost").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Waste table
export const waste = pgTable("waste", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  productId: varchar("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  quantity: real("quantity").notNull(),
  cost: real("cost").notNull(),
  date: text("date").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Personal meals table
export const personalMeals = pgTable("personal_meals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  dishId: varchar("dish_id").notNull().references(() => dishes.id, { onDelete: "cascade" }),
  quantity: integer("quantity").notNull().default(1),
  cost: real("cost").notNull(),
  date: text("date").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Sales table (Vendite)
export const sales = pgTable("sales", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  dishId: varchar("dish_id").notNull().references(() => dishes.id, { onDelete: "cascade" }),
  dishName: text("dish_name").notNull(),
  quantitySold: integer("quantity_sold").notNull(),
  unitCost: real("unit_cost").notNull(), // Costo materie prime per singolo piatto
  unitRevenue: real("unit_revenue").notNull(), // Ricavo netto per singolo piatto
  totalCost: real("total_cost").notNull(), // unitCost * quantitySold
  totalRevenue: real("total_revenue").notNull(), // unitRevenue * quantitySold
  saleDate: text("sale_date").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Order item schema
export const orderItemSchema = z.object({
  productId: z.string(),
  quantity: z.number().min(0),
  unitPrice: z.number().min(0),
  totalPrice: z.number().min(0),
});

// Orders table (Ricevimento Merci)
export const orders = pgTable("orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  supplier: text("supplier").notNull(),
  orderDate: text("order_date").notNull(),
  items: json("items").$type<z.infer<typeof orderItemSchema>[]>().notNull(),
  totalAmount: real("total_amount").notNull(),
  status: varchar("status").notNull().default("pending"), // pending, confirmed, cancelled
  notes: text("notes"),
  operatorName: text("operator_name"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Stock movements table (Magazzino In/Out)
export const stockMovements = pgTable("stock_movements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  productId: varchar("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  movementType: varchar("movement_type").notNull(), // 'in' | 'out'
  quantity: real("quantity").notNull(),
  unitPrice: real("unit_price"),
  totalCost: real("total_cost"),
  source: varchar("source").notNull(), // 'order', 'sale', 'waste', 'adjustment'
  sourceId: varchar("source_id"), // ID dell'ordine, vendita, etc.
  movementDate: text("movement_date").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Inventory snapshots table (per calcoli teorici)
export const inventorySnapshots = pgTable("inventory_snapshots", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  productId: varchar("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  snapshotDate: text("snapshot_date").notNull(),
  initialQuantity: real("initial_quantity").notNull(),
  finalQuantity: real("final_quantity").notNull(),
  theoreticalQuantity: real("theoretical_quantity"),
  variance: real("variance"), // differenza tra teorico e finale
  createdAt: timestamp("created_at").defaultNow(),
});

// Editable inventory values table (nuovo sistema per magazzino editabile)
export const editableInventory = pgTable("editable_inventory", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  productId: varchar("product_id").notNull().unique().references(() => products.id, { onDelete: "cascade" }),
  initialQuantity: real("initial_quantity").notNull().default(0),
  finalQuantity: real("final_quantity").notNull().default(0),
  lastUpdated: timestamp("last_updated").defaultNow(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Zod schemas for validation
export const insertSupplierSchema = createInsertSchema(suppliers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  name: z.string().min(1, "Nome fornitore richiesto"),
  email: z.string().email().optional().or(z.literal("")),
  notes: z.string().optional(),
});

export const updateSupplierSchema = z.object({
  name: z.string().min(1, "Nome fornitore richiesto").optional(),
  email: z.string().email().optional().or(z.literal("")),
  notes: z.string().optional(),
});

export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  effectivePricePerUnit: true, // Calculated automatically by backend
}).extend({
  waste: z.number().min(0).max(100).default(0),
  quantity: z.number().min(0),
  pricePerUnit: z.number().min(0),
  unit: z.enum(["kg", "l", "pezzo"]),
  supplierId: z.string().optional().or(z.literal("")),
  // Keep legacy fields for backward compatibility
  supplierEmail: z.string().email().optional().or(z.literal("")),
});

export const insertRecipeSchema = createInsertSchema(recipes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  ingredients: z.array(recipeIngredientSchema),
  weightAdjustment: z.number().min(-99.9, "Weight adjustment cannot be -100% or lower").max(500, "Weight adjustment cannot exceed 500%").default(0), // Peso +/- percentage (-99.9% to +500%)
  totalCost: z.number().min(0),
});

export const insertDishSchema = createInsertSchema(dishes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  ingredients: z.array(dishIngredientSchema),
  totalCost: z.number().min(0),
  sellingPrice: z.number().min(0),
  netPrice: z.number().min(0),
  foodCost: z.number().min(0),
});

export const insertWasteSchema = createInsertSchema(waste).omit({
  id: true,
  createdAt: true,
}).extend({
  quantity: z.number().min(0),
  cost: z.number().min(0),
});

export const insertPersonalMealSchema = createInsertSchema(personalMeals).omit({
  id: true,
  createdAt: true,
}).extend({
  quantity: z.number().min(0).default(1),
  cost: z.number().min(0),
});

export const insertSalesSchema = createInsertSchema(sales).omit({
  id: true,
  totalCost: true, // Calculated automatically
  totalRevenue: true, // Calculated automatically
  createdAt: true,
  updatedAt: true,
}).extend({
  dishName: z.string().min(1),
  quantitySold: z.number().min(1),
  unitCost: z.number().min(0),
  unitRevenue: z.number().min(0),
  saleDate: z.string(),
});

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  items: z.array(orderItemSchema),
  totalAmount: z.number().min(0),
  status: z.enum(["pending", "confirmed", "cancelled", "pendente"]).default("pending"),
});

export const insertStockMovementSchema = createInsertSchema(stockMovements).omit({
  id: true,
  createdAt: true,
}).extend({
  movementType: z.enum(["in", "out"]),
  quantity: z.number().min(0),
  unitPrice: z.number().min(0).optional(),
  totalCost: z.number().min(0).optional(),
  source: z.enum(["order", "sale", "waste", "personal_meal", "adjustment"]),
});

export const insertInventorySnapshotSchema = createInsertSchema(inventorySnapshots).omit({
  id: true,
  createdAt: true,
}).extend({
  initialQuantity: z.number().min(0),
  finalQuantity: z.number().min(0),
  theoreticalQuantity: z.number().min(0).optional(),
  variance: z.number().optional(),
});

export const insertEditableInventorySchema = createInsertSchema(editableInventory).omit({
  id: true,
  createdAt: true,
  lastUpdated: true,
}).extend({
  initialQuantity: z.number().min(0),
  finalQuantity: z.number().min(0),
});

// Update schemas for secure PATCH/PUT operations
export const updateProductSchema = insertProductSchema.partial().omit({
  // Explicitly omit immutable fields that should never be updated
}).extend({
  // Allow optional updates but maintain validation
  waste: z.number().min(0).max(100).optional(),
  quantity: z.number().min(0).optional(),
  pricePerUnit: z.number().min(0).optional(),
  unit: z.enum(["kg", "l", "pezzo"]).optional(),
  supplierEmail: z.string().email().optional().or(z.literal("")).optional(),
});

export const updateRecipeSchema = z.object({
  name: z.string().optional(),
  ingredients: z.array(recipeIngredientSchema).optional(),
  weightAdjustment: z.number().min(-99.9, "Weight adjustment cannot be -100% or lower").max(500, "Weight adjustment cannot exceed 500%").optional(), // Peso +/- percentage
  totalCost: z.number().min(0).optional(),
});

export const updateDishSchema = z.object({
  name: z.string().optional(),
  ingredients: z.array(dishIngredientSchema).optional(),
  totalCost: z.number().min(0).optional(),
  sellingPrice: z.number().min(0).optional(),
  netPrice: z.number().min(0).optional(),
  foodCost: z.number().min(0).optional(),
});

export const updateSalesSchema = z.object({
  dishName: z.string().min(1).optional(),
  quantitySold: z.number().min(1).optional(),
  unitCost: z.number().min(0).optional(),
  unitRevenue: z.number().min(0).optional(),
  saleDate: z.string().optional(),
  notes: z.string().optional(),
});

export const updateOrderSchema = z.object({
  supplier: z.string().optional(),
  orderDate: z.string().optional(),
  items: z.array(orderItemSchema).optional(),
  totalAmount: z.number().min(0).optional(),
  status: z.enum(["pending", "confirmed", "cancelled", "pendente"]).optional(),
  notes: z.string().optional(),
  operatorName: z.string().optional(),
});

export const updateStockMovementSchema = z.object({
  quantity: z.number().min(0).optional(),
  unitPrice: z.number().min(0).optional(),
  totalCost: z.number().min(0).optional(),
  movementDate: z.string().optional(),
  notes: z.string().optional(),
});

export const updateInventorySnapshotSchema = z.object({
  snapshotDate: z.string().optional(),
  initialQuantity: z.number().min(0).optional(),
  finalQuantity: z.number().min(0).optional(),
  theoreticalQuantity: z.number().min(0).optional(),
  variance: z.number().optional(),
});

export const updateEditableInventorySchema = z.object({
  initialQuantity: z.number().min(0).optional(),
  finalQuantity: z.number().min(0).optional(),
  notes: z.string().optional(),
});

export const upsertEditableInventorySchema = z.object({
  productId: z.string(),
  initialQuantity: z.number().min(0),
  finalQuantity: z.number().min(0),
  notes: z.string().optional(),
});

// Types
export type Supplier = typeof suppliers.$inferSelect;
export type InsertSupplier = z.infer<typeof insertSupplierSchema>;
export type UpdateSupplier = z.infer<typeof updateSupplierSchema>;
export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type UpdateProduct = z.infer<typeof updateProductSchema>;
export type Recipe = typeof recipes.$inferSelect;
export type InsertRecipe = z.infer<typeof insertRecipeSchema>;
export type UpdateRecipe = z.infer<typeof updateRecipeSchema>;
export type Dish = typeof dishes.$inferSelect;
export type InsertDish = z.infer<typeof insertDishSchema>;
export type UpdateDish = z.infer<typeof updateDishSchema>;
export type Sales = typeof sales.$inferSelect;
export type InsertSales = z.infer<typeof insertSalesSchema>;
export type UpdateSales = z.infer<typeof updateSalesSchema>;
export type Waste = typeof waste.$inferSelect;
export type InsertWaste = z.infer<typeof insertWasteSchema>;
export type PersonalMeal = typeof personalMeals.$inferSelect;
export type InsertPersonalMeal = z.infer<typeof insertPersonalMealSchema>;
export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type UpdateOrder = z.infer<typeof updateOrderSchema>;
export type StockMovement = typeof stockMovements.$inferSelect;
export type InsertStockMovement = z.infer<typeof insertStockMovementSchema>;
export type UpdateStockMovement = z.infer<typeof updateStockMovementSchema>;
export type InventorySnapshot = typeof inventorySnapshots.$inferSelect;
export type InsertInventorySnapshot = z.infer<typeof insertInventorySnapshotSchema>;
export type UpdateInventorySnapshot = z.infer<typeof updateInventorySnapshotSchema>;
export type EditableInventory = typeof editableInventory.$inferSelect;
export type InsertEditableInventory = z.infer<typeof insertEditableInventorySchema>;
export type UpdateEditableInventory = z.infer<typeof updateEditableInventorySchema>;
export type UpsertEditableInventory = z.infer<typeof upsertEditableInventorySchema>;

// Budget entries table
export const budgetEntries = pgTable("budget_entries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  date: text("date").notNull(), // Format: YYYY-MM-DD
  year: integer("year").notNull(), // 2026, 2025, etc.
  month: integer("month").notNull(), // 1-12
  day: integer("day").notNull(), // 1-31
  copertoMedio: real("coperto_medio"), // Prezzo medio per coperto
  coperti: integer("coperti"), // Numero di coperti previsti
  budgetRevenue: real("budget_revenue"), // Budget ricavi (calcolato: coperti * copertoMedio)
  budgetDelivery: real("budget_delivery"), // Budget delivery
  actualRevenue: real("actual_revenue"), // Incasso reale (per confronti)
  actualDelivery: real("actual_delivery"), // Delivery reale (per confronti)
  consuntivo: real("consuntivo"), // Consuntivo 2026 (budget_revenue + budget_delivery)
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Budget schemas
export const insertBudgetEntrySchema = createInsertSchema(budgetEntries, {
  date: z.string().min(1),
  year: z.number().min(2020).max(2050),
  month: z.number().min(1).max(12),
  day: z.number().min(1).max(31),
  copertoMedio: z.number().min(0).optional(),
  coperti: z.number().min(0).optional(),
  budgetRevenue: z.number().min(0).optional(),
  budgetDelivery: z.number().min(0).optional(),
  actualRevenue: z.number().min(0).optional(),
  actualDelivery: z.number().min(0).optional(),
  consuntivo: z.number().min(0).optional(),
  notes: z.string().optional(),
}).omit({ id: true, createdAt: true, updatedAt: true });

export const updateBudgetEntrySchema = z.object({
  copertoMedio: z.number().min(0).optional(),
  coperti: z.number().min(0).optional(),
  budgetRevenue: z.number().min(0).optional(),
  budgetDelivery: z.number().min(0).optional(),
  actualRevenue: z.number().min(0).optional(),
  actualDelivery: z.number().min(0).optional(),
  consuntivo: z.number().min(0).optional(),
  notes: z.string().optional(),
});

// Budget types
export type BudgetEntry = typeof budgetEntries.$inferSelect;
export type InsertBudgetEntry = z.infer<typeof insertBudgetEntrySchema>;
export type UpdateBudgetEntry = z.infer<typeof updateBudgetEntrySchema>;

// Economic parameters table for editable P&L values
export const economicParameters = pgTable("economic_parameters", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  year: integer("year").notNull(), // 2026, 2025, etc.
  month: integer("month").notNull(), // 1-12
  
  // Target percentages (editable) - DEPRECATED: ora si calcola da budget€ / corrispettivi
  materieFirstePercent: real("materie_prime_percent").default(22.10), // Consumi materie prime %
  acquistiVarPercent: real("acquisti_vari_percent").default(3.00), // Acquisti vari %
  
  // Budget amounts for materie prime and acquisti vari (NEW)
  materieFirsteBudget: real("materie_prime_budget").default(0), // Consumi materie prime €
  acquistiVarBudget: real("acquisti_vari_budget").default(0), // Acquisti vari €
  
  // Budget amounts (editable)
  locazioniBudget: real("locazioni_budget").default(0), // Locazioni locali €
  personaleBudget: real("personale_budget").default(0), // Costi del personale €
  utenzeBudget: real("utenze_budget").default(0), // Utenze €
  manutenzionibudget: real("manutenzioni_budget").default(0), // Manutenzioni €
  noleggibudget: real("noleggi_budget").default(0), // Noleggi e Leasing €
  prestazioniTerziBudget: real("prestazioni_terzi_budget").default(0), // Prestazioni di terzi €
  consulenzeBudget: real("consulenze_budget").default(0), // Consulenze e compensi a terzi €
  marketingBudget: real("marketing_budget").default(0), // Marketing €
  deliveryBudget: real("delivery_budget").default(0), // Delivery €
  trasferteBudget: real("trasferte_budget").default(0), // Trasferte e viaggi €
  assicurazioniBudget: real("assicurazioni_budget").default(0), // Assicurazioni €
  speseBancarieBudget: real("spese_bancarie_budget").default(0), // Spese bancarie €
  
  // Consuntivo amounts (editable)
  materieFirsteConsuntivo: real("materie_prime_consuntivo").default(0), // Consumi materie prime consuntivo €
  acquistiVarConsuntivo: real("acquisti_vari_consuntivo").default(0), // Acquisti vari consuntivo €
  locazioniConsuntivo: real("locazioni_consuntivo").default(0), // Locazioni locali consuntivo €
  personaleConsuntivo: real("personale_consuntivo").default(0), // Costi del personale consuntivo €
  utenzeConsuntivo: real("utenze_consuntivo").default(0), // Utenze consuntivo €
  manutenzioniConsuntivo: real("manutenzioni_consuntivo").default(0), // Manutenzioni consuntivo €
  noleggiConsuntivo: real("noleggi_consuntivo").default(0), // Noleggi e Leasing consuntivo €
  prestazioniTerziConsuntivo: real("prestazioni_terzi_consuntivo").default(0), // Prestazioni di terzi consuntivo €
  consulenzeConsuntivo: real("consulenze_consuntivo").default(0), // Consulenze e compensi a terzi consuntivo €
  marketingConsuntivo: real("marketing_consuntivo").default(0), // Marketing consuntivo €
  deliveryConsuntivo: real("delivery_consuntivo").default(0), // Delivery consuntivo €
  trasferteConsuntivo: real("trasferte_consuntivo").default(0), // Trasferte e viaggi consuntivo €
  assicurazioniConsuntivo: real("assicurazioni_consuntivo").default(0), // Assicurazioni consuntivo €
  speseBancarieConsuntivo: real("spese_bancarie_consuntivo").default(0), // Spese bancarie consuntivo €
  
  // Consuntivo percentages (new for bidirectional editing)
  materieFirsteConsuntivoPercent: real("materie_prime_consuntivo_percent").default(0), // Consumi materie prime consuntivo %
  acquistiVarConsuntivoPercent: real("acquisti_vari_consuntivo_percent").default(0), // Acquisti vari consuntivo %
  locazioniConsuntivoPercent: real("locazioni_consuntivo_percent").default(0), // Locazioni locali consuntivo %
  personaleConsuntivoPercent: real("personale_consuntivo_percent").default(0), // Costi del personale consuntivo %
  utenzeConsuntivoPercent: real("utenze_consuntivo_percent").default(0), // Utenze consuntivo %
  manutenzioniConsuntivoPercent: real("manutenzioni_consuntivo_percent").default(0), // Manutenzioni consuntivo %
  noleggiConsuntivoPercent: real("noleggi_consuntivo_percent").default(0), // Noleggi e Leasing consuntivo %
  prestazioniTerziConsuntivoPercent: real("prestazioni_terzi_consuntivo_percent").default(0), // Prestazioni di terzi consuntivo %
  consulenzeConsuntivoPercent: real("consulenze_consuntivo_percent").default(0), // Consulenze e compensi a terzi consuntivo %
  marketingConsuntivoPercent: real("marketing_consuntivo_percent").default(0), // Marketing consuntivo %
  deliveryConsuntivoPercent: real("delivery_consuntivo_percent").default(0), // Delivery consuntivo %
  trasferteConsuntivoPercent: real("trasferte_consuntivo_percent").default(0), // Trasferte e viaggi consuntivo %
  assicurazioniConsuntivoPercent: real("assicurazioni_consuntivo_percent").default(0), // Assicurazioni consuntivo %
  speseBancarieConsuntivoPercent: real("spese_bancarie_consuntivo_percent").default(0), // Spese bancarie consuntivo %
  
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => {
  return {
    yearMonthIdx: uniqueIndex("economic_parameters_year_month_idx").on(table.year, table.month),
  }
});

// Economic parameters schemas
export const insertEconomicParametersSchema = createInsertSchema(economicParameters, {
  year: z.number().min(2020).max(2050),
  month: z.number().min(1).max(12),
  materieFirstePercent: z.number().min(0).optional(),
  acquistiVarPercent: z.number().min(0).optional(),
  locazioniBudget: z.number().min(0).optional(),
  personaleBudget: z.number().min(0).optional(),
  utenzeBudget: z.number().min(0).optional(),
  manutenzionibudget: z.number().min(0).optional(),
  noleggibudget: z.number().min(0).optional(),
  prestazioniTerziBudget: z.number().min(0).optional(),
  consulenzeBudget: z.number().min(0).optional(),
  marketingBudget: z.number().min(0).optional(),
  deliveryBudget: z.number().min(0).optional(),
  trasferteBudget: z.number().min(0).optional(),
  assicurazioniBudget: z.number().min(0).optional(),
  speseBancarieBudget: z.number().min(0).optional(),
  acquistiVarConsuntivo: z.number().min(0).optional(),
  locazioniConsuntivo: z.number().min(0).optional(),
  personaleConsuntivo: z.number().min(0).optional(),
  utenzeConsuntivo: z.number().min(0).optional(),
  manutenzioniConsuntivo: z.number().min(0).optional(),
  noleggiConsuntivo: z.number().min(0).optional(),
  prestazioniTerziConsuntivo: z.number().min(0).optional(),
  consulenzeConsuntivo: z.number().min(0).optional(),
  marketingConsuntivo: z.number().min(0).optional(),
  deliveryConsuntivo: z.number().min(0).optional(),
  trasferteConsuntivo: z.number().min(0).optional(),
  assicurazioniConsuntivo: z.number().min(0).optional(),
  speseBancarieConsuntivo: z.number().min(0).optional(),
  
  // Consuntivo percentages
  materieFirsteConsuntivoPercent: z.number().min(0).optional(),
  acquistiVarConsuntivoPercent: z.number().min(0).optional(),
  locazioniConsuntivoPercent: z.number().min(0).optional(),
  personaleConsuntivoPercent: z.number().min(0).optional(),
  utenzeConsuntivoPercent: z.number().min(0).optional(),
  manutenzioniConsuntivoPercent: z.number().min(0).optional(),
  noleggiConsuntivoPercent: z.number().min(0).optional(),
  prestazioniTerziConsuntivoPercent: z.number().min(0).optional(),
  consulenzeConsuntivoPercent: z.number().min(0).optional(),
  marketingConsuntivoPercent: z.number().min(0).optional(),
  deliveryConsuntivoPercent: z.number().min(0).optional(),
  trasferteConsuntivoPercent: z.number().min(0).optional(),
  assicurazioniConsuntivoPercent: z.number().min(0).optional(),
  speseBancarieConsuntivoPercent: z.number().min(0).optional(),
}).omit({ id: true, createdAt: true });

export const updateEconomicParametersSchema = z.object({
  materieFirstePercent: z.number().min(0).optional(),
  materieFirsteBudget: z.number().min(0).optional(), // Consumi materie prime Budget €
  acquistiVarPercent: z.number().min(0).optional(),
  acquistiVarBudget: z.number().min(0).optional(), // Acquisti vari Budget €
  locazioniBudget: z.number().min(0).optional(),
  personaleBudget: z.number().min(0).optional(),
  utenzeBudget: z.number().min(0).optional(),
  manutenzionibudget: z.number().min(0).optional(),
  noleggibudget: z.number().min(0).optional(),
  prestazioniTerziBudget: z.number().min(0).optional(),
  consulenzeBudget: z.number().min(0).optional(),
  marketingBudget: z.number().min(0).optional(),
  deliveryBudget: z.number().min(0).optional(),
  trasferteBudget: z.number().min(0).optional(),
  assicurazioniBudget: z.number().min(0).optional(),
  speseBancarieBudget: z.number().min(0).optional(),
  acquistiVarConsuntivo: z.number().min(0).optional(),
  locazioniConsuntivo: z.number().min(0).optional(),
  personaleConsuntivo: z.number().min(0).optional(),
  utenzeConsuntivo: z.number().min(0).optional(),
  manutenzioniConsuntivo: z.number().min(0).optional(),
  noleggiConsuntivo: z.number().min(0).optional(),
  prestazioniTerziConsuntivo: z.number().min(0).optional(),
  consulenzeConsuntivo: z.number().min(0).optional(),
  marketingConsuntivo: z.number().min(0).optional(),
  deliveryConsuntivo: z.number().min(0).optional(),
  trasferteConsuntivo: z.number().min(0).optional(),
  assicurazioniConsuntivo: z.number().min(0).optional(),
  speseBancarieConsuntivo: z.number().min(0).optional(),
  
  // Consuntivo percentages
  materieFirsteConsuntivo: z.number().min(0).optional(), // NEW: materie prime consuntivo €
  materieFirsteConsuntivoPercent: z.number().min(0).optional(),
  acquistiVarConsuntivoPercent: z.number().min(0).optional(),
  locazioniConsuntivoPercent: z.number().min(0).optional(),
  personaleConsuntivoPercent: z.number().min(0).optional(),
  utenzeConsuntivoPercent: z.number().min(0).optional(),
  manutenzioniConsuntivoPercent: z.number().min(0).optional(),
  noleggiConsuntivoPercent: z.number().min(0).optional(),
  prestazioniTerziConsuntivoPercent: z.number().min(0).optional(),
  consulenzeConsuntivoPercent: z.number().min(0).optional(),
  marketingConsuntivoPercent: z.number().min(0).optional(),
  deliveryConsuntivoPercent: z.number().min(0).optional(),
  trasferteConsuntivoPercent: z.number().min(0).optional(),
  assicurazioniConsuntivoPercent: z.number().min(0).optional(),
  speseBancarieConsuntivoPercent: z.number().min(0).optional(),
});

export type EconomicParameters = typeof economicParameters.$inferSelect;
export type InsertEconomicParameters = z.infer<typeof insertEconomicParametersSchema>;
export type UpdateEconomicParameters = z.infer<typeof updateEconomicParametersSchema>;

// Session storage table for Replit Auth
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Users table - Compatible with both current auth and Replit Auth
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  // Replit Auth fields
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  // Legacy auth fields (for backwards compatibility)
  username: varchar("username", { length: 255 }).unique(),
  password: text("password"), // hashed password - nullable for Replit Auth users
  isAdmin: boolean("is_admin").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User schemas for validation - Compatible with both auth systems
export const insertUserSchema = createInsertSchema(users, {
  username: z.string().min(3).max(50).optional(),
  email: z.string().email().optional(),
  password: z.string().min(6).optional(),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const selectUserSchema = createInsertSchema(users).omit({
  password: true, // Never expose password in responses
});

// Replit Auth specific types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type SelectUser = Omit<User, 'password'>; // Safe user type without password
