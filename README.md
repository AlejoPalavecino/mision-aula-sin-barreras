# Misión Aula Sin Barreras

Videojuego educativo de 15 minutos para docentes de primaria, basado en el modelo DUA-A. Una experiencia de cinco etapas con ilustraciones, interacciones, propuestas pedagógicas y reflexión final.

## Estructura

```text
index.html               ← contenido semántico y pantallas
assets/css/styles.css    ← estilos, responsive y accesibilidad
assets/js/config.js      ← URL PÚBLICA del receptor de Apps Script
assets/js/app.js         ← lógica interactiva y validación de formularios
assets/img/              ← ilustración y favicon en SVG
.github/workflows/pages.yml ← tests + despliegue a GitHub Pages
tests/                   ← tests estáticos
qa/                      ← pruebas end-to-end locales (mock; no datos reales)
docs/                    ← guía de publicación y seguridad
```

## Acceso público

Una vez creado el repositorio y habilitado GitHub Pages:

**https://alejopalavecino.github.io/mision-aula-sin-barreras/**

> Esta URL es una dirección prevista, no una confirmación de publicación hasta que termine el workflow de GitHub Pages.

## Publicación

1. Crear en `AlejoPalavecino` un repositorio **público** llamado `mision-aula-sin-barreras` (sin README, sin .gitignore ni licencia iniciales).
2. Subir la estructura completa a la rama `main`.
3. Entrar a **Settings → Pages → Build and deployment → Source: GitHub Actions**.
4. Ir a **Actions → Validar y publicar Misión Aula Sin Barreras** y comprobar que los jobs `tests` y `deploy` finalicen con éxito.
5. Abrir el enlace Pages.

El sitio es estático y no requiere servidor propio. Los datos se reciben mediante un Google Apps Script desplegado de forma independiente.

## Privacidad y seguridad

- **Nunca subir `Code.gs`, una hoja de cálculo, un token, contraseñas ni datos de docentes a este repositorio público.**
- La URL del Apps Script en `assets/js/config.js` es una URL pública de recepción, no una contraseña; cualquier dato en el frontend es inspeccionable con F12. Ocultarla por ofuscación o cifrado en JavaScript **no aporta seguridad**.
- El Apps Script valida el correo antes de iniciar y antes de guardar, y bajo `LockService` rechaza un registro posterior con el mismo correo. El correo se normaliza a minúsculas.
- **No demuestra identidad individual**: un usuario podría utilizar otro correo o el correo de otra persona. Para garantizar unicidad por persona hace falta autenticación o verificación de titularidad; este proyecto usa **unicidad por dirección ingresada**.
- La planilla Google Sheets debe estar configurada con **Acceso general: Restringido**, no «cualquier persona con el enlace». La ejecución de Apps Script necesita autorización privada para escribir.
- El servicio público requiere controles de servidor y revisión de cuotas antes de una capacitación masiva. No confiar en validaciones JS para proteger los datos.

## Validación local

```bash
python -m unittest discover -s tests -v
node --check assets/js/config.js
node --check assets/js/app.js
```

Para probar de extremo a extremo con un servidor **simulado**, sin modificar la hoja real:

```bash
pip install playwright
python -m playwright install chromium
python qa/browser_smoke.py
```

## Cómo actualizar el backend de Google Apps Script

La aplicación web debe tener desplegado el script de registro único V9 **sin envíos de correo** que se distribuye a la coordinación por separado. No lo publiques en este repositorio; contiene configuración del servidor. Consultá `docs/CONFIGURACION_GOOGLE_SHEETS.md`.
