/** GPT API 설정 — 기본값 (실제 키는 gpt-config.local.js에 설정) */
window.GPT_CONFIG = window.GPT_CONFIG || {
  apiKey: 'YOUR_OPENAI_API_KEY_HERE',
  model: 'gpt-4o-mini',
  endpoint: 'https://api.openai.com/v1/chat/completions',
  maxTokens: 800,
  temperature: 0.7,
};
