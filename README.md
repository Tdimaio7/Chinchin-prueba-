# Frontend - Prueba

Proyecto Angular demo para la prueba técnica. Este README refleja el estado actual del desarrollo: funcionalidad de autenticación mock, cifrado de token, protecciones UI/anti-bot y almacenamiento en `sessionStorage`.

Estado actual: Autenticación (COMPLETADA - demo)

Principales características implementadas

- Registro y login mock (front-end): el registro guarda un objeto de usuario en `sessionStorage` con { email, salt, hash }.
- Derivación de contraseña: PBKDF2 (SHA-256, 100k iteraciones) para derivar la clave/huella.
- Token de sesión cifrado: se genera un token mock (payload base64) y se cifra con AES-GCM; el iv y ciphertext se almacenan en `sessionStorage` bajo la clave `app_token_enc`.
- Almacenamiento exclusivamente en `sessionStorage`: por petición del encargo no se usan `localStorage` para datos sensibles.
- Magic Link (mock): generación y verificación de tokens de un solo uso almacenados en `sessionStorage` (`magic_tokens`).
- Protecciones anti-bot y UX:
	- Honeypot (campo oculto) en formularios.
	- Captcha matemático estético.
	- Heurística de tiempo (no aceptar envíos < 2s tras renderizado).
	- Rate-limiting simple: intentos registrados en `sessionStorage` (ej. `login_attempts`, `register_attempts`).
- Interceptor HTTP (`TokenInterceptor`): añade header Authorization si el token está en memoria.
- Guardas de ruta (`AuthGuard`): protegen rutas que requieren autenticación.

Keys principales en sessionStorage

- `app_users` — mapa de usuarios registrados (email → { email, salt, hash }). El código migra automáticamente desde la key legacy `app_user` si existe.
- `app_token_enc` — objeto { iv: string(base64), ct: string(base64) } con el token cifrado (AES-GCM).
- `magic_tokens` — mapa de tokens mágicos temporales para el flujo de magic link.
- `login_attempts`, `register_attempts`, `magic_attempts` — arrays de timestamps usados para rate-limiting.

Limitaciones y notas de seguridad

- Demo frontend: no hay backend real. No utilices esto en producción tal cual.
- La demostración usa Web Crypto (PBKDF2 + AES-GCM) para enseñar mejores prácticas, pero la verdadera seguridad requiere:
	- Almacenar usuarios y hashes en el servidor.
	- Gestionar sesiones y tokens con cookies seguras o JWT firmados por el backend.
	- Políticas de expiración, revocación y transporte seguro (HTTPS).
- El interceptor no espera operaciones asíncronas para desencriptar el token; si recargas la página la clave derivada de la contraseña se pierde y `getToken()` devolverá una marca que indica token presente en sesión, pero no el valor desencriptado hasta re-login o verificación mágica.

Mensajes y localización

- UI y mensajes de error están en español (ej. duplicados, errores de login ahora muestran ``Correo o contraseña incorrectos``).

Cómo probar rápidamente

1. Instalar dependencias:

```powershell
npm install
```

2. Ejecutar en modo desarrollo:

```powershell
npm start
```

3. Flujo básico:
	- Abre http://localhost:4200
	- Regístrate (email + contraseña ≥ 6 caracteres).
	- Inicia sesión con las credenciales.
	- Tras login el token cifrado aparecerá en `sessionStorage` bajo `app_token_enc`.

4. Magic Link (mock): generar token mágico desde la UI y usar el flujo de verificación.

5. Probar protecciones anti-bot:
	- Envía el formulario rápidamente (<2s) o rellena el honeypot para ver el rechazo.
	- Fallar el captcha repetidamente y observar rate-limiting.

Archivos clave

- `src/app/services/auth.service.ts` — lógica central de auth (PBKDF2, AES-GCM, almacenamiento en sessionStorage, magic link).
- `src/app/login.component.ts`, `src/app/register.component.ts` — formularios y controles anti-bot.
- `src/app/interceptors/token.interceptor.ts` — añade Authorization si `AuthService` tiene token en memoria.
- `src/app/guards/auth.guard.ts` — protección de rutas.

---

## Cómo ejecutar el proyecto (rápido)

1. Instalar dependencias:

```powershell
npm install
```

2. Ejecutar en modo desarrollo:

```powershell
npm start
# o
ng serve --open
```

3. Abrir en el navegador:

http://localhost:4200

## Build de producción

```powershell
npm run build
# o
ng build --configuration production
```

## Nota sobre la limpieza de caché

Se detectó que la carpeta `.angular/cache` fue accidentalmente añadida al historial y contenía archivos mayores a 100MB, lo que provocó rechazos al `git push` hacia GitHub. Para resolverlo:

- Se reescribió el historial del repositorio para eliminar `.angular/cache` y se forzó un push a `origin/main`.
- Se actualizó `.gitignore` para incluir `.angular/` y `.angular/cache/`.

Si trabajas en una copia local anterior al reescrito, sincronízala con:

```powershell
git fetch origin
git reset --hard origin/main
```

> Importante: esto sobrescribirá tu rama local. Si tienes trabajo no commiteado, guárdalo antes.

## Estado y próximos pasos

- Autenticación mock: completada.
- Listado de criptomonedas y saldos: implementado (parcial).
- Pendiente: detalle con gráficos históricos, exchange UI, persistencia y tests.

Si quieres que continúe con el detalle de criptomoneda (gráfico histórico y datos), lo empiezo ahora.
