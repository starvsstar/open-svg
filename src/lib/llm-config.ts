export const getLLMConfig = () => {
  return {
    apiKey: process.env.LLM_API_KEY,
    baseUrl: process.env.LLM_BASE_URL,
    model: process.env.LLM_MODEL || 'gpt-3.5-turbo',
    temperature: Number(process.env.LLM_TEMPERATURE) || 0.7,
  }
}

export const AVAILABLE_MODELS = [
  { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
  { value: 'gpt-4', label: 'GPT-4' },
  { value: 'qwen-turbo', label: 'Qwen Turbo' },
  { value: 'qwen-plus', label: 'Qwen Plus' },
  // 可以根据实际支持的模型添加更多
] as const 