/** GPT API 키 공유 모듈 (챗봇 & 이미지 생성봇) */
const GptApi = {
  STORAGE_KEY: 'asdf_gpt_api_key',

  bootstrap() {
    const builtIn = window.GPT_CONFIG?.apiKey;
    if (builtIn && builtIn !== 'YOUR_OPENAI_API_KEY_HERE' && !localStorage.getItem(this.STORAGE_KEY)) {
      localStorage.setItem(this.STORAGE_KEY, builtIn);
    }
  },

  getApiKey() {
    return localStorage.getItem(this.STORAGE_KEY) || window.GPT_CONFIG?.apiKey || '';
  },

  saveApiKey(key) {
    if (key?.trim()) {
      localStorage.setItem(this.STORAGE_KEY, key.trim());
    }
  },
};

document.addEventListener('DOMContentLoaded', () => GptApi.bootstrap());
