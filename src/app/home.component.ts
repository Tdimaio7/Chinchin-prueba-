/**
 * HomeComponent
 * - Panel principal (dashboard) que resume saldo total y actividad reciente.
 * - Escucha balances$ y history$ para mostrar información en tiempo real.
 * - Navegación: enlaza a mercado e historial.
 */
import { Component, OnDestroy, OnInit } from '@angular/core';
import { PortfolioService } from './services/portfolio.service';
import { CryptoService } from './services/crypto.service';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { SettingsService } from './services/settings.service';

@Component({
  selector: 'app-home',
  template: `
    <div class="hero">
      <div class="hero-left">
        <h1>Panel de control</h1>
        <p class="muted">Resumen de tus activos y últimas operaciones. Diseño seguro y claro para uso corporativo.</p>
      </div>
      <div class="card">
        <div class="title">Saldo total</div>
        <div class="subtitle">$ {{totalUSD | number:'1.2-2'}}</div>
      </div>
    </div>

    <div class="grid" style="margin-top:16px">
      <div class="card" (click)="goMarket()" style="cursor:pointer">
        <div class="title">Mercado</div>
        <p class="muted">Listado con actualización periódica, filtros y ordenamiento. Haz click para abrir mercado.</p>
      </div>

      <div class="card" role="button" tabindex="0" (click)="goHistory()" (keydown.enter)="goHistory()" style="cursor:pointer">
        <div class="title">Actividad reciente</div>
        <div *ngIf="showRecent">
          <div *ngIf="recent.length > 0">
            <ul style="margin:0;padding:0;list-style:none">
              <li *ngFor="let r of recent" style="padding:8px 0;border-bottom:1px solid #f0f6fb">
                <div><strong>{{r.amountFrom | number:'1.4-8'}} {{r.from | uppercase}}</strong> → <strong>{{r.amountTo | number:'1.4-8'}} {{r.to | uppercase}}</strong></div>
                <div class="muted-sm">{{r.ts | date:'short'}}</div>
              </li>
            </ul>
            <div style="margin-top:8px" class="muted-sm">Haz click en el cuadro para ver el historial completo</div>
          </div>
          <div *ngIf="recent.length === 0" class="muted-sm">No hay actividad reciente</div>
        </div>
        <div *ngIf="!showRecent" class="muted-sm">La sección de actividad reciente está oculta (ajustes).</div>
      </div>
    </div>
  `
})
export class HomeComponent {
  public totalUSD = 0;
  private sub: Subscription | null = null;
  private historySub: Subscription | null = null;
  private settingsSub: Subscription | null = null;
  public recent: any[] = [];
  public showRecent = true;

  constructor(private portfolio: PortfolioService, private crypto: CryptoService, private router: Router, private settings: SettingsService) {}

  ngOnInit() {
    this.sub = this.portfolio.balances$.subscribe(() => this.calculateTotal());
    this.historySub = this.portfolio.history$.subscribe(h => { this.recent = (h || []).slice(0,5); });
    this.showRecent = this.settings.getValue().showRecentActivity;
    this.settingsSub = this.settings.settings$.subscribe(s => this.showRecent = s.showRecentActivity);
    this.calculateTotal();
  }

  ngOnDestroy() { this.sub?.unsubscribe(); this.historySub?.unsubscribe(); this.settingsSub?.unsubscribe(); }

  goHistory() { this.router.navigate(['/history']); }

  async calculateTotal() {
    const balances = this.portfolio.getBalances();
    this.crypto.fetchMarket().subscribe(list => {
      let sum = 0;
      for (const b of balances) {
        const price = list.find(i => i.symbol.toLowerCase() === b.symbol.toLowerCase())?.current_price || 0;
        sum += (b.amount * price);
      }
      this.totalUSD = sum;
    });
  }

  goMarket() { this.router.navigate(['/market']); }
}
