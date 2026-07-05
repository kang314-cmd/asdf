/** ASDF GPT 이미지 생성봇 */
const ImageBot = {
  isOpen: false,
  isLoading: false,
  generatedImages: [],

  init() {
    const toggle = document.getElementById('imagebot-toggle');
    const close = document.getElementById('imagebot-close');
    const form = document.getElementById('imagebot-form');

    toggle?.addEventListener('click', () => this.toggle());
    close?.addEventListener('click', () => this.close());
    form?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.generate();
    });
  },

  toggle() {
    if (this.isOpen) {
      this.close();
    } else {
      BotUi.closeOthers('imagebot');
      this.open();
    }
  },

  open() {
    this.isOpen = true;
    document.getElementById('imagebot-panel')?.removeAttribute('hidden');
    document.getElementById('imagebot-toggle')?.classList.add('active');
    document.getElementById('imagebot-prompt')?.focus();
  },

  close() {
    this.isOpen = false;
    document.getElementById('imagebot-panel')?.setAttribute('hidden', '');
    document.getElementById('imagebot-toggle')?.classList.remove('active');
  },

  setStatus(msg, type = 'info') {
    const el = document.getElementById('imagebot-status');
    if (!el) return;
    el.textContent = msg;
    el.className = 'imagebot-status ' + type;
    el.hidden = !msg;
  },

  async generate() {
    if (this.isLoading) return;

    const promptEl = document.getElementById('imagebot-prompt');
    const btn = document.getElementById('imagebot-generate');
    const prompt = promptEl?.value.trim();

    if (!prompt) {
      this.setStatus('프롬프트를 입력해 주세요.', 'error');
      return;
    }

    const apiKey = GptApi.getApiKey();
    if (!apiKey) {
      this.setStatus('API 키가 없습니다. 챗봇 ⚙에서 키를 설정해 주세요.', 'error');
      return;
    }

    const config = window.GPT_CONFIG || {};
    const model = config.imageModel || 'gpt-image-2';
    const endpoint = config.imageEndpoint || 'https://api.openai.com/v1/images/generations';

    this.isLoading = true;
    if (btn) btn.disabled = true;
    this.setStatus('이미지 생성 중... 잠시만 기다려 주세요.', 'loading');

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          prompt,
          response_format: 'b64_json',
          size: config.imageSize || '1024x1024',
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        const errMsg = data.error?.message || `API 오류 (${res.status})`;
        this.setStatus(`오류: ${errMsg}`, 'error');
        return;
      }

      const b64 = data.data?.[0]?.b64_json;
      const url = data.data?.[0]?.url;

      if (!b64 && !url) {
        this.setStatus('이미지 데이터를 받지 못했습니다.', 'error');
        return;
      }

      const imageSrc = b64 ? `data:image/png;base64,${b64}` : url;
      this.addImageToGallery(imageSrc, prompt);
      this.setStatus('이미지가 생성되었습니다!', 'success');
      if (promptEl) promptEl.value = '';
    } catch {
      this.setStatus('네트워크 오류가 발생했습니다.', 'error');
    } finally {
      this.isLoading = false;
      if (btn) btn.disabled = false;
    }
  },

  addImageToGallery(src, prompt) {
    const gallery = document.getElementById('imagebot-gallery');
    if (!gallery) return;

    document.getElementById('imagebot-gallery-empty')?.setAttribute('hidden', '');

    const item = document.createElement('div');
    item.className = 'imagebot-gallery-item';
    item.innerHTML = `
      <img src="${src}" alt="${this.escape(prompt)}" loading="lazy">
      <div class="imagebot-gallery-meta">
        <p class="imagebot-gallery-prompt">${this.escape(prompt)}</p>
        <a href="${src}" download="asdf-image-${Date.now()}.png" class="imagebot-download">다운로드</a>
      </div>
    `;

    gallery.prepend(item);
    this.generatedImages.unshift({ src, prompt, createdAt: Date.now() });
  },

  escape(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  },
};

document.addEventListener('DOMContentLoaded', () => ImageBot.init());
