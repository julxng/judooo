
import { GoogleGenAI, Type } from "@google/genai";
import { ArtEvent, OptimizationResult } from "../types";

// Fix: Always use named parameter for apiKey and obtain it directly from process.env.API_KEY
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export interface DiscoveredEvent {
  title: string;
  source: string;
  url: string;
  dateMentioned: string;
}

export const searchArtEvents = async (location: string): Promise<DiscoveredEvent[]> => {
  try {
    const prompt = `Search for the most recent or upcoming art exhibitions and events in ${location}, Vietnam. Focus on major galleries and Facebook event pages.`;
    // Fix: Using googleSearch tool as per guidelines. 
    // Note: Instructions warn that response.text may not be JSON when using googleSearch.
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        tools: [{googleSearch: {}}],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              source: { type: Type.STRING },
              url: { type: Type.STRING },
              dateMentioned: { type: Type.STRING }
            },
            required: ["title", "source", "url"]
          }
        }
      },
    });
    // Fix: Access response text using .text property (not a method)
    return JSON.parse(response.text || '[]');
  } catch (error) {
    console.error("Discovery error:", error);
    return [];
  }
};

export const optimizeArtRoute = async (events: ArtEvent[]): Promise<OptimizationResult> => {
  try {
    const context = events.map(e => `${e.title} at ${e.location} (${e.lat}, ${e.lng})`).join("; ");
    const prompt = `You are a professional local guide in Vietnam. Given these art events: ${context}, provide an optimized visiting route for one day. 
    1. Return the list of IDs in the best chronological/geographical order. 
    2. Provide a brief narrative explaining the transport logic and why this order works.`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            orderedIds: { type: Type.ARRAY, items: { type: Type.STRING } },
            narrative: { type: Type.STRING }
          },
          required: ["orderedIds", "narrative"]
        }
      }
    });
    // Fix: Access response text using .text property
    return JSON.parse(response.text || '{"orderedIds": [], "narrative": "Unable to optimize at this time."}');
  } catch (error) {
    return { orderedIds: events.map(e => e.id), narrative: "Defaulting to manual order due to an error." };
  }
};

export const curateArtCollection = async (preferences: string) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Expert curator: Given "${preferences}", suggest 3 exhibition themes for the Vietnam market. JSON.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              theme: { type: Type.STRING },
              rationale: { type: Type.STRING }
            },
            required: ["theme", "rationale"]
          }
        }
      }
    });
    // Fix: Access response text using .text property
    return JSON.parse(response.text || '[]');
  } catch (error) {
    return [];
  }
};
