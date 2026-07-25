import { apiKeys } from '../config/apiKeys';

export class GeminiProvider {
  static async generateContent(prompt: string, responseType: 'text' | 'json' = 'text'): Promise<string> {
    const key = apiKeys.gemini;
    console.log('[GeminiProvider] Resolved key:', key ? `${key.substring(0, 7)}...${key.substring(key.length - 5)}` : 'undefined/empty');
    if (!key) {
      throw new Error('Gemini API key is not configured.');
    }

    const requestBody: any = {
      contents: [
        {
          parts: [{ text: prompt }]
        }
      ]
    };

    if (responseType === 'json') {
      requestBody.generationConfig = {
        responseMimeType: 'application/json'
      };
    }

    const versions = ['v1', 'v1beta'];
    const models = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-pro', 'gemini-1.5-flash-latest'];
    let lastError: any = null;

    for (const model of models) {
      for (const version of versions) {
        const url = `https://generativelanguage.googleapis.com/${version}/models/${model}:generateContent?key=${key}`;
        console.log(`[GeminiProvider] Trying URL: https://generativelanguage.googleapis.com/${version}/models/${model}:generateContent`);
        try {
          const response = await fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-goog-api-key': key
            },
            body: JSON.stringify(requestBody)
          });

          console.log(`[GeminiProvider] Response Status for ${model} (${version}):`, response.status);

          if (response.status === 404) {
            lastError = new Error(`Gemini REST API returned status code 404 for model ${model} version ${version}`);
            continue;
          }

          if (!response.ok) {
            const errText = await response.text();
            console.error(`[GeminiProvider] Error Response Body:`, errText);
            throw new Error(`Gemini REST API returned status code ${response.status}: ${errText}`);
          }

          const data = await response.json();
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (!text) {
            throw new Error('Empty response from Gemini candidate parts.');
          }

          console.log(`[GeminiProvider] Success! Mapped through model: ${model} (${version})`);
          return text.trim();
        } catch (err: any) {
          lastError = err;
          // If it's a 404 error, try the next combination
          if (err.message && err.message.includes('404')) {
            continue;
          }
          throw err;
        }
      }
    }

    throw lastError || new Error('Failed to fetch from Gemini REST API.');
  }
}
export default GeminiProvider;
