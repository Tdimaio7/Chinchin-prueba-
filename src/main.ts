import 'zone.js';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { enableProdMode } from '@angular/core';
import { AppModule } from './app/app.module';

// `process` puede no existir en el navegador; proteger el acceso evita errores en tiempo de ejecución.
if (typeof process !== 'undefined' && process?.env && process.env.NODE_ENV === 'production') {
  enableProdMode();
}

platformBrowserDynamic().bootstrapModule(AppModule)
  .catch(err => console.error(err));
