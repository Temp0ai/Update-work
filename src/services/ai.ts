import { GoogleGenAI } from "@google/genai";
import { Customer, Purchase } from "../types";
import { storage } from "./storage";

function getAI(): GoogleGenAI {
  const settings = storage.getSettings();
  const apiKey = settings.geminiApiKey || "";
  if (!apiKey) {
    throw new Error("Gemini API key not set. Please add it in Settings.");
  }
  return new GoogleGenAI({ apiKey });
}

export async function generatePersonalizedMessage(
  customer: Customer,
  type: 'birthday' | 'followup' | 'offer',
  recentPurchases: Purchase[],
  options: {
    tone?: 'casual' | 'formal' | 'enthusiastic';
    length?: 'short' | 'medium' | 'long';
    keywords?: string;
  } = {}
): Promise<string> {
  const settings = storage.getSettings();
  const { tone = 'casual', length = 'medium', keywords = '' } = options;
  const purchaseSummary = recentPurchases.length > 0
    ? `Recent purchases: ${recentPurchases.slice(0, 3).map(p => `₹${p.amount} on ${new Date(p.date).toLocaleDateString()} (${p.notes || 'No notes'})`).join(', ')}`
    : 'No recent purchase history.';

  const lengthGuide = {
    short: 'one sentence only',
    medium: '2-3 sentences',
    long: 'a detailed friendly paragraph'
  }[length];

  const prompt = `
    You are a professional fashion consultant and CRM manager for "${settings.shopName}", a boutique where "${settings.slogan}".
    The owner is ${settings.ownerName}.
    Generate a personalized WhatsApp message for a customer.
    
    Customer Name: ${customer.name}
    Message Type: ${type}
    Tone: ${tone}
    Target Length: ${lengthGuide}
    ${keywords ? `MUST INCLUDE these keywords/concepts: ${keywords}` : ''}
    ${purchaseSummary}
    ${customer.notes ? `Customer Style Notes: ${customer.notes}` : ''}
    
    Guidelines:
    - Use fashion-forward, elegant, and friendly language.
    - Mention specific items from their purchase history if available.
    - Mention the slogan "${settings.slogan}" naturally if appropriate for an Enthusiastic tone.
    - For follow-ups, mention "new seasonal arrivals" or "exclusive collection previews".
    - For birthdays, offer a "special boutique treat" or "birthday discount".
    - If they haven't visited in a while, invite them for a "personal styling session".
    - Language style: ${tone}
    - Keep it ${lengthGuide}.
    - Use emojis like 👗, 👠, ✨, 🛍️.
    - DO NOT include placeholders like [Your Name].
    - Just output the message text itself.
  `;

  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });
    return response.text || "Hello! Just checking in with you.";
  } catch (error) {
    console.error("AI Generation Error:", error);
    return "Hello! Hope you are doing well.";
  }
}

export async function analyzeImageForInstagram(
  base64Image: string,
  mimeType: string,
  extraPrompt: string = ""
): Promise<{ caption: string; hashtags: string[]; productDescription: string; tags: string[] }> {
  const settings = storage.getSettings();
  const prompt = `
    You are an expert social media manager for "${settings.shopName}", a luxury boutique.
    Analyze this photo and generate high-converting Instagram content.
    
    Current Shop Details:
    - Name: ${settings.shopName}
    - Slogan: ${settings.slogan}
    - Owner: ${settings.ownerName}
    
    User Context/Request: ${extraPrompt}
    
    Tasks:
    1. Provide a "Product Description": 1-2 sentences of what is actually in the photo (clothing, style, mood).
    2. Suggest a "Main Caption": A punchy, engaging caption using ${settings.shopName}'s brand voice. Include emojis.
    3. Generate 10-15 "Relevant Hashtags".
    4. Suggest 3-5 "Instagram Tags" (e.g., fashion style tags or handle patterns).
    
    Output everything in JSON format:
    {
      "productDescription": "...",
      "caption": "...",
      "hashtags": ["#tag1", "#tag2", ...],
      "tags": ["@style", ...]
    }
  `;

  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          parts: [
            { inlineData: { data: base64Image.split(',')[1], mimeType } },
            { text: prompt }
          ]
        }
      ],
      config: {
        responseMimeType: "application/json"
      }
    });

    const data = JSON.parse(response.text || '{}');
    return {
      productDescription: data.productDescription || "Look at our latest collection!",
      caption: data.caption || "Discover the essence of style. ✨",
      hashtags: data.hashtags || ["#fashion", "#boutique", "#style"],
      tags: data.tags || ["@fashion", "@luxury"]
    };
  } catch (error) {
    console.error("AI Image Analysis Error:", error);
    throw error;
  }
}
