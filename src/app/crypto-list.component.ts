import { Component, OnDestroy, OnInit } from '@angular/core';
import { CryptoService, CryptoItem } from './services/crypto.service';
import { interval, Subscription } from 'rxjs';

interface Balance { symbol: string; amount: number }

@Component({
  selector: 'app-crypto-list',
  template: `
    <div class="card">
      <div class="header-row" style="display:flex;justify-content:space-between;align-items:center;gap:12px">
        <div>
          <div class="title">Mercado</div>
          <div class="muted-sm">Actualiza cada 30s.</div>
        </div>

        <div class="toolbar">
          <div class="search-wrap">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M21 21l-4.35-4.35" stroke="#0b72ff" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/><circle cx="11" cy="11" r="6" stroke="#0b72ff" stroke-width="1.6"/></svg>
            <input class="search-input" placeholder="Buscar por nombre o símbolo" [(ngModel)]="filter" />
          </div>
        </div>
      </div>

      <div class="filters-row" style="display:flex;gap:12px;align-items:center;margin-top:12px">
        <div class="filter-group">
          <label class="muted-sm">Precio (USD)</label>
          <input class="small-input" type="number" placeholder="min" [(ngModel)]="priceMin" />
          <input class="small-input" type="number" placeholder="max" [(ngModel)]="priceMax" />
        </div>

        <div class="filter-group">
          <label class="muted-sm">Cambio % 24h</label>
          <input class="small-input" type="number" placeholder="min" [(ngModel)]="changeMin" />
          <input class="small-input" type="number" placeholder="max" [(ngModel)]="changeMax" />
        </div>

        <div style="margin-left:auto">
          <button class="btn secondary" (click)="resetFilters()">Reset filtros</button>
        </div>
      </div>

      <div class="layout" style="display:flex;gap:18px;margin-top:18px;align-items:flex-start">
        <div style="flex:2">
          <table class="data-table">
            <thead>
              <tr>
                <th (click)="sortBy('name')">Nombre</th>
                <th (click)="sortBy('symbol')">Símbolo</th>
                <th (click)="sortBy('current_price')">Precio (USD)</th>
                <th (click)="sortBy('price_change_percentage_24h')">Cambio 24h %</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let c of filteredList()">
                <td>
                  <div class="coin-cell">
                    <a [routerLink]="['/market', c.id]" class="coin-link">{{c.name}}</a>
                  </div>
                </td>
                <td class="hide-mobile">{{c.symbol | uppercase}}</td>
                <td>{{c.current_price | number:'1.2-2'}}</td>
                <td>
                  <span [ngClass]="{'badge-up': (c.price_change_percentage_24h || 0) >= 0, 'badge-down': (c.price_change_percentage_24h || 0) < 0}">
                    {{c.price_change_percentage_24h | number:'1.2-2'}}%
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div style="flex:1">
          <div class="balances-panel card">
            <div class="title">Saldos</div>
            <table class="data-table">
              <thead><tr><th>Cripto</th><th>Cantidad</th><th>Valor USD</th></tr></thead>
              <tbody>
                <tr *ngFor="let b of balances">
                  <td>{{b.symbol | uppercase}}</td>
                  <td>{{b.amount}}</td>
                  <td>{{balanceValue(b.symbol) | number:'1.2-2'}}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `
})
export class CryptoListComponent implements OnInit, OnDestroy {
  public list: CryptoItem[] = [];
  public filter = '';
  public sortField: keyof CryptoItem | null = null;
  public sortDir: 1 | -1 = 1;
  private sub: Subscription | null = null;
  public priceMin: number | null = null;
  public priceMax: number | null = null;
  public changeMin: number | null = null;
  public changeMax: number | null = null;

  // Saldos mock del usuario
  public balances: Balance[] = [
    { symbol: 'btc', amount: 0.1234 },
    { symbol: 'eth', amount: 1.5 },
    { symbol: 'usdt', amount: 200 }
  ];

  constructor(private svc: CryptoService) {}

  resetFilters() {
    this.filter = '';
    this.priceMin = null;
    this.priceMax = null;
    this.changeMin = null;
    this.changeMax = null;
  }

  ngOnInit() {
    this.load();
    this.sub = interval(30_000).subscribe(() => this.load());
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }

  load() {
    this.svc.fetchMarket().subscribe(list => this.list = list);
  }

  filteredList() {
    let out = this.list.filter(i => i.name.toLowerCase().includes(this.filter.toLowerCase()) || i.symbol.toLowerCase().includes(this.filter.toLowerCase()));
    if (this.priceMin !== null) out = out.filter(i => i.current_price >= (this.priceMin || 0));
    if (this.priceMax !== null) out = out.filter(i => i.current_price <= (this.priceMax || Infinity));
    if (this.changeMin !== null) out = out.filter(i => (i.price_change_percentage_24h || 0) >= (this.changeMin || 0));
    if (this.changeMax !== null) out = out.filter(i => (i.price_change_percentage_24h || 0) <= (this.changeMax || Infinity));
    if (this.sortField) {
      out = out.sort((a, b) => (a[this.sortField!] as any) > (b[this.sortField!] as any) ? this.sortDir : -this.sortDir);
    }
    return out;
  }

  sortBy(field: keyof CryptoItem) {
    if (this.sortField === field) this.sortDir = this.sortDir === 1 ? -1 : 1;
    else { this.sortField = field; this.sortDir = 1; }
  }

  getBalance(symbol: string) {
    const b = this.balances.find(x => x.symbol.toLowerCase() === symbol.toLowerCase());
    return b ? (b.amount) : 0;
  }

  balanceValue(symbol: string) {
    const bal = this.balances.find(x => x.symbol.toLowerCase() === symbol.toLowerCase());
    const price = this.list.find(l => l.symbol.toLowerCase() === symbol.toLowerCase())?.current_price || 0;
    return (bal ? bal.amount : 0) * price;
  }
}
