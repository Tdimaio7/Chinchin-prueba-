# Chinchin - Prueba Frontend (Angular)

Demo Angular que implementa los requisitos de la prueba técnica de Chinchin.

Requisitos mínimos

- Node.js 16+ y npm

Instalación

```powershell
npm install
```

Desarrollo

```powershell
npm start
```

Build de producción

```powershell
npm run build -- --configuration production
```

Cobertura de la prueba (resumen)

- Autenticación de usuario: Implementado (mock). Registro, login y cierre de sesión. Tokens cifrados en `sessionStorage` (AES-GCM). — Implementado
- Almacenamiento seguro de tokens: Token cifrado y guardado en `sessionStorage` (demo). — Implementado
- Mostrar lista de criptomonedas y refresco cada 30s: Lista y refresco implementados; integración con API pública y fallback. — Parcial/Implementado
- Saldos del usuario (data estática): Implementado (servicio de portfolio con saldos iniciales). — Implementado
- Filtrado/ordenado de la lista: Filtros y orden básico en la UI. — Implementado
- Detalle de criptomoneda (gráficos históricos): Página de detalle disponible; gráficos básicos/placeholder. — Parcial
- Intercambio de criptomonedas: UI de intercambio con tasa limitada por tiempo, cálculo y ejecución (actualiza saldos). — Implementado
- Historial de transacciones: Registro básico de operaciones en almacenamiento local. — Parcial
- Sección de configuración: Vistas y opciones básicas presentes (mostrar/ocultar vistas, refresco). — Parcial

Notas importantes

- Fallbacks fijos cuando la API falla:
	- 1 PTR = 60 USD
	- 37.85 BS = 1 USD

- La app usa APIs públicas (CoinGecko/Binance como referencia). Ver `src/app/services/crypto.service.ts`.

Archivos clave

- `src/app/services/auth.service.ts` — autenticación (PBKDF2 + AES-GCM), token mock.
- `src/app/login.component.ts`, `src/app/register.component.ts` — formularios y protecciones anti-bot.
- `src/app/services/crypto.service.ts` — obtención de precios y fallbacks PTR/BS.
- `src/app/exchange.component.ts` — lógica y UI del intercambio.
- `src/app/services/portfolio.service.ts` — saldos y ejecución de operaciones.

Despliegue

- `netlify.toml` incluido y deploy realizado con Netlify CLI; publicación desde `dist/frontend-demo`.
- Sitio público (deploy actual): https://chinchin-prueba.netlify.app

Deploy desde CLI (no interactivo)

Si prefieres desplegar sin prompts usando un token y opcionalmente un `site-id`:

Windows (cmd):

```powershell
set NETLIFY_AUTH_TOKEN=TU_TOKEN_AQUI & npx netlify deploy --prod --dir=dist/frontend-demo --site-id TU_SITE_ID --message "Deploy: UI fixes"
```

PowerShell:

```powershell
$env:NETLIFY_AUTH_TOKEN="TU_TOKEN_AQUI"
npx netlify deploy --prod --dir=dist/frontend-demo --site-id TU_SITE_ID --message "Deploy: UI fixes"
```

También existe el script npm `deploy:netlify` agregado al `package.json` que ejecuta el comando si tienes `netlify-cli` instalado y `NETLIFY_AUTH_TOKEN` en el entorno.
