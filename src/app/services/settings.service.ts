import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

/**
 * SettingsService
 * - Gestiona preferencias por usuario (persistidas en localStorage).
 * - Emite cambios vía un BehaviorSubject para que la UI se actualice automáticamente.
 *
 * Contrato:
 * - refreshInterval: número en segundos (0 = desactivado).
 * - showBalances: mostrar panel de saldos.
 * - showRecentActivity: mostrar sección de actividad reciente en inicio.
 *
 * Robustez:
 * - Carga con valores por defecto si no hay configuración guardada o si el parse falla.
 */

export interface UserSettings { showBalances: boolean; refreshInterval: number; showRecentActivity: boolean }

@Injectable({ providedIn: 'root' })
export class SettingsService {
  private BASE_KEY = 'app_settings_v1';
  private subj = new BehaviorSubject<UserSettings>(this.load());
  public settings$ = this.subj.asObservable();

  private getUserKey() {
    try { const u = sessionStorage.getItem('app_current_user'); return u ? `${this.BASE_KEY}_${u}` : `${this.BASE_KEY}_anon`; } catch { return `${this.BASE_KEY}_anon`; }
  }

  private load(): UserSettings {
    try {
      const raw = localStorage.getItem(this.getUserKey());
      if (!raw) return { showBalances: true, refreshInterval: 30, showRecentActivity: true };
      const parsed = JSON.parse(raw) as UserSettings;
      if (parsed.showRecentActivity === undefined) parsed.showRecentActivity = true;
      if (parsed.refreshInterval === undefined) parsed.refreshInterval = 30;
      return parsed;
    } catch {
      return { showBalances: true, refreshInterval: 30, showRecentActivity: true };
    }
  }

  save(s: UserSettings) { try { localStorage.setItem(this.getUserKey(), JSON.stringify(s)); } catch {} this.subj.next(s); }
  getValue(): UserSettings { return this.subj.getValue(); }
}
