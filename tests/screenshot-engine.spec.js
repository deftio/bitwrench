// The vendored screenshot engine (src/vendor/html2canvas.min.js) must paint
// CSS Color 4 colours. html2canvas 1.4.1 threw on three of the four functions
// below, which aborted every bwserve / bwcli attach screenshot of a page that
// used them (#125). The engine is html2canvas-pro since 2.1.15.
//
// BW_H2C_FILE overrides the engine file, so the test can be run against
// another build (it was shown failing against the 1.4.1 file first).
import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const ENGINE = process.env.BW_H2C_FILE || 'src/vendor/html2canvas.min.js';

const PAGE = `<!DOCTYPE html><html><head><style>
  :root { color-scheme: light }
  div { width: 100px; height: 100px }
  #mix   { background: color-mix(in srgb, #ff0000 50%, #0000ff) }
  #oklch { background: oklch(70% 0.2 150) }
  #ld    { background: light-dark(#00ff00, #ff00ff) }
  #p3    { background: color(display-p3 1 0 0) }
</style></head><body>
  <div id="mix"></div><div id="oklch"></div><div id="ld"></div><div id="p3"></div>
</body></html>`;

test.describe('vendored screenshot engine (#125)', () => {
  test('paints CSS Color 4 backgrounds instead of throwing', async ({ page }) => {
    await page.setContent(PAGE);
    await page.addScriptTag({ content: readFileSync(ENGINE, 'utf8') });
    const result = await page.evaluate(async () => {
      const out = {};
      for (const id of ['mix', 'oklch', 'ld', 'p3']) {
        try {
          const cv = await window.html2canvas(document.getElementById(id), { logging: false });
          const px = cv.getContext('2d').getImageData(50, 50, 1, 1).data;
          out[id] = [px[0], px[1], px[2]];
        } catch (e) {
          out[id] = 'THROWS: ' + String(e && e.message || e);
        }
      }
      return out;
    });
    // Tolerance covers colour-space rounding; a throw or a transparent/black
    // box is far outside it.
    const near = (got, want) => Array.isArray(got) && got.every((v, i) => Math.abs(v - want[i]) <= 6);
    expect(near(result.mix,   [128, 0, 128]), 'color-mix: ' + JSON.stringify(result.mix)).toBe(true);
    expect(near(result.oklch, [0, 191, 84]),  'oklch: ' + JSON.stringify(result.oklch)).toBe(true);
    expect(near(result.ld,    [0, 255, 0]),   'light-dark: ' + JSON.stringify(result.ld)).toBe(true);
    expect(near(result.p3,    [255, 0, 0]),   'color(display-p3): ' + JSON.stringify(result.p3)).toBe(true);
  });

  test('is byte-identical to the html2canvas-pro 2.6.4 npm artifact, with its license beside it', async () => {
    // sha256 of dist/html2canvas-pro.min.js inside the registry tarball for
    // 2.6.4 (tarball sha1 687784cb0e722f5dde63cde30684bd686e3be11f). A vendor
    // bump changes this constant on purpose, in the same change as the
    // changelog line that names the new version.
    const PINNED = '496eb74a3fc6f60349e733cc66ad369c4817e1a4d6fa65778f82bdfa10393cc1';
    const bytes = readFileSync('src/vendor/html2canvas.min.js');
    expect(createHash('sha256').update(bytes).digest('hex')).toBe(PINNED);
    expect(bytes.subarray(0, 200).toString()).toMatch(/html2canvas-pro 2\.6\.4/);
    expect(readFileSync('src/vendor/html2canvas.LICENSE', 'utf8')).toMatch(/MIT License/);
  });
});
