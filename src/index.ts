import { GoogleGenAI } from "@google/genai";
import { HumanMessage } from "@langchain/core/messages";
import { ChatVertexAI } from "@langchain/google-vertexai";
import dotenv from "dotenv";
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read prompt files
const systemInstructions = readFileSync(
  join(__dirname, "../system-instructions.md"),
  "utf-8"
);
const userInput = readFileSync(join(__dirname, "../user-input.md"), "utf-8");

// Read snapshot image
let snapshotImage: Buffer | undefined;
try {
  snapshotImage = readFileSync(join(__dirname, "../snapshot.png"));
} catch (error) {
  console.warn("Warning: snapshot.png not found, proceeding without image");
}

async function compareVertexAISDKs() {
  console.log(
    "=== Comparing Google Vertex AI SDK vs Langchain Vertex SDK ===\n"
  );
  console.log("System Instructions:", systemInstructions);
  console.log("\nUser Input:", userInput);
  console.log("\n");

  // Google Vertex AI SDK
  try {
    console.log("--- Testing Google Vertex AI SDK ---");
    await testGoogleVertexAI(systemInstructions, userInput, snapshotImage);
  } catch (error) {
    console.error("Google Vertex AI SDK Error:", error);
  }

  console.log("\n");

  // Langchain Vertex SDK
  try {
    console.log("--- Testing Langchain Vertex SDK ---");
    await testLangchainVertex(systemInstructions, userInput, snapshotImage);
  } catch (error) {
    console.error("Langchain Vertex SDK Error:", error);
  }
}

export async function testGoogleVertexAI(
  systemInstructions: string,
  userInput: string,
  imageBuffer?: Buffer
) {
  // Initialize Google GenAI
  const genAI = new GoogleGenAI({
    apiKey: process.env.GOOGLE_API_KEY,
  });

  console.log("Sending request to Google GenAI...");

  const parts: any[] = [{ text: userInput }];

  // Add image if provided
  if (imageBuffer) {
    const base64Image = imageBuffer.toString("base64");

    parts.push({
      inlineData: {
        data: base64Image,
        mimeType: "image/png",
      },
    });
  }

  const result = await genAI.models.generateContent({
    model: "gemini-2.5-flash",
    config: {
      temperature: 0.0,
      thinkingConfig: {
        includeThoughts: false,
        thinkingBudget: 0,
      },
      systemInstruction: systemInstructions,
    },

    contents: [
      {
        role: "user",
        parts,
      },
    ],
  });

  return result;
}

export async function testLangchainVertex(
  systemInstructions: string,
  userInput: string,
  imageBuffer?: Buffer
) {
  console.log("Sending request to Langchain Vertex...");

  const gemini = new ChatVertexAI({
    model: "gemini-2.5-flash",
    thinkingBudget: 0,
    maxReasoningTokens: 0,
    temperature: 0.0,

    apiKey: process.env.GOOGLE_LANGCHAIN_API_KEY,
  });

  // Build user message with optional image
  if (!imageBuffer) throw new Error("Image buffer is required");

  const base64Image = imageBuffer.toString("base64");

  const result = await gemini.invoke([
    ["system", systemInstructions],
    new HumanMessage([
      {
        type: "text",
        text: userInput,
      },
      {
        type: "image_url",
        
        image_url: `data:image/png;base64,${base64Image}`,
        
      },
    ]),
  ]);

  const text = result;
  return text;
}
