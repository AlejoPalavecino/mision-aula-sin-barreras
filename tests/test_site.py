"""Comprobaciones de despliegue y exposición de datos: solamente librería estándar."""
from pathlib import Path
import re
import unittest

ROOT = Path(__file__).resolve().parents[1]
HTML = (ROOT / 'index.html').read_text(encoding='utf-8')
CSS = (ROOT / 'assets/css/styles.css').read_text(encoding='utf-8')
JS = (ROOT / 'assets/js/app.js').read_text(encoding='utf-8')
CONFIG = (ROOT / 'assets/js/config.js').read_text(encoding='utf-8')
PUBLIC = HTML + '\n' + CSS + '\n' + JS + '\n' + CONFIG

class PagesSiteTests(unittest.TestCase):
    def test_entrypoint_and_assets_exist(self):
        for name in ('index.html','assets/css/styles.css','assets/js/app.js','assets/js/config.js','assets/img/favicon.svg','assets/img/hero-water-cycle.svg','.nojekyll'):
            with self.subTest(file=name):
                self.assertTrue((ROOT / name).is_file())

    def test_html_links_modular_assets(self):
        for path in ('./assets/css/styles.css','./assets/js/app.js','./assets/js/config.js','./assets/img/favicon.svg','./assets/img/hero-water-cycle.svg'):
            self.assertIn(path, HTML)
        self.assertNotIn('<style>', HTML)
        self.assertNotRegex(HTML, r'<script(?![^>]*\bsrc=)')

    def test_five_stages(self):
        for i in range(1,6):
            self.assertEqual(HTML.count(f'id="stage{i}"'), 1)

    def test_duration_font_and_responsiveness(self):
        self.assertIn('15 min orientativos', HTML)
        self.assertIn('Lexend Deca', CSS)
        self.assertIn('name="viewport"', HTML)

    def test_only_one_email_registration_flow(self):
        self.assertIn('action: "checkEmail"', JS)
        self.assertIn('status === "duplicate"', JS)
        self.assertIn('status === "saved"', JS)
        for id in ('startEmail','participantEmail','sendBtn'):
            self.assertIn(f'id="{id}"', HTML)
        for banned in ('restartBtn','backToStartBtn','pauseBtn','readBtn'):
            self.assertNotIn(banned, PUBLIC)

    def test_four_final_answers(self):
        for id in ('barrierSelect','changeInput','evidenceInput','reflectionInput'):
            self.assertIn(f'id="{id}"', HTML)

    def test_no_private_data_in_published_files(self):
        for pattern in (r'sk-proj-', r'AIza[0-9A-Za-z_-]{20,}', r'SPREADSHEET_ID', r'PRIVATE_KEY', r'docs\.google\.com/spreadsheets/d/',r'MailApp', r'sendEmail\s*\('):
            self.assertNotRegex(PUBLIC, pattern)
        self.assertIn('https://script.google.com/macros/s/', CONFIG)

    def test_csp_and_external_scripts(self):
        self.assertIn('Content-Security-Policy', HTML)
        self.assertIn('script-src', HTML)
        self.assertIn('script.google.com', HTML)
        self.assertIn('defer src="./assets/js/app.js"', HTML)

    def test_whatsapp_and_cta(self):
        self.assertIn('wa.me/5492634249750', HTML)
        self.assertIn('Hace click acá', HTML)

    def test_duplicate_dom_ids(self):
        ids = re.findall(r'\bid="([^"]+)"', HTML)
        self.assertEqual(len(ids), len(set(ids)))

if __name__=='__main__':
    unittest.main()
