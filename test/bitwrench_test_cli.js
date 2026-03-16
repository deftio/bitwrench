/**
 * Bitwrench CLI - Unit + Integration tests
 * Tests the single-file conversion pipeline
 */

import { strict as assert } from 'node:assert';
import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = resolve(fileURLToPath(import.meta.url), '..');

const fixtureDir = join(__dirname, 'fixtures', 'cli', 'tmp');
const binPath = resolve(__dirname, '..', 'bin', 'bwcli.js');

// Dynamically import CLI modules
let convertFile, resolveTheme, deriveOutputPath, extractMarkdownTitle, extractHtmlTitle, THEME_PRESETS;
let getInjectionHead, getInjectionBodyEnd;

before(async () => {
    const convert = await import('../src/cli/convert.js');
    convertFile = convert.convertFile;
    resolveTheme = convert.resolveTheme;
    deriveOutputPath = convert.deriveOutputPath;
    extractMarkdownTitle = convert.extractMarkdownTitle;
    extractHtmlTitle = convert.extractHtmlTitle;
    THEME_PRESETS = convert.THEME_PRESETS;

    const inject = await import('../src/cli/inject.js');
    getInjectionHead = inject.getInjectionHead;
    getInjectionBodyEnd = inject.getInjectionBodyEnd;

    // Set up fixture directory
    mkdirSync(fixtureDir, { recursive: true });
});

after(() => {
    // Clean up fixture directory
    if (existsSync(fixtureDir)) {
        rmSync(fixtureDir, { recursive: true, force: true });
    }
});

// Helper to write a fixture file and return its path
function writeFixture(name, content) {
    const path = join(fixtureDir, name);
    writeFileSync(path, content, 'utf8');
    return path;
}

