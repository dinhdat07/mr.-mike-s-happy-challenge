// services/aiService.ts
import { CONFIG } from '../constants';

const OPENROUTER_API_URL = process.env.OPENROUTER_API_URL || "https://api.openrouter.ai/v1/completions";
// console.log("Using OpenRouter API URL:", OPENROUTER_API_URL);

// IMPORTANT: The API key is hardcoded here for immediate testing at the user's request.
// For any public deployment or version control, revert to using environment variables.
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || "your-openrouter-api-key-here";
// console.log("Using OpenRouter API Key:", OPENROUTER_API_KEY);

// Using window.location.origin makes it dynamic. Replace with your actual deployed URL if preferred for consistency.
const SITE_URL = typeof window !== 'undefined' ? window.location.origin : (process.env.SITE_URL || "https://your-default-site-url.com");
// console.log("Using Site URL:", SITE_URL);
const SITE_TITLE = CONFIG.APP_TITLE;

export interface OpenRouterMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

interface OpenRouterRequestPayload {
  model: string;
  messages: OpenRouterMessage[];
  // Add other OpenRouter parameters as needed (e.g., temperature, max_tokens) by extending this interface.
}

interface OpenRouterResponseChoice {
  message: {
    role: string;
    content: string;
  };
  // Other properties like finish_reason, index might be present.
}

interface OpenRouterAPIResponse {
  id: string;
  model: string;
  choices: OpenRouterResponseChoice[];
  // Other properties like created, usage might be present.
}

/**
 * Fetches a completion from the OpenRouter API.
 *
 * @param messages An array of message objects to send to the API.
 * @param model The model to use for the completion (e.g., "microsoft/phi-3-mini-4k-instruct:free", "microsoft/phi-4-reasoning:free").
 * @returns A promise that resolves to the AI's message content as a string, or null if an error occurs.
 */
export async function getOpenRouterCompletion(
  messages: OpenRouterMessage[],
  model: string = "microsoft/phi-3-mini-4k-instruct:free" // Default to a generally available free model
): Promise<string | null> {
  if (!OPENROUTER_API_KEY) {
    console.error(
      "OpenRouter API key is not set in the code. " +
      "Please ensure it is correctly hardcoded or configured."
    );
    return null;
  }

  const requestBody: OpenRouterRequestPayload = {
    model: model,
    messages: messages,
  };

  try {
    const response = await fetch(OPENROUTER_API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "HTTP-Referer": SITE_URL, // Optional: For OpenRouter leaderboard/ranking
        "X-Title": SITE_TITLE,     // Optional: For OpenRouter leaderboard/ranking
        "Content-Type": "application/json"
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorBodyText = await response.text();
      console.error(`OpenRouter API error: ${response.status} ${response.statusText}. Response: ${errorBodyText}`);
      return null;
    }

    const data: OpenRouterAPIResponse = await response.json();

    if (data.choices && data.choices.length > 0 && data.choices[0].message && data.choices[0].message.content) {
      return data.choices[0].message.content.trim();
    } else {
      console.error("OpenRouter API response does not contain expected content structure.", data);
      return null;
    }

  } catch (error) {
    console.error("Failed to fetch from OpenRouter API or parse its response:", error);
    return null;
  }
}

/*
// Example of how you might use this service elsewhere in your app (do not uncomment here):

async function exampleUsage() {
  const userMessages: OpenRouterMessage[] = [
    { role: "user", content: "What is the capital of France?" }
  ];

  // Using the default model:
  // const defaultModelResponse = await getOpenRouterCompletion(userMessages);
  // if (defaultModelResponse) {
  //   console.log("AI (default model) says:", defaultModelResponse);
  // }

  // Using the specific model you mentioned:
  const phi4Response = await getOpenRouterCompletion(userMessages, "microsoft/phi-4-reasoning:free");
  if (phi4Response) {
    console.log("AI (phi-4-reasoning) says:", phi4Response);
  }
}
*/