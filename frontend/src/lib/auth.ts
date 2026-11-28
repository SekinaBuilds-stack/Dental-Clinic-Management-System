// Small session helper. The existing components read the JWT from localStorage
// key "token" while services/api.ts reads "access_token", so we write both.
const TOKEN_KEYS = ['token', 'access_token'] as const;

export function setSession(token: string, role: string, permissions: string[] = []) {
  try {
    TOKEN_KEYS.forEach((k) => localStorage.setItem(k, token));
    localStorage.setItem('role', role);
    localStorage.setItem('permissions', JSON.stringify(permissions));
  } catch {
    /* storage unavailable: the session simply will not persist */
  }
}

export function clearSession() {
  try {
    [...TOKEN_KEYS, 'role', 'permissions', 'selectedPatient'].forEach((k) => localStorage.removeItem(k));
  } catch {
    /* ignore */
  }
}

export function getToken(): string {
  try {
    return localStorage.getItem('token') ?? '';
  } catch {
    return '';
  }
}

export function getRole(): string {
  try {
    return localStorage.getItem('role') ?? '';
  } catch {
    return '';
  }
}

export function getPermissions(): string[] {
  try {
    const raw = JSON.parse(localStorage.getItem('permissions') ?? '[]');
    return Array.isArray(raw) ? raw.map(String) : [];
  } catch {
    return [];
  }
}

/** True when the signed-in user's role grants this permission. */
export function can(permission: string): boolean {
  return getPermissions().includes(permission);
}

export function isAuthenticated(): boolean {
  return getToken() !== '';
}

export function jwtPayload(token: string = getToken()): Record<string, unknown> | null {
  try {
    const part = token.split('.')[1];
    if (!part) return null;
    return JSON.parse(atob(part.replace(/-/g, '+').replace(/_/g, '/')));
  } catch {
    return null;
  }
}

export function currentUserId(): string {
  const p = jwtPayload();
  return String(p?.sub ?? p?.id ?? p?.userId ?? 'unknown');
}
