import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertDishSchema, type InsertDish, type Dish, type Product, type Recipe } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calculator, Plus, X, TrendingUp } from "lucide-react";
import { z } from "zod";
import { 
  calculateDishSuggestedPrice,
  calculateProductRealFoodCost,
  calculateRecipeRealFoodCost,
  calculateFoodCostPercentage,
  formatPrice,
  DEFAULT_TARGET_FOOD_COST_PERCENTAGE
} from "@/lib/priceCalculations";

interface DishFormProps {
  onSubmit: (dish: InsertDish) => void;
  products: Product[];
  recipes: Recipe[];
  editDish?: Dish;
  onCancel?: () => void;
}

export default function DishForm({ onSubmit, products, recipes, editDish, onCancel }: DishFormProps) {
  const [isEditing] = useState(!!editDish);
  const [ingredients, setIngredients] = useState(editDish?.ingredients || []);
  const [ingredientType, setIngredientType] = useState<"product" | "recipe">("product");
  const [selectedProductId, setSelectedProductId] = useState("");
  const [selectedRecipeId, setSelectedRecipeId] = useState("");
  const [quantity, setQuantity] = useState("");

  const form = useForm<{ name: string; sellingPrice: number }>({
    resolver: zodResolver(z.object({ 
      name: z.string().min(1, "Nome piatto richiesto"),
      sellingPrice: z.number().min(0.01, "Prezzo di vendita richiesto")
    })),
    defaultValues: {
      name: editDish?.name || "",
      sellingPrice: editDish?.sellingPrice || 0,
    },
  });

  const selectedProduct = products.find(p => p.id === selectedProductId);
  const selectedRecipe = recipes.find(r => r.id === selectedRecipeId);
  const totalCost = ingredients.reduce((sum, ing) => sum + ing.cost, 0);
  const sellingPrice = form.watch("sellingPrice") || 0;
  const netPrice = sellingPrice / 1.10; // Remove 10% IVA
  const foodCost = netPrice > 0 ? (totalCost / netPrice) * 100 : 0;

  const addIngredient = () => {
    if (!quantity) return;
    
    const parsedQuantity = parseFloat(quantity);
    if (parsedQuantity <= 0) return;

    let ingredient;
    
    if (ingredientType === "product") {
      if (!selectedProductId) return;
      const product = products.find(p => p.id === selectedProductId);
      if (!product) return;

      const cost = parsedQuantity * product.pricePerUnit;
      ingredient = {
        type: "product" as const,
        productId: selectedProductId,
        quantity: parsedQuantity,
        cost,
      };
    } else {
      if (!selectedRecipeId) return;
      const recipe = recipes.find(r => r.id === selectedRecipeId);
      if (!recipe) return;

      const cost = parsedQuantity * recipe.totalCost;
      ingredient = {
        type: "recipe" as const,
        recipeId: selectedRecipeId,
        quantity: parsedQuantity,
        cost,
      };
    }

    console.log("Adding ingredient:", ingredient);
    setIngredients([...ingredients, ingredient]);
    setSelectedProductId("");
    setSelectedRecipeId("");
    setQuantity("");
  };

  const removeIngredient = (index: number) => {
    console.log("Removing ingredient at index:", index);
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const handleSubmit = (data: { name: string; sellingPrice: number }) => {
    if (ingredients.length === 0) return;

    const dish: InsertDish = {
      name: data.name,
      ingredients,
      totalCost,
      sellingPrice: data.sellingPrice,
      netPrice,
      foodCost,
    };

    console.log("Dish form submitted:", dish);
    onSubmit(dish);
    
    if (!isEditing) {
      form.reset();
      setIngredients([]);
    }
  };

  const handleCancel = () => {
    console.log("Dish form cancelled");
    form.reset();
    setIngredients([]);
    onCancel?.();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5 text-primary" />
          {isEditing ? "Modifica Piatto" : "Nuovo Piatto"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome Piatto</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Es. Spaghetti alla Carbonara"
                      className="bg-yellow-100 dark:bg-yellow-900/30"
                      data-testid="input-dish-name"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="border-t pt-4">
              <h3 className="font-semibold text-foreground mb-4">Ingredienti</h3>
              
              <div className="space-y-4">
                {/* Selettore tipo ingrediente */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Tipo Ingrediente</label>
                  <Select value={ingredientType} onValueChange={(value: "product" | "recipe") => {
                    setIngredientType(value);
                    setSelectedProductId("");
                    setSelectedRecipeId("");
                  }}>
                    <SelectTrigger data-testid="select-ingredient-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="product">Prodotto</SelectItem>
                      <SelectItem value="recipe">Ricetta</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {ingredientType === "product" ? (
                    <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                      <SelectTrigger data-testid="select-dish-product">
                        <SelectValue placeholder="Seleziona un prodotto" />
                      </SelectTrigger>
                      <SelectContent>
                        {products.map((product) => (
                          <SelectItem key={product.id} value={product.id}>
                            {product.name} ({product.unit})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Select value={selectedRecipeId} onValueChange={setSelectedRecipeId}>
                      <SelectTrigger data-testid="select-dish-recipe">
                        <SelectValue placeholder="Seleziona una ricetta" />
                      </SelectTrigger>
                      <SelectContent>
                        {recipes.length === 0 ? (
                          <SelectItem value="no-recipes-available" disabled>
                            Nessuna ricetta disponibile
                          </SelectItem>
                        ) : (
                          recipes.map((recipe) => (
                            <SelectItem key={recipe.id} value={recipe.id}>
                              {recipe.name} (€{recipe.totalCost.toFixed(2)}/porz.)
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  )}
                  
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Quantità"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="bg-yellow-100 dark:bg-yellow-900/30"
                    data-testid="input-dish-ingredient-quantity"
                  />
                </div>
                
                {/* Info ingrediente selezionato */}
                {ingredientType === "product" && selectedProduct && (
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      readOnly
                      value={selectedProduct.unit}
                      className="bg-muted text-muted-foreground"
                    />
                    <Input
                      readOnly
                      value={`€${selectedProduct.effectivePricePerUnit.toFixed(2)}`}
                      className="bg-muted text-muted-foreground"
                    />
                  </div>
                )}

                {ingredientType === "recipe" && selectedRecipe && (
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      readOnly
                      value="porz."
                      className="bg-muted text-muted-foreground"
                    />
                    <Input
                      readOnly
                      value={`€${selectedRecipe.totalCost.toFixed(2)}`}
                      className="bg-muted text-muted-foreground"
                    />
                  </div>
                )}
                
                <Button
                  type="button"
                  onClick={addIngredient}
                  disabled={(ingredientType === "product" ? !selectedProductId : !selectedRecipeId) || !quantity}
                  className="w-full"
                  data-testid="button-add-dish-ingredient"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Aggiungi ingrediente
                </Button>
              </div>

              {ingredients.length > 0 && (
                <div className="mt-4 space-y-2">
                  {ingredients.map((ingredient, index) => {
                    let itemName = "";
                    let itemUnit = "";
                    
                    if (ingredient.type === "product") {
                      const product = products.find(p => p.id === ingredient.productId);
                      itemName = product?.name || "Prodotto non trovato";
                      itemUnit = product?.unit || "";
                    } else {
                      const recipe = recipes.find(r => r.id === ingredient.recipeId);
                      itemName = recipe?.name || "Ricetta non trovata";
                      itemUnit = "porz.";
                    }
                    
                    return (
                      <Card key={index} className="p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{itemName}</span>
                            <Badge variant="secondary" className="text-xs">
                              {ingredient.quantity} {itemUnit}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              €{ingredient.cost.toFixed(2)}
                            </span>
                          </div>
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            onClick={() => removeIngredient(index)}
                            data-testid={`button-remove-dish-ingredient-${index}`}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}

              <Card className="p-3 mt-4 bg-muted">
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Costo Totale Ingredienti:</span>
                  <span className="font-bold font-mono text-lg">
                    €{totalCost.toFixed(2)}
                  </span>
                </div>
              </Card>
            </div>

            <FormField
              control={form.control}
              name="sellingPrice"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Prezzo di vendita (€, IVA inclusa)</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="number"
                      step="0.01"
                      min="0"
                      value={field.value}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                      className="bg-yellow-100 dark:bg-yellow-900/30"
                      placeholder="0.00"
                      data-testid="input-selling-price"
                    />
                  </FormControl>
                  <FormMessage />
                  
                  {/* Price Suggestion */}
                  {totalCost > 0 && (
                    <div className="mt-2">
                      <div className="bg-card border rounded-md p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <TrendingUp className="h-4 w-4 text-primary" />
                          <span className="font-medium text-sm">Suggerimento Prezzo</span>
                        </div>
                        <div className="space-y-1 text-sm">
                          {(() => {
                            // Calculate real food cost considering waste and weight adjustments
                            let totalRealFoodCost = 0;

                            for (const ingredient of ingredients) {
                              if ('productId' in ingredient) {
                                // Product ingredient - consider waste
                                const product = products.find(p => p.id === ingredient.productId);
                                if (product) {
                                  const realCostPerUnit = calculateProductRealFoodCost(product.pricePerUnit, product.waste);
                                  totalRealFoodCost += realCostPerUnit * ingredient.quantity;
                                }
                              } else if ('recipeId' in ingredient) {
                                // Recipe ingredient - consider weight adjustment
                                const recipe = recipes.find(r => r.id === ingredient.recipeId);
                                if (recipe) {
                                  const realCostPerUnit = calculateRecipeRealFoodCost(recipe.totalCost, recipe.weightAdjustment);
                                  totalRealFoodCost += realCostPerUnit * ingredient.quantity;
                                }
                              }
                            }

                            const suggestedPrice = totalRealFoodCost / (DEFAULT_TARGET_FOOD_COST_PERCENTAGE / 100);
                            const suggestedGrossPrice = suggestedPrice * 1.10; // Add IVA
                            const currentPrice = form.watch("sellingPrice");
                            const currentFoodCostPercentage = currentPrice ? calculateFoodCostPercentage(totalRealFoodCost, currentPrice / 1.10) : 0;

                            return (
                              <>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Prezzo suggerito (30% food cost):</span>
                                  <span className="font-mono font-medium">{formatPrice(suggestedGrossPrice)} (IVA incl.)</span>
                                </div>
                                {totalRealFoodCost !== totalCost && (
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">Costo reale con sfridi/peso:</span>
                                    <span className="font-mono font-medium">
                                      {formatPrice(totalRealFoodCost)}
                                    </span>
                                  </div>
                                )}
                                {currentPrice && (
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">Food cost reale attuale:</span>
                                    <span className={`font-mono font-medium ${
                                      currentFoodCostPercentage > 35 ? 'text-destructive' : 
                                      currentFoodCostPercentage > 30 ? 'text-yellow-600 dark:text-yellow-400' : 
                                      'text-green-600 dark:text-green-400'
                                    }`}>
                                      {currentFoodCostPercentage.toFixed(1)}%
                                    </span>
                                  </div>
                                )}
                              </>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                  )}
                </FormItem>
              )}
            />

            <Card className="p-3 bg-muted">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Prezzo netto:</span>
                  <span className="font-mono font-medium text-primary">
                    €{netPrice.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Food Cost:</span>
                  <span className={`font-mono font-bold ${foodCost > 30 ? 'text-destructive' : 'text-chart-2'}`}>
                    {foodCost.toFixed(1)}%
                  </span>
                </div>
              </div>
            </Card>

            <div className="flex gap-2 pt-4">
              <Button
                type="submit"
                disabled={ingredients.length === 0}
                className="flex-1"
                data-testid="button-submit-dish"
              >
                {isEditing ? "Aggiorna Piatto" : "Aggiungi Piatto"}
              </Button>
              {isEditing && (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleCancel}
                  className="flex-1"
                  data-testid="button-cancel-dish"
                >
                  Annulla Modifiche
                </Button>
              )}
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}