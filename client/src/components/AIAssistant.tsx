import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bot, Send, Sparkles, TrendingUp, ChefHat } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface AIResponse {
  success: boolean;
  analysis?: string;
  optimization?: {
    currentPercentage: number;
    targetPercentage: number;
    suggestions: string[];
    priority: 'high' | 'medium' | 'low';
  };
  suggestions?: string;
  timestamp: string;
}

export function AIAssistant() {
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<string>("");
  const [optimization, setOptimization] = useState<any>(null);
  const [menuSuggestions, setMenuSuggestions] = useState<string>("");
  const [marketTrends, setMarketTrends] = useState("");
  const { toast } = useToast();

  const handleAnalyze = async () => {
    if (!query.trim()) {
      toast({
        title: "Domanda richiesta",
        description: "Inserisci una domanda per l'assistente IA",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const result = await apiRequest("/api/ai/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });

      if (result.success && result.analysis) {
        setResponse(result.analysis);
        toast({
          title: "Analisi completata",
          description: "L'assistente IA ha analizzato i tuoi dati",
        });
      }
    } catch (error) {
      toast({
        title: "Errore",
        description: "Errore nell'analisi IA. Riprova più tardi.",
        variant: "destructive",
      });
      console.error("Errore analisi IA:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFoodCostOptimization = async () => {
    setIsLoading(true);
    try {
      const result = await apiRequest("/api/ai/food-cost-optimization", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      if (result.success && result.optimization) {
        setOptimization(result.optimization);
        toast({
          title: "Ottimizzazione completata",
          description: "Analisi food cost generata con successo",
        });
      }
    } catch (error) {
      toast({
        title: "Errore",
        description: "Errore nell'ottimizzazione food cost. Riprova più tardi.",
        variant: "destructive",
      });
      console.error("Errore ottimizzazione:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMenuSuggestions = async () => {
    setIsLoading(true);
    try {
      const result = await apiRequest("/api/ai/menu-suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ marketTrends }),
      });

      if (result.success && result.suggestions) {
        setMenuSuggestions(result.suggestions);
        toast({
          title: "Suggerimenti generati",
          description: "Suggerimenti per il menu creati con successo",
        });
      }
    } catch (error) {
      toast({
        title: "Errore",
        description: "Errore nella generazione suggerimenti. Riprova più tardi.",
        variant: "destructive",
      });
      console.error("Errore suggerimenti:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            Assistente IA FoodyFlow
          </CardTitle>
          <CardDescription>
            Analizza i tuoi dati con l'intelligenza artificiale per ottimizzare il ristorante
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs defaultValue="analyze" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="analyze" className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Analisi Generale
          </TabsTrigger>
          <TabsTrigger value="foodcost" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Food Cost
          </TabsTrigger>
          <TabsTrigger value="menu" className="flex items-center gap-2">
            <ChefHat className="h-4 w-4" />
            Menu Engineering
          </TabsTrigger>
        </TabsList>

        <TabsContent value="analyze" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Analisi Personalizzata</CardTitle>
              <CardDescription>
                Fai una domanda sui tuoi dati e ricevi consigli personalizzati
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Es: Come posso ridurre il food cost? Quali piatti sono più redditizi?"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAnalyze()}
                  data-testid="input-ai-query"
                />
                <Button 
                  onClick={handleAnalyze} 
                  disabled={isLoading || !query.trim()}
                  data-testid="button-analyze-ai"
                >
                  {isLoading ? "Analizzando..." : <Send className="h-4 w-4" />}
                </Button>
              </div>
              
              {response && (
                <Card className="bg-muted/50">
                  <CardContent className="p-4">
                    <div className="whitespace-pre-wrap text-sm" data-testid="text-ai-response">
                      {response}
                    </div>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="foodcost" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Ottimizzazione Food Cost</CardTitle>
              <CardDescription>
                Analisi automatica dei costi alimentari e suggerimenti per l'ottimizzazione
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={handleFoodCostOptimization} 
                disabled={isLoading}
                className="w-full"
                data-testid="button-optimize-foodcost"
              >
                {isLoading ? "Analizzando..." : "Analizza Food Cost"}
              </Button>

              {optimization && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Card>
                      <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-red-600">
                          {optimization.currentPercentage}%
                        </div>
                        <div className="text-sm text-muted-foreground">Food Cost Attuale</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {optimization.targetPercentage}%
                        </div>
                        <div className="text-sm text-muted-foreground">Obiettivo Consigliato</div>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="flex items-center gap-2 mb-2">
                    <Badge className={getPriorityColor(optimization.priority)}>
                      Priorità {optimization.priority}
                    </Badge>
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Suggerimenti per l'Ottimizzazione</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {optimization.suggestions.map((suggestion: string, index: number) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="text-primary mt-1">•</span>
                            <span className="text-sm">{suggestion}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="menu" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Suggerimenti Menu</CardTitle>
              <CardDescription>
                Ottimizza il tuo menu basandoti sui dati dei piatti e sui trend di mercato
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="Inserisci trend di mercato o preferenze specifiche (opzionale)"
                value={marketTrends}
                onChange={(e) => setMarketTrends(e.target.value)}
                rows={3}
                data-testid="textarea-market-trends"
              />
              
              <Button 
                onClick={handleMenuSuggestions} 
                disabled={isLoading}
                className="w-full"
                data-testid="button-menu-suggestions"
              >
                {isLoading ? "Generando suggerimenti..." : "Genera Suggerimenti Menu"}
              </Button>

              {menuSuggestions && (
                <Card className="bg-muted/50">
                  <CardContent className="p-4">
                    <div className="whitespace-pre-wrap text-sm" data-testid="text-menu-suggestions">
                      {menuSuggestions}
                    </div>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}