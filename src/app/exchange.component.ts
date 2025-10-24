/**
 * ExchangeComponent
 * - Interfaz de intercambio entre dos criptomonedas.
 * - Permite seleccionar par, introducir cantidad origen y calcular cantidad destino según la tasa actual.
 * - Implementa TTL para la tasa (15s) y requiere tasa válida para ejecutar el intercambio.
 *
 * API pública / efectos:
 * - execute(): ejecuta el swap usando PortfolioService.
 * - refreshRateNow(): recalcula tasa desde CryptoService.
 *
 * Seguridad / UX:
 * - Verifica saldo suficiente antes de ejecutar.
 * - Muestra mensajes de error/estado en UI.
 */
import { Component, OnInit } from '@angular/core';
import { CryptoService, CryptoItem } from './services/crypto.service';
import { PortfolioService } from './services/portfolio.service';

@Component({
  selector: 'app-exchange',
  template: `
    <div class="exchange-card">
      <h2>Intercambio</h2>

      <div class="fields-grid">
        <div class="field-col">
          <div class="field-card">
            <label>Desde</label>
            <select [(ngModel)]="fromId" (change)="onSelectionChange()">
              <option *ngFor="let c of market" [value]="c.id">{{c.name}} ({{c.symbol}})</option>
            </select>
            <div class="small muted-sm">Saldo: {{getBalance(fromSymbol) || 0}}</div>
          </div>

          <div class="field-card">
            <label>Cantidad ({{fromSymbol}})</label>
            <input type="number" [(ngModel)]="amountFrom" (input)="recalc()" min="0" />
            <div *ngIf="amountFrom > getBalance(fromSymbol)" class="error">Saldo insuficiente: tienes {{getBalance(fromSymbol) | number:'1.8-8'}} {{fromSymbol}}, intentas cambiar {{amountFrom}}</div>
          </div>
        </div>

        <div class="field-col">
          <div class="field-card">
            <label>Hacia</label>
            <select [(ngModel)]="toId" (change)="onSelectionChange()">
              <option *ngFor="let c of market" [value]="c.id">{{c.name}} ({{c.symbol}})</option>
            </select>
            <div class="small muted-sm">Saldo: {{getBalance(toSymbol) || 0}}</div>
          </div>

          <div class="field-card">
            <label>Recibir estimado ({{toSymbol}})</label>
            <input type="text" [value]="amountTo | number:'1.8-8'" readonly />
          </div>
        </div>
      </div>

      <div class="rate">
        <div class="rate-left">
          <div class="rate-label">Tasa actual</div>
          <div class="rate-value">
            <strong>{{rate | number:'1.8-8'}}</strong>
            <span class="pair">({{toSymbol}} por 1 {{fromSymbol}})</span>
          </div>
        </div>

        <div class="rate-right">
          <div *ngIf="rateValid" class="rate-ttl muted-sm">Válida: <span class="ttl">{{ (rateCountdown/1000) | number:'1.0-0' }}s</span></div>
          <div *ngIf="!rateValid" class="rate-expired muted-sm">Tasa expirada</div>
          <button class="btn small" (click)="refreshRateNow()" title="Actualizar tasa ahora">Actualizar</button>
        </div>
      </div>

      <div class="actions">
        <button class="btn primary" (click)="execute()" [disabled]="!canExecute()">Ejecutar intercambio</button>
      </div>

      <div *ngIf="message" class="message">{{message}}</div>
    </div>
  `,
  styles: [
    `
    .exchange-card { max-width:920px; margin:0 auto; padding:20px; border-radius:12px; background:var(--card-bg); box-shadow:var(--shadow-1); }
    h2 { margin:0 0 14px 0 }
    .fields-grid { display:flex; gap:18px; }
    .field-col { flex:1; display:flex; flex-direction:column; gap:12px }
    .field-card { padding:14px; border-radius:10px; background:linear-gradient(180deg,#fbfeff,#ffffff); border:1px solid #eef6fb; box-shadow:0 6px 18px rgba(8,30,50,0.03) }
    .field-card label{display:block;font-size:13px;color:#044;margin-bottom:8px}
    .field-card select, .field-card input[type="number"], .field-card input[type="text"]{width:100%;padding:10px 12px;border-radius:8px;border:1px solid #e6f0fb;background:#fff;font-size:14px}
  .small { color:#666; font-size:12px }
  .muted-sm{color:#8aa0b2;font-size:13px}
    .field-card select, .field-card input[type="number"], .field-card input[type="text"]{width:100%;padding:10px 12px;border-radius:8px;border:1px solid #e6f0fb;background:#fff;font-size:14px}
    .small { color:#666; font-size:12px }
    .muted-sm{color:#8aa0b2;font-size:13px}
    .rate{margin-top:14px;display:flex;justify-content:space-between;align-items:center}
    .rate-label{font-size:12px;color:#666}
    .rate-value{font-size:16px}
    .pair{font-size:12px;color:#666;margin-left:6px}
    .rate-right{display:flex;gap:8px;align-items:center}
    .btn.small{padding:6px 10px;font-size:13px;border-radius:8px}
    .btn.primary{background:linear-gradient(180deg,var(--primary-600),var(--primary-500));color:#fff;border:none;padding:10px 16px;border-radius:10px}
    .actions{margin-top:16px}
    .message{margin-top:12px;color:green}
    .error{color:#c00;font-size:13px;margin-top:6px}
    @media (max-width:800px){ .fields-grid{flex-direction:column} }
    `
  ]
})
export class ExchangeComponent implements OnInit {
  market: CryptoItem[] = [];
  fromId = 'bitcoin';
  toId = 'ethereum';
  amountFrom = 0;
  amountTo = 0;
  rate = 0;
  message = '';

