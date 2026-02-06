
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const fetchFundNews = async () => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: "Generate 4 realistic financial news snippets for an investment fund named 'New Way Fund'. Focus on sustainable growth, tech investments, and dividend updates.",
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              title: { type: Type.STRING },
              summary: { type: Type.STRING },
              date: { type: Type.STRING },
              category: { type: Type.STRING }
            },
            required: ["id", "title", "summary", "date", "category"]
          }
        }
      }
    });

    const jsonStr = response.text.trim();
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("Error fetching news from Gemini:", error);
    // Fallback data
    return [
      {
        id: "1",
        title: "Q3 Dividend Declaration",
        summary: "New Way Fund announces a 5% increase in quarterly dividends following robust tech portfolio performance.",
        date: "2024-05-20",
        category: "Internal"
      },
      {
        id: "2",
        title: "Strategic Energy Acquisition",
        summary: "The fund has successfully acquired a 15% stake in leading solar technology firm Helios.",
        date: "2024-05-18",
        category: "Market"
      }
    ];
  }
};
