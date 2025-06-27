/*
IMPORTANT NOTICE: DO NOT REMOVE
This is a custom client for the Anthropic API. You may update this service, but you should not need to.

Valid model names: 
claude-sonnet-4-20250514
claude-3-7-sonnet-latest
claude-3-5-haiku-latest
*/
import Anthropic from "@anthropic-ai/sdk";

export const getAnthropicClient = () => {
  const apiKey = process.env.EXPO_PUBLIC_VIBECODE_ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.warn("Anthropic API key not found in environment variables - using fallback");
    // Return a mock client that can be used for development
    return new Anthropic({
      apiKey: "mock-key-for-development",
    });
  }
  return new Anthropic({
    apiKey: apiKey,
  });
};
