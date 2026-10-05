"""Internet Chaos — Windows desktop launcher.

Opens the game in a native window (pywebview on the Edge WebView2 runtime that ships
with Windows 11). The game files are served from a fixed local port so the page origin,
and therefore its saved progress, stays the same between launches. Every save is also
mirrored to %APPDATA%\\Internet Chaos\\save.json.

Run from source:   .venv\\Scripts\\python.exe desktop\\app.py
Build the .exe:    build.bat   (or .venv\\Scripts\\python.exe desktop\\build.py)
"""

import ctypes
import json
import os
import socket
import sys
import threading
import time

import webview

APP_TITLE = 'Internet Chaos'
MUTEX_NAME = 'InternetChaos.SingleInstance'
PORTS = (43117, 43127, 43137, 43147)          # first free one is used; the first is the norm
MAX_SAVE_BYTES = 5 * 1024 * 1024

APPDATA = os.environ.get('APPDATA') or os.path.expanduser('~')
DATA_DIR = os.path.join(APPDATA, 'Internet Chaos')
LEGACY_DATA_DIR = os.path.join(APPDATA, 'Zuha Internet Chaos')   # used before the game was renamed
SAVE_FILE = os.path.join(DATA_DIR, 'save.json')
WEBVIEW_DIR = os.path.join(DATA_DIR, 'webview')


def migrate_legacy_data():
    """Moves saves and app storage from the old data folder the first time the renamed app runs."""
    if os.path.isdir(LEGACY_DATA_DIR) and not os.path.exists(DATA_DIR):
        try:
            os.replace(LEGACY_DATA_DIR, DATA_DIR)
        except OSError:
            pass  # the game still restores from the save file it finds, or starts fresh


def resource_root():
    """Folder holding index.html: the PyInstaller bundle, or the project when run from source."""
    bundled = getattr(sys, '_MEIPASS', None)
    if bundled:
        return bundled
    return os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def message_box(text, title=APP_TITLE):
    ctypes.windll.user32.MessageBoxW(None, text, title, 0x40)


def already_running():
    """Holds a named mutex for the life of the process; True if another copy owns it."""
    kernel32 = ctypes.windll.kernel32
    kernel32.CreateMutexW(None, False, MUTEX_NAME)
    return kernel32.GetLastError() == 183  # ERROR_ALREADY_EXISTS


def free_port():
    for port in PORTS:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            try:
                s.bind(('127.0.0.1', port))
                return port
            except OSError:
                continue
    return None


def portrait_size():
    """A tall, phone-like window that fits the primary screen above the taskbar."""
    try:
        screen = webview.screens[0]
        avail = screen.height
    except Exception:
        avail = 1080
    height = max(560, min(1000, avail - 90))
    return 520, height


def write_atomic(path, text):
    tmp = path + '.tmp'
    with open(tmp, 'w', encoding='utf-8') as f:
        f.write(text)
    os.replace(tmp, path)


class Api:
    """Methods the game can call through window.pywebview.api. Inputs are validated:
    only strings that parse as JSON objects are ever written as the save file."""

    def __init__(self):
        self._window = None

    def read_save(self):
        try:
            if os.path.getsize(SAVE_FILE) > MAX_SAVE_BYTES:
                return None
            with open(SAVE_FILE, encoding='utf-8') as f:
                return f.read()
        except OSError:
            return None

    def write_save(self, text):
        if not isinstance(text, str) or len(text) > MAX_SAVE_BYTES:
            return False
        try:
            if not isinstance(json.loads(text), dict):
                return False
        except ValueError:
            return False
        os.makedirs(DATA_DIR, exist_ok=True)
        if os.path.exists(SAVE_FILE):
            try:
                os.replace(SAVE_FILE, SAVE_FILE + '.bak')
            except OSError:
                pass
        write_atomic(SAVE_FILE, text)
        return True

    def export_save(self, text, filename):
        if not isinstance(text, str) or not text or len(text) > MAX_SAVE_BYTES or self._window is None:
            return None
        name = os.path.basename(str(filename or 'internet-chaos-save.txt')) or 'internet-chaos-save.txt'
        result = self._window.create_file_dialog(
            webview.FileDialog.SAVE,
            directory=os.path.join(os.path.expanduser('~'), 'Documents'),
            save_filename=name,
            file_types=('Text files (*.txt)', 'All files (*.*)'),
        )
        if not result:
            return None
        path = result if isinstance(result, str) else result[0]
        with open(path, 'w', encoding='utf-8') as f:
            f.write(text)
        return path

    def toggle_fullscreen(self):
        if self._window is not None:
            self._window.toggle_fullscreen()
        return True


