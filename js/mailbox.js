/** 우편함 — 업데이트 알림 및 공지 발송 */
const Mailbox = {
  getAll(userId) {
    const mailbox = Storage.get(Storage.KEYS.MAILBOX, {});
    return (mailbox[userId] || []).sort((a, b) => b.createdAt - a.createdAt);
  },

  getUnreadCount(userId) {
    return this.getAll(userId).filter((m) => !m.read).length;
  },

  sendToUser(userId, subject, body, type = 'system', meta = {}) {
    const mailbox = Storage.get(Storage.KEYS.MAILBOX, {});
    if (!mailbox[userId]) mailbox[userId] = [];

    mailbox[userId].push({
      id: 'mail_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
      subject,
      body,
      type,
      meta,
      read: false,
      createdAt: Date.now(),
    });
    Storage.set(Storage.KEYS.MAILBOX, mailbox);
  },

  sendToAll(subject, body, type = 'announcement') {
    const users = Storage.get(Storage.KEYS.USERS, {});
    const allIds = Object.keys(users);
    if (allIds.length === 0) {
      this._storeBroadcast(subject, body, type);
      return;
    }
    allIds.forEach((uid) => this.sendToUser(uid, subject, body, type));
    this._storeBroadcast(subject, body, type);
  },

  _storeBroadcast(subject, body, type) {
    const mailbox = Storage.get(Storage.KEYS.MAILBOX, {});
    if (!mailbox['__broadcast__']) mailbox['__broadcast__'] = [];
    mailbox['__broadcast__'].push({ subject, body, type, createdAt: Date.now() });
    Storage.set(Storage.KEYS.MAILBOX, mailbox);
  },

  markRead(userId, mailId) {
    const mailbox = Storage.get(Storage.KEYS.MAILBOX, {});
    if (!mailbox[userId]) return;
    const mail = mailbox[userId].find((m) => m.id === mailId);
    if (mail) mail.read = true;
    Storage.set(Storage.KEYS.MAILBOX, mailbox);
  },

  markAllRead(userId) {
    const mailbox = Storage.get(Storage.KEYS.MAILBOX, {});
    if (!mailbox[userId]) return;
    mailbox[userId].forEach((m) => (m.read = true));
    Storage.set(Storage.KEYS.MAILBOX, mailbox);
  },

  checkAppUpdate() {
    const storedVersion = Storage.get(Storage.KEYS.APP_VERSION, APP_VERSION);
    if (storedVersion !== APP_VERSION) {
      this.sendToAll(
        `앱 업데이트 v${APP_VERSION}`,
        `ASDF 홈페이지가 v${APP_VERSION}으로 업데이트되었습니다. 새로운 기능과 개선 사항을 확인하세요!`,
        'update'
      );
      Storage.set(Storage.KEYS.APP_VERSION, APP_VERSION);
    }
  },

  sendAnnouncement(subject, body) {
    if (!Auth.isAdminOrAbove()) return { ok: false, msg: '관리자 이상만 공지를 작성할 수 있습니다.' };
    this.sendToAll(subject, body, 'announcement');
    return { ok: true, msg: '공지가 전체 우편함으로 발송되었습니다.' };
  },

  deliverBroadcastsToUser(userId) {
    const mailbox = Storage.get(Storage.KEYS.MAILBOX, {});
    const broadcasts = mailbox['__broadcast__'] || [];
    if (!mailbox[userId]) mailbox[userId] = [];

    broadcasts.forEach((bc) => {
      const exists = mailbox[userId].some(
        (m) => m.subject === bc.subject && m.createdAt === bc.createdAt
      );
      if (!exists) {
        mailbox[userId].push({
          id: 'mail_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
          subject: bc.subject,
          body: bc.body,
          type: bc.type,
          read: false,
          createdAt: bc.createdAt,
        });
      }
    });
    Storage.set(Storage.KEYS.MAILBOX, mailbox);
  },
};
