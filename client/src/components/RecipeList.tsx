import { type Recipe, type Product } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChefHat, Edit, Trash2, UtensilsCrossed } from "lucide-react";

interface RecipeListProps {
  recipes: Recipe[];
  products: Product[];
  onEdit?: (recipe: Recipe) => void;
  onDelete?: (recipeId: string) => void;
}

export default function RecipeList({ recipes, products, onEdit, onDelete }: RecipeListProps) {
  const handleEdit = (recipe: Recipe) => {
    console.log("Edit recipe:", recipe.id);
    onEdit?.(recipe);
  };

  const handleDelete = (recipeId: string) => {
    console.log("Delete recipe:", recipeId);
    onDelete?.(recipeId);
  };

  const getProductName = (productId: string) => {
    return products.find(p => p.id === productId)?.name || "Prodotto sconosciuto";
  };

  const getProductUnit = (productId: string) => {
    return products.find(p => p.id === productId)?.unit || "";
  };

  if (recipes.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UtensilsCrossed className="h-5 w-5 text-primary" />
            Ricette Salvate
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground italic">
            Nessuna ricetta ancora creata.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UtensilsCrossed className="h-5 w-5 text-primary" />
          Ricette Salvate
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {recipes.map((recipe) => (
          <Card key={recipe.id} className="hover-elevate">
            <CardContent className="p-4">
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-2">
                    <ChefHat className="h-4 w-4 text-muted-foreground" />
                    <span className="font-semibold text-foreground">{recipe.name}</span>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-muted-foreground">
                      Ingredienti:
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {recipe.ingredients.map((ingredient, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {getProductName(ingredient.productId)}: {ingredient.quantity} {getProductUnit(ingredient.productId)}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      Costo Totale:
                    </span>
                    <span className="font-bold font-mono text-destructive">
                      €{recipe.totalCost.toFixed(2)}
                    </span>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleEdit(recipe)}
                    data-testid={`button-edit-recipe-${recipe.id}`}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => handleDelete(recipe.id)}
                    data-testid={`button-delete-recipe-${recipe.id}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </CardContent>
    </Card>
  );
}