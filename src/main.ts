/**
 * Entrada principal de la aplicación (bootstrap)
 * - Inicializa Angular y arranca AppModule.
 * - Marca producción cuando `process.env.NODE_ENV === 'production'` (protección segura para entornos de bundling).
 */
import 'zone.js';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { enableProdMode } from '@angular/core';
import { AppModule } from './app/app.module';

if (typeof process !== 'undefined' && (process as any)?.env && (process as any).env.NODE_ENV === 'production') {
  enableProdMode();
}

platformBrowserDynamic().bootstrapModule(AppModule)
  .catch(err => console.error(err));
