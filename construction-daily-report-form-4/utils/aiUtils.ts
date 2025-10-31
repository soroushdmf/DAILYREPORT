import { GoogleGenAI } from "@google/genai";
import { PhotoLogEntry, WeatherReport } from "../types";

// Fix: Initialize GoogleGenAI with API_KEY from environment variables as per guidelines.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

const model = 'gemini-2.5-flash';

const dataUrlToGeminiPart = (dataUrl: string) => {
  // data:image/jpeg;base64,....
  const parts = dataUrl.split(';base64,');
  const mimeType = parts[0].split(':')[1];
  const data = parts[1];
  return {
    inlineData: {
      mimeType,
      data,
    },
  };
};

export const generateCaptionForImage = async (photo: PhotoLogEntry): Promise<string> => {
    if (!photo.previewUrl) {
      throw new Error("Photo has no preview URL to generate caption from.");
    }
    
    try {
      const imagePart = dataUrlToGeminiPart(photo.previewUrl);
      const prompt = "Describe this image from a construction site daily report perspective. Be concise and factual. Mention the main activity, any visible equipment, and the number of workers if clearly identifiable.";

      const response = await ai.models.generateContent({
        model,
        contents: {
            parts: [imagePart, { text: prompt }]
        }
      });
      
      return response.text.trim();
    } catch (error) {
        console.error("Error generating caption with Gemini:", error);
        if (error instanceof Error) {
            return `Error: ${error.message}`;
        }
        return "Error: Could not generate caption.";
    }
};

export const generateWeatherComment = async (weatherData: Partial<WeatherReport>): Promise<string> => {
  try {
    const prompt = `Based on the following weather data for a construction site, write a brief, one-sentence comment about the conditions and their potential impact on work.
    Data: ${JSON.stringify(weatherData)}
    Example: "Clear skies and moderate temperatures provided excellent working conditions."
    Example: "High winds in the afternoon may have impacted crane operations."
    Example: "Morning rain caused some delays, but conditions improved by the afternoon."
    Comment:`;

    const response = await ai.models.generateContent({
        model,
        contents: prompt,
    });

    return response.text.trim();
  } catch (error) {
    console.error("Error generating weather comment with Gemini:", error);
    if (error instanceof Error) {
        return `Error: ${error.message}`;
    }
    return "Could not generate comment.";
  }
};

export const rewriteText = async (text: string): Promise<string> => {
  if (!text || text.trim().length === 0) {
    return text;
  }
  try {
    const prompt = `Correct any spelling and grammar mistakes in the following text, and improve its clarity and professionalism for a construction report. Return only the improved text.
    Original text: "${text}"
    Improved text:`;

    const response = await ai.models.generateContent({
        model,
        contents: prompt,
    });

    return response.text.trim();
  } catch (error) {
    console.error("Error rewriting text with Gemini:", error);
    if (error instanceof Error) {
        return `Error rewriting: ${error.message}`;
    }
    return "Error: Could not rewrite text.";
  }
};
