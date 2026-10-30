import { AiProviderConfig, AiResponse, HintLevel, MentorHint } from '../../types/ghostops';
import { HintContext, IGhostOpsProvider, OfflineDeterministicProvider } from './ghostOpsProviders';

export class ExternalAiAdapterProvider implements IGhostOpsProvider {
  private config: AiProviderConfig;
  private fallbackProvider: OfflineDeterministicProvider;

  constructor(config: AiProviderConfig) {
    this.config = config;
    this.fallbackProvider = new OfflineDeterministicProvider();
  }

  public get type(): string {
    return this.config.type;
  }

  public async generateHint(ctx: HintContext, level: HintLevel): Promise<MentorHint> {
    // Generate deterministic baseline first
    const baseline = await this.fallbackProvider.generateHint(ctx, level);

    // If no API key or endpoint provided, return baseline gracefully
    if (!this.isConfigured()) {
      return baseline;
    }

    try {
      const prompt = `You are GhostOps AI, a Socratic cybersecurity instructor for ROOTRANGE.
The student is attacking ${ctx.machine.name} (${ctx.machine.ip}, OS: ${ctx.machine.os}).
Current compromise level: ${ctx.compromiseLevel}.
Discovered ports: ${ctx.portsDiscovered.join(', ') || 'None'}.
Discovered web routes: ${ctx.routesDiscovered.join(', ') || 'None'}.
Discovered evidence count: ${ctx.evidence.length}.
Requested Hint Level: ${level} of 5.
Level 1 = General Direction.
Level 2 = Relevant Service/Category.
Level 3 = Specific Evidence Inspection.
Level 4 = Explicit Next Step.
Level 5 = Full Walkthrough.

Provide an educational, concise hint appropriate for level ${level}. Do not spoil the flag unless level 5.`;

      const response = await this.callExternalApi(prompt);
      if (response.success && response.text) {
        return {
          ...baseline,
          content: response.text,
        };
      }
    } catch {
      // Graceful fallback on network, timeout, or rate-limit error
    }

    return baseline;
  }

  public async queryAssistant(prompt: string, context?: HintContext): Promise<AiResponse> {
    if (!this.isConfigured()) {
      return {
        success: false,
        provider: this.config.type,
        error: `Provider "${this.config.type}" is not fully configured. Missing endpoint or API key. Falling back to offline engine.`,
      };
    }

    try {
      const contextPrefix = context
        ? `[Target: ${context.machine.name} (${context.machine.ip}), OS: ${context.machine.os}, Compromise: ${context.compromiseLevel}]\n`
        : '';
      return await this.callExternalApi(`${contextPrefix}User: ${prompt}`);
    } catch (err) {
      return {
        success: false,
        provider: this.config.type,
        error: err instanceof Error ? err.message : 'Unknown external API error',
      };
    }
  }

  private isConfigured(): boolean {
    if (this.config.type === 'offline') return true;
    if (this.config.type === 'ollama') {
      return Boolean(this.config.baseUrl);
    }
    return Boolean(this.config.apiKey);
  }

  private async callExternalApi(prompt: string): Promise<AiResponse> {
    const { type, baseUrl, apiKey, model, temperature } = this.config;

    if (type === 'ollama') {
      const url = `${baseUrl || 'http://localhost:11434'}/api/generate`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: model || 'llama3',
          prompt,
          stream: false,
          options: { temperature: temperature ?? 0.2 },
        }),
      });

      if (!res.ok) {
        throw new Error(`Ollama API error: ${res.status} ${res.statusText}`);
      }

      const data = await res.json();
      return {
        success: true,
        text: data.response,
        provider: 'ollama',
        modelUsed: model || 'llama3',
      };
    }

    if (type === 'openai') {
      const url = `${baseUrl || 'https://api.openai.com/v1'}/chat/completions`;
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: model || 'gpt-4o-mini',
          messages: [{ role: 'user', content: prompt }],
          temperature: temperature ?? 0.2,
        }),
      });

      if (!res.ok) {
        throw new Error(`OpenAI API error: ${res.status} ${res.statusText}`);
      }

      const data = await res.json();
      return {
        success: true,
        text: data.choices?.[0]?.message?.content,
        provider: 'openai',
        modelUsed: model || 'gpt-4o-mini',
      };
    }

    if (type === 'anthropic') {
      const url = `${baseUrl || 'https://api.anthropic.com/v1'}/messages`;
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey || '',
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: model || 'claude-3-5-sonnet-20241022',
          max_tokens: 1024,
          messages: [{ role: 'user', content: prompt }],
          temperature: temperature ?? 0.2,
        }),
      });

      if (!res.ok) {
        throw new Error(`Anthropic API error: ${res.status} ${res.statusText}`);
      }

      const data = await res.json();
      return {
        success: true,
        text: data.content?.[0]?.text,
        provider: 'anthropic',
        modelUsed: model || 'claude-3-5-sonnet',
      };
    }

    if (type === 'gemini') {
      const m = model || 'gemini-1.5-flash';
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${apiKey}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: temperature ?? 0.2 },
        }),
      });

      if (!res.ok) {
        throw new Error(`Gemini API error: ${res.status} ${res.statusText}`);
      }

      const data = await res.json();
      return {
        success: true,
        text: data.candidates?.[0]?.content?.parts?.[0]?.text,
        provider: 'gemini',
        modelUsed: m,
      };
    }

    return this.fallbackProvider.queryAssistant(prompt);
  }
}
