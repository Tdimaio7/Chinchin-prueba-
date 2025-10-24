/**
 * AuthGuard
 * - Evita el acceso a rutas protegidas si el usuario no está autenticado.
 * - Redirige a '/login' cuando no hay sesión activa.
 * - Dependencias: AuthService, Router.
 */
import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(private auth: AuthService, private router: Router) {}

  canActivate(): boolean {
    if (this.auth.isAuthenticated()) return true;
    this.router.navigate(['/login']);
    return false;
  }
}
