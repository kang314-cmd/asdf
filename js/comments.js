/** 댓글 시스템 — 수정/삭제/차단 및 운영진 모더레이션 */
const Comments = {
  getAll() {
    return Storage.get(Storage.KEYS.COMMENTS, []);
  },

  getByPost(postId) {
    const blockedComments = Storage.get(Storage.KEYS.BLOCKED_COMMENTS, []);
    const blockedUsers = Storage.get(Storage.KEYS.BLOCKED_USERS, []);
    const userId = Auth.getUser()?.accountId;
    const globalBlocked = blockedUsers.filter((b) => b.type === 'admin').map((b) => b.targetId);

    return this.getAll()
      .filter((c) => c.postId === postId)
      .filter((c) => !blockedComments.includes(c.id))
      .filter((c) => !globalBlocked.includes(c.authorId))
      .filter((c) => {
        if (!userId) return true;
        const myBlocks = blockedUsers.filter((b) => b.blockerId === userId).map((b) => b.targetId);
        return !myBlocks.includes(c.authorId);
      })
      .sort((a, b) => a.createdAt - b.createdAt);
  },

  add(postId, content) {
    if (!Auth.isLoggedIn()) return { ok: false, msg: '로그인이 필요합니다.' };
    if (!content.trim()) return { ok: false, msg: '댓글 내용을 입력하세요.' };

    const user = Auth.getUser();
    const comments = this.getAll();
    const comment = {
      id: 'cmt_' + Date.now(),
      postId,
      content: content.trim(),
      authorId: user.accountId,
      authorName: user.nickname,
      createdAt: Date.now(),
      updatedAt: null,
    };
    comments.push(comment);
    Storage.set(Storage.KEYS.COMMENTS, comments);
    return { ok: true, comment };
  },

  edit(commentId, newContent) {
    if (!Auth.isLoggedIn()) return { ok: false, msg: '로그인이 필요합니다.' };
    const comments = this.getAll();
    const idx = comments.findIndex((c) => c.id === commentId);
    if (idx === -1) return { ok: false, msg: '댓글을 찾을 수 없습니다.' };

    const comment = comments[idx];
    if (comment.authorId !== Auth.getUser().accountId) {
      return { ok: false, msg: '본인이 작성한 댓글만 수정할 수 있습니다.' };
    }

    comments[idx].content = newContent.trim();
    comments[idx].updatedAt = Date.now();
    Storage.set(Storage.KEYS.COMMENTS, comments);
    return { ok: true, msg: '댓글이 수정되었습니다.' };
  },

  delete(commentId) {
    if (!Auth.isLoggedIn()) return { ok: false, msg: '로그인이 필요합니다.' };

    const comments = this.getAll();
    const idx = comments.findIndex((c) => c.id === commentId);
    if (idx === -1) return { ok: false, msg: '댓글을 찾을 수 없습니다.' };

    const comment = comments[idx];
    const user = Auth.getUser();
    const isOwner = comment.authorId === user.accountId;

    if (isOwner) {
      comments.splice(idx, 1);
      Storage.set(Storage.KEYS.COMMENTS, comments);
      return { ok: true, msg: '댓글이 삭제되었습니다.' };
    }

    if (Auth.isAdminOrAbove()) {
      comments.splice(idx, 1);
      Storage.set(Storage.KEYS.COMMENTS, comments);
      return { ok: true, msg: '운영진 권한으로 댓글이 삭제되었습니다.' };
    }

    if (Auth.isTraineeAdmin()) {
      return this._requestApproval('delete_comment', { commentId, targetUserId: comment.authorId });
    }

    return { ok: false, msg: '본인이 작성한 댓글만 삭제할 수 있습니다.' };
  },

  blockComment(commentId) {
    if (!Auth.isLoggedIn()) return { ok: false, msg: '로그인이 필요합니다.' };

    const comments = this.getAll();
    const comment = comments.find((c) => c.id === commentId);
    if (!comment) return { ok: false, msg: '댓글을 찾을 수 없습니다.' };

    const blocked = Storage.get(Storage.KEYS.BLOCKED_COMMENTS, []);
    if (!blocked.includes(commentId)) {
      blocked.push(commentId);
      Storage.set(Storage.KEYS.BLOCKED_COMMENTS, blocked);
    }
    return { ok: true, msg: '댓글이 차단되었습니다. 더 이상 표시되지 않습니다.' };
  },

  blockUser(targetUserId) {
    if (!Auth.isLoggedIn()) return { ok: false, msg: '로그인이 필요합니다.' };
    const user = Auth.getUser();
    if (targetUserId === user.accountId) return { ok: false, msg: '자기 자신은 차단할 수 없습니다.' };

    if (Auth.isAdminOrAbove()) {
      return this._adminBlockUser(targetUserId);
    }

    if (Auth.isTraineeAdmin()) {
      return this._requestApproval('block_user', { targetUserId });
    }

    const blocked = Storage.get(Storage.KEYS.BLOCKED_USERS, []);
    if (!blocked.find((b) => b.blockerId === user.accountId && b.targetId === targetUserId)) {
      blocked.push({ blockerId: user.accountId, targetId: targetUserId, type: 'personal', createdAt: Date.now() });
      Storage.set(Storage.KEYS.BLOCKED_USERS, blocked);
    }
    return { ok: true, msg: '해당 사용자의 댓글이 차단되었습니다.' };
  },

  warnUser(targetUserId, reason) {
    if (!Auth.isLoggedIn()) return { ok: false, msg: '로그인이 필요합니다.' };
    if (!reason?.trim()) return { ok: false, msg: '경고 사유를 입력하세요.' };

    if (Auth.isAdminOrAbove()) {
      return this._adminWarnUser(targetUserId, reason);
    }

    if (Auth.isTraineeAdmin()) {
      return this._requestApproval('warn_user', { targetUserId, reason });
    }

    return { ok: false, msg: '경고 권한이 없습니다.' };
  },

  _adminBlockUser(targetUserId) {
    const blocked = Storage.get(Storage.KEYS.BLOCKED_USERS, []);
    blocked.push({ blockerId: 'system', targetId: targetUserId, type: 'admin', createdAt: Date.now() });
    Storage.set(Storage.KEYS.BLOCKED_USERS, blocked);
    Mailbox.sendToUser(targetUserId, '계정 차단 알림', '운영진에 의해 계정이 차단되었습니다.', 'warning');
    return { ok: true, msg: '사용자가 차단되었습니다.' };
  },

  _adminWarnUser(targetUserId, reason) {
    const warnings = Storage.get(Storage.KEYS.WARNINGS, []);
    warnings.push({
      id: 'warn_' + Date.now(),
      targetUserId,
      reason,
      issuedBy: Auth.getUser().accountId,
      issuedByName: Auth.getUser().nickname,
      createdAt: Date.now(),
    });
    Storage.set(Storage.KEYS.WARNINGS, warnings);
    Mailbox.sendToUser(targetUserId, '운영진 경고', reason, 'warning');
    return { ok: true, msg: '경고가 발송되었습니다.' };
  },

  _requestApproval(actionType, payload) {
    const requiredRoles = getAllAdminPlusAccounts();
    const users = Storage.get(Storage.KEYS.USERS, {});

    const approvals = Storage.get(Storage.KEYS.APPROVALS, []);
    const approval = {
      id: 'appr_' + Date.now(),
      actionType,
      payload,
      requesterId: Auth.getUser().accountId,
      requesterName: Auth.getUser().nickname,
      requiredRoles,
      approvals: {},
      status: 'pending',
      createdAt: Date.now(),
    };
    approvals.push(approval);
    Storage.set(Storage.KEYS.APPROVALS, approvals);

    Object.values(users)
      .filter((u) => u.isStaff && isAdminOrAbove(u.rank))
      .forEach((u) => {
        Mailbox.sendToUser(
          u.accountId,
          '[결재 요청] 수습 관리자 조치 승인 필요',
          `${Auth.getUser().nickname}님이 ${this._actionLabel(actionType)} 조치를 요청했습니다. 결재 메뉴에서 확인하세요.`,
          'approval',
          { approvalId: approval.id }
        );
      });

    return { ok: true, msg: '관리자 이상 운영진 전원에게 승인 요청이 발송되었습니다.' };
  },

  _actionLabel(type) {
    const labels = { delete_comment: '댓글 삭제', block_user: '사용자 차단', warn_user: '사용자 경고' };
    return labels[type] || type;
  },

  approveRequest(approvalId) {
    if (!Auth.isAdminOrAbove()) return { ok: false, msg: '승인 권한이 없습니다.' };

    const approvals = Storage.get(Storage.KEYS.APPROVALS, []);
    const idx = approvals.findIndex((a) => a.id === approvalId);
    if (idx === -1) return { ok: false, msg: '결재 요청을 찾을 수 없습니다.' };

    const approval = approvals[idx];
    if (approval.status !== 'pending') return { ok: false, msg: '이미 처리된 요청입니다.' };

    const user = Auth.getUser();
    const roleKey = user.baseId || user.accountId.split('_').slice(0, -1).join('_');
    approval.approvals[roleKey] = { approvedBy: user.accountId, at: Date.now() };

    const approvedRoles = Object.keys(approval.approvals);
    const allApproved = approval.requiredRoles.every((r) => approvedRoles.includes(r));

    if (allApproved) {
      approval.status = 'approved';
      this._executeApproval(approval);
    }

    Storage.set(Storage.KEYS.APPROVALS, approvals);
    return {
      ok: true,
      msg: allApproved
        ? '관리자 이상 전 직급 승인 완료! 조치가 실행되었습니다.'
        : `승인 완료 (${approvedRoles.length}/${approval.requiredRoles.length} 직급)`,
    };
  },

  rejectRequest(approvalId) {
    if (!Auth.isAdminOrAbove()) return { ok: false, msg: '거부 권한이 없습니다.' };

    const approvals = Storage.get(Storage.KEYS.APPROVALS, []);
    const idx = approvals.findIndex((a) => a.id === approvalId);
    if (idx === -1) return { ok: false, msg: '결재 요청을 찾을 수 없습니다.' };

    approvals[idx].status = 'rejected';
    approvals[idx].rejectedBy = Auth.getUser().accountId;
    Storage.set(Storage.KEYS.APPROVALS, approvals);

    Mailbox.sendToUser(
      approvals[idx].requesterId,
      '결재 요청 거부',
      `${Auth.getUser().nickname}님이 조치 요청을 거부했습니다.`,
      'warning'
    );
    return { ok: true, msg: '결재 요청이 거부되었습니다.' };
  },

  _executeApproval(approval) {
    const { actionType, payload } = approval;
    if (actionType === 'delete_comment') {
      const comments = this.getAll();
      const idx = comments.findIndex((c) => c.id === payload.commentId);
      if (idx !== -1) {
        comments.splice(idx, 1);
        Storage.set(Storage.KEYS.COMMENTS, comments);
      }
    } else if (actionType === 'block_user') {
      this._adminBlockUser(payload.targetUserId);
    } else if (actionType === 'warn_user') {
      this._adminWarnUser(payload.targetUserId, payload.reason);
    }

    Mailbox.sendToUser(
      approval.requesterId,
      '결재 승인 완료',
      `${this._actionLabel(actionType)} 조치가 승인되어 실행되었습니다.`,
      'system'
    );
  },

  getPendingApprovals() {
    return Storage.get(Storage.KEYS.APPROVALS, []).filter((a) => a.status === 'pending');
  },
};
