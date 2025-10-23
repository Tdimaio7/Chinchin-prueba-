import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CryptoService } from './services/crypto.service';

@Component({
  selector: 'app-crypto-detail',
  template: `
    <div class="card">
      <div class="title">{{coin?.name || coinId}}</div>
      <div *ngIf="coin">
        <div>Precio: {{coin.market_data?.current_price?.usd | number:'1.2-2'}} USD</div>
        <div>Volumen 24h: {{coin.market_data?.total_volume?.usd | number:'1.0-0'}}</div>
      </div>

      <div *ngIf="chart">
        <div class="title" style="margin-top:8px">Gráfico (últimos {{days}} días)</div>
        <svg [attr.width]="600" [attr.height]="120" style="max-width:100%" aria-hidden="true">
          <polyline [attr.points]="sparklinePoints" stroke="#0077cc" stroke-width="2" fill="none" />
        </svg>
      </div>
      <div *ngIf="!chart && !coin">No hay datos disponibles.</div>
    </div>
  `
})
export class CryptoDetailComponent implements OnInit {
  public coinId = '';
  public coin: any = null;
  public chart: { prices: number[][] } | null = null;
  public days = 30;

  get sparklinePoints() {
    if (!this.chart || !this.chart.prices?.length) return '';
    const w = 600, h = 120;
    const vals = this.chart.prices.map((p: any[]) => p[1]);
    const min = Math.min(...vals), max = Math.max(...vals);
    const range = max - min || 1;
    return vals.map((v, i) => `${(i/(vals.length-1))*w},${h - ((v - min)/range)*h}`).join(' ');
  }

  constructor(private route: ActivatedRoute, private svc: CryptoService) {}

  ngOnInit() {
    this.coinId = this.route.snapshot.params['id'];
    if (this.coinId) {
      this.svc.fetchCoinById(this.coinId).subscribe(c => this.coin = c);
      this.svc.fetchMarketChart(this.coinId, this.days).subscribe(ch => this.chart = ch);
    }
  }
}
