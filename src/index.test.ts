import dotenv from "dotenv";
import { mkdirSync, readFileSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { afterAll, describe, expect, it } from "vitest";
import { testGoogleVertexAI, testLangchainVertex } from "./index";

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Ensure results directory exists
const resultsDir = join(__dirname, "../results");
try {
  mkdirSync(resultsDir, { recursive: true });
} catch (error) {
  // Directory might already exist, ignore error
}

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

describe("Vertex AI SDK Comparison", () => {
  it("should complete both SDK calls in parallel and check duration difference", async () => {
    // Run both tests in parallel
    const [googleResult, langchainResult] = await Promise.allSettled([
      (async () => {
        const startTime = Date.now();
        const result = await testGoogleVertexAI(
          systemInstructions,
          userInput,
          snapshotImage
        );
        const endTime = Date.now();
        const durationMs = endTime - startTime;
        return { result, durationMs, startTime, endTime };
      })(),
      (async () => {
        const startTime = Date.now();
        const result = await testLangchainVertex(
          systemInstructions,
          userInput,
          snapshotImage
        );
        const endTime = Date.now();
        const durationMs = endTime - startTime;
        return { result, durationMs, startTime, endTime };
      })(),
    ]);

    // Check if both tests succeeded
    if (googleResult.status === "rejected") {
      throw new Error(`Google GenAI test failed: ${googleResult.reason}`);
    }
    if (langchainResult.status === "rejected") {
      throw new Error(`Langchain test failed: ${langchainResult.reason}`);
    }

    const googleData = googleResult.value;
    const langchainData = langchainResult.value;

    // Convert duration to seconds:milliseconds format
    const formatDuration = (ms: number): string => {
      const seconds = Math.floor(ms / 1000);
      const milliseconds = ms % 1000;
      return `${seconds}:${milliseconds.toString().padStart(3, "0")}`;
    };

    const googleDurationFormatted = formatDuration(googleData.durationMs);
    const langchainDurationFormatted = formatDuration(langchainData.durationMs);

    // Save Google GenAI result to JSON file
    const googleResultData = {
      duration: googleDurationFormatted,
      durationMs: googleData.durationMs,
      result: googleData.result,
      timestamp: new Date().toISOString(),
    };
    writeFileSync(
      join(resultsDir, "genai.json"),
      JSON.stringify(googleResultData, null, 2)
    );

    // Save Langchain result to JSON file
    const langchainResultData = {
      duration: langchainDurationFormatted,
      durationMs: langchainData.durationMs,
      result: langchainData.result,
      timestamp: new Date().toISOString(),
    };
    writeFileSync(
      join(resultsDir, "langchain.json"),
      JSON.stringify(langchainResultData, null, 2)
    );

    // Both should return results
    expect(googleData.result).toBeDefined();
    expect(langchainData.result).toBeDefined();

    // Calculate and check duration difference
    const timeDifference = Math.abs(googleData.durationMs - langchainData.durationMs);
    const timeDifferenceFormatted = formatDuration(timeDifference);

    console.log(`\nGoogle GenAI duration: ${googleDurationFormatted} (${googleData.durationMs}ms)`);
    console.log(`Langchain duration: ${langchainDurationFormatted} (${langchainData.durationMs}ms)`);
    console.log(`Time difference: ${timeDifferenceFormatted} (${timeDifference}ms)`);

    // Time difference should not be more than 8 seconds (8000ms)
    expect(timeDifference).toBeLessThanOrEqual(8000);
  }, 60000); // 60 second timeout for the test

  afterAll(async () => {
    // Wait 3 seconds for LangChain traces to be uploaded
    await new Promise((resolve) => setTimeout(resolve, 4_000));
  });
});
