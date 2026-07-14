export const OPENROUTER_RANKINGS_URL =
  'https://openrouter.ai/api/v1/datasets/rankings-daily'

export const CACHE_TTL_MS = 60 * 60 * 1000

export const RANKINGS_WINDOW_DAYS = 7

export const TOP_PROVIDERS_LIMIT = 6

export const TOP_MODELS_LIMIT = 5

export const PROVIDER_LABELS: Record<string, string> = {
  anthropic: 'Anthropic',
  openai: 'OpenAI',
  google: 'Google',
  deepseek: 'DeepSeek',
  'meta-llama': 'Meta',
  mistralai: 'Mistral',
  'x-ai': 'xAI',
  qwen: 'Qwen',
  moonshotai: 'Moonshot',
  zhipu: 'Zhipu',
  cohere: 'Cohere',
  perplexity: 'Perplexity',
  tencent: 'Tencent',
  ibm: 'IBM',
  nvidia: 'NVIDIA',
  other: 'Other',
}