describe('CLI: convert.js pipeline', function () {

    describe('Markdown conversion', function () {
        it('should convert a markdown file to HTML', function () {
            const input = writeFixture('test.md', '# Hello World\n\nThis is a test.');
            const output = join(fixtureDir, 'test-out.html');
            const result = convertFile(input, { output });
            assert.equal(result, output);
            const html = readFileSync(output, 'utf8');
            assert.ok(html.includes('<!DOCTYPE html>'));
            assert.ok(html.includes('Hello World'));
            assert.ok(html.includes('This is a test'));
        });

        it('should auto-detect title from first # heading', function () {
            const input = writeFixture('title.md', '# My Document Title\n\nContent here.');
            const output = join(fixtureDir, 'title-out.html');
            convertFile(input, { output });
            const html = readFileSync(output, 'utf8');
            assert.ok(html.includes('<title>My Document Title</title>'));
        });

        it('should use --title override over auto-detected title', function () {
            const input = writeFixture('override.md', '# Auto Title\n\nContent.');
            const output = join(fixtureDir, 'override-out.html');
            convertFile(input, { output, title: 'Custom Title' });
            const html = readFileSync(output, 'utf8');
            assert.ok(html.includes('<title>Custom Title</title>'));
            assert.ok(!html.includes('<title>Auto Title</title>'));
        });

        it('should use filename as title when no heading present', function () {
            const input = writeFixture('no-heading.md', 'Just some text without a heading.');
            const output = join(fixtureDir, 'no-heading-out.html');
            convertFile(input, { output });
            const html = readFileSync(output, 'utf8');
            assert.ok(html.includes('<title>no-heading</title>'));
        });

        it('should include quikdown styles for markdown files', function () {
            const input = writeFixture('styles.md', '# Test\n\nContent.');
            const output = join(fixtureDir, 'styles-out.html');
            convertFile(input, { output });
            const html = readFileSync(output, 'utf8');
            assert.ok(html.includes('.quikdown-'));
        });

        it('should derive output path from input when no --output given', function () {
            const input = writeFixture('derive.md', '# Test');
            const result = convertFile(input);
            assert.ok(result.endsWith('derive.html'));
            assert.ok(existsSync(result));
            // Clean up
            rmSync(result);
        });
    });

    describe('HTML conversion', function () {
        it('should handle HTML fragment (no doctype)', function () {
            const input = writeFixture('fragment.html', '<div><p>Hello</p></div>');
            const output = join(fixtureDir, 'fragment-out.html');
            convertFile(input, { output });
            const html = readFileSync(output, 'utf8');
            assert.ok(html.includes('<!DOCTYPE html>'));
            assert.ok(html.includes('<div><p>Hello</p></div>'));
        });

        it('should extract body and title from full HTML document', function () {
            const fullDoc = '<!DOCTYPE html><html><head><title>My Page</title></head><body><h1>Content</h1></body></html>';
            const input = writeFixture('full.html', fullDoc);
            const output = join(fixtureDir, 'full-out.html');
            convertFile(input, { output });
            const html = readFileSync(output, 'utf8');
            assert.ok(html.includes('<title>My Page</title>'));
            assert.ok(html.includes('<h1>Content</h1>'));
        });
    });

    describe('JSON conversion', function () {
        it('should render TACO JSON as HTML', function () {
            const taco = JSON.stringify({ t: 'div', a: { class: 'test' }, c: 'Hello TACO' });
            const input = writeFixture('taco.json', taco);
            const output = join(fixtureDir, 'taco-out.html');
            convertFile(input, { output });
            const html = readFileSync(output, 'utf8');
            assert.ok(html.includes('Hello TACO'));
            assert.ok(html.includes('class="test"'));
        });

        it('should pretty-print plain JSON as code block', function () {
            const data = JSON.stringify({ name: 'bitwrench', version: '2.0.4' });
            const input = writeFixture('plain.json', data);
            const output = join(fixtureDir, 'plain-out.html');
            convertFile(input, { output });
            const html = readFileSync(output, 'utf8');
            assert.ok(html.includes('<pre><code>'));
            assert.ok(html.includes('bitwrench'));
        });

        it('should throw on invalid JSON', function () {
            const input = writeFixture('bad.json', '{ not valid json }');
            const output = join(fixtureDir, 'bad-out.html');
            assert.throws(() => convertFile(input, { output }));
        });
    });

    describe('Error handling', function () {
        it('should throw on missing file', function () {
            assert.throws(() => convertFile('/nonexistent/file.md', { output: '/tmp/x.html' }));
        });

        it('should throw on unsupported extension', function () {
            const input = writeFixture('test.xyz', 'some content');
            const output = join(fixtureDir, 'test-xyz-out.html');
            assert.throws(() => convertFile(input, { output }), /Unsupported file type/);
        });
    });

    describe('Theme support', function () {
        it('should apply a preset theme', function () {
            const input = writeFixture('theme.md', '# Themed\n\nContent.');
            const output = join(fixtureDir, 'theme-out.html');
            convertFile(input, { output, theme: 'ocean' });
            const html = readFileSync(output, 'utf8');
            // Theme CSS should be included
            assert.ok(html.includes('<style>'));
            // Output should be larger than without a theme (more CSS)
            const plainOutput = join(fixtureDir, 'plain-theme.html');
            convertFile(input, { output: plainOutput });
            const plainHtml = readFileSync(plainOutput, 'utf8');
            assert.ok(html.length > plainHtml.length);
        });

        it('should apply hex color theme', function () {
            const input = writeFixture('hex-theme.md', '# Test\n\nContent.');
            const output = join(fixtureDir, 'hex-theme-out.html');
            convertFile(input, { output, theme: '#336699,#cc6633' });
            const html = readFileSync(output, 'utf8');
            assert.ok(html.includes('<style>'));
        });

        it('should throw on unknown theme name', function () {
            const input = writeFixture('bad-theme.md', '# Test');
            const output = join(fixtureDir, 'bad-theme-out.html');
            assert.throws(() => convertFile(input, { output, theme: 'nonexistent' }), /Unknown theme/);
        });
    });

    describe('CSS file inclusion', function () {
        it('should include external CSS file', function () {
            const cssContent = '.custom { color: red; }';
            const cssFile = writeFixture('custom.css', cssContent);
            const input = writeFixture('with-css.md', '# Test');
            const output = join(fixtureDir, 'with-css-out.html');
            convertFile(input, { output, css: cssFile });
            const html = readFileSync(output, 'utf8');
            assert.ok(html.includes('.custom { color: red; }'));
        });
    });

    describe('Highlight.js', function () {
        it('should include highlight.js when --highlight is set', function () {
            const input = writeFixture('hl.md', '# Test\n\n```js\nconsole.log("hi");\n```');
            const output = join(fixtureDir, 'hl-out.html');
            convertFile(input, { output, highlight: true });
            const html = readFileSync(output, 'utf8');
            assert.ok(html.includes('highlight.min.js'));
            assert.ok(html.includes('hljs.highlightAll()'));
        });

        it('should not include highlight.js by default', function () {
            const input = writeFixture('no-hl.md', '# Test');
            const output = join(fixtureDir, 'no-hl-out.html');
            convertFile(input, { output });
            const html = readFileSync(output, 'utf8');
            assert.ok(!html.includes('highlight.min.js'));
        });
    });

    describe('Favicon', function () {
        it('should include favicon when specified', function () {
            const input = writeFixture('fav.md', '# Test');
            const output = join(fixtureDir, 'fav-out.html');
            convertFile(input, { output, favicon: '/favicon.ico' });
            const html = readFileSync(output, 'utf8');
            assert.ok(html.includes('rel="icon"'));
            assert.ok(html.includes('/favicon.ico'));
        });
    });
});

