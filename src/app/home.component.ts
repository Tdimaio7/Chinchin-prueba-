import { Component } from '@angular/core';
import { PortfolioService } from './services/portfolio.service';
import { CryptoService } from './services/crypto.service';
import { Router } from '@angular/router';

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
        <p class="muted">Listado con actualización cada 30s, filtros y ordenamiento. Haz click para abrir mercado.</p>
      </div>
      <div class="card">
        <div class="title">Actividad reciente</div>
        <p class="muted">Transacciones simuladas y movimientos.</p>
      </div>
    </div>
  `
})
export class HomeComponent {
  public totalUSD = 0;
  constructor(private portfolio: PortfolioService, private crypto: CryptoService, private router: Router) {}

  ngOnInit() {
    this.calculateTotal();
  }

  async calculateTotal() {
    const balances = this.portfolio.getBalances();
    // cargar mercado y calcular valor
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
