import { GoogleGenAI } from "@google/genai";

// DON'T DELETE THIS COMMENT
// Follow these instructions when using this blueprint:
// - Note that the newest Gemini model series is "gemini-2.5-flash" or gemini-2.5-pro"
//   - do not change this unless explicitly requested by the user

// This API key is from Gemini Developer API Key, not vertex AI API Key
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function analyzeRestaurantData(data: any, query: string): Promise<string> {
    const prompt = `Sei un esperto consulente di food cost per ristoranti. 
Analizza i seguenti dati del ristorante e rispondi alla domanda in modo pratico e specifico.

Dati del ristorante:
${JSON.stringify(data, null, 2)}

Domanda: ${query}

Fornisci una risposta dettagliata e consigli pratici per migliorare la gestione del ristorante, concentrandoti su food cost, margini e ottimizzazione operativa. Rispondi sempre in italiano.`;

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
    });

    return response.text || "Mi dispiace, non riesco a elaborare la richiesta al momento.";
}

export interface FoodCostAnalysis {
    currentPercentage: number;
    targetPercentage: number;
    suggestions: string[];
    priority: 'high' | 'medium' | 'low';
}

export async function analyzeFoodCostOptimization(foodCostData: any): Promise<FoodCostAnalysis> {
    try {
        const systemPrompt = `Sei un esperto di food cost management per ristoranti.
Analizza i dati di food cost e fornisci suggerimenti per l'ottimizzazione.
Rispondi con JSON nel formato esatto:
{
  "currentPercentage": numero,
  "targetPercentage": numero, 
  "suggestions": ["suggerimento1", "suggerimento2", "suggerimento3"],
  "priority": "high" | "medium" | "low"
}`;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-pro",
            config: {
                systemInstruction: systemPrompt,
                responseMimeType: "application/json",
                responseSchema: {
                    type: "object",
                    properties: {
                        currentPercentage: { type: "number" },
                        targetPercentage: { type: "number" },
                        suggestions: { 
                            type: "array",
                            items: { type: "string" }
                        },
                        priority: { 
                            type: "string",
                            enum: ["high", "medium", "low"]
                        },
                    },
                    required: ["currentPercentage", "targetPercentage", "suggestions", "priority"],
                },
            },
            contents: `Analizza questi dati di food cost: ${JSON.stringify(foodCostData)}`,
        });

        const rawJson = response.text;

        if (rawJson) {
            const data: FoodCostAnalysis = JSON.parse(rawJson);
            return data;
        } else {
            throw new Error("Empty response from model");
        }
    } catch (error) {
        console.error("Errore analisi food cost:", error);
        return {
            currentPercentage: 0,
            targetPercentage: 30,
            suggestions: ["Verifica i prezzi dei fornitori", "Monitora gli sprechi", "Ottimizza le porzioni"],
            priority: 'medium'
        };
    }
}

export async function generateMenuSuggestions(dishData: any, marketTrends: string = ""): Promise<string> {
    const prompt = `Sei un esperto chef e consulente di menu engineering per ristoranti.
    
Basandoti sui seguenti dati dei piatti:
${JSON.stringify(dishData, null, 2)}

E considerando questi trend di mercato: ${marketTrends}

Genera suggerimenti per:
1. Ottimizzazione del menu esistente
2. Nuovi piatti da introdurre
3. Strategie di pricing
4. Combinazioni ingredienti per ridurre i costi

Fornisci una risposta dettagliata e pratica in italiano.`;

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
    });

    return response.text || "Non riesco a generare suggerimenti al momento.";
}