describe('CLI: inject.js', function () {
    it('should return empty string for none mode (head)', function () {
        assert.equal(getInjectionHead('none'), '');
    });

    it('should return empty string for none mode (body)', function () {
        assert.equal(getInjectionBodyEnd('none'), '');
    });

    it('should return CDN script tag for cdn mode', function () {
        const head = getInjectionHead('cdn');
        assert.ok(head.includes('cdn.jsdelivr.net'));
        assert.ok(head.includes('bitwrench.umd.min.js'));
        assert.ok(head.includes('<script'));
    });

    it('should return inline script for standalone mode', function () {
        const head = getInjectionHead('standalone');
        assert.ok(head.includes('<script>'));
        assert.ok(head.length > 1000); // UMD bundle is large
    });

    it('should return loadStyles script for cdn body injection', function () {
        const body = getInjectionBodyEnd('cdn');
        assert.ok(body.includes('bw.loadStyles'));
    });

    it('should return loadStyles script for standalone body injection', function () {
        const body = getInjectionBodyEnd('standalone');
        assert.ok(body.includes('bw.loadStyles'));
    });
});

describe('CLI: utility functions', function () {
    describe('resolveTheme', function () {
        it('should resolve preset names', function () {
            const config = resolveTheme('ocean');
            assert.ok(config.primary);
            assert.ok(config.secondary);
        });

        it('should be case-insensitive for presets', function () {
            const config = resolveTheme('Ocean');
            assert.ok(config.primary);
        });

        it('should parse hex color pairs', function () {
            const config = resolveTheme('#336699,#cc6633');
            assert.equal(config.primary, '#336699');
            assert.equal(config.secondary, '#cc6633');
        });

        it('should parse hex color triples', function () {
            const config = resolveTheme('#336699,#cc6633,#993366');
            assert.equal(config.primary, '#336699');
            assert.equal(config.secondary, '#cc6633');
            assert.equal(config.tertiary, '#993366');
        });

        it('should return null for falsy input', function () {
            assert.equal(resolveTheme(null), null);
            assert.equal(resolveTheme(''), null);
        });

        it('should throw for unknown theme names', function () {
            assert.throws(() => resolveTheme('badname'), /Unknown theme/);
        });
    });

    describe('deriveOutputPath', function () {
        it('should replace .md with .html', function () {
            assert.equal(deriveOutputPath('/path/to/file.md'), '/path/to/file.html');
        });

        it('should replace .json with .html', function () {
            assert.equal(deriveOutputPath('/path/to/data.json'), '/path/to/data.html');
        });
    });

    describe('extractMarkdownTitle', function () {
        it('should extract h1 from markdown', function () {
            assert.equal(extractMarkdownTitle('# My Title\n\ncontent'), 'My Title');
        });

        it('should return null when no h1', function () {
            assert.equal(extractMarkdownTitle('just text\n\nmore text'), null);
        });

        it('should not match h2 or deeper', function () {
            assert.equal(extractMarkdownTitle('## Not H1\n\ncontent'), null);
        });
    });

    describe('extractHtmlTitle', function () {
        it('should extract title from HTML', function () {
            assert.equal(extractHtmlTitle('<html><head><title>My Page</title></head></html>'), 'My Page');
        });

        it('should return null when no title tag', function () {
            assert.equal(extractHtmlTitle('<html><head></head></html>'), null);
        });
    });

    describe('THEME_PRESETS', function () {
        it('should have all 12 built-in presets', function () {
            const expected = ['teal', 'ocean', 'sunset', 'forest', 'slate', 'rose', 'indigo', 'amber', 'emerald', 'nord', 'coral', 'midnight'];
            for (const name of expected) {
                assert.ok(THEME_PRESETS[name], `missing preset: ${name}`);
            }
            assert.equal(Object.keys(THEME_PRESETS).length, 12);
        });

        it('each preset should have primary and secondary', function () {
            for (const [name, preset] of Object.entries(THEME_PRESETS)) {
                assert.ok(preset.primary, `${name} missing primary`);
                assert.ok(preset.secondary, `${name} missing secondary`);
            }
        });
    });
});

