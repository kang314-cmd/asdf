/** 대구광역시 대기질 일평균 API */
const AirQuality = {
  async fetchMonth(yearMonth) {
    const dt = yearMonth.replace('-', '');
    if (!/^\d{6}$/.test(dt)) {
      throw new Error('올바른 연월을 선택해 주세요. (예: 2024-01)');
    }

    const cfg = window.PUBLIC_DATA_CONFIG || {};
    const jsonUrl = PublicDataApi.buildUrl(cfg.daeguAirJsonUrl || 'https://air.daegu.go.kr/api/json/dayavg.do', { data_dt: dt });

    try {
      const { text } = await PublicDataApi.fetchWithFallback(jsonUrl);
      const data = JSON.parse(text);
      return this.normalizeRecords(data);
    } catch {
      const xmlUrl = PublicDataApi.buildUrl(cfg.daeguAirXmlUrl || 'https://air.daegu.go.kr/api/xml/dayavg.do', { data_dt: dt });
      const { text } = await PublicDataApi.fetchWithFallback(xmlUrl);
      return this.parseXml(text);
    }
  },

  normalizeRecords(raw) {
    const list = raw?.data || raw?.list || raw?.items || raw?.response?.body?.items
      || raw?.response?.data || (Array.isArray(raw) ? raw : []);

    const arr = Array.isArray(list) ? list : list?.item ? (Array.isArray(list.item) ? list.item : [list.item]) : [];

    if (arr.length === 0 && typeof raw === 'object') {
      const values = Object.values(raw).find((v) => Array.isArray(v) && v.length > 0);
      if (values) return this.normalizeRecords({ data: values });
    }

    return arr.map((item) => this.mapItem(item)).filter(Boolean);
  },

  mapItem(item) {
    if (!item || typeof item !== 'object') return null;
    const get = (...keys) => {
      for (const k of keys) {
        if (item[k] !== undefined && item[k] !== null && item[k] !== '') return item[k];
        const lower = Object.keys(item).find((x) => x.toLowerCase() === k.toLowerCase());
        if (lower && item[lower] !== '') return item[lower];
      }
      return '-';
    };

    return {
      date: get('data_dt', 'msrDt', 'date', 'mesureDe', 'day'),
      station: get('msrstn_nm', 'msrstnNm', 'station', 'spot_nm', 'spotNm', 'name'),
      pm10: get('pm10', 'PM10', 'pm10Value', 'pm10_avg'),
      pm25: get('pm25', 'PM25', 'pm2_5', 'pm25Value', 'pm25_avg'),
      o3: get('o3', 'O3', 'o3Value', 'o3_avg'),
      no2: get('no2', 'NO2', 'no2Value'),
      co: get('co', 'CO', 'coValue'),
      so2: get('so2', 'SO2', 'so2Value'),
    };
  },

  parseXml(xmlText) {
    const doc = new DOMParser().parseFromString(xmlText, 'text/xml');
    if (doc.querySelector('parsererror')) throw new Error('XML 파싱 오류');

    const items = [...doc.querySelectorAll('item, row, data, record')];
    if (items.length === 0) {
      const root = doc.documentElement;
      if (root && root.children.length) {
        return [...root.children].map((el) => {
          const obj = {};
          [...el.children].forEach((c) => { obj[c.tagName] = c.textContent; });
          return this.mapItem(obj);
        }).filter(Boolean);
      }
      return [];
    }

    return items.map((el) => {
      const obj = {};
      [...el.children].forEach((c) => { obj[c.tagName] = c.textContent; });
      return this.mapItem(obj);
    }).filter(Boolean);
  },

  gradePm25(val) {
    const n = parseFloat(val);
    if (isNaN(n)) return '';
    if (n <= 15) return 'good';
    if (n <= 35) return 'moderate';
    if (n <= 75) return 'bad';
    return 'very-bad';
  },

  gradeLabel(cls) {
    return { good: '좋음', moderate: '보통', bad: '나쁨', 'very-bad': '매우나쁨' }[cls] || '';
  },
};
