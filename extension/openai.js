import { OPENAI_API_URL, AI_SYSTEM_PROMPT } from './config.js';

/**
 * Analyzes a code patch by sending it to the OpenAI API.
 * @param {string} patch The code diff to analyze.
 * @param {string} apiKey OpenAI API key used for authentication.
 * @param {{timeout?: number}} [options] Optional settings such as request timeout in milliseconds.
 * @returns {Promise<object>} Parsed JSON comments from the AI.
 */
export async function analyzeDiffWithAI(patch, apiKey, { timeout = 10000 } = {}) {
  if (!patch) {
    return { comments: [] };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  let response;
  try {
    response = await fetch(OPENAI_API_URL, {
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
      signal: controller.signal,
    });
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error('OpenAI API request timed out');
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }

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
