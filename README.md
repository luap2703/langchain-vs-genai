# Vertex AI SDK Comparison

This project compares Google Vertex AI SDK with LangChain's Vertex SDK using TypeScript and ES modules.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the root directory with your API keys:
```
GOOGLE_API_KEY=your-google-api-key-here
GOOGLE_LANGCHAIN_API_KEY=your-google-langchain-api-key-here
```

Both API keys are required.

3. Add your prompts (optional):
   - Edit `system-instructions.md` with your system instructions
   - Edit `user-input.md` with your user input/prompt

## Running Tests

Run the test suite with Vitest:
```bash
npm test
```

Or run the test file directly:
```bash
npx vitest src/index.test.ts
```

The tests will:
- Run both SDK calls in parallel
- Save results to `results/genai.json` and `results/langchain.json`
- Check that the duration difference is within 8 seconds


