import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertWasteSchema, insertPersonalMealSchema, type InsertWaste, type InsertPersonalMeal, type Product, type Dish } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trash2, Users } from "lucide-react";

interface WasteFormProps {
  products: Product[];
  dishes: Dish[];
  onSubmitWaste: (waste: InsertWaste) => void;
  onSubmitPersonalMeal: (meal: InsertPersonalMeal) => void;
}

export default function WasteForm({ products, dishes, onSubmitWaste, onSubmitPersonalMeal }: WasteFormProps) {
  const [selectedProductId, setSelectedProductId] = useState("");
  const [selectedDishId, setSelectedDishId] = useState("");

  const wasteForm = useForm<InsertWaste>({
    resolver: zodResolver(insertWasteSchema),
    defaultValues: {
      productId: "",
      quantity: 0,
      cost: 0,
      date: new Date().toISOString().split('T')[0],
      notes: "",
    },
  });

  const personalMealForm = useForm<InsertPersonalMeal>({
    resolver: zodResolver(insertPersonalMealSchema),
    defaultValues: {
      dishId: "",
      quantity: 1,
      cost: 0,
      date: new Date().toISOString().split('T')[0],
      notes: "",
    },
  });

  const selectedProduct = products.find(p => p.id === selectedProductId);
  const selectedDish = dishes.find(d => d.id === selectedDishId);

  const wasteQuantity = wasteForm.watch("quantity");
  const personalMealQuantity = personalMealForm.watch("quantity");

  // Auto-calculate costs
  useEffect(() => {
    if (selectedProduct && wasteQuantity > 0) {
      const cost = wasteQuantity * selectedProduct.pricePerUnit;
      wasteForm.setValue("cost", cost);
    }
  }, [selectedProduct, wasteQuantity, wasteForm]);

  useEffect(() => {
    if (selectedDish && personalMealQuantity > 0) {
      const cost = personalMealQuantity * selectedDish.totalCost;
      personalMealForm.setValue("cost", cost);
    }
  }, [selectedDish, personalMealQuantity, personalMealForm]);

  const handleWasteSubmit = (data: InsertWaste) => {
    console.log("Waste form submitted:", data);
    onSubmitWaste(data);
    wasteForm.reset({
      productId: "",
      quantity: 0,
      cost: 0,
      date: new Date().toISOString().split('T')[0],
      notes: "",
    });
    setSelectedProductId("");
  };

  const handlePersonalMealSubmit = (data: InsertPersonalMeal) => {
    console.log("Personal meal form submitted:", data);
    onSubmitPersonalMeal(data);
    personalMealForm.reset({
      dishId: "",
      quantity: 1,
      cost: 0,
      date: new Date().toISOString().split('T')[0],
      notes: "",
    });
    setSelectedDishId("");
  };

  const handleProductChange = (productId: string) => {
    setSelectedProductId(productId);
    wasteForm.setValue("productId", productId);
    
    const product = products.find(p => p.id === productId);
    if (product) {
      const quantity = wasteForm.getValues("quantity");
      if (quantity > 0) {
        wasteForm.setValue("cost", quantity * product.pricePerUnit);
      }
    }
  };

  const handleDishChange = (dishId: string) => {
    setSelectedDishId(dishId);
    personalMealForm.setValue("dishId", dishId);
    
    const dish = dishes.find(d => d.id === dishId);
    if (dish) {
      const quantity = personalMealForm.getValues("quantity");
      personalMealForm.setValue("cost", quantity * dish.totalCost);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trash2 className="h-5 w-5 text-primary" />
          Gestione Sprechi e Pasti Personali
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="waste" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="waste" className="flex items-center gap-2">
              <Trash2 className="h-4 w-4" />
              Sprechi
            </TabsTrigger>
            <TabsTrigger value="personal" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Pasti Personali
            </TabsTrigger>
          </TabsList>

          <TabsContent value="waste" className="space-y-4">
            <Form {...wasteForm}>
              <form onSubmit={wasteForm.handleSubmit(handleWasteSubmit)} className="space-y-4">
                <FormField
                  control={wasteForm.control}
                  name="productId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prodotto</FormLabel>
                      <Select value={field.value} onValueChange={handleProductChange}>
                        <FormControl>
                          <SelectTrigger data-testid="select-waste-product">
                            <SelectValue placeholder="Seleziona un prodotto" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {products.map((product) => (
                            <SelectItem key={product.id} value={product.id}>
                              {product.name} (€{product.pricePerUnit.toFixed(2)}/{product.unit})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={wasteForm.control}
                    name="quantity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Quantità {selectedProduct && `(${selectedProduct.unit})`}
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            step="0.01"
                            min="0"
                            value={field.value}
                            onChange={(e) => {
                              const value = Number(e.target.value);
                              field.onChange(value);
                              if (selectedProduct) {
                                wasteForm.setValue("cost", value * selectedProduct.pricePerUnit);
                              }
                            }}
                            className="bg-yellow-100 dark:bg-yellow-900/30"
                            placeholder="0.00"
                            data-testid="input-waste-quantity"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={wasteForm.control}
                    name="cost"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Costo (€)</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            step="0.01"
                            min="0"
                            value={field.value}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                            placeholder="0.00"
                            className="bg-muted"
                            readOnly
                            data-testid="input-waste-cost"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={wasteForm.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="date"
                          className="bg-yellow-100 dark:bg-yellow-900/30"
                          data-testid="input-waste-date"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={wasteForm.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Note</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Motivo dello spreco..."
                          className="bg-yellow-100 dark:bg-yellow-900/30"
                          rows={2}
                          data-testid="input-waste-notes"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full"
                  data-testid="button-submit-waste"
                >
                  Registra Spreco
                </Button>
              </form>
            </Form>
          </TabsContent>

          <TabsContent value="personal" className="space-y-4">
            <Form {...personalMealForm}>
              <form onSubmit={personalMealForm.handleSubmit(handlePersonalMealSubmit)} className="space-y-4">
                <FormField
                  control={personalMealForm.control}
                  name="dishId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Piatto</FormLabel>
                      <Select value={field.value} onValueChange={handleDishChange}>
                        <FormControl>
                          <SelectTrigger data-testid="select-personal-meal-dish">
                            <SelectValue placeholder="Seleziona un piatto" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {dishes.map((dish) => (
                            <SelectItem key={dish.id} value={dish.id}>
                              {dish.name} (€{dish.totalCost.toFixed(2)})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={personalMealForm.control}
                    name="quantity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quantità</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            min="1"
                            value={field.value}
                            onChange={(e) => {
                              const value = Number(e.target.value);
                              field.onChange(value);
                              if (selectedDish) {
                                personalMealForm.setValue("cost", value * selectedDish.totalCost);
                              }
                            }}
                            className="bg-yellow-100 dark:bg-yellow-900/30"
                            placeholder="1"
                            data-testid="input-personal-meal-quantity"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={personalMealForm.control}
                    name="cost"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Costo (€)</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            step="0.01"
                            min="0"
                            value={field.value}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                            placeholder="0.00"
                            className="bg-muted"
                            readOnly
                            data-testid="input-personal-meal-cost"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={personalMealForm.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="date"
                          className="bg-yellow-100 dark:bg-yellow-900/30"
                          data-testid="input-personal-meal-date"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={personalMealForm.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Note</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Note sul pasto..."
                          className="bg-yellow-100 dark:bg-yellow-900/30"
                          rows={2}
                          data-testid="input-personal-meal-notes"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full"
                  data-testid="button-submit-personal-meal"
                >
                  Registra Pasto Personale
                </Button>
              </form>
            </Form>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}