  balancesMap: Record<string, number> = {};
  private rateTTL = 15_000;
  rateExpiresAt: number | null = null;
  rateValid = false;
  rateCountdown = 0;
  private rateTimer: any = null;

  constructor(private crypto: CryptoService, private portfolio: PortfolioService) {}

  ngOnInit() {
    this.crypto.fetchMarket().subscribe(list => {
      this.market = list;
      if (!this.market.find(m => m.id === this.fromId) && this.market.length) this.fromId = this.market[0].id;
      if (!this.market.find(m => m.id === this.toId) && this.market.length > 1) this.toId = this.market[1].id;
      this.refreshBalances();
      this.onSelectionChange();
    });
  }

  get fromSymbol() { return this.market.find(m => m.id === this.fromId)?.symbol || '' }
  get toSymbol() { return this.market.find(m => m.id === this.toId)?.symbol || '' }

  getBalance(symbol: string) {
    if (!symbol) return 0;
    return this.balancesMap[symbol] || 0;
  }

  private refreshBalances() {
    this.balancesMap = {};
    const list = this.portfolio.getBalances();
    for (const b of list) this.balancesMap[b.symbol] = b.amount;
  }

  onSelectionChange() {
    const from = this.market.find(m => m.id === this.fromId);
    const to = this.market.find(m => m.id === this.toId);
    if (from && to) {
      this.rate = from.current_price / to.current_price;
      this.recalc();
      this.setRateWithTTL();
    }
  }

  recalc() {
    this.amountTo = +((this.amountFrom || 0) * (this.rate || 0)).toFixed(8);
  }

  canExecute() {
    if (!this.fromId || !this.toId) return false;
    if (this.fromId === this.toId) return false;
    if (!this.amountFrom || this.amountFrom <= 0) return false;
    if (!this.rateValid) return false;
    const bal = this.getBalance(this.fromSymbol);
    return bal >= this.amountFrom;
  }

  execute() {
    try {
      if (!this.canExecute()) {
        if (!this.rateValid) { this.message = 'La tasa ha expirado. Actualiza la tasa antes de ejecutar.'; return; }
        const bal = this.getBalance(this.fromSymbol);
        if (bal <= 0) { this.message = 'Saldo insuficiente: no tienes ' + this.fromSymbol; }
        else { this.message = 'Saldo insuficiente: tienes ' + bal + ' ' + this.fromSymbol + ', intentas cambiar ' + this.amountFrom; }
        return;
      }

      this.portfolio.executeSwap(this.fromSymbol, this.toSymbol, this.amountFrom, this.rate);
      this.message = 'Intercambio ejecutado: ' + this.amountFrom + ' ' + this.fromSymbol + ' -> ' + this.amountTo + ' ' + this.toSymbol;
      this.amountFrom = 0;
      this.recalc();
      this.refreshBalances();
    } catch (err: any) {
      this.message = err?.message || 'Error al ejecutar';
    }
    setTimeout(() => this.message = '', 5000);
  }

  private clearRateTimer() {
    if (this.rateTimer) { clearInterval(this.rateTimer); this.rateTimer = null; }
  }

  private setRateWithTTL() {
    this.rateExpiresAt = Date.now() + this.rateTTL;
    this.rateValid = true;
    this.updateCountdown();
    this.clearRateTimer();
    this.rateTimer = setInterval(() => this.updateCountdown(), 500);
  }

  private updateCountdown() {
    if (!this.rateExpiresAt) { this.rateCountdown = 0; this.rateValid = false; return; }
    const rem = this.rateExpiresAt - Date.now();
    if (rem <= 0) {
      this.rateCountdown = 0;
      this.rateValid = false;
      this.clearRateTimer();
    } else {
      this.rateCountdown = rem;
      this.rateValid = true;
    }
  }

  refreshRateNow() {
    this.crypto.fetchMarket().subscribe(list => {
      this.market = list;
      const from = this.market.find(m => m.id === this.fromId);
      const to = this.market.find(m => m.id === this.toId);
      if (from && to) {
        this.rate = from.current_price / to.current_price;
        this.recalc();
        this.setRateWithTTL();
      }
    });
  }
  }
