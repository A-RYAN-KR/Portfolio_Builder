import { GoogleGenerativeAI } from "@google/generative-ai";

let genAIInstance = null;

export function getGenAI() {
  if (!genAIInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not set in environment variables");
    }
    genAIInstance = new GoogleGenerativeAI(apiKey);
  }
  return genAIInstance;
}

export function getModel(modelName = "gemini-2.5-flash") {
  const genAI = getGenAI();
  return genAI.getGenerativeModel({ model: modelName });
}

export async function* streamGenerate(prompt, systemInstruction, history = []) {
  const model = getModel();
  
  const chat = model.startChat({
    history: history.map(msg => ({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.content }],
    })),
    systemInstruction: systemInstruction ? { parts: [{ text: systemInstruction }] } : undefined,
  });

  const result = await chat.sendMessageStream(prompt);
  
  for await (const chunk of result.stream) {
    const text = chunk.text();
    if (text) {
      yield text;
    }
  }
}

export async function generate(prompt, systemInstruction, history = []) {
  const model = getModel();
  
  const chat = model.startChat({
    history: history.map(msg => ({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.content }],
    })),
    systemInstruction: systemInstruction ? { parts: [{ text: systemInstruction }] } : undefined,
  });

  const result = await chat.sendMessage(prompt);
  return result.response.text();
}
