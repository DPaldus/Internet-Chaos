"""Real screenshots of the game for the README.

    python tools/screenshots.py              all shots, English
    python tools/screenshots.py mango-os     just one (see SHOTS in tools/screenshot.html)

Serves the project on a local port, opens tools/screenshot.html?shot=<name> in headless
Microsoft Edge (or Chrome) with a throwaway profile, and saves docs/images/<name>.png at
1600×900. The throwaway profile means your own browser, its saves and settings are never
touched. Needs Python 3.8+ and Edge or Chrome.
"""
import functools
import http.server
import os
import shutil
import subprocess
import sys
import tempfile
import threading

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'docs', 'images')
SHOTS = ['forum-era', 'social-era', 'mango-os', 'style-shop', 'prism-os', 'chaosos-95', 'eras']
SIZE = (1600, 900)
BROWSERS = [
    r'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe',
    r'C:\Program Files\Microsoft\Edge\Application\msedge.exe',
    r'C:\Program Files\Google\Chrome\Application\chrome.exe',
    '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    'microsoft-edge', 'google-chrome', 'chromium',
]


def browser():
    for b in BROWSERS:
        if os.path.exists(b) or shutil.which(b):
            return b
    sys.exit('Microsoft Edge or Google Chrome is needed for screenshots.')


class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass


def serve():
    handler = functools.partial(QuietHandler, directory=ROOT)
    server = http.server.ThreadingHTTPServer(('127.0.0.1', 0), handler)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    return server


def shoot(exe, port, name):
    os.makedirs(OUT, exist_ok=True)
    target = os.path.join(OUT, name + '.png')
    profile = tempfile.mkdtemp(prefix='ichaos-shot-')
    try:
        subprocess.run([
            exe, '--headless=new', '--hide-scrollbars', '--no-first-run', '--no-default-browser-check',
            '--disable-extensions', '--mute-audio', '--user-data-dir=' + profile,
            '--window-size=%d,%d' % SIZE, '--force-device-scale-factor=1', '--virtual-time-budget=15000',
            '--screenshot=' + target, 'http://127.0.0.1:%d/tools/screenshot.html?shot=%s' % (port, name),
        ], check=True, timeout=180, stdin=subprocess.DEVNULL, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    finally:
        shutil.rmtree(profile, ignore_errors=True)
    print('%-12s -> %s (%d KB)' % (name, os.path.relpath(target, ROOT), os.path.getsize(target) // 1024))


def main():
    names = sys.argv[1:] or SHOTS
    exe = browser()
    server = serve()
    try:
        for name in names:
            shoot(exe, server.server_address[1], name)
    finally:
        server.shutdown()


if __name__ == '__main__':
    main()
