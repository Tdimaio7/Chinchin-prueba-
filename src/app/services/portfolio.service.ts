import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface Balance { symbol: string; amount: number }

/**
 * PortfolioService
 * ----------------
 * Resumen:
 * - Gestiona saldos mock del usuario y un historial de transacciones.
 * - Persiste datos por usuario en localStorage (namespaced keys usando 'app_current_user').
 * - Expone observables para que componentes puedan reaccionar a cambios en saldos/historial.
 *
 * Contrato:
 * - Entrada: métodos públicos como executeSwap(), setBalances(), getBalances().
 * - Salida: actualizaciones emitidas por balances$ y history$ (BehaviorSubject).
 *
 * Consideraciones de seguridad y robustez:
 * - Manejo tolerante a fallos de localStorage (try/catch alrededor de accesos).
 * - No expone directamente la manipulación de claves; nombres base versionados.
 * - Los importes están redondeados a 8 decimales para evitar drift de punto flotante.
 */

@Injectable({ providedIn: 'root' })
export class PortfolioService {
  private STORAGE_KEY_BASE = 'portfolio_balances_v1';
  private HISTORY_KEY_BASE = 'portfolio_history_v1';

  private defaultBalances: Balance[] = [
    { symbol: 'btc', amount: 0.1234 },
    { symbol: 'eth', amount: 1.5 },
    { symbol: 'usdt', amount: 200 }
  ];

  private balances: Balance[] = this.loadBalances();
  private balancesSubject = new BehaviorSubject<Balance[]>(this.balances);
  public balances$ = this.balancesSubject.asObservable();

  private historySubject = new BehaviorSubject<any[]>(this.loadHistory());
  public history$ = this.historySubject.asObservable();

  constructor() {}

  private getUserKey(base: string) {
    try {
      const u = sessionStorage.getItem('app_current_user');
      return u ? `${base}_${u}` : `${base}_anon`;
    } catch {
      return `${base}_anon`;
    }
  }

  private loadHistory(): any[] {
    try {
      const key = this.getUserKey(this.HISTORY_KEY_BASE);
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  getHistory(): any[] { return this.historySubject.getValue(); }

  pushHistory(entry: any) {
    const h = this.getHistory();
    h.unshift(entry);
    try { localStorage.setItem(this.getUserKey(this.HISTORY_KEY_BASE), JSON.stringify(h)); } catch {}
    try { this.historySubject.next(h.slice()); } catch {}
  }

  private loadBalances(): Balance[] {
    try {
      const raw = localStorage.getItem(this.getUserKey(this.STORAGE_KEY_BASE));
      if (!raw) return this.defaultBalances.slice();
      const parsed = JSON.parse(raw) as Balance[];
      const merged = this.defaultBalances.slice();
      for (const p of parsed) {
        const idx = merged.findIndex(m => m.symbol === p.symbol);
        if (idx >= 0) merged[idx].amount = p.amount; else merged.push(p);
      }
      return merged;
    } catch {
      return this.defaultBalances.slice();
    }
  }

  private saveBalances() {
    try { localStorage.setItem(this.getUserKey(this.STORAGE_KEY_BASE), JSON.stringify(this.balances)); } catch {}
    try { this.balancesSubject.next(this.balances.slice()); } catch {}
  }

  getBalances(): Balance[] { return this.balances; }
  setBalances(bal: Balance[]) { this.balances = bal; this.saveBalances(); }

  /*
   * executeSwap
   * - Simula un intercambio: debita 'symbolFrom' y acredita 'symbolTo' según la tasa.
   * - Emite cambios y registra la transacción en el historial.
   * Errores: lanza si saldo origen no existe o es insuficiente.
   */
  executeSwap(symbolFrom: string, symbolTo: string, amountFrom: number, rate: number) {
    const from = this.balances.find(b => b.symbol === symbolFrom);
    const to = this.balances.find(b => b.symbol === symbolTo);
    if (!from) throw new Error('Saldo origen no encontrado');
    if (from.amount < amountFrom) throw new Error('Saldo insuficiente');

    const amountTo = amountFrom * rate;
    from.amount = +(from.amount - amountFrom).toFixed(8);
    if (to) to.amount = +(to.amount + amountTo).toFixed(8);
    else this.balances.push({ symbol: symbolTo, amount: +amountTo.toFixed(8) });

    this.saveBalances();

    this.pushHistory({
      id: 'tx_' + Date.now(),
      ts: Date.now(),
      from: symbolFrom,
      to: symbolTo,
      amountFrom: amountFrom,
      amountTo: amountTo,
      rate
    });

    try { this.balancesSubject.next(this.balances.slice()); } catch {}
  }
}
