import { Component } from '@angular/core';

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
        <div class="subtitle">$ 12,345.67</div>
      </div>
    </div>

    <div class="grid" style="margin-top:16px">
      <div class="card">
        <div class="title">Mercado</div>
        <p class="muted">Listado con actualización cada 30s, filtros y ordenamiento.</p>
      </div>
      <div class="card">
        <div class="title">Actividad reciente</div>
        <p class="muted">Transacciones simuladas y movimientos.</p>
      </div>
    </div>
  `
})
export class HomeComponent {}
