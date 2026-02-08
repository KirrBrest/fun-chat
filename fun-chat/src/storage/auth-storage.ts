import {
  STORAGE_KEY_CURRENT_USER,
  STORAGE_KEY_SESSION_PASSWORD,
} from '../constants';

export function getCurrentUser(): string | null {
  return globalThis.localStorage.getItem(STORAGE_KEY_CURRENT_USER);
}

export function setCurrentUser(userName: string): void {
  globalThis.localStorage.setItem(STORAGE_KEY_CURRENT_USER, userName);
}

export function clearCurrentUser(): void {
  globalThis.localStorage.removeItem(STORAGE_KEY_CURRENT_USER);
}

function getSessionPasswordKey(): string {
  return String(STORAGE_KEY_SESSION_PASSWORD);
}

export function setSessionPassword(password: string): void {
  globalThis.sessionStorage.setItem(getSessionPasswordKey(), String(password));
}

export function getSessionPassword(): string | null {
  return globalThis.sessionStorage.getItem(getSessionPasswordKey());
}

export function clearSessionPassword(): void {
  globalThis.sessionStorage.removeItem(getSessionPasswordKey());
}
