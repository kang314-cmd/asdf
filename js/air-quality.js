/** 대구광역시 대기질 API (대구 Open API + 에어코리아 fallback) */
const AirQuality = {
  async fetchMonth(yearMonth) {
    const dt = yearMonth.replace('-', '');
    if (!/^\d{6}$/.test(dt)) {
      throw new Error('올바른 연월을 선택해 주세요. (예: 2024-07)');
    }

    this.validateMonth(yearMonth);

    const errors = [];

    try {
      const records = await this.fetchDaeguDayAvg(dt);
      if (records.length > 0) return records;
      errors.push('대구 API: 해당 월 데이터 없음');
    } catch (err) {
      errors.push(`대구 API: ${err.message}`);
    }

    try {
      const records = await this.fetchAirKoreaDaegu(yearMonth);
      if (records.length > 0) return records;
      errors.push('에어코리아: 데이터 없음');
    } catch (err) {
      errors.push(`에어코리아: ${err.message}`);
    }

    throw new Error(errors.join('\n'));
  },

  validateMonth(yearMonth) {
    const [y, m] = yearMonth.split('-').map(Number);
    const selected = new Date(y, m - 1, 1);
    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    if (selected > thisMonth) {
      throw new Error('미래 연월은 조회할 수 없습니다. 과거 또는 현재 월을 선택해 주세요.');
    }
  },

  async fetchDaeguDayAvg(dt) {
    const cfg = window.PUBLIC_DATA_CONFIG || {};
    const jsonUrl = PublicDataApi.buildDaeguUrl(
      cfg.daeguAirJsonUrl || 'https://air.daegu.go.kr/api/json/dayavg.do',
      { data_dt: dt }
    );

    try {
      const text = await PublicDataApi.fetchText(jsonUrl);
      return this.normalizeRecords(JSON.parse(text));
    } catch {
      const xmlUrl = PublicDataApi.buildDaeguUrl(
        cfg.daeguAirXmlUrl || 'https://air.daegu.go.kr/api/xml/dayavg.do',
        { data_dt: dt }
      );
      const text = await PublicDataApi.fetchText(xmlUrl);
      return this.parseXml(text);
    }
  },

  async fetchAirKoreaDaegu(yearMonth) {
    const url = PublicDataApi.buildAirKoreaUrl('getCtprvnRltmMesureDnsty', {
      sidoName: '대구',
      numOfRows: '100',
      pageNo: '1',
      ver: '1.0',
    });

    const text = await PublicDataApi.fetchText(url);
    const data = JSON.parse(text);
    const items = data?.response?.body?.items;

    if (!items || items.length === 0) {
      throw new Error(data?.response?.header?.resultMsg || '응답 데이터가 없습니다.');
    }

    const arr = Array.isArray(items) ? items : [items];
    const prefix = yearMonth;

    let filtered = arr.filter((item) => String(item.dataTime || '').startsWith(prefix));
    if (filtered.length === 0) filtered = arr;

    return filtered.map((item) => ({
        date: item.dataTime || '-',
        station: item.stationName || '-',
        pm10: item.pm10Value ?? '-',
        pm25: item.pm25Value ?? '-',
        o3: item.o3Value ?? '-',
        no2: item.no2Value ?? '-',
        co: item.coValue ?? '-',
        so2: item.so2Value ?? '-',
      }));
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
      date: get('data_dt', 'msrDt', 'date', 'mesureDe', 'day', 'dataTime'),
      station: get('msrstn_nm', 'msrstnNm', 'stationName', 'station', 'spot_nm', 'spotNm', 'name'),
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
      if (root?.children.length) {
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
