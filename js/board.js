/** 게시판 CRUD */
const Board = {
  getPosts(boardType) {
    return Storage.get(Storage.KEYS.POSTS, [])
      .filter((p) => p.board === boardType)
      .sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || b.createdAt - a.createdAt);
  },

  getPost(postId) {
    return Storage.get(Storage.KEYS.POSTS, []).find((p) => p.id === postId);
  },

  create(boardType, title, content) {
    if (!Auth.isLoggedIn()) return { ok: false, msg: '로그인이 필요합니다.' };
    if (!title.trim() || !content.trim()) return { ok: false, msg: '제목과 내용을 입력하세요.' };

    const user = Auth.getUser();
    const posts = Storage.get(Storage.KEYS.POSTS, []);
    const post = {
      id: 'post_' + Date.now(),
      board: boardType,
      title: title.trim(),
      content: content.trim(),
      author: user.nickname,
      authorId: user.accountId,
      createdAt: Date.now(),
      pinned: false,
    };
    posts.push(post);
    Storage.set(Storage.KEYS.POSTS, posts);
    return { ok: true, post };
  },

  boardLabel(type) {
    const labels = {
      user_board: '유저 게시판',
      dev_notes: '개발자 노트',
      world_lore: '게임 세계관',
      update_news: '업데이트 소식',
    };
    return labels[type] || type;
  },
};
