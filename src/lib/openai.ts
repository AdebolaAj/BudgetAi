import OpenAI from 'openai';

declare global {
  var budgetAiOpenAIClient: OpenAI | undefined;
}

function getOpenAIApiKey() {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not set. Add it to your environment before using the deep dive feature.');
  }

  return apiKey;
}

export function getOpenAIClient() {
  if (!globalThis.budgetAiOpenAIClient) {
    globalThis.budgetAiOpenAIClient = new OpenAI({
      apiKey: getOpenAIApiKey(),
    });
  }

  return globalThis.budgetAiOpenAIClient;
}

export function getOpenAIModel() {
  return process.env.OPENAI_MODEL ?? 'gpt-5.2';
}
