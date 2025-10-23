import { Component } from '@angular/core';
import { AuthService } from './services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-root',
  template: `
    <div class="app-container">
      <header>
        <nav class="topbar">
          <div class="brand">
            <div class="logo">App</div>
            <a routerLink="/">Inicio</a>
          </div>
          <div>
            <a *ngIf="!auth.isAuthenticated()" routerLink="/login" style="margin-left:12px">Iniciar sesión</a>
            <a *ngIf="!auth.isAuthenticated()" routerLink="/register" style="margin-left:12px">Registro</a>
            <a *ngIf="auth.isAuthenticated()" (click)="logout()" style="margin-left:12px">Cerrar sesión</a>
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

  // Cierra la sesión y redirige a la página de login
  logout() {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
