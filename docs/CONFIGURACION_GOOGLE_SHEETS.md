# Google Sheets — Configuración privada (NO incluir código del servidor en GitHub)

**Planilla de destino:** la planilla «Respuestas de actividad» ya preparada con las columnas Fecha y hora, correo electrónico, nombre y apellido y las cuatro respuestas finales.

## 1. Proteger datos de docentes

Desde la planilla, elegir **Compartir → Acceso general → Restringido**. La planilla no debe ser legible para visitantes del sitio. Dar acceso solo a la coordinación.

## 2. Apps Script

Desde la planilla abrir **Extensiones → Apps Script**. En `Code.gs`, utilizar el archivo del servidor **V9 (registro único, sin envío de correos)** entregado a la coordinación por separado, nunca dentro de este repositorio público.

En **Implementar → Gestionar implementaciones**, editar la aplicación web actual:

- Ejecutar como: **Yo** (la cuenta que tiene permiso de edición sobre Sheets).
- Quién tiene acceso: **Cualquier persona**, si la política de la cuenta lo permite, para que los 300 docentes puedan enviar sin autorizar cada uno.
- Seleccionar **Nueva versión**, guardar e implementar.
- Mantener la URL `/exec` configurada en `assets/js/config.js`.

La URL `/exec` NO es secreta y puede verse en F12. El servidor debe rechazar correos repetidos y validar la entrada incluso cuando se le envían solicitudes externas al videojuego.

## 3. Comprobaciones imprescindibles

1. Confirmar que el código Apps Script actualizado expone `checkEmail` y el registro único.
2. Probar un correo **no registrado**: la validación inicial debe permitir la actividad.
3. Completar los cinco desafíos y enviar las cuatro respuestas y nombre.
4. Verificar en la hoja `Respuestas` exactamente una fila nueva.
5. Reintentar con el mismo correo desde otra pestaña o dispositivo: debe bloquear.
6. Comprobar no se envían correos y que ningún participante puede abrir la planilla.

## Limitaciones honestas

- La cuenta se identifica por el correo **declarado**, no por un inicio de sesión verificado.
- Un segundo correo puede permitir otro intento. Un tercero que conozca la dirección de otra persona puede registrar en su nombre. No puede garantizarse **una persona = una participación** sin verificar identidad.
- 300 docentes requieren verificar cuotas/concurrencia y monitorizar registros fallidos.
- En Apps Script se usa `LockService` para que dos envíos simultáneos con el mismo correo no creen dos filas.
- No cifrar la URL de Apps Script en el navegador: esa no es una medida de seguridad válida.
