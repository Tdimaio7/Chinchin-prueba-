import { Injectable } from '@angular/core';

/**
 * AuthService (demo)
 * ------------------
 * Responsabilidades:
 * - Registro y login de usuarios en modo demo (almacenamiento en sessionStorage).
 * - Derivación de clave (PBKDF2) y cifrado de tokens con Web Crypto API (AES-GCM).
 * - Gestión de tokens "mock" (no JWT real): se cifran y almacenan como prueba de sesión.
 *
 * Contrato / API pública:
 * - register(email,password): Promise<boolean>
 * - login(email,password): Promise<string> -> devuelve token (encriptado en session)
 * - logout(): void
 * - isAuthenticated(): boolean
 * - getToken()/decryptTokenFromSession(): gestión del token en memoria
 * - createMagicToken/verifyMagicToken: flujo de token mágico para login sin contraseña
 *
 * Seguridad & límites:
 * - Este servicio está pensado para demo/local: no es un sistema de autenticación seguro en producción.
 * - Las claves y tokens se guardan en sessionStorage y la clave de sesión se mantiene en memoria.
 * - Operaciones criptográficas usan Web Crypto (PBKDF2 y AES-GCM) con iteraciones elevadas.
 */

export interface StoredUser { email: string; salt: string; hash: string }

@Injectable({ providedIn: 'root' })
export class AuthService {
  private USER_KEY = 'app_user';
  private TOKEN_KEY = 'app_token_enc';
  private USERS_KEY = 'app_users';
  private sessionKey: CryptoKey | null = null;
  private tokenValue: string | null = null;

  constructor() {}

  private getUsersMap(): Record<string, StoredUser> {
    const raw = sessionStorage.getItem(this.USERS_KEY);
    if (raw) {
      try { return JSON.parse(raw) as Record<string, StoredUser>; } catch { }
    }
    const legacy = sessionStorage.getItem(this.USER_KEY);
    if (legacy) {
      try {
        const u: StoredUser = JSON.parse(legacy);
        const map: Record<string, StoredUser> = {};
        if (u && u.email) map[u.email] = u;
        sessionStorage.setItem(this.USERS_KEY, JSON.stringify(map));
        sessionStorage.removeItem(this.USER_KEY);
        return map;
      } catch { }
    }
    return {};
  }

  private setUsersMap(map: Record<string, StoredUser>) { sessionStorage.setItem(this.USERS_KEY, JSON.stringify(map)); }

  private async generateSalt() { const salt = crypto.getRandomValues(new Uint8Array(16)); return this.toBase64(salt); }

