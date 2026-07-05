/** ASDF 게임 공식 홈페이지 — 메인 앱 */
const App = {
  currentPage: 'home',
  currentBoard: null,
  currentPostId: null,

  init() {
    Storage.init();
    Auth.init();
    Mailbox.checkAppUpdate();

    if (Auth.isLoggedIn()) {
      Mailbox.deliverBroadcastsToUser(Auth.getUser().accountId);
    }

    this.bindNav();
    this.bindAuth();
    this.bindModals();
    this.render();
  },

  bindNav() {
    document.querySelectorAll('[data-page]').forEach((el) => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        const page = el.dataset.page;
        this.currentBoard = el.dataset.board || null;
        this.currentPostId = null;
        this.navigate(page);
      });
    });
  },

  bindAuth() {
    document.getElementById('btn-login').addEventListener('click', () => this.handleLogin());
    document.getElementById('btn-register').addEventListener('click', () => this.handleRegister());
    document.getElementById('btn-logout').addEventListener('click', () => {
      Auth.logout();
      this.showToast('로그아웃되었습니다.');
      this.render();
    });
    document.getElementById('login-password').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this.handleLogin();
    });
  },

  bindModals() {
    document.getElementById('modal-close').addEventListener('click', () => this.closeModal());
    document.getElementById('modal-overlay').addEventListener('click', (e) => {
      if (e.target === e.currentTarget) this.closeModal();
    });
  },

  handleLogin() {
    const id = document.getElementById('login-id').value;
    const pw = document.getElementById('login-password').value;
    const result = Auth.login(id, pw);
    this.showToast(result.msg, result.ok ? 'success' : 'error');
    if (result.ok) {
      Mailbox.deliverBroadcastsToUser(Auth.getUser().accountId);
      document.getElementById('login-id').value = '';
      document.getElementById('login-password').value = '';
      this.render();
    }
  },

  handleRegister() {
    const nick = document.getElementById('register-nickname').value;
    const pw = document.getElementById('register-password').value;
    const result = Auth.register(nick, pw);
    this.showToast(result.msg, result.ok ? 'success' : 'error');
    if (result.ok) {
      document.getElementById('register-nickname').value = '';
      document.getElementById('register-password').value = '';
    }
  },

  navigate(page) {
    this.currentPage = page;
    this.render();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  openPost(postId) {
    this.currentPostId = postId;
    this.currentPage = 'post-detail';
    this.render();
  },

  showModal(title, bodyHtml, onConfirm) {
    document.getElementById('modal-title').textContent = title;
    document.getElementById('modal-body').innerHTML = bodyHtml;
    document.getElementById('modal-overlay').classList.add('active');

    const confirmBtn = document.getElementById('modal-confirm');
    const newBtn = confirmBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(newBtn, confirmBtn);
    newBtn.addEventListener('click', () => {
      if (onConfirm) onConfirm();
      this.closeModal();
    });
  },

  closeModal() {
    document.getElementById('modal-overlay').classList.remove('active');
  },

  showToast(msg, type = 'info') {
    const toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.className = 'toast show ' + type;
    setTimeout(() => toast.classList.remove('show'), 3000);
  },

  render() {
    this.renderHeader();
    this.renderContent();
  },

  renderHeader() {
    const user = Auth.getUser();
    const authSection = document.getElementById('auth-section');
    const userInfo = document.getElementById('user-info');
    const mailBadge = document.getElementById('mail-badge');

    if (user) {
      authSection.style.display = 'none';
      userInfo.style.display = 'flex';
      document.getElementById('user-name').textContent = user.nickname;
      document.getElementById('user-role').textContent = user.roleLabel || '일반 유저';

      const unread = Mailbox.getUnreadCount(user.accountId);
      mailBadge.textContent = unread;
      mailBadge.style.display = unread > 0 ? 'inline-flex' : 'none';
    } else {
      authSection.style.display = 'flex';
      userInfo.style.display = 'none';
    }

    document.querySelectorAll('[data-page]').forEach((el) => {
      el.classList.toggle('active', el.dataset.page === this.currentPage);
    });

    const navApprovals = document.getElementById('nav-approvals');
    const navAnnounce = document.getElementById('nav-announce');
    if (navApprovals) navApprovals.style.display = Auth.isAdminOrAbove() ? '' : 'none';
    if (navAnnounce) navAnnounce.style.display = Auth.isAdminOrAbove() ? '' : 'none';
  },

  renderContent() {
    const main = document.getElementById('main-content');
    switch (this.currentPage) {
      case 'home': main.innerHTML = this.renderHome(); break;
      case 'board': main.innerHTML = this.renderBoard(); break;
      case 'post-detail': main.innerHTML = this.renderPostDetail(); break;
      case 'mailbox': main.innerHTML = this.renderMailbox(); break;
      case 'approvals': main.innerHTML = this.renderApprovals(); break;
      case 'announce': main.innerHTML = this.renderAnnounce(); break;
      default: main.innerHTML = this.renderHome();
    }
    this.bindDynamicEvents();
  },

  renderHome() {
    return `
      <section class="hero">
        <div class="hero-bg"></div>
        <div class="hero-content">
          <span class="hero-tag">OFFICIAL WEBSITE</span>
          <h1>ASDF</h1>
          <p class="hero-sub">빛과 어둠이 맞서는 대륙, 당신의 전설이 시작됩니다</p>
          <div class="hero-actions">
            <button class="btn btn-primary" data-page="board" data-board="world_lore">세계관 탐험</button>
            <button class="btn btn-outline" data-page="board" data-board="update_news">최신 소식</button>
          </div>
        </div>
      </section>
      <section class="features">
        <div class="feature-card" data-page="board" data-board="user_board">
          <div class="feature-icon">💬</div>
          <h3>유저 게시판</h3>
          <p>플레이어들과 공략과 정보를 공유하세요</p>
        </div>
        <div class="feature-card" data-page="board" data-board="dev_notes">
          <div class="feature-icon">📝</div>
          <h3>개발자 노트</h3>
          <p>개발팀의 생생한 개발 이야기</p>
        </div>
        <div class="feature-card" data-page="board" data-board="world_lore">
          <div class="feature-icon">🌍</div>
          <h3>게임 세계관</h3>
          <p>ASDFia 대륙의 신화와 역사</p>
        </div>
        <div class="feature-card" data-page="board" data-board="update_news">
          <div class="feature-icon">📢</div>
          <h3>업데이트 소식</h3>
          <p>패치 노트와 이벤트 정보</p>
        </div>
      </section>
      <section class="world-preview">
        <h2>세계관 미리보기</h2>
        <div class="world-grid">
          <div class="world-item">
            <h4>창세의 대륙 ASDFia</h4>
            <p>고대 신들이 만든 대륙에서 다섯 개의 왕국이 번영하고 있습니다. 각 왕국은 고유한 원소의 힘을 다루며, 균형이 깨지면 어둠의 균열이 열립니다.</p>
          </div>
          <div class="world-item">
            <h4>선택받은 자들</h4>
            <p>「ASDF의 인장」을 가진 영웅들만이 균열을 봉인할 수 있습니다. 당신은 그 중 한 명입니다.</p>
          </div>
          <div class="world-item">
            <h4>어둠의 군단</h4>
            <p>균열 너머에서 Void Legion이 침공합니다. 연합하지 않으면 대륙은 영원히 어둠에 잠깁니다.</p>
          </div>
        </div>
      </section>
    `;
  },

  renderBoard() {
    const board = this.currentBoard || 'user_board';
    const posts = Board.getPosts(board);
    const canWrite = Auth.isLoggedIn();

    return `
      <section class="page-header">
        <h2>${Board.boardLabel(board)}</h2>
        <p>${this.boardDescription(board)}</p>
      </section>
      ${canWrite ? `
        <div class="write-form card">
          <h3>새 글 작성</h3>
          <input type="text" id="post-title" placeholder="제목" class="input">
          <textarea id="post-content" placeholder="내용을 입력하세요..." class="textarea" rows="4"></textarea>
          <button class="btn btn-primary" id="btn-write-post">게시</button>
        </div>
      ` : '<p class="login-hint card">글을 작성하려면 로그인하세요.</p>'}
      <div class="post-list">
        ${posts.length === 0 ? '<p class="empty-msg">게시글이 없습니다.</p>' : posts.map((p) => `
          <article class="post-card card ${p.pinned ? 'pinned' : ''}" data-post-id="${p.id}">
            ${p.pinned ? '<span class="pin-badge">📌 고정</span>' : ''}
            <h3>${this.escape(p.title)}</h3>
            <p class="post-preview">${this.escape(p.content.slice(0, 120))}${p.content.length > 120 ? '...' : ''}</p>
            <div class="post-meta">
              <span>${this.escape(p.author)}</span>
              <span>${this.formatDate(p.createdAt)}</span>
            </div>
          </article>
        `).join('')}
      </div>
    `;
  },

  boardDescription(board) {
    const desc = {
      user_board: '자유롭게 이야기를 나누는 커뮤니티 공간',
      dev_notes: '개발팀의 비하인드 스토리와 기술 노트',
      world_lore: 'ASDF 세계관과 캐릭터 설정',
      update_news: '패치, 이벤트, 공식 발표',
    };
    return desc[board] || '';
  },

  renderPostDetail() {
    const post = Board.getPost(this.currentPostId);
    if (!post) return '<p class="empty-msg card">게시글을 찾을 수 없습니다.</p>';

    const comments = Comments.getByPost(post.id);
    const user = Auth.getUser();

    return `
      <button class="btn btn-text" id="btn-back">← 목록으로</button>
      <article class="post-detail card">
        <h2>${this.escape(post.title)}</h2>
        <div class="post-meta">
          <span>${this.escape(post.author)}</span>
          <span>${this.formatDate(post.createdAt)}</span>
        </div>
        <div class="post-body">${this.escape(post.content).replace(/\n/g, '<br>')}</div>
      </article>
      <section class="comments-section card">
        <h3>댓글 (${comments.length})</h3>
        ${Auth.isLoggedIn() ? `
          <div class="comment-form">
            <textarea id="comment-input" class="textarea" rows="2" placeholder="댓글을 입력하세요..."></textarea>
            <button class="btn btn-primary btn-sm" id="btn-add-comment">댓글 작성</button>
          </div>
        ` : '<p class="login-hint">댓글을 작성하려면 로그인하세요.</p>'}
        <div class="comment-list">
          ${comments.map((c) => this.renderComment(c, user)).join('')}
        </div>
      </section>
    `;
  },

  renderComment(comment, user) {
    const isOwner = user && comment.authorId === user.accountId;
    const isAdmin = Auth.isAdminOrAbove();
    const isTrainee = Auth.isTraineeAdmin();

    let actions = '';
    if (user) {
      if (isOwner) {
        actions += `<button class="btn btn-text btn-sm" data-action="edit-comment" data-id="${comment.id}">수정</button>`;
        actions += `<button class="btn btn-text btn-sm" data-action="delete-comment" data-id="${comment.id}">삭제</button>`;
      }
      if (!isOwner) {
        actions += `<button class="btn btn-text btn-sm" data-action="block-comment" data-id="${comment.id}">댓글 차단</button>`;
        actions += `<button class="btn btn-text btn-sm" data-action="block-user" data-target="${comment.authorId}">사용자 차단</button>`;
      }
      if (isAdmin && !isOwner) {
        actions += `<button class="btn btn-text btn-sm btn-danger" data-action="admin-delete" data-id="${comment.id}">운영 삭제</button>`;
        actions += `<button class="btn btn-text btn-sm btn-danger" data-action="admin-warn" data-target="${comment.authorId}">경고</button>`;
      }
      if (isTrainee && !isOwner) {
        actions += `<button class="btn btn-text btn-sm btn-warn" data-action="trainee-delete" data-id="${comment.id}">삭제 요청</button>`;
        actions += `<button class="btn btn-text btn-sm btn-warn" data-action="trainee-block" data-target="${comment.authorId}">차단 요청</button>`;
        actions += `<button class="btn btn-text btn-sm btn-warn" data-action="trainee-warn" data-target="${comment.authorId}">경고 요청</button>`;
      }
    }

    return `
      <div class="comment-item" data-comment-id="${comment.id}">
        <div class="comment-header">
          <strong>${this.escape(comment.authorName)}</strong>
          <span>${this.formatDate(comment.createdAt)}${comment.updatedAt ? ' (수정됨)' : ''}</span>
        </div>
        <p class="comment-body">${this.escape(comment.content)}</p>
        <div class="comment-actions">${actions}</div>
      </div>
    `;
  },

  renderMailbox() {
    if (!Auth.isLoggedIn()) return '<p class="empty-msg card">우편함을 확인하려면 로그인하세요.</p>';

    const mails = Mailbox.getAll(Auth.getUser().accountId);
    const typeIcons = { update: '🔄', announcement: '📢', warning: '⚠️', approval: '📋', system: '📧' };

    return `
      <section class="page-header">
        <h2>우편함</h2>
        <button class="btn btn-outline btn-sm" id="btn-mark-all-read">모두 읽음</button>
      </section>
      <div class="mail-list">
        ${mails.length === 0 ? '<p class="empty-msg card">받은 우편이 없습니다.</p>' : mails.map((m) => `
          <div class="mail-item card ${m.read ? 'read' : 'unread'}" data-mail-id="${m.id}">
            <div class="mail-icon">${typeIcons[m.type] || '📧'}</div>
            <div class="mail-content">
              <h4>${this.escape(m.subject)}</h4>
              <p>${this.escape(m.body)}</p>
              <span class="mail-date">${this.formatDate(m.createdAt)}</span>
            </div>
            ${!m.read ? '<span class="unread-dot"></span>' : ''}
          </div>
        `).join('')}
      </div>
    `;
  },

  renderApprovals() {
    if (!Auth.isAdminOrAbove()) return '<p class="empty-msg card">접근 권한이 없습니다.</p>';

    const pending = Comments.getPendingApprovals();

    return `
      <section class="page-header">
        <h2>결재 관리</h2>
        <p>수습 관리자의 조치 요청 승인</p>
      </section>
      <div class="approval-list">
        ${pending.length === 0 ? '<p class="empty-msg card">대기 중인 결재 요청이 없습니다.</p>' : pending.map((a) => {
          const approvedCount = Object.keys(a.approvals).length;
          const user = Auth.getUser();
          const roleKey = user.baseId || user.accountId.split('_').slice(0, -1).join('_');
          const myApproved = a.approvals[roleKey];
          const required = a.requiredRoles || a.requiredApprovers || 4;
          return `
            <div class="approval-item card" data-approval-id="${a.id}">
              <h4>${Comments._actionLabel(a.actionType)} 요청</h4>
              <p>요청자: ${this.escape(a.requesterName)}</p>
              <p>승인 현황: ${approvedCount} / ${Array.isArray(required) ? required.length : required} 직급</p>
              <div class="approval-actions">
                ${!myApproved ? `
                  <button class="btn btn-primary btn-sm" data-action="approve" data-id="${a.id}">승인</button>
                  <button class="btn btn-danger btn-sm" data-action="reject" data-id="${a.id}">거부</button>
                ` : '<span class="approved-badge">✓ 승인 완료</span>'}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  },

  renderAnnounce() {
    if (!Auth.isAdminOrAbove()) return '<p class="empty-msg card">관리자 이상만 공지를 작성할 수 있습니다.</p>';

    return `
      <section class="page-header">
        <h2>공지 작성</h2>
        <p>작성한 공지는 전체 유저의 우편함으로 발송됩니다</p>
      </section>
      <div class="write-form card">
        <input type="text" id="announce-subject" placeholder="공지 제목" class="input">
        <textarea id="announce-body" placeholder="공지 내용..." class="textarea" rows="6"></textarea>
        <button class="btn btn-primary" id="btn-send-announce">공지 발송</button>
      </div>
    `;
  },

  bindDynamicEvents() {
    document.querySelectorAll('[data-page]').forEach((el) => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        this.currentBoard = el.dataset.board || null;
        this.currentPostId = null;
        this.navigate(el.dataset.page === 'board' ? 'board' : el.dataset.page);
      });
    });

    document.querySelectorAll('[data-post-id]').forEach((el) => {
      el.addEventListener('click', () => this.openPost(el.dataset.postId));
    });

    const btnBack = document.getElementById('btn-back');
    if (btnBack) btnBack.addEventListener('click', () => this.navigate('board'));

    const btnWrite = document.getElementById('btn-write-post');
    if (btnWrite) {
      btnWrite.addEventListener('click', () => {
        const title = document.getElementById('post-title').value;
        const content = document.getElementById('post-content').value;
        const result = Board.create(this.currentBoard, title, content);
        this.showToast(result.msg, result.ok ? 'success' : 'error');
        if (result.ok) this.render();
      });
    }

    const btnComment = document.getElementById('btn-add-comment');
    if (btnComment) {
      btnComment.addEventListener('click', () => {
        const content = document.getElementById('comment-input').value;
        const result = Comments.add(this.currentPostId, content);
        this.showToast(result.msg, result.ok ? 'success' : 'error');
        if (result.ok) this.render();
      });
    }

    this.bindCommentActions();
    this.bindMailboxEvents();
    this.bindApprovalEvents();
    this.bindAnnounceEvents();
  },

  bindCommentActions() {
    document.querySelectorAll('[data-action]').forEach((el) => {
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        const action = el.dataset.action;
        const id = el.dataset.id;
        const target = el.dataset.target;

        switch (action) {
          case 'edit-comment':
            this.showModal('댓글 수정', `<textarea id="edit-comment-text" class="textarea" rows="3"></textarea>`, () => {
              const text = document.getElementById('edit-comment-text').value;
              const r = Comments.edit(id, text);
              this.showToast(r.msg, r.ok ? 'success' : 'error');
              if (r.ok) this.render();
            });
            break;
          case 'delete-comment':
          case 'admin-delete':
          case 'trainee-delete':
            if (confirm('댓글을 삭제하시겠습니까?')) {
              const r = Comments.delete(id);
              this.showToast(r.msg, r.ok ? 'success' : 'error');
              if (r.ok) this.render();
            }
            break;
          case 'block-comment':
            if (confirm('이 댓글을 차단하시겠습니까?')) {
              const r = Comments.blockComment(id);
              this.showToast(r.msg, r.ok ? 'success' : 'error');
              if (r.ok) this.render();
            }
            break;
          case 'block-user':
          case 'trainee-block':
            if (confirm('해당 사용자를 차단하시겠습니까?')) {
              const r = Comments.blockUser(target);
              this.showToast(r.msg, r.ok ? 'success' : 'error');
              if (r.ok) this.render();
            }
            break;
          case 'admin-warn':
          case 'trainee-warn':
            this.showModal('경고 사유', `<textarea id="warn-reason" class="textarea" rows="3" placeholder="경고 사유를 입력하세요"></textarea>`, () => {
              const reason = document.getElementById('warn-reason').value;
              const r = Comments.warnUser(target, reason);
              this.showToast(r.msg, r.ok ? 'success' : 'error');
            });
            break;
        }
      });
    });
  },

  bindMailboxEvents() {
    document.querySelectorAll('[data-mail-id]').forEach((el) => {
      el.addEventListener('click', () => {
        Mailbox.markRead(Auth.getUser().accountId, el.dataset.mailId);
        el.classList.remove('unread');
        el.classList.add('read');
        el.querySelector('.unread-dot')?.remove();
        this.renderHeader();
      });
    });

    const btnMarkAll = document.getElementById('btn-mark-all-read');
    if (btnMarkAll) {
      btnMarkAll.addEventListener('click', () => {
        Mailbox.markAllRead(Auth.getUser().accountId);
        this.showToast('모든 우편을 읽음 처리했습니다.');
        this.render();
      });
    }
  },

  bindApprovalEvents() {
    document.querySelectorAll('[data-action="approve"]').forEach((el) => {
      el.addEventListener('click', () => {
        const r = Comments.approveRequest(el.dataset.id);
        this.showToast(r.msg, r.ok ? 'success' : 'error');
        if (r.ok) this.render();
      });
    });
    document.querySelectorAll('[data-action="reject"]').forEach((el) => {
      el.addEventListener('click', () => {
        const r = Comments.rejectRequest(el.dataset.id);
        this.showToast(r.msg, r.ok ? 'success' : 'error');
        if (r.ok) this.render();
      });
    });
  },

  bindAnnounceEvents() {
    const btn = document.getElementById('btn-send-announce');
    if (btn) {
      btn.addEventListener('click', () => {
        const subject = document.getElementById('announce-subject').value;
        const body = document.getElementById('announce-body').value;
        const r = Mailbox.sendAnnouncement(subject, body);
        this.showToast(r.msg, r.ok ? 'success' : 'error');
      });
    }
  },

  escape(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  },

  formatDate(ts) {
    return new Date(ts).toLocaleString('ko-KR', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  },
};

document.addEventListener('DOMContentLoaded', () => App.init());
