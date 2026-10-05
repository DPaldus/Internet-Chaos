"""Builds dist/Internet Chaos.exe (a single self-contained Windows executable).

Usage (from the project folder):
    .venv\\Scripts\\python.exe desktop\\build.py              build the .exe
    .venv\\Scripts\\python.exe desktop\\build.py --shortcut   build, then add a Desktop shortcut

build.bat does the same and creates the .venv on first use.
"""

import os
import shutil
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
ICON = os.path.join(HERE, 'icon.ico')
EXE_NAME = 'Internet Chaos'
SHORTCUT_NAME = 'Internet Chaos.lnk'


def make_icon():
    """Draws the app icon: a hot-pink tile with a chunky white "IC" and a Tolerance-notch stripe."""
    from PIL import Image, ImageDraw, ImageFont

    size = 256
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    grad = Image.new('RGBA', (size, size))
    gd = ImageDraw.Draw(grad)
    top, bottom = (255, 79, 139), (122, 18, 110)
    for y in range(size):
        t = y / (size - 1)
        gd.line([(0, y), (size, y)], fill=tuple(int(top[i] + (bottom[i] - top[i]) * t) for i in range(3)) + (255,))
    mask = Image.new('L', (size, size), 0)
    ImageDraw.Draw(mask).rounded_rectangle([8, 8, size - 8, size - 8], radius=52, fill=255)
    img.paste(grad, (0, 0), mask)

    d = ImageDraw.Draw(img)
    d.rounded_rectangle([8, 8, size - 8, size - 8], radius=52, outline=(30, 6, 40, 255), width=8)
    d.rectangle([44, 196, 212, 210], fill=(29, 107, 107, 255))       # the "Tolerance" stripe
    d.polygon([(150, 186), (170, 186), (160, 198)], fill=(255, 204, 0, 255))

    font = None
    for name in ('impact.ttf', 'ariblk.ttf', 'arialbd.ttf'):
        try:
            font = ImageFont.truetype(os.path.join(os.environ.get('WINDIR', 'C:\\Windows'), 'Fonts', name), 150)
            break
        except OSError:
            continue
    font = font or ImageFont.load_default()
    box = d.textbbox((0, 0), 'IC', font=font)
    w, h = box[2] - box[0], box[3] - box[1]
    x, y = (size - w) / 2 - box[0], (size - h) / 2 - box[1] - 14
    d.text((x + 8, y + 8), 'IC', font=font, fill=(30, 6, 40, 200))
    d.text((x, y), 'IC', font=font, fill=(255, 255, 255, 255))

    img.save(ICON, sizes=[(16, 16), (24, 24), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)])
    print('icon written:', ICON)


def build():
    sep = os.pathsep  # PyInstaller --add-data uses ';' on Windows
    data = [
        ('index.html', '.'),
        ('css', 'css'),
        ('js', 'js'),
        (os.path.join('desktop', 'icon.ico'), '.'),
    ]
    args = [
        sys.executable, '-m', 'PyInstaller',
        '--noconfirm', '--clean', '--onefile', '--windowed',
        '--name', EXE_NAME,
        '--icon', ICON,
        '--distpath', os.path.join(ROOT, 'dist'),
        '--workpath', os.path.join(ROOT, 'build'),
        '--specpath', os.path.join(ROOT, 'build'),
    ]
    for src, dest in data:
        args += ['--add-data', os.path.join(ROOT, src) + sep + dest]
    args.append(os.path.join(HERE, 'app.py'))
    subprocess.run(args, check=True, cwd=ROOT)
    exe = os.path.join(ROOT, 'dist', EXE_NAME + '.exe')
    print('built:', exe, '(%.1f MB)' % (os.path.getsize(exe) / 1e6))
    return exe


def make_shortcut(exe):
    desktop = os.path.join(os.path.expanduser('~'), 'Desktop')
    link = os.path.join(desktop, SHORTCUT_NAME)
    ps = (
        "$s = (New-Object -ComObject WScript.Shell).CreateShortcut($env:ZLINK);"
        "$s.TargetPath = $env:ZEXE; $s.WorkingDirectory = $env:ZDIR;"
        "$s.IconLocation = $env:ZEXE + ',0'; $s.Description = 'Internet Chaos'; $s.Save()"
    )
    env = dict(os.environ, ZLINK=link, ZEXE=exe, ZDIR=os.path.dirname(exe))
    subprocess.run(['powershell', '-NoProfile', '-Command', ps], check=True, env=env)
    print('shortcut:', link)


if __name__ == '__main__':
    if not os.path.exists(ICON) or '--icon' in sys.argv:
        make_icon()
    exe_path = build()
    if '--shortcut' in sys.argv:
        make_shortcut(exe_path)
    shutil.rmtree(os.path.join(ROOT, 'build'), ignore_errors=True)
