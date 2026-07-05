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

  buildDaeguUrl(baseUrl, params) {
    const url = new URL(baseUrl);
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, v);
    });
    return url.toString();
  },

  buildAirKoreaUrl(path, params) {
    const key = this.getServiceKey();
    if (!key) throw new Error('공공데이터 API 인증키가 필요합니다. 아래 입력란에 키를 저장해 주세요.');

    const url = new URL(`${window.PUBLIC_DATA_CONFIG?.airKoreaBase || 'https://apis.data.go.kr/B552584/ArpltnInforInqireSvc'}/${path}`);
    url.searchParams.set('serviceKey', key);
    url.searchParams.set('returnType', 'json');
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, v);
    });
    return url.toString();
  },

  async fetchText(url) {
    const attempts = [
      async () => {
        const res = await fetch(url);
        return res.text();
      },
      async () => {
        const res = await fetch(`https://corsproxy.io/?${encodeURIComponent(url)}`);
        return res.text();
      },
      async () => {
        const res = await fetch(`https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`);
        return res.text();
      },
      async () => {
        const res = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(url)}`);
        const json = await res.json();
        return json.contents || '';
      },
    ];

    let lastError = null;

    for (const attempt of attempts) {
      try {
        const text = await attempt();
        if (!text) continue;

        const trimmed = text.trim();
        if (trimmed.startsWith('<!DOCTYPE') || trimmed.startsWith('<html')) {
          lastError = new Error('대구 대기질 API가 점검 중입니다. 에어코리아 API로 조회합니다.');
          continue;
        }
        return text;
      } catch (err) {
        lastError = err;
      }
    }

    throw lastError || new Error('API 서버에 연결할 수 없습니다. 인터넷 연결과 API 키를 확인해 주세요.');
  },
};

document.addEventListener('DOMContentLoaded', () => PublicDataApi.bootstrap());
