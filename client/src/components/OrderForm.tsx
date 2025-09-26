import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertOrderSchema, type InsertOrder, type Order, type Product } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Truck, Plus, Minus, Calendar, User, FileText } from "lucide-react";

interface OrderFormProps {
  onSubmit: (order: InsertOrder) => void;
  editOrder?: Order;
  onCancel?: () => void;
  products: Product[];
}

export default function OrderForm({ onSubmit, editOrder, onCancel, products }: OrderFormProps) {
  const isEditing = !!editOrder;
  const [showProducts, setShowProducts] = useState(false);
  const [supplierProducts, setSupplierProducts] = useState<Product[]>([]);

  const form = useForm<InsertOrder>({
    resolver: zodResolver(insertOrderSchema),
    defaultValues: {
      supplier: "",
      orderDate: new Date().toISOString().split('T')[0], // Today's date
      items: [{ productId: "", quantity: 0, unitPrice: 0, totalPrice: 0 }],
      totalAmount: 0,
      status: "pending",
      notes: "",
      operatorName: "",
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  // Get unique suppliers from products
  const uniqueSuppliers = Array.from(new Set(products.map(p => p.supplier).filter(Boolean))) as string[];

  // Update form values when editOrder changes
  useEffect(() => {
    if (editOrder) {
      form.reset({
        supplier: editOrder.supplier,
        orderDate: editOrder.orderDate.split('T')[0], // Extract date part only
        items: editOrder.items,
        totalAmount: editOrder.totalAmount,
        status: editOrder.status as "pending" | "confirmed" | "cancelled",
        notes: editOrder.notes || "",
        operatorName: editOrder.operatorName || "",
      });
    } else {
      form.reset({
        supplier: "",
        orderDate: new Date().toISOString().split('T')[0],
        items: [{ productId: "", quantity: 0, unitPrice: 0, totalPrice: 0 }],
        totalAmount: 0,
        status: "pending" as const,
        notes: "",
        operatorName: "",
      });
    }
  }, [editOrder, form]);

  // Calculate total amount when items change - watch all form values for deep changes
  const watchedValues = form.watch();
  useEffect(() => {
    if (watchedValues.items) {
      let total = 0;
      watchedValues.items.forEach((item, index) => {
        const quantity = Number(item.quantity) || 0;
        const unitPrice = Number(item.unitPrice) || 0;
        const itemTotal = quantity * unitPrice;
        
        // Update totalPrice for each item
        if (item.totalPrice !== itemTotal) {
          form.setValue(`items.${index}.totalPrice`, itemTotal);
        }
        
        total += itemTotal;
      });
      form.setValue("totalAmount", total);
    }
  }, [watchedValues, form]);

  const handleSubmit = (data: InsertOrder) => {
    console.log("Order form submitted:", data);
    onSubmit(data);
    if (!isEditing) {
      form.reset({
        supplier: "",
        orderDate: new Date().toISOString().split('T')[0],
        items: [{ productId: "", quantity: 0, unitPrice: 0, totalPrice: 0 }],
        totalAmount: 0,
        status: "pending",
        notes: "",
        operatorName: "",
      });
    }
  };

  const handleCancel = () => {
    console.log("Order form cancelled");
    form.reset();
    onCancel?.();
  };

  // Handle supplier selection and show products
  const handleShowProducts = () => {
    const selectedSupplier = form.getValues("supplier");
    if (!selectedSupplier) return;
    
    const filtered = products.filter(p => p.supplier === selectedSupplier);
    setSupplierProducts(filtered);
    setShowProducts(true);
    
    // Clear existing items and add new ones based on supplier products
    form.setValue("items", []);
    filtered.forEach((product, index) => {
      append({ 
        productId: product.id, 
        quantity: 0, 
        unitPrice: product.effectivePricePerUnit || product.pricePerUnit,
        totalPrice: 0 
      });
    });
  };

  const addItem = () => {
    append({ productId: "", quantity: 0, unitPrice: 0, totalPrice: 0 });
  };

  const removeItem = (index: number) => {
    if (fields.length > 1) {
      remove(index);
    }
  };

  const getProductName = (productId: string) => {
    const product = products.find(p => p.id === productId);
    return product ? `${product.name} (${product.code})` : "";
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-2">
        <Truck className="h-5 w-5 text-primary" />
        <CardTitle>
          {isEditing ? "Modifica Ordine" : "Nuovo Ricevimento Merci"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Basic Order Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="supplier"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Truck className="h-4 w-4" />
                      Fornitore
                    </FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger data-testid="select-supplier">
                          <SelectValue placeholder="Seleziona fornitore" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {uniqueSuppliers.map((supplier) => (
                          <SelectItem key={supplier} value={supplier}>
                            {supplier}
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
                name="orderDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Data Ordine
                    </FormLabel>
                    <FormControl>
                      <Input 
                        type="date" 
                        className="bg-yellow-100 dark:bg-yellow-900/30"
                        data-testid="input-order-date"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="operatorName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Operatore
                    </FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Nome operatore" 
                        className="bg-yellow-100 dark:bg-yellow-900/30"
                        data-testid="input-operator-name"
                        value={field.value || ""}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        name={field.name} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Stato Ordine</FormLabel>
                    <Select 
                      value={field.value} 
                      onValueChange={field.onChange}
                      data-testid="select-order-status"
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleziona stato" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="pending">In Attesa</SelectItem>
                        <SelectItem value="confirmed">Confermato</SelectItem>
                        <SelectItem value="cancelled">Annullato</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* View Products Button */}
            {!showProducts && (
              <div className="flex justify-center py-4">
                <Button
                  type="button"
                  variant="default"
                  size="lg"
                  onClick={handleShowProducts}
                  disabled={!form.watch("supplier") || !form.watch("orderDate") || !form.watch("operatorName")}
                  data-testid="button-show-products"
                  className="px-8"
                >
                  Vedi
                </Button>
              </div>
            )}

            {/* Order Items */}
            {showProducts && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Prodotti da {form.watch("supplier")}</h3>
                <div className="text-sm text-muted-foreground">
                  {supplierProducts.length} prodotti disponibili
                </div>
              </div>

              {fields.map((field, index) => {
                const product = supplierProducts.find(p => p.id === form.watch(`items.${index}.productId`));
                return (
                <Card key={field.id} className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <div className="space-y-2">
                      <FormLabel>Prodotto</FormLabel>
                      <div className="font-medium text-sm">
                        {product ? `${product.name} (${product.code})` : 'Prodotto non trovato'}
                      </div>
                      {product && (
                        <div className="text-xs text-muted-foreground">
                          Prezzo: €{(product.effectivePricePerUnit || product.pricePerUnit).toFixed(2)}/{product.unit}
                          {product.waste > 0 && ` (${product.waste}% sfrido)`}
                        </div>
                      )}
                    </div>

                    <FormField
                      control={form.control}
                      name={`items.${index}.quantity`}
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
                              data-testid={`input-quantity-${index}`}
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="text-right space-y-2">
                      <div className="text-sm font-medium">
                        Totale: €{((Number(watchedValues.items?.[index]?.quantity) || 0) * (Number(watchedValues.items?.[index]?.unitPrice) || 0)).toFixed(2)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {Number(watchedValues.items?.[index]?.quantity) || 0} {product?.unit}
                      </div>
                    </div>
                  </div>
                </Card>
              );
              })}
            </div>
            )}

            {/* Total Amount Display */}
            <div className="bg-muted p-4 rounded-lg">
              <div className="flex items-center justify-between text-lg font-semibold">
                <span>Totale Ordine:</span>
                <span data-testid="text-total-amount">€{(form.watch("totalAmount") || 0).toFixed(2)}</span>
              </div>
            </div>

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Note
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Note aggiuntive sull'ordine..."
                      rows={3}
                      className="bg-yellow-100 dark:bg-yellow-900/30"
                      data-testid="input-notes"
                      value={field.value || ""}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      name={field.name}
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
                data-testid="button-submit-order"
                className="flex-1 md:flex-none"
              >
                {isEditing ? "Aggiorna Ordine" : "Crea Ordine"}
              </Button>
              {isEditing && (
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleCancel}
                  data-testid="button-cancel-order"
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