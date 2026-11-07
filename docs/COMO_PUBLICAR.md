# Publicación en GitHub Pages

Repositorio elegido: `AlejoPalavecino/mision-aula-sin-barreras`.

### Paso 1 — Repositorio listo

El repositorio `AlejoPalavecino/mision-aula-sin-barreras` ya fue creado y su contenido está subido a la rama `main`. No necesitás volver a crearlo ni hacer `git push`.

### Paso 2 — Activar Pages

En el repositorio → **Settings → Pages → Build and deployment → Source → GitHub Actions**. GitHub exige activar Pages una vez desde la interfaz: el `GITHUB_TOKEN` del workflow no puede crear el sitio por primera vez. Luego entrá a **Actions**, abrí **Validar y publicar Misión Aula Sin Barreras**, elegí **Run workflow** o **Re-run all jobs**, y comprobá que `tests` y `deploy` terminen en verde.

El enlace de la actividad será `https://alejopalavecino.github.io/mision-aula-sin-barreras/` una vez que GitHub confirme el despliegue.

### Paso 3 — Configurar Apps Script y Google Sheets

Consultar `docs/CONFIGURACION_GOOGLE_SHEETS.md`. La URL del servicio ya se incorporó al `assets/js/config.js`; si cambia la implementación, hay que modificarla y volver a hacer push.

### Paso 4 — Probar una participación real y un duplicado

Con un correo de prueba válido y no registrado: completar la actividad → enviar → comprobar fila en Sheets → recargar → intentar ingresar con el mismo correo → debe bloquear. No hacer pruebas con correos reales de participantes antes de la capacitación.
