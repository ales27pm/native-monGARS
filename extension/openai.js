import { OPENAI_API_URL, AI_SYSTEM_PROMPT } from './config.js';

/**
 * Analyzes a code patch by sending it to the OpenAI API.
 * @param {string} patch
 * @param {string} apiKey
 * @returns {Promise<object>}
 */
export async function analyzeDiffWithAI(patch, apiKey) {
  if (!patch) {
    return { comments: [] };
  }

  const response = await fetch(OPENAI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4-turbo',
      messages: [
        { role: 'system', content: AI_SYSTEM_PROMPT },
        { role: 'user', content: patch },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.2,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`OpenAI API request failed: ${response.status} ${response.statusText} - ${text}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('Received an invalid response from the AI.');
  }

  try {
    return JSON.parse(content);
  } catch (err) {
    console.error('Failed to parse AI JSON response:', content);
    throw new Error('Could not parse the AI feedback. The response was not valid JSON.');
  }
}
