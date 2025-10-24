/**
 * SettingsComponent
 * - Interfaz para que el usuario ajuste preferencias locales (mostrar saldos, intervalo de refresco, actividad reciente).
 * - Persiste cambios a través de SettingsService (namespaced por usuario).
 * - UI-pass-through: no realiza lógica compleja, delega en service.
 */
import { Component } from '@angular/core';
import { SettingsService, UserSettings } from './services/settings.service';

@Component({
  selector: 'app-settings',
  template: `
    <div class="card">
      <div class="title">Configuración</div>
      <div style="display:flex;flex-direction:column;gap:12px;padding-top:12px">
        <label><input type="checkbox" [(ngModel)]="settings.showBalances" (change)="save()"/> Mostrar panel de saldos</label>
        <label>
          Intervalo de refresco del mercado
          <select class="select-pill" [(ngModel)]="settings.refreshInterval" (change)="save()">
            <option [ngValue]="0">Desactivado</option>
            <option [ngValue]="15">15 segundos</option>
            <option [ngValue]="30">30 segundos</option>
            <option [ngValue]="60">60 segundos</option>
          </select>
        </label>
        <label><input type="checkbox" [(ngModel)]="settings.showRecentActivity" (change)="save()"/> Mostrar actividad reciente en inicio</label>
      </div>
    </div>
  `
})
export class SettingsComponent {
  settings: UserSettings;
  constructor(private svc: SettingsService) { this.settings = this.svc.getValue(); }
  save() { this.svc.save(this.settings); }
}
