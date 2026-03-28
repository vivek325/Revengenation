// ── Keys ─────────────────────────────────────────────────────────────────────
const USERS_KEY = "rns_users";
const SESSION_KEY = "rns_session";

// ── Admin credentials (hardcoded, unique) ────────────────────────────────────
export const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "Revenge@Admin2026";

// ── Types ─────────────────────────────────────────────────────────────────────
export interface AuthUser {
  username: string;
  isAdmin: boolean;
}

interface StoredUser {
  username: string;
  password: string;
  email?: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function getStoredUsers(): StoredUser[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveStoredUsers(users: StoredUser[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

// ── Public API ────────────────────────────────────────────────────────────────

/** Register a new user. Returns an error string on failure, null on success. */
export function signUp(username: string, password: string, email?: string): string | null {
  const trimmed = username.trim().toLowerCase();
  if (!trimmed || !password) return "Username and password are required.";
  if (trimmed.length < 3) return "Username must be at least 3 characters.";
  if (password.length < 6) return "Password must be at least 6 characters.";
  if (trimmed === ADMIN_USERNAME) return "That username is reserved.";

  const users = getStoredUsers();
  if (users.find((u) => u.username === trimmed)) return "Username already taken.";

  users.push({ username: trimmed, password, email });
  saveStoredUsers(users);
  // auto-login after signup
  setSession({ username: trimmed, isAdmin: false });
  return null;
}

/** Login. Returns an error string on failure, null on success. */
export function login(username: string, password: string): string | null {
  const trimmed = username.trim().toLowerCase();
  if (!trimmed || !password) return "Username and password are required.";

  // Admin check
  if (trimmed === ADMIN_USERNAME) {
    if (password !== ADMIN_PASSWORD) return "Invalid admin credentials.";
    setSession({ username: ADMIN_USERNAME, isAdmin: true });
    return null;
  }

  const users = getStoredUsers();
  const user = users.find((u) => u.username === trimmed);
  if (!user || user.password !== password) return "Incorrect username or password.";

  setSession({ username: trimmed, isAdmin: false });
  return null;
}

export function logout() {
  if (typeof window !== "undefined") {
    localStorage.removeItem(SESSION_KEY);
  }
}

export function getSession(): AuthUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

function setSession(user: AuthUser) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

/** Seeds a demo user on first load if no users exist yet. */
export function initDemoUser() {
  if (typeof window === "undefined") return;
  const users = getStoredUsers();
  if (!users.find((u) => u.username === "demouser")) {
    users.push({ username: "demouser", password: "Story@123" });
    saveStoredUsers(users);
  }
}

