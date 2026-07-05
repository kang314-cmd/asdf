/** ASDF 게임 공식 홈페이지 — 운영진·권한 설정 */
const STAFF_ROLES = {
  CHIEF_MANAGER: { id: 'chief_manager', label: '총괄 매니저', rank: 5, baseId: 'Manager_Omega', basePassword: 'Manager_Protocol_Omega' },
  MANAGER: { id: 'manager', label: '매니저', rank: 4, baseId: 'Manager_Alpha', basePassword: 'Manager_Protocol_Alpha' },
  CHIEF_ADMIN: { id: 'chief_admin', label: '총괄 관리자', rank: 3, baseId: 'Manager_Beta', basePassword: 'Manager_Protocol_Beta' },
  ADMIN: { id: 'admin', label: '관리자', rank: 2, baseId: 'Manager_Gamma', basePassword: 'Manager_Protocol_Gamma' },
  TRAINEE_ADMIN: { id: 'trainee_admin', label: '수습 관리자', rank: 1, baseId: 'Manager_Sigma', basePassword: 'Manager_Protocol_Sigma' },
};

const ADMIN_MIN_RANK = STAFF_ROLES.ADMIN.rank;

const BOARD_TYPES = {
  USER: 'user_board',
  DEV: 'dev_notes',
  WORLD: 'world_lore',
  UPDATE: 'update_news',
};

const APP_VERSION = '1.0.0';

function parseStaffCredentials(rawId, rawPassword) {
  const idMatch = rawId.match(/^(.+?)_(\d+)$/);
  const pwMatch = rawPassword.match(/^(.+?)_(\d+)$/);

  const baseId = idMatch ? idMatch[1] : rawId;
  const suffix = idMatch ? parseInt(idMatch[2], 10) : 0;
  const basePassword = pwMatch ? pwMatch[1] : rawPassword;
  const pwSuffix = pwMatch ? parseInt(pwMatch[2], 10) : 0;

  if (suffix !== pwSuffix) return null;

  for (const role of Object.values(STAFF_ROLES)) {
    if (role.baseId === baseId && role.basePassword === basePassword) {
      return {
        role,
        accountId: `${baseId}_${suffix}`,
        displayName: `${role.label} (${baseId}_${suffix})`,
        isStaff: true,
        rank: role.rank,
      };
    }
  }
  return null;
}

function isAdminOrAbove(rank) {
  return rank >= ADMIN_MIN_RANK;
}

function getAllAdminPlusAccounts() {
  const accounts = [];
  for (const role of Object.values(STAFF_ROLES)) {
    if (isAdminOrAbove(role.rank)) {
      accounts.push(role.baseId);
    }
  }
  return accounts;
}
