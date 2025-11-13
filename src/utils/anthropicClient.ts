interface AnthropicMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface AnthropicResponse {
  content: string;
  model: string;
}

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_MODEL = 'claude-sonnet-4-20250514';

export async function sendToAnthropic(
  messages: AnthropicMessage[],
  apiKey: string
): Promise<AnthropicResponse> {
  try {
    const response = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: ANTHROPIC_MODEL,
        max_tokens: 4096,
        messages: messages.map(m => ({
          role: m.role,
          content: m.content
        }))
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`API Error ${response.status}: ${error}`);
    }

    const data = await response.json();
    
    return {
      content: data.content[0].text,
      model: data.model
    };
  } catch (error) {
    console.error('Anthropic API Error:', error);
    throw error;
  }
}

// Gerenciar API Key no localStorage
export function saveApiKey(apiKey: string): void {
  localStorage.setItem('anthropic_api_key', apiKey);
}

export function getApiKey(): string | null {
  return localStorage.getItem('anthropic_api_key');
}

export function hasApiKey(): boolean {
  return !!getApiKey();
}

export function clearApiKey(): void {
  localStorage.removeItem('anthropic_api_key');
}
