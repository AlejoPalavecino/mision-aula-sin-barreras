# Publicación en GitHub Pages

Repositorio elegido: `AlejoPalavecino/mision-aula-sin-barreras`.

### Paso 1 — Crear el repositorio

Abrir https://github.com/new con tu sesión de `AlejoPalavecino`. Elegir:

- Owner: `AlejoPalavecino`
- Repository name: `mision-aula-sin-barreras`
- Visibility: **Public**
- Desactivar inicialización de README, .gitignore y licencia (el proyecto ya los incluye)

Presionar **Create repository**.

### Paso 2 — Subir los archivos

Descomprimí el ZIP del proyecto. Desde una terminal (Git Bash o PowerShell con Git) ubicada **dentro de la carpeta descomprimida**:

```bash
git init -b main
git add .
git commit -m "feat: publicar Misión Aula Sin Barreras"
git remote add origin https://github.com/AlejoPalavecino/mision-aula-sin-barreras.git
git push -u origin main
```

GitHub solicitará autenticación si no tenés configurada la sesión. Si el repositorio fue creado con README u otro commit, clonalo y copiá dentro la estructura del proyecto en lugar de forzar un push.

### Paso 3 — Activar Pages

En el repositorio → **Settings → Pages → Build and deployment → Source → GitHub Actions**. Entrá a **Actions**, abrí **Validar y publicar Misión Aula Sin Barreras** y comprobá que el workflow complete `tests` y `deploy`. Si hiciera falta, usá **Run workflow**.

El enlace de la actividad será `https://alejopalavecino.github.io/mision-aula-sin-barreras/` una vez que GitHub confirme el despliegue.

### Paso 4 — Configurar Apps Script y Google Sheets

Consultar `docs/CONFIGURACION_GOOGLE_SHEETS.md`. La URL del servicio ya se incorporó al `assets/js/config.js`; si cambia la implementación, hay que modificarla y volver a hacer push.

### Paso 5 — Probar una participación real y un duplicado

Con un correo de prueba válido y no registrado: completar la actividad → enviar → comprobar fila en Sheets → recargar → intentar ingresar con el mismo correo → debe bloquear. No hacer pruebas con correos reales de participantes antes de la capacitación.
