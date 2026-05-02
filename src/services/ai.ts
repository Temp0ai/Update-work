import { GoogleGenAI } from "@google/genai";
import { Customer, Purchase } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

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
  const { tone = 'casual', length = 'medium', keywords = '' } = options;
  const purchaseSummary = recentPurchases.length > 0
    ? `Recent purchases: ${recentPurchases.slice(0, 3).map(p => `$${p.amount} on ${new Date(p.date).toLocaleDateString()} (${p.notes || 'No notes'})`).join(', ')}`
    : 'No recent purchase history.';

  const lengthGuide = {
    short: 'one sentence only',
    medium: '2-3 sentences',
    long: 'a detailed friendly paragraph'
  }[length];

  const prompt = `
    You are a helpful CRM assistant for a business called "Customer Connect".
    Generate a personalized WhatsApp message for a customer.
    
    Customer Name: ${customer.name}
    Message Type: ${type}
    Tone: ${tone}
    Target Length: ${lengthGuide}
    ${keywords ? `MUST INCLUDE these keywords/concepts: ${keywords}` : ''}
    ${purchaseSummary}
    ${customer.notes ? `Customer Notes: ${customer.notes}` : ''}
    
    Guidelines:
    - Language style: ${tone}
    - Keep it ${lengthGuide}.
    - Use emojis appropriate for a ${tone} tone.
    - Mention their name.
    - DO NOT include placeholders like [Your Name].
    - Just output the message text itself.
  `;

  try {
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
