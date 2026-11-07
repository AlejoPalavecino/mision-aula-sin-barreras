"""Prueba de flujo completo sobre Chromium con Apps Script simulado.
Ejecutar localmente con: python tests/browser_smoke.py
"""
from pathlib import Path
import json
import re
import base64
import tempfile
import shutil
from urllib.parse import parse_qs, urlparse
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]

class FakeBackend:
    def __init__(self):
        self.emails = set()
        self.request_statuses = {}
        self.submitted = []

    def route(self, route):
        request = route.request
        parsed = urlparse(request.url)
        if request.method == 'POST':
            data = json.loads(request.post_data or '{}')
            rid = data.get('requestId', '')
            email = data.get('email', '').strip().lower()
            if data.get('action') == 'checkEmail':
                self.request_statuses[rid] = 'duplicate' if email in self.emails else 'available'
            else:
                self.request_statuses[rid] = 'duplicate' if email in self.emails else 'saved'
                if email not in self.emails:
                    self.emails.add(email)
                    self.submitted.append(data)
            route.fulfill(status=200, content_type='text/plain', body='ok', headers={"Access-Control-Allow-Origin": "*"})
        else:
            query = parse_qs(parsed.query)
            rid = query.get('check', [''])[0]
            cb = query.get('callback', [''])[0]
            status = self.request_statuses.get(rid, 'pending')
            route.fulfill(status=200, content_type='application/javascript', body=f'{cb}({json.dumps({"status": status})});', headers={"Access-Control-Allow-Origin": "*"})


