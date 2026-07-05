/** 애니메이션 캐릭터 변환봇 */
const AnimeBot = {
  isOpen: false,
  isLoading: false,
  uploadedImage: null,

  init() {
    document.getElementById('animebot-toggle')?.addEventListener('click', () => this.toggle());
    document.getElementById('animebot-close')?.addEventListener('click', () => this.close());
    document.getElementById('animebot-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.convert();
    });
    document.getElementById('animebot-file')?.addEventListener('change', (e) => this.onFileSelect(e));
    document.getElementById('animebot-clear-file')?.addEventListener('click', () => this.clearFile());
  },

  toggle() {
    if (this.isOpen) this.close();
    else {
      BotUi.closeOthers('animebot');
      this.open();
    }
  },

  open() {
    this.isOpen = true;
    document.getElementById('animebot-panel')?.removeAttribute('hidden');
    document.getElementById('animebot-toggle')?.classList.add('active');
  },

  close() {
    this.isOpen = false;
    document.getElementById('animebot-panel')?.setAttribute('hidden', '');
    document.getElementById('animebot-toggle')?.classList.remove('active');
  },

  setStatus(msg, type = 'info') {
    const el = document.getElementById('animebot-status');
    if (!el) return;
    el.textContent = msg;
    el.className = `animebot-status ${type}`;
    el.hidden = !msg;
  },

  onFileSelect(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      this.setStatus('이미지 파일만 업로드할 수 있습니다.', 'error');
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      this.setStatus('이미지 크기는 4MB 이하여야 합니다.', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      this.uploadedImage = { dataUrl: reader.result, name: file.name };
      const preview = document.getElementById('animebot-preview');
      const img = document.getElementById('animebot-preview-img');
      if (img) img.src = reader.result;
      preview?.removeAttribute('hidden');
      this.setStatus('');
    };
    reader.readAsDataURL(file);
  },

  clearFile() {
    this.uploadedImage = null;
    const input = document.getElementById('animebot-file');
    if (input) input.value = '';
    document.getElementById('animebot-preview')?.setAttribute('hidden', '');
  },

  async analyzeImage(dataUrl) {
    const apiKey = GptApi.getApiKey();
    const config = window.GPT_CONFIG || {};
    const extra = document.getElementById('animebot-style')?.value.trim() || '';

    const res = await fetch(config.endpoint || 'https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: config.visionModel || 'gpt-4o-mini',
        messages: [{
          role: 'user',
          content: [
            {
              type: 'text',
              text: `이 이미지를 분석하여 애니메이션 캐릭터로 변환하기 위한 영어 프롬프트를 작성해 주세요.
포함할 내용: 외모(머리색, 눈색, 의상, 포즈), 분위기, 배경 요소.
${extra ? `추가 스타일 요청: ${extra}` : ''}
2~3문장의 영어 설명만 출력하세요.`,
            },
            { type: 'image_url', image_url: { url: dataUrl, detail: 'low' } },
          ],
        }],
        max_tokens: 400,
      }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || `Vision API 오류 (${res.status})`);
    return data.choices?.[0]?.message?.content?.trim() || '';
  },

  async generateAnime(description) {
    const apiKey = GptApi.getApiKey();
    const config = window.GPT_CONFIG || {};
    const prompt = `Anime character illustration, Japanese animation style, cel-shaded, vibrant colors, large expressive eyes, clean line art, high quality character portrait. ${description}`;

    const res = await fetch(config.imageEndpoint || 'https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: config.imageModel || 'gpt-image-2',
        prompt,
        response_format: 'b64_json',
        size: config.imageSize || '1024x1024',
      }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || `Image API 오류 (${res.status})`);

    const b64 = data.data?.[0]?.b64_json;
    const url = data.data?.[0]?.url;
    if (!b64 && !url) throw new Error('생성된 이미지가 없습니다.');
    return b64 ? `data:image/png;base64,${b64}` : url;
  },

  async convert() {
    if (this.isLoading) return;
    if (!this.uploadedImage) {
      this.setStatus('변환할 이미지를 업로드해 주세요.', 'error');
      return;
    }

    const apiKey = GptApi.getApiKey();
    if (!apiKey) {
      this.setStatus('GPT API 키가 필요합니다. 챗봇 ⚙에서 설정해 주세요.', 'error');
      return;
    }

    const btn = document.getElementById('animebot-convert');
    this.isLoading = true;
    if (btn) btn.disabled = true;

    try {
      this.setStatus('① 이미지 분석 중...', 'loading');
      const description = await this.analyzeImage(this.uploadedImage.dataUrl);

      this.setStatus('② 애니 캐릭터 생성 중...', 'loading');
      const resultSrc = await this.generateAnime(description);

      this.showResult(this.uploadedImage.dataUrl, resultSrc, description);
      this.setStatus('애니 캐릭터 변환 완료!', 'success');
    } catch (err) {
      this.setStatus(`오류: ${err.message}`, 'error');
    } finally {
      this.isLoading = false;
      if (btn) btn.disabled = false;
    }
  },

  showResult(originalSrc, animeSrc, description) {
    document.getElementById('animebot-result-empty')?.setAttribute('hidden', '');
    const wrap = document.getElementById('animebot-result');
    if (!wrap) return;

    const item = document.createElement('div');
    item.className = 'animebot-result-item';
    item.innerHTML = `
      <div class="animebot-compare">
        <div class="animebot-compare-col">
          <span class="animebot-compare-label">원본</span>
          <img src="${originalSrc}" alt="원본 이미지">
        </div>
        <div class="animebot-compare-arrow">→</div>
        <div class="animebot-compare-col">
          <span class="animebot-compare-label">애니 캐릭터</span>
          <img src="${animeSrc}" alt="애니 캐릭터">
        </div>
      </div>
      <p class="animebot-desc">${this.escape(description)}</p>
      <a href="${animeSrc}" download="asdf-anime-${Date.now()}.png" class="animebot-download">애니 이미지 다운로드</a>
    `;
    wrap.prepend(item);
  },

  escape(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  },
};

document.addEventListener('DOMContentLoaded', () => AnimeBot.init());
