/** localStorage 기반 데이터 저장소 */
const Storage = {
  KEYS: {
    USERS: 'asdf_users',
    SESSIONS: 'asdf_sessions',
    POSTS: 'asdf_posts',
    COMMENTS: 'asdf_comments',
    MAILBOX: 'asdf_mailbox',
    APPROVALS: 'asdf_approvals',
    BLOCKED_USERS: 'asdf_blocked_users',
    BLOCKED_COMMENTS: 'asdf_blocked_comments',
    WARNINGS: 'asdf_warnings',
    APP_VERSION: 'asdf_app_version',
    SEEDED: 'asdf_seeded',
  },

  get(key, fallback = null) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  },

  set(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  },

  init() {
    if (this.get(this.KEYS.SEEDED)) return;

    const defaultPosts = [
      {
        id: 'post_world_1',
        board: 'world_lore',
        title: 'ASDF 세계관 — 창세의 서사',
        content: '고대의 대륙 ASDFia에서 빛과 어둠의 균형이 깨지며, 선택받은 영웅들이 각성하기 시작합니다. 당신은 이 세계의 운명을 바꿀 열쇠를 쥐고 있습니다.',
        author: '시스템',
        authorId: 'system',
        createdAt: Date.now() - 86400000 * 7,
        pinned: true,
      },
      {
        id: 'post_dev_1',
        board: 'dev_notes',
        title: '개발자 노트 #1 — 프로젝트 킥오프',
        content: 'ASDF 공식 홈페이지와 커뮤니티 시스템 구축을 시작합니다. 플레이어 여러분의 피드백을 기다립니다.',
        author: '개발팀',
        authorId: 'system',
        createdAt: Date.now() - 86400000 * 5,
        pinned: false,
      },
      {
        id: 'post_update_1',
        board: 'update_news',
        title: 'v1.0.0 정식 출시',
        content: 'ASDF 게임 공식 홈페이지 v1.0.0이 출시되었습니다. 우편함에서 업데이트 알림을 확인하세요!',
        author: '운영팀',
        authorId: 'system',
        createdAt: Date.now() - 86400000 * 2,
        pinned: true,
      },
      {
        id: 'post_user_1',
        board: 'user_board',
        title: '첫 번째 자유 게시글 — 환영합니다!',
        content: '유저 게시판에 오신 것을 환영합니다. 게임 팁, 공략, 자유 토론을 나눠보세요.',
        author: 'Guest_Player',
        authorId: 'guest_demo',
        createdAt: Date.now() - 86400000,
        pinned: false,
      },
    ];

    this.set(this.KEYS.POSTS, defaultPosts);
    this.set(this.KEYS.COMMENTS, []);
    this.set(this.KEYS.USERS, {});
    this.set(this.KEYS.SESSIONS, {});
    this.set(this.KEYS.MAILBOX, {});
    this.set(this.KEYS.APPROVALS, []);
    this.set(this.KEYS.BLOCKED_USERS, []);
    this.set(this.KEYS.BLOCKED_COMMENTS, []);
    this.set(this.KEYS.WARNINGS, []);
    this.set(this.KEYS.APP_VERSION, APP_VERSION);
    this.set(this.KEYS.SEEDED, true);
  },
};
