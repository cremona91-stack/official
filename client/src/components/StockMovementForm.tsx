import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertStockMovementSchema, type InsertStockMovement, type StockMovement, type Product } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUpDown, ArrowUp, ArrowDown, Package, Calendar, Euro } from "lucide-react";

interface StockMovementFormProps {
  onSubmit: (movement: InsertStockMovement) => void;
  editMovement?: StockMovement;
  onCancel?: () => void;
  products: Product[];
}

export default function StockMovementForm({ onSubmit, editMovement, onCancel, products }: StockMovementFormProps) {
  const isEditing = !!editMovement;

  const form = useForm<InsertStockMovement>({
    resolver: zodResolver(insertStockMovementSchema),
    defaultValues: {
      productId: "",
      movementType: "in",
      quantity: 0,
      unitPrice: 0,
      totalCost: 0,
      source: "adjustment",
      movementDate: new Date().toISOString().split('T')[0],
      notes: "",
    },
  });

  // Update form values when editMovement changes
  useEffect(() => {
    if (editMovement) {
      form.reset({
        productId: editMovement.productId,
        movementType: editMovement.movementType as "in" | "out",
        quantity: editMovement.quantity,
        unitPrice: editMovement.unitPrice || 0,
        totalCost: editMovement.totalCost || 0,
        source: editMovement.source as "waste" | "order" | "sale" | "personal_meal" | "adjustment",
        movementDate: editMovement.movementDate.split('T')[0],
        notes: editMovement.notes || "",
      });
    } else {
      form.reset({
        productId: "",
        movementType: "in",
        quantity: 0,
        unitPrice: 0,
        totalCost: 0,
        source: "adjustment",
        movementDate: new Date().toISOString().split('T')[0],
        notes: "",
      });
    }
  }, [editMovement, form]);

  // Auto-calculate total cost when quantity or unit price changes
  const watchedQuantity = form.watch("quantity");
  const watchedUnitPrice = form.watch("unitPrice");
  useEffect(() => {
    const total = (watchedQuantity || 0) * (watchedUnitPrice || 0);
    form.setValue("totalCost", total);
  }, [watchedQuantity, watchedUnitPrice, form]);

  const handleSubmit = (data: InsertStockMovement) => {
    console.log("Stock movement form submitted:", data);
    onSubmit(data);
    if (!isEditing) {
      form.reset({
        productId: "",
        movementType: "in",
        quantity: 0,
        unitPrice: 0,
        totalCost: 0,
        source: "adjustment",
        movementDate: new Date().toISOString().split('T')[0],
        notes: "",
      });
    }
  };

  const handleCancel = () => {
    console.log("Stock movement form cancelled");
    form.reset();
    onCancel?.();
  };

  const getProductName = (productId: string) => {
    const product = products.find(p => p.id === productId);
    return product ? `${product.name} (${product.code})` : "";
  };

  const getMovementTypeIcon = (type: string) => {
    switch (type) {
      case "in":
        return <ArrowUp className="h-4 w-4 text-green-600" />;
      case "out":
        return <ArrowDown className="h-4 w-4 text-red-600" />;
      default:
        return <ArrowUpDown className="h-4 w-4" />;
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-2">
        <Package className="h-5 w-5 text-primary" />
        <CardTitle>
          {isEditing ? "Modifica Movimento" : "Nuovo Movimento Magazzino"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Product and Movement Type */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="productId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      Prodotto
                    </FormLabel>
                    <Select 
                      value={field.value} 
                      onValueChange={field.onChange}
                      data-testid="select-product"
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleziona prodotto" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {products.map((product) => (
                          <SelectItem key={product.id} value={product.id}>
                            {product.name} ({product.code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="movementType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <ArrowUpDown className="h-4 w-4" />
                      Tipo Movimento
                    </FormLabel>
                    <Select 
                      value={field.value} 
                      onValueChange={field.onChange}
                      data-testid="select-movement-type"
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleziona tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="in">
                          <div className="flex items-center gap-2">
                            <ArrowUp className="h-4 w-4 text-green-600" />
                            Entrata (IN)
                          </div>
                        </SelectItem>
                        <SelectItem value="out">
                          <div className="flex items-center gap-2">
                            <ArrowDown className="h-4 w-4 text-red-600" />
                            Uscita (OUT)
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Quantity and Pricing */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantità</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0"
                        className="bg-yellow-100 dark:bg-yellow-900/30"
                        data-testid="input-quantity"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="unitPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Euro className="h-4 w-4" />
                      Prezzo Unitario (€)
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        className="bg-yellow-100 dark:bg-yellow-900/30"
                        data-testid="input-unit-price"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="totalCost"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Euro className="h-4 w-4" />
                      Costo Totale (€)
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        data-testid="input-total-cost"
                        readOnly
                        className="bg-muted"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <div className="text-sm text-muted-foreground">
                      Calcolato automaticamente
                    </div>
                  </FormItem>
                )}
              />
            </div>

            {/* Date and Source */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="movementDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Data Movimento
                    </FormLabel>
                    <FormControl>
                      <Input 
                        type="date" 
                        className="bg-yellow-100 dark:bg-yellow-900/30"
                        data-testid="input-movement-date"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="source"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Origine Movimento</FormLabel>
                    <Select 
                      value={field.value} 
                      onValueChange={field.onChange}
                      data-testid="select-source"
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleziona origine" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="order">Ordine</SelectItem>
                        <SelectItem value="sale">Vendita</SelectItem>
                        <SelectItem value="waste">Scarto</SelectItem>
                        <SelectItem value="adjustment">Aggiustamento</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Note</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Note aggiuntive sul movimento..."
                      rows={3}
                      value={field.value || ""}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      name={field.name}
                      ref={field.ref}
                      className="bg-yellow-100 dark:bg-yellow-900/30"
                      data-testid="input-notes"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Form Actions */}
            <div className="flex gap-3 pt-4">
              <Button 
                type="submit" 
                data-testid="button-submit-movement"
                className="flex-1 md:flex-none flex items-center gap-2"
              >
                {getMovementTypeIcon(form.watch("movementType"))}
                {isEditing ? "Aggiorna Movimento" : "Registra Movimento"}
              </Button>
              {isEditing && (
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleCancel}
                  data-testid="button-cancel-movement"
                >
                  Annulla
                </Button>
              )}
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}