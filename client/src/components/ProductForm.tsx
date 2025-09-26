import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertProductSchema, type InsertProduct, type Product } from "@shared/schema";
import { useSuppliers } from "@/hooks/useApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package } from "lucide-react";

interface ProductFormProps {
  onSubmit: (product: InsertProduct) => void;
  editProduct?: Product;
  onCancel?: () => void;
}

export default function ProductForm({ onSubmit, editProduct, onCancel }: ProductFormProps) {
  const isEditing = !!editProduct;
  const { data: suppliers = [], isLoading: suppliersLoading } = useSuppliers();

  // Create modified schema with required supplier by ID
  const productFormSchema = insertProductSchema.extend({
    supplierId: z.string().min(1, "Devi selezionare un fornitore")
  });

  const form = useForm<InsertProduct>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      code: "",
      name: "",
      supplier: "",
      supplierId: "",
      supplierEmail: "",
      waste: 0,
      notes: "",
      quantity: 0,
      unit: "kg",
      pricePerUnit: 0,
    },
  });

  // Update form values when editProduct changes
  useEffect(() => {
    if (editProduct) {
      form.reset({
        code: editProduct.code,
        name: editProduct.name,
        supplier: editProduct.supplier || "",
        supplierId: editProduct.supplierId || "",
        supplierEmail: editProduct.supplierEmail || "",
        waste: editProduct.waste,
        notes: editProduct.notes || "",
        quantity: editProduct.quantity,
        unit: editProduct.unit as "kg" | "l" | "pezzo",
        pricePerUnit: editProduct.pricePerUnit,
      });
    } else {
      form.reset({
        code: "",
        name: "",
        supplier: "",
        supplierId: "",
        supplierEmail: "",
        waste: 0,
        notes: "",
        quantity: 0,
        unit: "kg",
        pricePerUnit: 0,
      });
    }
  }, [editProduct, form]);

  const handleSubmit = (data: InsertProduct) => {
    console.log("Product form submitted:", data);
    onSubmit(data);
    if (!isEditing) {
      form.reset();
    }
  };

  const handleCancel = () => {
    console.log("Product form cancelled");
    form.reset();
    onCancel?.();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5 text-primary" />
          {isEditing ? "Modifica Prodotto" : "Crea Prodotto"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Codice Prodotto</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Es. FAR-001"
                      className="bg-yellow-100 dark:bg-yellow-900/30"
                      data-testid="input-product-code"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome Prodotto</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Es. Farina Tipo 00"
                      className="bg-yellow-100 dark:bg-yellow-900/30"
                      data-testid="input-product-name"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="supplierId"
              render={({ field }) => {
                // Find supplier for display purposes
                const selectedSupplier = suppliers.find(s => s.id === field.value);
                return (
                  <FormItem>
                    <FormLabel>Fornitore *</FormLabel>
                    <Select 
                      value={field.value || undefined} 
                      onValueChange={(supplierId) => {
                        field.onChange(supplierId);
                        // Auto-populate supplier email and name when supplier is selected
                        const selectedSupplier = suppliers.find(s => s.id === supplierId);
                        if (selectedSupplier) {
                          form.setValue("supplier", selectedSupplier.name);
                          if (selectedSupplier.email) {
                            form.setValue("supplierEmail", selectedSupplier.email);
                          }
                        }
                      }}
                      disabled={suppliersLoading}
                    >
                      <FormControl>
                        <SelectTrigger 
                          className="bg-yellow-100 dark:bg-yellow-900/30"
                          data-testid="select-supplier"
                        >
                          <SelectValue placeholder={suppliersLoading ? "Caricamento..." : "Seleziona un fornitore"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {suppliers.length === 0 ? (
                          <SelectItem value="no-suppliers-available" disabled>
                            Nessun fornitore disponibile
                          </SelectItem>
                        ) : (
                          suppliers.map((supplier) => (
                            <SelectItem key={supplier.id} value={supplier.id}>
                              {supplier.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                    {suppliers.length === 0 && (
                      <p className="text-sm text-orange-600 dark:text-orange-400">
                        Aggiungi fornitori nella sezione Fornitori prima di creare prodotti.
                      </p>
                    )}
                  </FormItem>
                );
              }}
            />

            <FormField
              control={form.control}
              name="supplierEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Fornitore</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value || ""}
                      type="email"
                      placeholder="Es. info@granoeco.it"
                      className="bg-yellow-100 dark:bg-yellow-900/30"
                      data-testid="input-supplier-email"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="waste"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sfrido (%)</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        {...field}
                        type="number"
                        min="0"
                        max="100"
                        value={field.value}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                        className="pr-8 bg-yellow-100 dark:bg-yellow-900/30"
                        data-testid="input-waste"
                      />
                      <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground font-medium">
                        %
                      </span>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Note</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      value={field.value || ""}
                      placeholder="Aggiungi note sul prodotto..."
                      className="bg-yellow-100 dark:bg-yellow-900/30"
                      rows={2}
                      data-testid="input-notes"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantità</FormLabel>
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
                        data-testid="input-quantity"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="unit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unità</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger data-testid="select-unit">
                          <SelectValue placeholder="Seleziona unità" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="kg">kg</SelectItem>
                        <SelectItem value="l">l</SelectItem>
                        <SelectItem value="pezzo">pezzo</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="pricePerUnit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Costo/Unità (€)</FormLabel>
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
                        data-testid="input-price"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                type="submit"
                className="flex-1"
                data-testid="button-submit-product"
              >
                {isEditing ? "Aggiorna Prodotto" : "Aggiungi Prodotto"}
              </Button>
              {isEditing && (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleCancel}
                  className="flex-1"
                  data-testid="button-cancel-product"
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