  private async deriveKey(password: string, saltB64: string) {
    const salt = this.fromBase64(saltB64);
    const enc = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey('raw', enc.encode(password), { name: 'PBKDF2' }, false, ['deriveBits']);
    const derived = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations: 100_000, hash: 'SHA-256' }, keyMaterial, 256);
    return new Uint8Array(derived);
  }

  private toBase64(buf: Uint8Array) {
    let binary = '';
    const len = buf.byteLength;
    for (let i = 0; i < len; i++) binary += String.fromCharCode(buf[i]);
    return btoa(binary);
  }

  private fromBase64(b64: string) {
    const binary = atob(b64);
    const len = binary.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
  }

  async register(email: string, password: string) {
    const users = this.getUsersMap();
    if (users[email]) throw new Error('El correo ya se utilizó');
    const salt = await this.generateSalt();
    const hash = this.toBase64(await this.deriveKey(password, salt));
    const user: StoredUser = { email, salt, hash };
    users[email] = user;
    this.setUsersMap(users);
    return true;
  }

  async login(email: string, password: string) {
    const users = this.getUsersMap();
    const user = users[email];
    if (!user) throw new Error('No existe un usuario registrado con ese correo');
    const derived = this.toBase64(await this.deriveKey(password, user.salt));
    if (derived !== user.hash) throw new Error('Correo o contraseña incorrectos');

    const tokenPayload = { sub: email, iat: Date.now() };
    const token = btoa(JSON.stringify(tokenPayload));
    const derivedRaw = await this.deriveKey(password, user.salt);
    this.sessionKey = await crypto.subtle.importKey('raw', derivedRaw, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);

    const iv = crypto.getRandomValues(new Uint8Array(12));
    const enc = new TextEncoder();
    const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, this.sessionKey, enc.encode(token));
    const ctB64 = this.toBase64(new Uint8Array(ct));
    const ivB64 = this.toBase64(iv);
    sessionStorage.setItem(this.TOKEN_KEY, JSON.stringify({ iv: ivB64, ct: ctB64 }));

    this.tokenValue = token;
    try { sessionStorage.setItem('app_current_user', email); } catch {}
    return token;
  }

  logout() { sessionStorage.removeItem(this.TOKEN_KEY); sessionStorage.removeItem('magic_tokens'); this.sessionKey = null; this.tokenValue = null; try { sessionStorage.removeItem('app_current_user'); } catch {} }

  isAuthenticated(): boolean { if (this.tokenValue) return true; const raw = sessionStorage.getItem(this.TOKEN_KEY); return !!raw; }

  getToken(): string | null { if (this.tokenValue) return this.tokenValue; const raw = sessionStorage.getItem(this.TOKEN_KEY); if (!raw) return null; return 'session-token-present'; }

  async decryptTokenFromSession(): Promise<string | null> {
    const raw = sessionStorage.getItem(this.TOKEN_KEY);
    if (!raw || !this.sessionKey) return null;
    try {
      const obj = JSON.parse(raw);
      const iv = this.fromBase64(obj.iv);
      const ct = this.fromBase64(obj.ct);
      const dec = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, this.sessionKey, ct);
      const decStr = new TextDecoder().decode(dec);
      this.tokenValue = decStr;
      return decStr;
    } catch (err) {
      return null;
    }
  }

  async createMagicToken(email: string, ttlMs = 10 * 60_000) {
    const users = this.getUsersMap();
    const user = users[email];
    if (!user) throw new Error('Email no registrado');
    const rand = crypto.getRandomValues(new Uint8Array(12));
    const token = this.toBase64(rand) + '.' + Date.now();
    const storeRaw = sessionStorage.getItem('magic_tokens');
    const map = storeRaw ? JSON.parse(storeRaw) : {};
    map[token] = { email, exp: Date.now() + ttlMs };
    sessionStorage.setItem('magic_tokens', JSON.stringify(map));
    return token;
  }

  async verifyMagicToken(token: string) {
    const storeRaw = sessionStorage.getItem('magic_tokens');
    if (!storeRaw) throw new Error('Token inválido o expirado');
    const map = JSON.parse(storeRaw || '{}');
    const meta = map[token];
    if (!meta) throw new Error('Token inválido');
    if (meta.exp < Date.now()) { delete map[token]; sessionStorage.setItem('magic_tokens', JSON.stringify(map)); throw new Error('Token expirado'); }

    const email = meta.email; delete map[token]; sessionStorage.setItem('magic_tokens', JSON.stringify(map));
    const tokenPayload = { sub: email, iat: Date.now(), via: 'magic' };
    const sessToken = btoa(JSON.stringify(tokenPayload));

    const sessionKey = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
    const raw = new Uint8Array(await crypto.subtle.exportKey('raw', sessionKey));
    this.sessionKey = await crypto.subtle.importKey('raw', raw, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);

    const iv = crypto.getRandomValues(new Uint8Array(12));
    const enc = new TextEncoder();
    const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, this.sessionKey, enc.encode(sessToken));
    const ctB64 = this.toBase64(new Uint8Array(ct));
    const ivB64 = this.toBase64(iv);
    sessionStorage.setItem(this.TOKEN_KEY, JSON.stringify({ iv: ivB64, ct: ctB64 }));
    this.tokenValue = sessToken;
    try { sessionStorage.setItem('app_current_user', email); } catch {}
    return sessToken;
  }
}
