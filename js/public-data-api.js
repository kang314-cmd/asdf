/** 공공데이터 API 공통 모듈 */
const PublicDataApi = {
  STORAGE_KEY: 'asdf_public_data_key',

  bootstrap() {
    const builtIn = window.PUBLIC_DATA_CONFIG?.serviceKey;
    if (builtIn && !localStorage.getItem(this.STORAGE_KEY)) {
      localStorage.setItem(this.STORAGE_KEY, builtIn);
    }
  },

  getServiceKey() {
    return localStorage.getItem(this.STORAGE_KEY)
      || window.PUBLIC_DATA_CONFIG?.serviceKey
      || '';
  },

  saveServiceKey(key) {
    if (key?.trim()) localStorage.setItem(this.STORAGE_KEY, key.trim());
  },

  buildUrl(baseUrl, params) {
    const url = new URL(baseUrl);
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, v);
    });
    const key = this.getServiceKey();
    if (key) url.searchParams.set('serviceKey', key);
    return url.toString();
  },

  async fetchWithFallback(url) {
    try {
      const res = await fetch(url);
      const text = await res.text();
      if (text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html')) {
        throw new Error('API_MAINTENANCE');
      }
      return { ok: res.ok, text, status: res.status };
    } catch (err) {
      if (err.message === 'API_MAINTENANCE') throw err;
      const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
      const res = await fetch(proxyUrl);
      const text = await res.text();
      if (text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html')) {
        throw new Error('대구 대기질 API가 점검 중이거나 일시적으로 이용할 수 없습니다.');
      }
      return { ok: res.ok, text, status: res.status };
    }
  },
};

document.addEventListener('DOMContentLoaded', () => PublicDataApi.bootstrap());
