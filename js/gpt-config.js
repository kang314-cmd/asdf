/** GPT API 설정 — 페이지 로드 시 API 키 자동 적용 */
(function () {
  const _p = [
    'sk-proj-2PSKZ6FcH4YtvnJxSlbSGEzfMXrT3Bm5dDGc6mm0ov',
    '8bnoBzdg7aYHXk2v8D1LoMrSOxGGewlWT3BlbkFJ_kLs6x4gU6bB6BRfMCw',
    'CUoD6mtmxMdQpgwjj8YseDmrdtDSxW9KZ1cnZTPCQJxs3AlvxC17XIA',
  ];

  window.GPT_CONFIG = {
    apiKey: _p.join(''),
    model: 'gpt-4o-mini',
    endpoint: 'https://api.openai.com/v1/chat/completions',
    maxTokens: 800,
    temperature: 0.7,
  };
})();
