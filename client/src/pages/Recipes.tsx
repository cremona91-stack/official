import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ChefHat, Utensils, Plus, Calculator, ChevronDown, AlertTriangle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import RecipeForm from "@/components/RecipeForm";
import RecipeList from "@/components/RecipeList";
import DishForm from "@/components/DishForm";
import DishList from "@/components/DishList";
import {
  useRecipes,
  useDishes,
  useProducts,
  useCreateRecipe,
  useUpdateRecipe,
  useDeleteRecipe,
  useCreateDish,
  useUpdateDish,
  useDeleteDish,
} from "@/hooks/useApi";
import type { Recipe, Dish, Product, InsertRecipe, InsertDish } from "@shared/schema";

export default function Recipes() {
  const [activeTab, setActiveTab] = useState("recipes");
  const [editingRecipe, setEditingRecipe] = useState<Recipe | undefined>();
  const [editingDish, setEditingDish] = useState<Dish | undefined>();
  
  // Recipe calculator state
  const [selectedRecipeId, setSelectedRecipeId] = useState<string>("");
  const [targetKg, setTargetKg] = useState<string>("");
  const [calculatedIngredients, setCalculatedIngredients] = useState<{product: Product, quantity: number, finishedQuantity: number, cost: number, hasWeightAdjustment: boolean}[]>([]);
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);
  const [calculationError, setCalculationError] = useState<string>("");

  // Data fetching
  const { data: products = [] } = useProducts();
  const { data: recipes = [] } = useRecipes();
  const { data: dishes = [] } = useDishes();

  // Mutations
  const createRecipeMutation = useCreateRecipe();
  const updateRecipeMutation = useUpdateRecipe();
  const deleteRecipeMutation = useDeleteRecipe();
  
  const createDishMutation = useCreateDish();
  const updateDishMutation = useUpdateDish();
  const deleteDishMutation = useDeleteDish();

  // Recipe handlers
  const handleCreateRecipe = (data: InsertRecipe) => {
    createRecipeMutation.mutate(data);
  };

  const handleUpdateRecipe = (id: string, data: InsertRecipe) => {
    updateRecipeMutation.mutate({ id, data });
    setEditingRecipe(undefined);
  };

  const handleDeleteRecipe = (id: string) => {
    deleteRecipeMutation.mutate(id);
  };

  // Dish handlers
  const handleCreateDish = (data: InsertDish) => {
    createDishMutation.mutate(data);
  };

  const handleUpdateDish = (id: string, data: InsertDish) => {
    updateDishMutation.mutate({ id, data });
    setEditingDish(undefined);
  };

  const handleDeleteDish = (id: string) => {
    deleteDishMutation.mutate(id);
  };

  // Recipe calculator handlers with improved validation
  const calculateIngredients = useCallback(() => {
    setCalculationError("");
    
    if (!selectedRecipeId || !targetKg || parseFloat(targetKg) <= 0) {
      setCalculatedIngredients([]);
      return;
    }

    const recipe = recipes.find(r => r.id === selectedRecipeId);
    if (!recipe) {
      setCalculatedIngredients([]);
      return;
    }

    const multiplier = parseFloat(targetKg);
    const weightAdjustment = recipe.weightAdjustment || 0;
    
    // Guard against division by zero or invalid weight adjustments
    const weightAdjustmentFactor = 1 + weightAdjustment / 100;
    
    if (weightAdjustmentFactor <= 0) {
      setCalculationError(`Peso adjustment di ${weightAdjustment}% non valido. Non può essere -100% o inferiore.`);
      setCalculatedIngredients([]);
      return;
    }
    
    const adjustedMultiplier = multiplier / weightAdjustmentFactor;
    
    // Check if adjustedMultiplier is finite
    if (!isFinite(adjustedMultiplier)) {
      setCalculationError("Errore di calcolo: moltiplicatore non valido.");
      setCalculatedIngredients([]);
      return;
    }
    
    const ingredients = recipe.ingredients.map(ingredient => {
      const product = products.find(p => p.id === ingredient.productId);
      if (!product) return null;
      
      // Calculate raw quantity needed (what we actually buy/use)
      const rawQuantity = ingredient.quantity * adjustedMultiplier;
      const cost = ingredient.cost * adjustedMultiplier;
      
      // Validate calculated values
      if (!isFinite(rawQuantity) || !isFinite(cost)) {
        return null;
      }
      
      return {
        product,
        quantity: rawQuantity, // This is the actual quantity to buy
        finishedQuantity: ingredient.quantity * multiplier, // This is the final result
        cost: cost,
        hasWeightAdjustment: weightAdjustment !== 0
      };
    }).filter(Boolean) as {product: Product, quantity: number, finishedQuantity: number, cost: number, hasWeightAdjustment: boolean}[];

    // Final validation: check if all calculations are valid
    if (ingredients.length === 0 && recipe.ingredients.length > 0) {
      setCalculationError("Errore nel calcolo degli ingredienti.");
      return;
    }

    setCalculatedIngredients(ingredients);
  }, [selectedRecipeId, targetKg, recipes, products]);

  // Auto-recalculate when dependencies change
  useEffect(() => {
    if (selectedRecipeId && targetKg) {
      calculateIngredients();
    } else {
      setCalculatedIngredients([]);
      setCalculationError("");
    }
  }, [calculateIngredients, selectedRecipeId, targetKg]);

  const getTotalCost = () => {
    return calculatedIngredients.reduce((sum, ing) => sum + ing.cost, 0);
  };

  const getCalculationSummary = () => {
    if (calculatedIngredients.length === 0) return "Seleziona ricetta e quantità";
    
    const totalCost = getTotalCost();
    const ingredientCount = calculatedIngredients.length;
    const hasWeightAdjustment = calculatedIngredients.some(ing => ing.hasWeightAdjustment);
    const recipe = recipes.find(r => r.id === selectedRecipeId);
    const weightInfo = hasWeightAdjustment && recipe ? ` (peso ${recipe.weightAdjustment > 0 ? '+' : ''}${recipe.weightAdjustment}%)` : '';
    
    return `${targetKg} kg${weightInfo} • ${ingredientCount} ingredienti • €${totalCost.toFixed(2)}`;
  };


  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ChefHat className="h-6 w-6 text-primary" />
              <CardTitle className="text-2xl">Gestione Ricette e Piatti</CardTitle>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="recipes" className="flex items-center gap-2">
            <ChefHat className="h-4 w-4" />
            Ricette
          </TabsTrigger>
          <TabsTrigger value="dishes" className="flex items-center gap-2">
            <Utensils className="h-4 w-4" />
            Piatti
          </TabsTrigger>
        </TabsList>

        <TabsContent value="recipes" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Recipe Form */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  {editingRecipe ? "Modifica Ricetta" : "Nuova Ricetta"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <RecipeForm
                  products={products}
                  editRecipe={editingRecipe}
                  onSubmit={editingRecipe 
                    ? (data) => handleUpdateRecipe(editingRecipe.id, data)
                    : handleCreateRecipe
                  }
                  onCancel={() => setEditingRecipe(undefined)}
                  data-testid="recipe-form"
                />
              </CardContent>
            </Card>

            {/* Recipe Calculator */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  Calcolatrice Ricette
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="recipe-select">Ricetta</Label>
                  <Select value={selectedRecipeId} onValueChange={setSelectedRecipeId}>
                    <SelectTrigger data-testid="select-recipe">
                      <SelectValue placeholder="Seleziona una ricetta" />
                    </SelectTrigger>
                    <SelectContent>
                      {recipes.map((recipe) => (
                        <SelectItem key={recipe.id} value={recipe.id}>
                          {recipe.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="target-kg">Kg di semilavorato</Label>
                  <Input
                    id="target-kg"
                    type="number"
                    min="0"
                    step="0.1"
                    value={targetKg}
                    onChange={(e) => setTargetKg(e.target.value)}
                    placeholder="es. 3"
                    data-testid="input-target-kg"
                  />
                </div>
                
                {calculationError && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>{calculationError}</AlertDescription>
                  </Alert>
                )}
                
                <Button 
                  onClick={calculateIngredients} 
                  className="w-full"
                  disabled={!selectedRecipeId || !targetKg || parseFloat(targetKg) <= 0}
                  data-testid="button-calculate"
                >
                  <Calculator className="w-4 h-4 mr-2" />
                  Calcola Ingredienti
                </Button>
                
                {calculatedIngredients.length > 0 && (
                  <Collapsible open={isCalculatorOpen} onOpenChange={setIsCalculatorOpen}>
                    <CollapsibleTrigger asChild>
                      <Button 
                        variant="outline" 
                        className="w-full justify-between"
                        data-testid="button-toggle-ingredients"
                      >
                        <span>{getCalculationSummary()}</span>
                        <ChevronDown className={`h-4 w-4 transition-transform ${isCalculatorOpen ? 'rotate-180' : ''}`} />
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="space-y-2 mt-2">
                      <div className="bg-muted p-3 rounded-md space-y-2">
                        <h4 className="font-semibold text-sm">Ingredienti necessari:</h4>
                        {calculatedIngredients.map((ingredient, index) => {
                          const recipe = recipes.find(r => r.id === selectedRecipeId);
                          const hasWeightAdjustment = ingredient.hasWeightAdjustment;
                          
                          return (
                            <div key={index} className="space-y-1">
                              <div className="flex justify-between text-sm">
                                <span className="font-medium">{ingredient.product.name}</span>
                                <span className="font-mono">€{ingredient.cost.toFixed(2)}</span>
                              </div>
                              {hasWeightAdjustment ? (
                                <div className="text-xs text-muted-foreground ml-2 space-y-0.5">
                                  <div>
                                    • Da comprare (crudo): <span className="font-mono">{ingredient.quantity.toFixed(2)} {ingredient.product.unit}</span>
                                  </div>
                                  <div>
                                    • Risultato (cotto): <span className="font-mono">{ingredient.finishedQuantity.toFixed(2)} {ingredient.product.unit}</span>
                                  </div>
                                  <div>
                                    • Peso: {recipe?.weightAdjustment && recipe.weightAdjustment > 0 ? '+' : ''}{recipe?.weightAdjustment || 0}% durante la lavorazione
                                  </div>
                                </div>
                              ) : (
                                <div className="text-xs text-muted-foreground ml-2">
                                  • Quantità: <span className="font-mono">{ingredient.quantity.toFixed(2)} {ingredient.product.unit}</span>
                                </div>
                              )}
                            </div>
                          );
                        })}
                        <hr className="my-2" />
                        <div className="flex justify-between font-semibold text-sm">
                          <span>Totale</span>
                          <span className="font-mono">€{getTotalCost().toFixed(2)}</span>
                        </div>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                )}
              </CardContent>
            </Card>
          </div>
          
          <div className="space-y-6">
            {/* Recipe List */}
            <RecipeList
              recipes={recipes}
              products={products}
              onEdit={setEditingRecipe}
              onDelete={handleDeleteRecipe}
              data-testid="recipe-list"
            />
          </div>
        </TabsContent>

        <TabsContent value="dishes" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Dish Form */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  {editingDish ? "Modifica Piatto" : "Nuovo Piatto"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <DishForm
                  products={products}
                  recipes={recipes}
                  editDish={editingDish}
                  onSubmit={editingDish
                    ? (data) => handleUpdateDish(editingDish.id, data)
                    : handleCreateDish
                  }
                  onCancel={() => setEditingDish(undefined)}
                  data-testid="dish-form"
                />
              </CardContent>
            </Card>

            {/* Dish List */}
            <div>
              <DishList
                dishes={dishes}
                products={products}
                onEdit={setEditingDish}
                onDelete={handleDeleteDish}
                data-testid="dish-list"
              />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}