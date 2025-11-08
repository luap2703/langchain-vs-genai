# Vertex AI SDK Comparison

This project compares Google Vertex AI SDK with Langdoc's Vertex SDK using TypeScript and ES modules.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the root directory with your Google API key:
```
GOOGLE_API_KEY=your-api-key-here
GOOGLE_PROJECT_ID=your-project-id (optional)
GOOGLE_REGION=us-central1 (optional)
```

3. Add your prompts:
   - Edit `system-instructions.md` with your system instructions
   - Edit `user-input.md` with your user input/prompt

## Running

Build and run:
```bash
npm run build
npm start
```

Or run directly with tsx:
```bash
npm run dev
```


