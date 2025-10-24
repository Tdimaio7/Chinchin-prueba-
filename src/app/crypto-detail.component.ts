/**
 * CryptoDetailComponent
 * - Muestra información detallada de una criptomoneda y un gráfico histórico simple.
 * - Carga datos de CoinGecko vía CryptoService y renderiza un SVG con una sparkline.
 * - Efectos: consumo de API para fetchCoinById y fetchMarketChart.
 * - UX: soporte de hover sobre el gráfico que muestra tooltip con fecha/valor.
 */
import { Component, OnInit, HostListener } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CryptoService } from './services/crypto.service';

@Component({
  selector: 'app-crypto-detail',
  template: `
    <div class="card">
      <div class="title">{{coin?.name || coinId}}</div>

      <div *ngIf="coin" class="muted-sm" style="margin-bottom:8px">
        <div>Precio: {{coin.market_data?.current_price?.usd | number:'1.2-2'}} USD</div>
        <div>Volumen 24h: {{coin.market_data?.total_volume?.usd | number:'1.0-0'}}</div>
      </div>

      <div class="toolbar" style="justify-content:flex-start;margin-bottom:8px">
        <label class="muted-sm">Periodo:&nbsp;</label>
        <button class="btn secondary" (click)="setDays(1)" [class.active]="days===1">1d</button>
        <button class="btn secondary" (click)="setDays(7)" [class.active]="days===7">7d</button>
        <button class="btn secondary" (click)="setDays(30)" [class.active]="days===30">30d</button>
        <button class="btn secondary" (click)="setDays(90)" [class.active]="days===90">90d</button>
      </div>

      <div *ngIf="loading">Cargando datos...</div>

      <div *ngIf="chart">
        <div class="title" style="margin-top:8px">Gráfico (últimos {{days}} días)</div>
        <div style="position:relative">
          <svg #svg [attr.width]="svgW" [attr.height]="svgH" style="max-width:100%;display:block" (mousemove)="onMouse($event)" (mouseleave)="onLeave()" aria-hidden="false">
            <polyline [attr.points]="sparklinePoints" stroke="#0077cc" stroke-width="2" fill="none" />
            <circle *ngIf="hoverX!==null" [attr.cx]="hoverX" [attr.cy]="hoverY" r="3" fill="#0077cc"></circle>
          </svg>
          <div *ngIf="hoverLabel" style="position:absolute;left:var(--hl-left);top:8px;background:rgba(0,0,0,0.75);color:#fff;padding:6px;border-radius:6px;font-size:12px">
            {{hoverLabel}}
          </div>
        </div>
      </div>

      <div *ngIf="!chart && !loading">No hay datos disponibles.</div>
    </div>
  `
})
export class CryptoDetailComponent implements OnInit {
  public coinId = '';
  public coin: any = null;
  public chart: { prices: number[][] } | null = null;
  public days = 30;
  public loading = false;

  public svgW = 600;
  public svgH = 120;
  public hoverX: number | null = null;
  public hoverY: number | null = null;
  public hoverLabel: string | null = null;

  get sparklinePoints() {
    if (!this.chart || !this.chart.prices?.length) return '';
    const w = this.svgW, h = this.svgH;
    const vals = this.chart.prices.map((p: any[]) => p[1]);
    const min = Math.min(...vals), max = Math.max(...vals);
    const range = max - min || 1;
    return vals.map((v, i) => `${(i/(vals.length-1))*w},${h - ((v - min)/range)*h}`).join(' ');
  }

  constructor(private route: ActivatedRoute, private svc: CryptoService) {}

  ngOnInit() {
    this.coinId = this.route.snapshot.params['id'];
    if (this.coinId) this.loadAll();
  }

  setDays(d: number) {
    if (this.days === d) return;
    this.days = d;
    this.loadChart();
  }

  private loadAll() {
    this.loading = true;
    this.svc.fetchCoinById(this.coinId).subscribe(c => this.coin = c);
    this.loadChart();
  }

  private loadChart() {
    this.loading = true;
    this.chart = null;
    this.hoverLabel = null;
    this.svc.fetchMarketChart(this.coinId, this.days).subscribe(ch => {
      this.chart = ch;
      this.loading = false;
    }, _e => this.loading = false);
  }

  onMouse(evt: MouseEvent) {
    if (!this.chart || !this.chart.prices?.length) return;
    const rect = (evt.target as SVGElement).getBoundingClientRect();
    const x = evt.clientX - rect.left;
    const w = this.svgW;
    const idx = Math.round((x / w) * (this.chart.prices.length - 1));
    const val = this.chart.prices[idx];
    const vals = this.chart.prices.map((p: any[]) => p[1]);
    const min = Math.min(...vals), max = Math.max(...vals);
    const range = max - min || 1;
    const y = this.svgH - ((val[1] - min) / range) * this.svgH;
    this.hoverX = (idx / (this.chart.prices.length - 1)) * this.svgW;
    this.hoverY = y;
    this.hoverLabel = `${new Date(val[0]).toLocaleDateString()}: $${val[1].toFixed(2)}`;
    (document.documentElement as any).style.setProperty('--hl-left', `${Math.max(8, this.hoverX - 40)}px`);
  }

  onLeave() {
    this.hoverX = null; this.hoverY = null; this.hoverLabel = null;
  }
}