describe('CLI: integration tests', function () {
    it('should print version with --version', function () {
        const result = execSync(`node ${binPath} --version`, { encoding: 'utf8' });
        assert.ok(result.includes('bwcli v'));
        // Dynamically check version matches package.json
        const pkg = JSON.parse(readFileSync(resolve(binPath, '..', '..', 'package.json'), 'utf8'));
        assert.ok(result.includes(pkg.version), `Expected version ${pkg.version} in output: ${result.trim()}`);
    });

    it('should print help with --help', function () {
        const result = execSync(`node ${binPath} --help`, { encoding: 'utf8' });
        assert.ok(result.includes('Usage:'));
        assert.ok(result.includes('--output'));
        assert.ok(result.includes('--theme'));
    });

    it('should exit with error for no args', function () {
        try {
            execSync(`node ${binPath} 2>&1`, { encoding: 'utf8' });
            assert.fail('Should have thrown');
        } catch (err) {
            assert.ok(err.stderr.includes('No input file') || err.stdout.includes('No input file'));
        }
    });

    it('should convert a markdown file end-to-end', function () {
        const input = writeFixture('e2e.md', '# End to End\n\nThis works.');
        const output = join(fixtureDir, 'e2e-out.html');
        execSync(`node ${binPath} ${input} -o ${output}`, { encoding: 'utf8' });
        const html = readFileSync(output, 'utf8');
        assert.ok(html.includes('End to End'));
        assert.ok(html.includes('<!DOCTYPE html>'));
    });

    it('should convert with --standalone flag', function () {
        const input = writeFixture('standalone-e2e.md', '# Standalone\n\nOffline ready.');
        const output = join(fixtureDir, 'standalone-e2e-out.html');
        execSync(`node ${binPath} ${input} -o ${output} --standalone`, { encoding: 'utf8' });
        const html = readFileSync(output, 'utf8');
        assert.ok(html.length > 50000); // UMD bundle inlined
    });

    it('should convert with --cdn flag', function () {
        const input = writeFixture('cdn-e2e.md', '# CDN\n\nWith CDN.');
        const output = join(fixtureDir, 'cdn-e2e-out.html');
        execSync(`node ${binPath} ${input} -o ${output} --cdn`, { encoding: 'utf8' });
        const html = readFileSync(output, 'utf8');
        assert.ok(html.includes('cdn.jsdelivr.net'));
    });

    it('should convert with --theme flag', function () {
        const input = writeFixture('theme-e2e.md', '# Themed\n\nWith ocean theme.');
        const output = join(fixtureDir, 'theme-e2e-out.html');
        execSync(`node ${binPath} ${input} -o ${output} --theme ocean`, { encoding: 'utf8' });
        const html = readFileSync(output, 'utf8');
        assert.ok(html.length > 10000); // Theme CSS included
    });

    it('should include generator meta tag', function () {
        const input = writeFixture('meta.md', '# Meta\n\nGenerator tag.');
        const output = join(fixtureDir, 'meta-out.html');
        convertFile(input, { output });
        const html = readFileSync(output, 'utf8');
        assert.ok(html.includes('name="generator"'));
        assert.ok(html.includes('bitwrench v'));
    });
});
