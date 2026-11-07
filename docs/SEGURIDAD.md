# Seguridad, privacidad y límites técnicos

## Qué es público

GitHub Pages distribuye a cualquier visitante `index.html`, CSS, JavaScript, dibujos SVG y la URL del receptor de Google Apps Script. Se pueden leer desde el navegador mediante **F12**. Esto es normal para una web estática.

**No guardar en el frontend**: contraseña de Gmail, token de GitHub, API key privada, ID de planilla acompañado de permisos públicos, respuestas de terceros, ni información de otros docentes. La URL `/exec` del receptor no es un secreto, por lo que no se ofusca ni cifra artificialmente.

## Qué permanece privado

- La planilla de Google Sheets con los nombres, correos y reflexiones.
- El archivo `AppsScript_Mision_Aula_Sin_Barreras_PRIVADO.gs` y su constante de configuración de la planilla (se entrega aparte, no dentro de este repositorio).
- Las credenciales de la cuenta que ejecuta Apps Script.

La conexión con Apps Script usa HTTPS; no es necesario ni adecuado cifrar el código JavaScript para intentar ocultar información visible en F12. Los controles de acceso reales deben estar en Google Sheets y en Apps Script.

## Cuándo se permite entrar y registrar

1. Se introduce el correo y se consulta si ya figura en la planilla.
2. Si existe, se impide empezar.
3. Si no existe, se puede realizar el recorrido.
4. Al enviar se validan nombre y las cuatro respuestas.
5. El servidor bloquea la operación, comprueba de nuevo el correo y guarda **una sola fila**.
6. Si la misma dirección vuelve a utilizarse, el servidor rechaza la segunda petición.

### Limitación esencial

Sin verificación de titularidad o inicio de sesión, **una dirección declarada ≠ una identidad verificada**. Puede ser posible ingresar con otro correo o suplantar el de un tercero. Por lo tanto, el control es **un envío por correo introducido**, no una participación garantizada por persona física.

## Acciones obligatorias antes de 300 docentes

- En Google Sheets, **Compartir → Acceso general → Restringido**. Se detectó que estaba configurado con lectura para cualquiera que tenga el enlace.
- Actualizar e implementar en Apps Script el backend privado V9. Ejecutar como la cuenta con acceso de escritura a la planilla, con acceso al receptor para participantes.
- No compartir la planilla con los participantes.
- Comprobar el flujo real con un correo de prueba y luego un intento duplicado.
- Verificar límites de Apps Script y de Google Sheets para tráfico simultáneo; el servidor puede requerir reintentos si 300 personas envían exactamente al mismo tiempo.
- No introducir información sensible de estudiantes en las reflexiones.
