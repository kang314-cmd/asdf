/** 인증 및 동시 접속 방지 */
const Auth = {
  currentUser: null,
  sessionToken: null,

  init() {
    const saved = sessionStorage.getItem('asdf_current_session');
    if (saved) {
      const { token, accountId } = JSON.parse(saved);
      const sessions = Storage.get(Storage.KEYS.SESSIONS, {});
      if (sessions[accountId] === token) {
        const users = Storage.get(Storage.KEYS.USERS, {});
        this.currentUser = users[accountId] || null;
        this.sessionToken = token;
      } else {
        sessionStorage.removeItem('asdf_current_session');
      }
    }
  },

  _generateToken() {
    return 'tok_' + Date.now() + '_' + Math.random().toString(36).slice(2);
  },

  register(nickname, password) {
    if (!nickname || nickname.length < 2) return { ok: false, msg: '닉네임은 2자 이상이어야 합니다.' };
    if (!password || password.length < 4) return { ok: false, msg: '비밀번호는 4자 이상이어야 합니다.' };

    const users = Storage.get(Storage.KEYS.USERS, {});
    const accountId = 'user_' + nickname.toLowerCase().replace(/\s/g, '_');

    if (users[accountId]) return { ok: false, msg: '이미 존재하는 닉네임입니다.' };

    users[accountId] = {
      accountId,
      nickname,
      password,
      isStaff: false,
      rank: 0,
      roleLabel: '일반 유저',
      createdAt: Date.now(),
    };
    Storage.set(Storage.KEYS.USERS, users);
    return { ok: true, msg: '회원가입 완료!' };
  },

  login(rawId, rawPassword) {
    const staff = parseStaffCredentials(rawId.trim(), rawPassword.trim());
    if (staff) {
      return this._loginStaff(staff);
    }

    const users = Storage.get(Storage.KEYS.USERS, {});
    const found = Object.values(users).find(
      (u) => !u.isStaff && (u.nickname === rawId || u.accountId === rawId) && u.password === rawPassword
    );
    if (!found) return { ok: false, msg: 'ID 또는 비밀번호가 올바르지 않습니다.' };
    return this._createSession(found);
  },

  _loginStaff(staff) {
    const users = Storage.get(Storage.KEYS.USERS, {});
    const accountId = staff.accountId;

    if (!users[accountId]) {
      users[accountId] = {
        accountId,
        nickname: staff.displayName,
        password: staff.role.basePassword + '_' + accountId.split('_').pop(),
        isStaff: true,
        rank: staff.rank,
        roleLabel: staff.role.label,
        roleId: staff.role.id,
        baseId: staff.role.baseId,
        createdAt: Date.now(),
      };
      Storage.set(Storage.KEYS.USERS, users);
    }

    const sessions = Storage.get(Storage.KEYS.SESSIONS, {});
    if (sessions[accountId]) {
      return { ok: false, msg: `계정 ${accountId}이(가) 이미 접속 중입니다. _n 접미사로 다른 계정을 사용하세요.` };
    }

    return this._createSession(users[accountId]);
  },

  _createSession(user) {
    const token = this._generateToken();
    const sessions = Storage.get(Storage.KEYS.SESSIONS, {});
    sessions[user.accountId] = token;
    Storage.set(Storage.KEYS.SESSIONS, sessions);

    this.currentUser = user;
    this.sessionToken = token;
    sessionStorage.setItem('asdf_current_session', JSON.stringify({ token, accountId: user.accountId }));
    return { ok: true, msg: `${user.nickname}님, 환영합니다!` };
  },

  logout() {
    if (this.currentUser) {
      const sessions = Storage.get(Storage.KEYS.SESSIONS, {});
      delete sessions[this.currentUser.accountId];
      Storage.set(Storage.KEYS.SESSIONS, sessions);
    }
    this.currentUser = null;
    this.sessionToken = null;
    sessionStorage.removeItem('asdf_current_session');
  },

  isLoggedIn() {
    return !!this.currentUser;
  },

  getUser() {
    return this.currentUser;
  },

  isStaff() {
    return this.currentUser?.isStaff ?? false;
  },

  isAdminOrAbove() {
    return isAdminOrAbove(this.currentUser?.rank ?? 0);
  },

  isTraineeAdmin() {
    return this.currentUser?.roleId === STAFF_ROLES.TRAINEE_ADMIN.id;
  },
};
