/** ASDF GPT 챗봇 */
const Chatbot = {
  history: [],
  isOpen: false,
  isLoading: false,

  init() {
    const toggle = document.getElementById('chatbot-toggle');
    const close = document.getElementById('chatbot-close');
    const form = document.getElementById('chatbot-form');
    const saveKeyBtn = document.getElementById('chatbot-save-key');
    const settingsBtn = document.getElementById('chatbot-settings');

    toggle?.addEventListener('click', () => this.toggle());
    close?.addEventListener('click', () => this.close());
    form?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.send();
    });
    saveKeyBtn?.addEventListener('click', () => this.saveApiKey());
    settingsBtn?.addEventListener('click', () => this.toggleSettings());

    this.updateKeyUI();
  },

  getApiKey() {
    return GptApi.getApiKey();
  },

  saveApiKey() {
    const input = document.getElementById('chatbot-api-key');
    const key = input?.value.trim();
    if (!key) {
      this.appendMessage('bot', 'API 키를 입력해 주세요.');
      return;
    }
    GptApi.saveApiKey(key);
    if (input) input.value = '';
    this.updateKeyUI();
    this.appendMessage('bot', 'API 키가 저장되었습니다. 챗봇과 이미지 생성봇 모두 사용 가능합니다!');
  },

  toggleSettings() {
    const setup = document.getElementById('chatbot-key-setup');
    if (!setup) return;
    setup.hidden = !setup.hidden;
    if (!setup.hidden) {
      document.getElementById('chatbot-api-key')?.focus();
    }
  },

  updateKeyUI() {
    const hasKey = !!this.getApiKey();
    const setup = document.getElementById('chatbot-key-setup');
    const form = document.getElementById('chatbot-form');
    const settingsBtn = document.getElementById('chatbot-settings');
    if (setup) setup.hidden = true;
    if (form) form.style.display = hasKey ? 'flex' : 'none';
    if (settingsBtn) settingsBtn.hidden = !hasKey;
  },

  toggle() {
    if (this.isOpen) {
      this.close();
    } else {
      if (typeof ImageBot !== 'undefined' && ImageBot.isOpen) ImageBot.close();
      this.open();
    }
  },

  open() {
    this.isOpen = true;
    document.getElementById('chatbot-panel')?.removeAttribute('hidden');
    document.getElementById('chatbot-toggle')?.classList.add('active');
    this.updateKeyUI();
    if (this.getApiKey()) {
      document.getElementById('chatbot-input')?.focus();
    } else {
      document.getElementById('chatbot-api-key')?.focus();
    }
  },

  close() {
    this.isOpen = false;
    document.getElementById('chatbot-panel')?.setAttribute('hidden', '');
    document.getElementById('chatbot-toggle')?.classList.remove('active');
  },

  appendMessage(role, text) {
    const container = document.getElementById('chatbot-messages');
    if (!container) return;

    const div = document.createElement('div');
    div.className = `chatbot-msg ${role === 'user' ? 'user' : 'bot'}`;
    div.innerHTML = `<p>${this.escape(text).replace(/\n/g, '<br>')}</p>`;
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
  },

  appendLoading() {
    const container = document.getElementById('chatbot-messages');
    if (!container) return null;

    const div = document.createElement('div');
    div.className = 'chatbot-msg bot loading';
    div.id = 'chatbot-loading';
    div.innerHTML = '<p><span class="typing-dots"><span></span><span></span><span></span></span></p>';
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
    return div;
  },

  removeLoading() {
    document.getElementById('chatbot-loading')?.remove();
  },

  getSystemPrompt() {
    return `당신은 "ASDF" 게임 공식 홈페이지의 AI 가이드입니다.
게임 세계관(ASDFia 대륙, 빛과 어둠, Void Legion), 유저 게시판, 개발자 노트, 업데이트 소식, 우편함, 운영진 시스템에 대해 친절하게 안내합니다.
모르는 내용은 솔직히 모른다고 하고, 공식 홈페이지 메뉴를 안내하세요.
답변은 한국어로, 간결하고 명확하게 작성하세요.`;
  },

  async send() {
    if (this.isLoading) return;

    const input = document.getElementById('chatbot-input');
    const sendBtn = document.getElementById('chatbot-send');
    const text = input?.value.trim();
    if (!text) return;

    const apiKey = this.getApiKey();
    const config = window.GPT_CONFIG || {};
    if (!apiKey) {
      this.appendMessage('bot', 'GPT API 키가 설정되지 않았습니다. ⚙ 버튼에서 키를 입력해 주세요.');
      document.getElementById('chatbot-key-setup').hidden = false;
      return;
    }

    this.appendMessage('user', text);
    input.value = '';
    this.history.push({ role: 'user', content: text });

    this.isLoading = true;
    if (sendBtn) sendBtn.disabled = true;
    this.appendLoading();

    try {
      const res = await fetch(config.endpoint || 'https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: config.model || 'gpt-4o-mini',
          messages: [
            { role: 'system', content: this.getSystemPrompt() },
            ...this.history.slice(-10),
          ],
          max_tokens: config.maxTokens || 800,
          temperature: config.temperature ?? 0.7,
        }),
      });

      const data = await res.json();
      this.removeLoading();

      if (!res.ok) {
        const errMsg = data.error?.message || `API 오류 (${res.status})`;
        this.appendMessage('bot', `오류: ${errMsg}`);
        this.history.pop();
        return;
      }

      const reply = data.choices?.[0]?.message?.content?.trim() || '응답을 받지 못했습니다.';
      this.history.push({ role: 'assistant', content: reply });
      this.appendMessage('bot', reply);
    } catch {
      this.removeLoading();
      this.appendMessage('bot', '네트워크 오류가 발생했습니다. 인터넷 연결을 확인해 주세요.');
      this.history.pop();
    } finally {
      this.isLoading = false;
      if (sendBtn) sendBtn.disabled = false;
      input?.focus();
    }
  },

  escape(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  },
};

document.addEventListener('DOMContentLoaded', () => Chatbot.init());
