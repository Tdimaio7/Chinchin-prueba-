/**
 * MagicVerifyComponent
 * - Consume el token mágico (pasado por ruta) y delega la verificación en AuthService.verifyMagicToken.
 * - En caso de éxito redirige al home; en caso contrario muestra error.
 * - Diseño pensado para demo: el token se almacena temporalmente en sessionStorage por AuthService.
 */
import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-magic-verify',
  template: `
    <div class="app-container">
      <div style="max-width:520px;margin:0 auto">
        <div class="card center">
          <h3 class="title">Verificando enlace...</h3>
          <p class="muted" *ngIf="!error">Por favor espera.</p>
          <p style="color:#b00020" *ngIf="error">{{error}}</p>
        </div>
      </div>
    </div>
  `
})
export class MagicVerifyComponent {
  public error: string | null = null;
  constructor(private route: ActivatedRoute, private auth: AuthService, private router: Router) {
    const token = this.route.snapshot.paramMap.get('token') || '';
    this.verify(token);
  }

  async verify(token: string) {
    try {
      await this.auth.verifyMagicToken(token);
      // redirect to home
      this.router.navigate(['/']);
    } catch (err: any) {
      this.error = err?.message || 'Token inválido';
    }
  }
}
