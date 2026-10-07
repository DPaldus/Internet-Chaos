"""Production build of the web game.

    python tools/build.py          the player build (no DEV menu)
    python tools/build.py --dev    the same, but with the F8 DEV menu, for testing

Makes dist/ (the folder to upload) and release/internet-chaos-web.zip from it:
  * every script listed in index.html is joined in order into one file,
    js/game.min.js, minified with esbuild: comments and whitespace removed and local
    names shortened, with no source map;
  * css/game.css is minified;
  * index.html loads the single script, loses its comments and indentation, and
    gets cache-busting version stamps;
  * assets/ is copied (without the full-size master logo).

The readable source in js/ and css/ stays as it is; only dist/ is meant for players.
esbuild (a single binary) is downloaded once from the npm registry into tools/.esbuild/
and checked against the registry's SHA-512 before use. Needs Python 3.8+ only.
"""
import base64
import hashlib
import io
import json
import os
import platform
import re
import shutil
import stat
import subprocess
import sys
import tarfile
import tempfile
import urllib.request
import zipfile

ESBUILD_VERSION = '0.25.0'
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DIST = os.path.join(ROOT, 'dist')
CACHE = os.path.join(ROOT, 'tools', '.esbuild')
ZIP_PATH = os.path.join(ROOT, 'release', 'internet-chaos-web.zip')
SKIP_ASSETS = {'internet-chaos-logo.png'}      # full-size master logo; the game uses the smaller copies
DEV_ONLY = {'js/ui/dev.js'}                    # the F8 DEV menu: only in `python tools/build.py --dev`


def esbuild_path():
    """The esbuild binary for this machine, downloaded and verified on first use."""
    system = {'Windows': 'win32', 'Darwin': 'darwin', 'Linux': 'linux'}[platform.system()]
    machine = platform.machine().lower()
    arch = 'arm64' if machine in ('arm64', 'aarch64') else 'x64'
    pkg = '@esbuild/%s-%s' % (system, arch)
    exe = 'esbuild.exe' if system == 'win32' else 'esbuild'
    target = os.path.join(CACHE, ESBUILD_VERSION, exe)
    if os.path.exists(target):
        return target

    print('Downloading %s %s from the npm registry...' % (pkg, ESBUILD_VERSION))
    meta = json.load(urllib.request.urlopen('https://registry.npmjs.org/%s/%s' % (pkg, ESBUILD_VERSION), timeout=30))
    data = urllib.request.urlopen(meta['dist']['tarball'], timeout=120).read()
    algo, expected = meta['dist']['integrity'].split('-', 1)
    if algo != 'sha512' or base64.b64encode(hashlib.sha512(data).digest()).decode() != expected:
        sys.exit('esbuild download failed its integrity check; nothing was installed.')
    inner = 'package/esbuild.exe' if system == 'win32' else 'package/bin/esbuild'
    with tarfile.open(fileobj=io.BytesIO(data), mode='r:gz') as tar:
        binary = tar.extractfile(inner).read()
    os.makedirs(os.path.dirname(target), exist_ok=True)
    with open(target, 'wb') as f:
        f.write(binary)
    os.chmod(target, os.stat(target).st_mode | stat.S_IEXEC)
    return target


def esbuild(args, stdin=None):
    result = subprocess.run([esbuild_path()] + args + ['--log-level=warning'], input=stdin,
                            capture_output=True, cwd=ROOT)
    if result.returncode != 0:
        sys.exit(result.stderr.decode('utf-8', 'replace'))
    return result.stdout


def read(path):
    with open(os.path.join(ROOT, path), encoding='utf-8') as f:
        return f.read()


def write(path, text):
    full = os.path.join(DIST, path)
    os.makedirs(os.path.dirname(full), exist_ok=True)
    with open(full, 'w', encoding='utf-8', newline='\n') as f:
        f.write(text)


def stamp(text):
    return hashlib.sha256(text.encode('utf-8')).hexdigest()[:10]


def build(dev=False):
    if os.path.isdir(DIST):
        shutil.rmtree(DIST)
    os.makedirs(DIST)
    html = read('index.html')

    # 1. Scripts: one bundle, in the order index.html loads them.
    srcs = re.findall(r'<script src="(js/[^"]+)"></script>', html)
    if not srcs:
        sys.exit('No scripts found in index.html.')
    if not dev:
        srcs = [src for src in srcs if src not in DEV_ONLY]
    bundle = ';\n'.join(read(src) for src in srcs) + ';\n'
    with tempfile.NamedTemporaryFile('w', suffix='.js', delete=False, encoding='utf-8') as tmp:
        tmp.write(bundle)
    try:
        js = esbuild([tmp.name, '--minify', '--target=es2020', '--legal-comments=none']).decode('utf-8')
    finally:
        os.unlink(tmp.name)
    write('js/game.min.js', js)

    # 2. Styles.
    css = esbuild(['css/game.css', '--minify', '--legal-comments=none']).decode('utf-8')
    write('css/game.css', css)

    # 3. The page: one script tag, minified inline script, no comments or indentation.
    first = html.index('<script src="js/')
    last = html.rindex('</script>', first, html.index('</body>')) + len('</script>')
    html = html[:first] + '<script src="js/game.min.js?v=%s"></script>' % stamp(js) + html[last:]
    html = html.replace('href="css/game.css"', 'href="css/game.css?v=%s"' % stamp(css))

    def inline(match):
        code = esbuild(['--minify', '--loader=js', '--legal-comments=none'], stdin=match.group(1).encode('utf-8'))
        return '<script>' + code.decode('utf-8').strip() + '</script>'
    html = re.sub(r'<script>(.*?)</script>', inline, html, flags=re.S)
    html = re.sub(r'<!--.*?-->', '', html, flags=re.S)
    html = '\n'.join(line.strip() for line in html.splitlines() if line.strip()) + '\n'
    write('index.html', html)

    # 4. Assets.
    for name in os.listdir(os.path.join(ROOT, 'assets')):
        if name not in SKIP_ASSETS:
            os.makedirs(os.path.join(DIST, 'assets'), exist_ok=True)
            shutil.copy2(os.path.join(ROOT, 'assets', name), os.path.join(DIST, 'assets', name))

    # 5. No source maps anywhere.
    for folder, _, files in os.walk(DIST):
        for name in files:
            if name.endswith('.map'):
                sys.exit('A source map ended up in dist/: ' + name)
            if name.endswith(('.js', '.css')) and 'sourceMappingURL' in read(os.path.join(folder, name)):
                sys.exit('A source map reference ended up in ' + name)

    # 6. The release zip for itch.io or any static host: dist/ at the zip root.
    os.makedirs(os.path.dirname(ZIP_PATH), exist_ok=True)
    if os.path.exists(ZIP_PATH):
        os.remove(ZIP_PATH)
    with zipfile.ZipFile(ZIP_PATH, 'w', zipfile.ZIP_DEFLATED, compresslevel=9) as z:
        for folder, _, files in os.walk(DIST):
            for name in sorted(files):
                full = os.path.join(folder, name)
                z.write(full, os.path.relpath(full, DIST).replace(os.sep, '/'))

    print('dist/ ready: %d scripts -> js/game.min.js (%d KB, was %d KB)' % (len(srcs), len(js) // 1024, len(bundle) // 1024))
    print('Release ready: %s (%d KB)' % (ZIP_PATH, os.path.getsize(ZIP_PATH) // 1024))


if __name__ == '__main__':
    build(dev='--dev' in sys.argv[1:])
