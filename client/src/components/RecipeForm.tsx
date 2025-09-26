import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertRecipeSchema, type InsertRecipe, type Recipe, type Product, recipeIngredientSchema } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChefHat, Plus, Trash2, X } from "lucide-react";
import { z } from "zod";

interface RecipeFormProps {
  onSubmit: (recipe: InsertRecipe) => void;
  products: Product[];
  editRecipe?: Recipe;
  onCancel?: () => void;
}

const ingredientFormSchema = z.object({
  productId: z.string().min(1, "Seleziona un ingrediente"),
  quantity: z.number().min(0.01, "Inserisci una quantità valida"),
});

export default function RecipeForm({ onSubmit, products, editRecipe, onCancel }: RecipeFormProps) {
  const [isEditing, setIsEditing] = useState(!!editRecipe);
  const [ingredients, setIngredients] = useState(editRecipe?.ingredients || []);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [ingredientWeightAdjustment, setIngredientWeightAdjustment] = useState("0");

  const form = useForm<{ name: string; weightAdjustment: number }>({
    resolver: zodResolver(z.object({ 
      name: z.string().min(1, "Nome ricetta richiesto"),
      weightAdjustment: z.number().min(-100).max(1000).default(0)
    })),
    defaultValues: {
      name: editRecipe?.name || "",
      weightAdjustment: editRecipe?.weightAdjustment || 0,
    },
  });

  // Update form and state when editRecipe prop changes
  useEffect(() => {
    if (editRecipe) {
      setIsEditing(true);
      setIngredients(editRecipe.ingredients || []);
      form.reset({
        name: editRecipe.name,
        weightAdjustment: editRecipe.weightAdjustment || 0,
      });
    } else {
      setIsEditing(false);
      setIngredients([]);
      form.reset({
        name: "",
        weightAdjustment: 0,
      });
    }
  }, [editRecipe, form]);

  const selectedProduct = products.find(p => p.id === selectedProductId);
  const totalCost = ingredients.reduce((sum, ing) => sum + ing.cost, 0);

  const addIngredient = () => {
    if (!selectedProductId || !quantity) return;

    const product = products.find(p => p.id === selectedProductId);
    if (!product) return;

    const parsedQuantity = parseFloat(quantity);
    if (parsedQuantity <= 0) return;

    const cost = parsedQuantity * product.pricePerUnit;
    const parsedWeightAdjustment = parseFloat(ingredientWeightAdjustment) || 0;
    const ingredient = {
      productId: selectedProductId,
      quantity: parsedQuantity,
      cost,
      weightAdjustment: parsedWeightAdjustment,
    };

    console.log("Adding ingredient:", ingredient);
    setIngredients([...ingredients, ingredient]);
    setSelectedProductId("");
    setQuantity("");
    setIngredientWeightAdjustment("0");
  };

  const removeIngredient = (index: number) => {
    console.log("Removing ingredient at index:", index);
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const handleSubmit = (data: { name: string; weightAdjustment: number }) => {
    if (ingredients.length === 0) return;

    const recipe: InsertRecipe = {
      name: data.name,
      ingredients,
      weightAdjustment: data.weightAdjustment,
      totalCost,
    };

    console.log("Recipe form submitted:", recipe);
    onSubmit(recipe);
    
    if (!isEditing) {
      form.reset();
      setIngredients([]);
    }
  };

  const handleCancel = () => {
    console.log("Recipe form cancelled");
    form.reset();
    setIngredients([]);
    onCancel?.();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ChefHat className="h-5 w-5 text-primary" />
          {isEditing ? "Modifica Ricetta" : "Crea Ricetta"}
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
                  <FormLabel>Nome Ricetta</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Es. Pasta Frolla"
                      className="bg-yellow-100 dark:bg-yellow-900/30"
                      data-testid="input-recipe-name"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="weightAdjustment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Peso +/- (%)</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="number"
                      step="0.1"
                      min="-100"
                      max="1000"
                      placeholder="0"
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      className="bg-yellow-100 dark:bg-yellow-900/30"
                      data-testid="input-recipe-weight-adjustment"
                    />
                  </FormControl>
                  <div className="text-xs text-muted-foreground mt-1">
                    Aumento/diminuzione peso dopo lavorazione (es. +70% per pasta cotta)
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="border-t pt-4">
              <h3 className="font-semibold text-foreground mb-4">Ingredienti</h3>
              
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-2">
                  <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                    <SelectTrigger data-testid="select-ingredient">
                      <SelectValue placeholder="Seleziona un ingrediente" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name} ({product.unit})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Quantità"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="bg-yellow-100 dark:bg-yellow-900/30"
                    data-testid="input-ingredient-quantity"
                  />
                  
                  <Input
                    type="number"
                    step="0.1"
                    min="-100"
                    max="1000"
                    placeholder="Peso +/- %"
                    value={ingredientWeightAdjustment}
                    onChange={(e) => setIngredientWeightAdjustment(e.target.value)}
                    className="bg-yellow-100 dark:bg-yellow-900/30"
                    data-testid="input-ingredient-weight-adjustment"
                  />
                </div>
                
                {selectedProduct && (
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      readOnly
                      value={selectedProduct.unit}
                      className="bg-muted text-muted-foreground"
                    />
                    <Input
                      readOnly
                      value={`€${selectedProduct.pricePerUnit.toFixed(2)}`}
                      className="bg-muted text-muted-foreground"
                    />
                  </div>
                )}
                
                <Button
                  type="button"
                  onClick={addIngredient}
                  disabled={!selectedProductId || !quantity}
                  className="w-full"
                  data-testid="button-add-ingredient"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Aggiungi ingrediente
                </Button>
              </div>

              {ingredients.length > 0 && (
                <div className="mt-4 space-y-2">
                  {ingredients.map((ingredient, index) => {
                    const product = products.find(p => p.id === ingredient.productId);
                    return (
                      <Card key={index} className="p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{product?.name}</span>
                            <Badge variant="secondary" className="text-xs">
                              {ingredient.quantity} {product?.unit}
                            </Badge>
                            {ingredient.weightAdjustment !== 0 && (
                              <Badge variant="outline" className="text-xs">
                                {ingredient.weightAdjustment > 0 ? '+' : ''}{ingredient.weightAdjustment}%
                              </Badge>
                            )}
                            <span className="text-sm text-muted-foreground">
                              €{ingredient.cost.toFixed(2)}
                            </span>
                          </div>
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            onClick={() => removeIngredient(index)}
                            data-testid={`button-remove-ingredient-${index}`}
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
                  <span className="font-semibold">Costo Totale Ricetta:</span>
                  <span className="font-bold font-mono text-lg">
                    €{totalCost.toFixed(2)}
                  </span>
                </div>
              </Card>
            </div>


            <div className="flex gap-2 pt-4">
              <Button
                type="submit"
                disabled={ingredients.length === 0}
                className="flex-1"
                data-testid="button-submit-recipe"
              >
                {isEditing ? "Aggiorna Ricetta" : "Aggiungi Ricetta"}
              </Button>
              {isEditing && (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleCancel}
                  className="flex-1"
                  data-testid="button-cancel-recipe"
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