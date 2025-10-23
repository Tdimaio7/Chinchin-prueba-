import { Component } from '@angular/core';
import { AuthService } from './services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-magic-link',
  template: `
    <div class="app-container">
      <div style="max-width:520px;margin:0 auto">
        <div class="card">
          <h3 class="title">Iniciar con link mágico</h3>
          <p class="muted">Introduce tu email. Te mostraremos un enlace (simulado) que puedes usar para iniciar sesión.</p>

          <form (submit)="send($event)" class="form">
            <label>
              Email
              <input name="email" type="email" required ngModel #mEmail="ngModel" pattern="^[^\\s@]+@[^\\s@]+\.[^\\s@]+$" />
            </label>
            <div class="muted-sm" *ngIf="mEmail.invalid && mEmail.touched">Introduce un email con formato válido</div>

            <div class="actions">
              <button class="btn" type="submit">Enviar enlace</button>
            </div>

            <div *ngIf="link" style="margin-top:12px">
              <div class="muted-sm">Enlace simulado (haz click para iniciar sesión):</div>
              <a [routerLink]="['/magic-verify', link]">{{link}}</a>
            </div>
            <div *ngIf="error" style="color:#b00020" class="muted-sm">{{error}}</div>
          </form>
        </div>
      </div>
    </div>
  `
})
export class MagicLinkComponent {
  public link: string | null = null;
  public error: string | null = null;
  constructor(private auth: AuthService, private router: Router) {}

  async send(e: Event) {
    e.preventDefault();
    this.error = null; this.link = null;
    const blocked = this.checkRateLimit('magic_attempts');
    if (blocked.blocked) {
      this.error = `Demasiados intentos. Intenta de nuevo en ${Math.ceil(blocked.remaining / 1000)}s`;
      return;
    }
    
    const form = e.target as HTMLFormElement;
    const email = (form.elements.namedItem('email') as HTMLInputElement).value;
    try {
      const token = await this.auth.createMagicToken(email);
      this.link = token;
      this.resetAttempts('magic_attempts');
    } catch (err: any) {
      this.error = err?.message || 'Error generando enlace';
      this.addAttempt('magic_attempts');
    }
  }

  private RATE_MAX = 5;
  private RATE_WINDOW = 10 * 60 * 1000;

  private getAttempts(key: string): number[] {
    const raw = sessionStorage.getItem(key);
    if (!raw) return [];
    try { return JSON.parse(raw) as number[]; } catch { return []; }
  }

  private setAttempts(key: string, arr: number[]) {
    sessionStorage.setItem(key, JSON.stringify(arr));
  }

  private addAttempt(key: string) {
    const now = Date.now();
    const attempts = this.getAttempts(key).filter(ts => now - ts <= this.RATE_WINDOW);
    attempts.push(now);
    this.setAttempts(key, attempts);
  }

  private resetAttempts(key: string) {
    sessionStorage.removeItem(key);
  }

  private checkRateLimit(key: string): { blocked: boolean; remaining: number } {
    const now = Date.now();
    const attempts = this.getAttempts(key).filter(ts => now - ts <= this.RATE_WINDOW);
    if (attempts.length >= this.RATE_MAX) {
      const oldest = attempts[0];
      const remaining = this.RATE_WINDOW - (now - oldest);
      return { blocked: true, remaining };
    }
    return { blocked: false, remaining: 0 };
  }
}
