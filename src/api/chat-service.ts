/*
IMPORTANT NOTICE: DO NOT REMOVE
./src/api/chat-service.ts
If the user wants to use AI to generate text, answer questions, or analyze images you can use the functions defined in this file to communicate with the OpenAI, Anthropic, and Grok APIs.
*/
import { AIMessage, AIRequestOptions, AIResponse } from "../types/ai";
import { getAnthropicClient } from "./anthropic";
import { getOpenAIClient } from "./openai";
import { getGrokClient } from "./grok";

/**
 * Get a text response from Anthropic
 * @param messages - The messages to send to the AI
 * @param options - The options for the request
 * @returns The response from the AI
 */
export const getAnthropicTextResponse = async (
  messages: AIMessage[],
  options?: AIRequestOptions,
): Promise<AIResponse> => {
  try {
    const client = getAnthropicClient();
    const defaultModel = "claude-3-5-sonnet-20240620";

    const response = await client.messages.create({
      model: options?.model || defaultModel,
      messages: messages.map((msg) => ({
        role: msg.role === "assistant" ? "assistant" : "user",
        content: msg.content,
      })),
      max_tokens: options?.maxTokens || 2048,
      temperature: options?.temperature || 0.7,
    });

    // Handle content blocks from the response
    const content = response.content.reduce((acc, block) => {
      if ("text" in block) {
        return acc + block.text;
      }
      return acc;
    }, "");

    return {
      content,
      usage: {
        promptTokens: response.usage?.input_tokens || 0,
        completionTokens: response.usage?.output_tokens || 0,
        totalTokens: (response.usage?.input_tokens || 0) + (response.usage?.output_tokens || 0),
      },
    };
  } catch (error) {
    console.error("Anthropic API Error:", error);
    
    // Provide mock response if API key issues
    if (error instanceof Error && (error.message?.includes('API') || error.message?.includes('401') || error.message?.includes('403'))) {
      console.warn("Using mock response due to API key issues");
      
      // Create a mock response based on the user's message
      const userMessage = messages[messages.length - 1]?.content || "Hello";
      const mockResponse = `This is a mock response from the AI assistant. Your message was: "${userMessage.substring(0, 100)}${userMessage.length > 100 ? '...' : ''}". 

The actual AI service is currently unavailable, but I would normally provide a helpful and detailed response to your query. This is placeholder text to demonstrate the app's functionality.`;
      
      return {
        content: mockResponse,
        usage: {
          promptTokens: userMessage.length / 4,
          completionTokens: mockResponse.length / 4,
          totalTokens: (userMessage.length + mockResponse.length) / 4,
        },
      };
    }
    
    throw error;
  }
};

/**
 * Get a simple chat response from Anthropic
 * @param prompt - The prompt to send to the AI
 * @returns The response from the AI
 */
export const getAnthropicChatResponse = async (prompt: string): Promise<AIResponse> => {
  return await getAnthropicTextResponse([{ role: "user", content: prompt }]);
};

/**
 * Get a text response from OpenAI
 * @param messages - The messages to send to the AI
 * @param options - The options for the request
 * @returns The response from the AI
 */
export const getOpenAITextResponse = async (messages: AIMessage[], options?: AIRequestOptions): Promise<AIResponse> => {
  try {
    const client = getOpenAIClient();
    const defaultModel = "gpt-4o"; //accepts images as well, use this for image analysis

    const response = await client.chat.completions.create({
      model: options?.model || defaultModel,
      messages: messages,
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens || 2048,
    });

    return {
      content: response.choices[0]?.message?.content || "",
      usage: {
        promptTokens: response.usage?.prompt_tokens || 0,
        completionTokens: response.usage?.completion_tokens || 0,
        totalTokens: response.usage?.total_tokens || 0,
      },
    };
  } catch (error) {
    console.error("OpenAI API Error:", error);
    
    // Provide mock response if API key issues
    if (error instanceof Error && (error.message?.includes('API') || error.message?.includes('401') || error.message?.includes('403') || error.message?.includes('key'))) {
      console.warn("Using mock response due to API key issues");
      
      // Create a mock response based on the user's message
      const userMessage = messages[messages.length - 1]?.content || "Hello";
      const mockResponse = `This is a mock response from the OpenAI assistant. Your message was: "${typeof userMessage === 'string' ? userMessage.substring(0, 100) : 'Image/Complex content'}${typeof userMessage === 'string' && userMessage.length > 100 ? '...' : ''}". 

The actual OpenAI service is currently unavailable due to API configuration, but I would normally provide a helpful and detailed response to your query. This is placeholder text to demonstrate the app's functionality.`;
      
      return {
        content: mockResponse,
        usage: {
          promptTokens: typeof userMessage === 'string' ? userMessage.length / 4 : 50,
          completionTokens: mockResponse.length / 4,
          totalTokens: (typeof userMessage === 'string' ? userMessage.length : 200) / 4 + mockResponse.length / 4,
        },
      };
    }
    
    throw error;
  }
};

/**
 * Get a simple chat response from OpenAI
 * @param prompt - The prompt to send to the AI
 * @returns The response from the AI
 */
export const getOpenAIChatResponse = async (prompt: string): Promise<AIResponse> => {
  return await getOpenAITextResponse([{ role: "user", content: prompt }]);
};

/**
 * Get a text response from Grok
 * @param messages - The messages to send to the AI
 * @param options - The options for the request
 * @returns The response from the AI
 */
export const getGrokTextResponse = async (messages: AIMessage[], options?: AIRequestOptions): Promise<AIResponse> => {
  try {
    const client = getGrokClient();
    const defaultModel = "grok-3-beta";

    const response = await client.chat.completions.create({
      model: options?.model || defaultModel,
      messages: messages,
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens || 2048,
    });

    return {
      content: response.choices[0]?.message?.content || "",
      usage: {
        promptTokens: response.usage?.prompt_tokens || 0,
        completionTokens: response.usage?.completion_tokens || 0,
        totalTokens: response.usage?.total_tokens || 0,
      },
    };
  } catch (error) {
    console.error("Grok API Error:", error);
    throw error;
  }
};

/**
 * Get a simple chat response from Grok
 * @param prompt - The prompt to send to the AI
 * @returns The response from the AI
 */
export const getGrokChatResponse = async (prompt: string): Promise<AIResponse> => {
  return await getGrokTextResponse([{ role: "user", content: prompt }]);
};
