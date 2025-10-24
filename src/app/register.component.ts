/**
 * RegisterComponent
 * - Formulario de registro (demo). Aplica las mismas protecciones anti-bot que LoginComponent.
 * - Llama a AuthService.register y muestra mensajes de éxito o error.
 * - Persistencia: no escribe datos sensibles en localStorage/remote; los usuarios demo se guardan en sessionStorage.
 */
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-register',
  template: `
    <div class="app-container">
      <div style="max-width:480px; margin:0 auto">
        <div class="card">
          <h2 class="title">Registro</h2>
          <p class="muted">Crea una cuenta para probar la demo corporativa.</p>

          <form class="form" (submit)="onSubmit($event)" #rf="ngForm">
            <label>
              Email
              <input name="email" type="email" required ngModel #emailModel="ngModel" pattern="^[^\\s@]+@[^\\s@]+\.[^\\s@]+$" />
            </label>
            <div class="muted-sm" *ngIf="emailModel.invalid && emailModel.touched">
              <span *ngIf="emailModel.errors?.['required']">El email es obligatorio.</span>
              <span *ngIf="emailModel.errors?.['pattern']">Introduce un email con formato válido.</span>
            </div>

            <label>
              Contraseña
              <input name="password" type="password" required minlength="6" ngModel #pwdModel="ngModel" />
            </label>
            <div class="muted-sm" *ngIf="pwdModel.invalid && pwdModel.touched">La contraseña debe tener al menos 6 caracteres</div>

            <div class="actions">
              <button class="btn" type="submit" [disabled]="rf.invalid">Crear cuenta</button>
              <a class="btn secondary" routerLink="/login">Ya tengo cuenta</a>
            </div>

            <div *ngIf="success" class="muted-sm" style="color:green">{{success}}</div>
            <div *ngIf="error" class="muted-sm" style="color:#b00020">{{error}}</div>
            <input name="hp_field" class="hp-hidden" autocomplete="off" />

            <div class="captcha-row">
              <div class="captcha-box" aria-hidden="true">
                <div class="captcha-prompt">Resuelve</div>
                <div class="captcha-question">{{captchaQuestion}}</div>
              </div>

              <div class="captcha-controls">
                <input class="captcha-input" name="captcha" type="number" required [(ngModel)]="captchaResponse" placeholder="Tu respuesta" />
                <button type="button" class="captcha-refresh" (click)="generateCaptcha()" title="Regenerar pregunta">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                    <path d="M21 12a9 9 0 10-2.1 5.6L21 20v-3l-3.3 1.1A7 7 0 1119 12z" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </button>
              </div>
            </div>
            <div class="muted-sm captcha-note">Comprueba que no eres un bot antes de continuar.</div>
            <div class="muted-sm" *ngIf="captchaError" style="color:#b00020">{{captchaError}}</div>
          </form>
        </div>
      </div>
    </div>
  `
})
export class RegisterComponent {
  public error: string | null = null;
  public success: string | null = null;
  public captchaQuestion = '';
  public captchaAnswer = 0;
  public captchaResponse: number | null = null;
  public captchaError: string | null = null;
  private formRenderedAt = 0;
  constructor(private auth: AuthService, private router: Router) {}

  ngOnInit() {
    this.generateCaptcha();
    this.formRenderedAt = Date.now();
  }

  async onSubmit(e: Event) {
    e.preventDefault();
    this.error = null;
    this.success = null;
    this.captchaError = null;
    const blocked = this.checkRateLimit('register_attempts');
    if (blocked.blocked) {
      this.error = `Demasiados intentos. Intenta de nuevo en ${Math.ceil(blocked.remaining / 1000)}s`;
      return;
    }

    const form = e.target as HTMLFormElement;
    const hp = (form.elements.namedItem('hp_field') as HTMLInputElement | null)?.value;
    if (hp) {
      this.error = 'Formulario inválido';
      this.addAttempt('register_attempts');
      return;
    }
    if (Date.now() - this.formRenderedAt < 2000) {
      this.error = 'Por favor espera un momento antes de enviar';
      return;
    }
    if (this.captchaResponse === null || this.captchaResponse !== this.captchaAnswer) {
      this.captchaError = 'Respuesta incorrecta al captcha';
      this.generateCaptcha();
      this.addAttempt('register_attempts');
      return;
    }
    const email = (form.elements.namedItem('email') as HTMLInputElement).value;
    const password = (form.elements.namedItem('password') as HTMLInputElement).value;
    try {
      await this.auth.register(email, password);
      this.success = 'Cuenta creada. Puedes iniciar sesión.';
      this.resetAttempts('register_attempts');
      setTimeout(() => this.router.navigate(['/login']), 900);
    } catch (err: any) {
      if (err instanceof Error && err.message === 'El correo ya se utilizó') {
        this.error = 'El correo ya está en uso. Prueba con otro o inicia sesión.';
      } else {
        this.error = err?.message || 'Registro fallido';
      }
      this.addAttempt('register_attempts');
    }
  }

  public generateCaptcha() {
    const a = Math.floor(Math.random() * 8) + 1;
    const b = Math.floor(Math.random() * 8) + 1;
    this.captchaQuestion = `${a} + ${b}`;
    this.captchaAnswer = a + b;
    this.captchaResponse = null;
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
