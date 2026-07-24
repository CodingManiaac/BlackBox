export interface LLMRequest {
  model: 'gemini-1.5-pro' | 'gemini-1.5-flash' | 'claude-3-opus' | 'gpt-4o';
  prompt: string;
  temperature?: number;
}

export interface LLMResponse {
  content: string;
  confidence: number;
  tokensUsed: number;
  latencyMs: number;
}

export class LLMProvider {
  private static activeProvider: 'Gemini' | 'Claude' | 'OpenAI' | 'Sandbox' = 'Sandbox';

  static setProvider(provider: 'Gemini' | 'Claude' | 'OpenAI' | 'Sandbox') {
    this.activeProvider = provider;
  }

  static async generate(request: LLMRequest): Promise<LLMResponse> {
    const start = Date.now();
    // Simulate slight model processing latency
    await new Promise(resolve => setTimeout(resolve, 50));
    const latency = Date.now() - start;

    // Return a mock sandbox output with random (but high) confidence rating
    const mockConfidence = Number((88 + Math.random() * 10).toFixed(2));
    
    return {
      content: `[Provider: ${this.activeProvider}] Simulated response for prompt: "${request.prompt.substring(0, 40)}..."`,
      confidence: mockConfidence,
      tokensUsed: Math.floor(100 + Math.random() * 200),
      latencyMs: latency
    };
  }
}
