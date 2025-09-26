import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Edit2, 
  Trash2, 
  Eye,
  Package,
  Calendar,
  User,
  FileText,
  Euro,
  ChevronDown,
  Mail
} from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Order, Product } from "@shared/schema";

interface OrderListProps {
  orders: Order[];
  products: Product[];
  onEdit: (order: Order) => void;
  onDelete: (orderId: string) => void;
  onView?: (order: Order) => void;
}

export default function OrderList({ orders, products, onEdit, onDelete, onView }: OrderListProps) {
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Mutation per aggiornare lo status dell'ordine
  const updateStatusMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: string }) => {
      const response = await apiRequest('PATCH', `/api/orders/${orderId}/status`, { status });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      // Invalida anche i stock movements perché il server crea automaticamente movimenti IN quando l'ordine è "confirmed"
      queryClient.invalidateQueries({ queryKey: ['/api/stock-movements'] });
      toast({
        title: "Status aggiornato",
        description: "Lo status dell'ordine è stato modificato con successo."
      });
    },
    onError: (error) => {
      console.error('Error updating status:', error);
      toast({
        title: "Errore",
        description: "Non è stato possibile aggiornare lo status dell'ordine.",
        variant: "destructive"
      });
    }
  });

  // Mutation per inviare email ordine
  const sendEmailMutation = useMutation({
    mutationFn: async (orderId: string) => {
      try {
        const response = await apiRequest('POST', `/api/orders/${orderId}/send-email`, {});
        return response.json();
      } catch (error: any) {
        // Estrai il messaggio dal server se disponibile
        let serverMessage = "Non è stato possibile inviare l'email dell'ordine.";
        if (error.message) {
          try {
            // Il formato dell'errore è "status: jsonResponse"
            const statusMatch = error.message.match(/^\d+: (.+)$/);
            if (statusMatch) {
              const jsonResponse = JSON.parse(statusMatch[1]);
              serverMessage = jsonResponse.message || jsonResponse.error || serverMessage;
            }
          } catch {
            // Se non riesce a parsare, usa il messaggio originale
            serverMessage = error.message;
          }
        }
        throw new Error(serverMessage);
      }
    },
    onSuccess: (data) => {
      toast({
        title: "Email inviata",
        description: data.message || "Email ordine inviata con successo ai fornitori."
      });
    },
    onError: (error: any) => {
      console.error('Error sending email:', error);
      toast({
        title: "Errore invio email",
        description: error.message || "Non è stato possibile inviare l'email dell'ordine.",
        variant: "destructive"
      });
    }
  });

  const getProductName = (productId: string) => {
    const product = products.find(p => p.id === productId);
    return product ? `${product.name} (${product.code})` : "Prodotto non trovato";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100";
      case "confirmed":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100";
      case "cancelled":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100";
      case "pendente":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pending":
        return "In Attesa";
      case "confirmed":
        return "Confermato";
      case "cancelled":
        return "Annullato";
      case "pendente":
        return "Pendente";
      default:
        return status;
    }
  };

  const toggleExpanded = (orderId: string) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
  };

  if (orders.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Lista Ordini
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-12">
          <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Nessun ordine trovato</p>
          <p className="text-sm text-muted-foreground mt-1">
            Crea il primo ordine per iniziare
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Lista Ordini ({orders.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {orders.map((order) => (
          <Card key={order.id} className="border">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-medium" data-testid={`text-supplier-${order.id}`}>
                      {order.supplier}
                    </h3>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <div className="cursor-pointer" data-testid={`badge-status-${order.id}`}>
                          <Badge 
                            className={`${getStatusColor(order.status)} hover:opacity-80 transition-opacity`}
                          >
                            <span className="flex items-center gap-1">
                              {getStatusLabel(order.status)}
                              <ChevronDown className="h-3 w-3" />
                            </span>
                          </Badge>
                        </div>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start">
                        <DropdownMenuItem 
                          onClick={() => updateStatusMutation.mutate({ orderId: order.id, status: 'pending' })}
                          disabled={order.status === 'pending' || updateStatusMutation.isPending}
                          data-testid={`status-pending-${order.id}`}
                        >
                          <span className="w-2 h-2 rounded-full bg-yellow-500 mr-2"></span>
                          In Attesa
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => updateStatusMutation.mutate({ orderId: order.id, status: 'confirmed' })}
                          disabled={order.status === 'confirmed' || updateStatusMutation.isPending}
                          data-testid={`status-confirmed-${order.id}`}
                        >
                          <span className="w-2 h-2 rounded-full bg-green-500 mr-2"></span>
                          Confermato
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => updateStatusMutation.mutate({ orderId: order.id, status: 'cancelled' })}
                          disabled={order.status === 'cancelled' || updateStatusMutation.isPending}
                          data-testid={`status-cancelled-${order.id}`}
                        >
                          <span className="w-2 h-2 rounded-full bg-red-500 mr-2"></span>
                          Annullato
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => updateStatusMutation.mutate({ orderId: order.id, status: 'pendente' })}
                          disabled={order.status === 'pendente' || updateStatusMutation.isPending}
                          data-testid={`status-pendente-${order.id}`}
                        >
                          <span className="w-2 h-2 rounded-full bg-gray-500 mr-2"></span>
                          Pendente
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span data-testid={`text-order-date-${order.id}`}>
                        {new Date(order.orderDate).toLocaleDateString('it-IT')}
                      </span>
                    </div>
                    
                    {order.operatorName && (
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        <span data-testid={`text-operator-${order.id}`}>
                          {order.operatorName}
                        </span>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-1">
                      <Euro className="h-4 w-4" />
                      <span className="font-semibold" data-testid={`text-total-${order.id}`}>
                        €{order.totalAmount.toFixed(1)}
                      </span>
                    </div>
                  </div>

                  {order.notes && (
                    <div className="flex items-start gap-1 mt-2 text-sm text-muted-foreground">
                      <FileText className="h-4 w-4 mt-0.5" />
                      <span data-testid={`text-notes-${order.id}`}>
                        {order.notes}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-1 ml-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleExpanded(order.id)}
                    data-testid={`button-toggle-${order.id}`}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => sendEmailMutation.mutate(order.id)}
                    disabled={sendEmailMutation.isPending}
                    className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                    data-testid={`button-email-${order.id}`}
                    title="Invia email ordine ai fornitori"
                  >
                    <Mail className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(order)}
                    data-testid={`button-edit-${order.id}`}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(order.id)}
                    className="text-destructive hover:text-destructive"
                    data-testid={`button-delete-${order.id}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Expanded Order Items */}
              {expandedOrder === order.id && (
                <div className="mt-4 pt-4 border-t">
                  <h4 className="font-medium mb-3">Prodotti Ordinati:</h4>
                  <div className="space-y-2">
                    {order.items.map((item, index) => (
                      <div 
                        key={index}
                        className="flex items-center justify-between text-sm bg-muted/50 p-2 rounded"
                        data-testid={`item-${order.id}-${index}`}
                      >
                        <div className="flex-1">
                          <span className="font-medium">
                            {getProductName(item.productId)}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-muted-foreground">
                          <span>Qtà: {item.quantity}</span>
                          <span>€{item.unitPrice.toFixed(1)}/unità</span>
                          <span className="font-semibold text-foreground">
                            €{(item.quantity * item.unitPrice).toFixed(1)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </CardContent>
    </Card>
  );
}