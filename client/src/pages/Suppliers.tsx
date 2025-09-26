import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Plus, Edit, Trash2, Users } from "lucide-react";
import { useSuppliers, useCreateSupplier, useUpdateSupplier, useDeleteSupplier } from "@/hooks/useApi";
import { insertSupplierSchema, updateSupplierSchema } from "@shared/schema";
import type { Supplier, InsertSupplier, UpdateSupplier } from "@shared/schema";
import { z } from "zod";

const formSchema = insertSupplierSchema.extend({
  email: z.string().email("Formato email non valido").optional().or(z.literal("")),
});

export default function Suppliers() {
  const [showForm, setShowForm] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | undefined>();

  const { data: suppliers, isLoading } = useSuppliers();
  const createSupplier = useCreateSupplier();
  const updateSupplier = useUpdateSupplier();
  const deleteSupplier = useDeleteSupplier();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      notes: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      if (editingSupplier) {
        // Update existing supplier
        const updateData: UpdateSupplier = {
          name: values.name,
          email: values.email || undefined,
          notes: values.notes || undefined,
        };
        await updateSupplier.mutateAsync({ id: editingSupplier.id, data: updateData });
      } else {
        // Create new supplier
        const supplierData: InsertSupplier = {
          name: values.name,
          email: values.email || undefined,
          notes: values.notes || undefined,
        };
        await createSupplier.mutateAsync(supplierData);
      }
      resetForm();
    } catch (error) {
      console.error("Error saving supplier:", error);
    }
  };

  const handleEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    form.setValue("name", supplier.name);
    form.setValue("email", supplier.email || "");
    form.setValue("notes", supplier.notes || "");
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteSupplier.mutateAsync(id);
    } catch (error) {
      console.error("Error deleting supplier:", error);
    }
  };

  const resetForm = () => {
    form.reset();
    setEditingSupplier(undefined);
    setShowForm(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="text-muted-foreground">Caricamento fornitori...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Fornitori</h1>
            <p className="text-muted-foreground">
              Gestisci i fornitori dei tuoi prodotti
            </p>
          </div>
        </div>
        <Button 
          onClick={() => setShowForm(true)} 
          data-testid="button-add-supplier"
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Nuovo Fornitore
        </Button>
      </div>

      {/* Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingSupplier ? "Modifica Fornitore" : "Nuovo Fornitore"}
            </CardTitle>
            <CardDescription>
              {editingSupplier ? "Modifica i dati del fornitore" : "Inserisci i dati del nuovo fornitore"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome Fornitore *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Inserisci il nome del fornitore"
                          data-testid="input-supplier-name"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="fornitore@esempio.com"
                          data-testid="input-supplier-email"
                          {...field}
                        />
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
                          placeholder="Note aggiuntive sul fornitore (opzionale)"
                          data-testid="input-supplier-notes"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex gap-2 pt-4">
                  <Button 
                    type="submit"
                    data-testid="button-save-supplier"
                    disabled={createSupplier.isPending || updateSupplier.isPending}
                  >
                    {(createSupplier.isPending || updateSupplier.isPending) ? "Salvando..." : editingSupplier ? "Aggiorna" : "Salva"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={resetForm}
                    data-testid="button-cancel-supplier"
                  >
                    Annulla
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}

      {/* Suppliers List */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {suppliers?.map((supplier) => (
          <Card key={supplier.id} className="hover-elevate">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg" data-testid={`text-supplier-name-${supplier.id}`}>
                    {supplier.name}
                  </CardTitle>
                  {supplier.email && (
                    <p className="text-sm text-muted-foreground mt-1" data-testid={`text-supplier-email-${supplier.id}`}>
                      {supplier.email}
                    </p>
                  )}
                </div>
                <div className="flex gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleEdit(supplier)}
                    data-testid={`button-edit-supplier-${supplier.id}`}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        size="icon"
                        variant="ghost"
                        data-testid={`button-delete-supplier-${supplier.id}`}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Conferma eliminazione</AlertDialogTitle>
                        <AlertDialogDescription>
                          Sei sicuro di voler eliminare il fornitore "{supplier.name}"? 
                          Questa azione non può essere annullata.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Annulla</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(supplier.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          data-testid={`button-confirm-delete-supplier-${supplier.id}`}
                        >
                          Elimina
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </CardHeader>
            {supplier.notes && (
              <CardContent className="pt-0">
                <p className="text-sm text-muted-foreground" data-testid={`text-supplier-notes-${supplier.id}`}>
                  {supplier.notes}
                </p>
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      {suppliers?.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Nessun fornitore presente</h3>
            <p className="text-muted-foreground text-center mb-4">
              Inizia aggiungendo il primo fornitore per organizzare meglio i tuoi prodotti
            </p>
            <Button onClick={() => setShowForm(true)} data-testid="button-add-first-supplier">
              <Plus className="h-4 w-4 mr-2" />
              Aggiungi il primo fornitore
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}