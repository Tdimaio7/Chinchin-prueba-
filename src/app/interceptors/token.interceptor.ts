/**
 * TokenInterceptor
 * - Añade cabecera Authorization a peticiones realizadas al mismo origen (app-origin).
 * - Evita añadir headers a orígenes externos (ej. CoinGecko) para no causar CORS preflight innecesario.
 * - Utiliza AuthService.getToken() para obtener el token (mock/demo).
 */
import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler } from '@angular/common/http';
import { AuthService } from '../services/auth.service';

@Injectable()
export class TokenInterceptor implements HttpInterceptor {
  constructor(private auth: AuthService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler) {
    const token = this.auth.getToken();

    try {
      const reqUrl = new URL(req.url, window.location.origin);
      if (reqUrl.origin !== window.location.origin) {
        return next.handle(req);
      }
    } catch (e) {
      return next.handle(req);
    }

    if (token) {
      const cloned = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
      return next.handle(cloned);
    }

    return next.handle(req);
  }
}