SAVE_ON_CLOSE_JS = (
    "(function(){ try { if (window.ICHAOS && ICHAOS.game) {"
    " ICHAOS.save.write(ICHAOS.game.s); return JSON.stringify(ICHAOS.game.s); } } catch (e) {} return null; })()"
)


def main():
    selftest = '--selftest' in sys.argv

    if not selftest and already_running():
        message_box('Internet Chaos is already running.')
        return

    port = free_port()
    if port is None:
        message_box('Could not start the game: the local ports it needs are all in use.')
        return

    migrate_legacy_data()
    os.makedirs(WEBVIEW_DIR, exist_ok=True)
    root = resource_root()
    icon = os.path.join(root, 'icon.ico')
    if not os.path.exists(icon):
        icon = os.path.join(root, 'desktop', 'icon.ico')

    width, height = portrait_size()
    api = Api()
    window = webview.create_window(
        APP_TITLE,
        url=os.path.join(root, 'index.html'),
        js_api=api,
        width=width,
        height=height,
        min_size=(380, 560),
        background_color='#1d6b6b',
        text_select=True,
        hidden=selftest,
    )
    api._window = window

    # Saving needs the page, but evaluate_js inside the closing event would deadlock the
    # UI thread. So the first close is cancelled, the save runs on a worker thread
    # (capped at a few seconds), and then the window is closed for real.
    close_state = {'saved': False}

    def save_then_close():
        def save():
            try:
                state = window.evaluate_js(SAVE_ON_CLOSE_JS)
                if isinstance(state, str):
                    api.write_save(state)
            except Exception:
                pass
        worker = threading.Thread(target=save, daemon=True)
        worker.start()
        worker.join(3)
        close_state['saved'] = True
        window.destroy()

    def on_closing():
        if close_state['saved']:
            return True
        threading.Thread(target=save_then_close, daemon=True).start()
        return False

    window.events.closing += on_closing

    def run_selftest(win):
        """Boots the game hidden, checks it is alive and writes a report, then quits."""
        report = {'ok': False}
        try:
            win.events.loaded.wait(30)
            time.sleep(4)
            info = win.evaluate_js(
                "JSON.stringify({game: !!(window.ICHAOS && ICHAOS.game), era: ICHAOS.game && ICHAOS.game.s.era, created: ICHAOS.game && ICHAOS.game.s.created,"
                " desktop: !!(ICHAOS.desktop && ICHAOS.desktop.active), origin: location.origin,"
                " storage: (function(){try{return !!localStorage.getItem(ICHAOS.SAVE_KEY);}catch(e){return 'error';}})()})"
            )
            report = json.loads(info)
            report['ok'] = bool(report.get('game'))
            report['saveFile'] = os.path.exists(SAVE_FILE)
        except Exception as err:  # report, never crash the self-test
            report['error'] = repr(err)
        out = os.path.join(DATA_DIR, 'selftest.json')
        with open(out, 'w', encoding='utf-8') as f:
            json.dump(report, f)
        win.destroy()

    webview.start(
        run_selftest if selftest else None,
        window if selftest else None,
        gui='edgechromium',
        http_server=True,
        http_port=port,
        private_mode=False,
        storage_path=WEBVIEW_DIR,
        icon=icon if os.path.exists(icon) else None,
    )


if __name__ == '__main__':
    main()
    os._exit(0)  # never leave a background process holding the single-instance lock
