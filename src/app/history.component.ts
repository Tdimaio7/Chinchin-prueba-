/**
 * HistoryComponent
 * - Muestra historial de transacciones del usuario (obtenido desde PortfolioService.history$).
 * - Alinea cantidades como numéricas para facilitar lectura y uso de tabular-nums en CSS.
 * - No modifica datos; solo presenta la lista emitida por PortfolioService.
 */
import { Component, OnInit, OnDestroy } from '@angular/core';
import { PortfolioService } from './services/portfolio.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-history',
  template: `
    <div class="card">
      <div class="title">Historial de transacciones</div>
      <table class="data-table">
        <thead>
          <tr>
            <th>Fecha / Hora</th>
            <th>Desde</th>
            <th>Hacia</th>
            <th class="numeric">Cantidad desde</th>
            <th class="numeric">Cantidad hacia</th>
            <th class="numeric">Tasa</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let t of history">
            <td>{{t.ts | date:'short'}}</td>
            <td>{{t.from | uppercase}}</td>
            <td>{{t.to | uppercase}}</td>
            <td class="numeric">{{t.amountFrom}}</td>
            <td class="numeric">{{t.amountTo | number:'1.8-8'}}</td>
            <td class="numeric">{{t.rate | number:'1.8-8'}}</td>
          </tr>
          <tr *ngIf="history.length === 0"><td colspan="6" class="muted-sm">No hay transacciones</td></tr>
        </tbody>
      </table>
    </div>
  `
})
export class HistoryComponent implements OnInit {
  history: any[] = [];
  private sub: Subscription | null = null;
  constructor(private portfolio: PortfolioService) {}

  ngOnInit() {
    this.sub = this.portfolio.history$.subscribe(h => this.history = h.slice());
  }

  ngOnDestroy() { this.sub?.unsubscribe(); }
}
