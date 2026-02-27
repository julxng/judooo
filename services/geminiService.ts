
import { ArtEvent, OptimizationResult } from "../types";

export interface DiscoveredEvent {
  title: string;
  source: string;
  url: string;
  dateMentioned: string;
}

// Mock implementation - no API key required for local dev
export const searchArtEvents = async (location: string): Promise<DiscoveredEvent[]> => {
  // Return empty array - no real API calls in local dev
  return [];
};

// Mock implementation - no API key required for local dev
export const optimizeArtRoute = async (events: ArtEvent[]): Promise<OptimizationResult> => {
  // Return basic mock: preserve original order with simple narrative
  return {
    orderedIds: events.map(e => e.id),
    narrative: "Route optimization is disabled in local development mode."
  };
};

// Mock implementation - no API key required for local dev
export const curateArtCollection = async (preferences: string) => {
  // Return empty array - no real API calls in local dev
  return [];
};