def run():
    backend = FakeBackend()
    def handle_post(data):
        rid = data.get('requestId', '')
        email = data.get('email', '').strip().lower()
        if data.get('action') == 'checkEmail':
            status = 'duplicate' if email in backend.emails else 'available'
        else:
            status = 'duplicate' if email in backend.emails else 'saved'
            if status == 'saved':
                backend.emails.add(email)
                backend.submitted.append(data)
        backend.request_statuses[rid] = status
        return status
    def inject_bridge(page):
        page.expose_function('testPost', handle_post)
        page.evaluate('''
          window._statuses = {};
          window.fetch = async (url, options) => {
            const data = JSON.parse(options.body);
            window._statuses[data.requestId] = await window.testPost(data);
            return {ok: true};
          };
          window.verifySheetSubmission = async (requestId) => window._statuses[requestId] || 'unverified';
        ''')
    # El entorno de pruebas puede bloquear navegación HTTP/FILE local. Para verificar
    # el comportamiento en Chromium, reconstituimos únicamente en memoria la versión
    # modular: no modifica ni publica archivos, ni accede al Apps Script real.
    html = (ROOT/'index.html').read_text(encoding='utf-8')
    css = (ROOT/'assets/css/styles.css').read_text(encoding='utf-8')
    config = (ROOT/'assets/js/config.js').read_text(encoding='utf-8')
    js = (ROOT/'assets/js/app.js').read_text(encoding='utf-8')
    svg = (ROOT/'assets/img/hero-water-cycle.svg').read_bytes()
    html = re.sub(r'<meta\s+http-equiv="Content-Security-Policy"[^>]*>', '', html)
    html = re.sub(r'<link[^>]+fonts(?:\.googleapis|\.gstatic)\.com[^>]*>', '', html)
    html = html.replace('<link rel="stylesheet" href="./assets/css/styles.css">', '<style>'+css+'</style>')
    html = html.replace('<script defer src="./assets/js/config.js"></script>', '<script>'+config+'</script>')
    html = html.replace('<script defer src="./assets/js/app.js"></script>', '<script>'+js+'</script>')
    html = html.replace('src="./assets/img/hero-water-cycle.svg"', 'src="data:image/svg+xml;base64,'+base64.b64encode(svg).decode()+'"')
    with sync_playwright() as pw:
        browser_executable = shutil.which('chromium') or shutil.which('google-chrome') or pw.chromium.executable_path
        browser = pw.chromium.launch(executable_path=browser_executable, headless=True, args=['--no-sandbox','--disable-dev-shm-usage'])
        page = browser.new_page(viewport={"width": 1400, "height": 900}, device_scale_factor=1)
        page.set_default_timeout(6000)
        errors = []
        page.on('pageerror', lambda err: errors.append(str(err) + '\n' + str(getattr(err,'stack',''))))
        page.set_content(html, wait_until='domcontentloaded')
        inject_bridge(page)
        page.wait_for_timeout(500)
        screenshots = Path(tempfile.gettempdir()) / 'aula-sin-barreras-qa'
        screenshots.mkdir(exist_ok=True)
        page.screenshot(path=str(screenshots / 'aula_pages_home.png'), full_page=True)
        assert page.locator('#startEmail').count() == 1
        assert page.locator('#clock').inner_text() == '00:00'
        page.locator('#startEmail').fill('Docente.Prueba@Example.com')
        page.locator('#startBtn').click()
        page.locator('#stage1.active').wait_for(timeout=5000)
        assert page.locator('#participantEmail').input_value() == 'docente.prueba@example.com'

        for profile, dim in [('0','sensorial'),('1','cognitiva'),('2','emocional'),('3','fisica')]:
            page.locator(f'#profileGrid [data-profile="{profile}"]').click()
            page.locator(f'.dimension-btn[data-dimension="{dim}"]').click()
        assert page.locator('#next1').is_enabled()
        page.locator('#next1').click()

        for option in ('a1','a2','a3','a4'):
            page.locator(f'[data-access="{option}"]').click()
        page.locator('#check2').click()
        assert page.locator('#next2').is_visible()
        page.locator('#next2').click()

        for card, answer in [('c1','procesa'),('c2','repite'),('c3','procesa'),('c4','repite')]:
            page.locator(f'[data-process-card="{card}"] [data-process-choice="{answer}"]').click()
        page.locator('#check3').click()
        assert page.locator('#next3').is_visible()
        page.locator('#next3').click()

        for item in ('oral','grafica'):
            page.locator(f'[data-expression="{item}"]').click()
        page.locator('#next4a').click()
        page.locator('[data-feedback="process"]').click()
        page.locator('#next4b').click()
        page.locator('[data-reg="yes"]').click()
        page.locator('#check4').click()
        page.locator('#next4').click()

        page.locator('#stage5.active').wait_for(timeout=2000)
        page.locator('#participantName').fill('Docente de Prueba')
        page.locator('#barrierSelect').select_option(label='Cognitiva: comprensión y organización')
        page.locator('#changeInput').fill('Voy a facilitar consignas cortas en tres pasos.')
        page.locator('#evidenceInput').fill('Voy a observar participación y explicación de ideas.')
        page.locator('#reflectionInput').fill('El acceso es una condición del aprendizaje.')
        page.locator('#sendBtn').click()
        page.locator('#completionNotice:visible').wait_for(timeout=4000)
        assert len(backend.submitted) == 1
        response = backend.submitted[0]
        for f in ['email','name','barrier','change','evidence','reflection']:
            assert response.get(f), f
        assert response['email'] == 'docente.prueba@example.com'
        assert 'guardad' in page.locator('#submitFeedback').inner_text().lower()
        assert not page.locator('#sendBtn').is_enabled()
        assert page.locator('#successModal:visible').is_visible(), 'La ventana de éxito debe abrirse al guardar'
        assert page.locator('#successModalTitle').inner_text() == '¿Te gustó esta experiencia?'
        whatsapp = page.locator('#successModal a.experience-cta-link')
        assert whatsapp.is_visible(), 'La CTA de WhatsApp debe ser visible en el modal'
        assert whatsapp.get_attribute('href').startswith('https://wa.me/5492634249750?text=')
        assert page.locator('#downloadBtn').count() == 0
        assert page.locator('#copyBtn').count() == 0
        page.screenshot(path=str(screenshots / 'aula_pages_final.png'), full_page=True)
        page.locator('#closeSuccessModal').click()
        assert not page.locator('#successModal').is_visible(), 'El modal debe poder cerrarse'
        assert not page.locator('#sendBtn').is_enabled(), 'El formulario no debe reabrirse al cerrar el modal'

        # Fresh tab with same email must be blocked by backend.
        print('FIRST PASS OK', flush=True)
        other = browser.new_page(viewport={"width": 390, "height": 844}, device_scale_factor=1)
        other.set_default_timeout(6000)
        other.set_content(html, wait_until='domcontentloaded')
        inject_bridge(other)
        other.wait_for_timeout(500)
        other.screenshot(path=str(screenshots / 'aula_pages_mobile.png'), full_page=True)
        print('MOBILE LOADED',flush=True)
        other.locator('#startEmail').fill('docente.prueba@example.com')
        other.locator('#startBtn').click()
        other.locator('text=Este correo ya completó la actividad').wait_for(timeout=4000)
        assert not other.locator('#game').is_visible()
        assert len(backend.submitted) == 1
        assert not errors, errors
        print('BROWSER SMOKE OK: 5 stages, save once, duplicate email blocked, desktop/mobile screenshots')
        browser.close()

if __name__ == '__main__':
    run()
