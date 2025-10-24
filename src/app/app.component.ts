/**
 * AppComponent
 * - Contenedor principal de la aplicación y barra superior (header).
 * - Muestra enlaces de navegación condicionales según el estado de autenticación.
 * - Efectos secundarios: llama a AuthService para cerrar sesión y Router para redirección.
 *
 * Nota: el componente actúa como layout y router-outlet para las rutas hijas.
 */
import { Component } from '@angular/core';
import { AuthService } from './services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-root',
  template: `
    <div class="app-container">
      <header>
        <nav class="topbar">
          <div class="brand-row">
            <div class="brand">
              <div class="logo">C</div>
              <div class="brand-title">Chinchin</div>
            </div>
            <div class="nav-links">
              <a routerLink="/">Inicio</a>
              <a *ngIf="auth.isAuthenticated()" routerLink="/market">Mercado</a>
              <a *ngIf="auth.isAuthenticated()" routerLink="/exchange">Intercambio</a>
              <a *ngIf="auth.isAuthenticated()" routerLink="/history">Historial</a>
              <a *ngIf="auth.isAuthenticated()" routerLink="/settings">Configuración</a>
            </div>
          </div>
          <div>
            <a *ngIf="!auth.isAuthenticated()" routerLink="/login">Iniciar sesión</a>
            <a *ngIf="!auth.isAuthenticated()" routerLink="/register">Registro</a>
            <a *ngIf="auth.isAuthenticated()" (click)="logout()">Cerrar sesión</a>
          </div>
        </nav>
      </header>

      <main style="margin-top:18px">
        <router-outlet></router-outlet>
      </main>

  <footer class="footer">© 2025 · Tomas Dimaio</footer>
    </div>
  `,
  styles: []
})
export class AppComponent {
  constructor(public auth: AuthService, private router: Router) {}

  logout() {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
