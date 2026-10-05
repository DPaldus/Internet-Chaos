@echo off
rem Builds dist\Internet Chaos.exe. First run creates a private Python environment in .venv.
setlocal
cd /d "%~dp0"
chcp 65001 >nul

if not exist ".venv\Scripts\python.exe" (
  echo Creating build environment...
  python -m venv .venv || goto :fail
  ".venv\Scripts\python.exe" -m pip install --disable-pip-version-check pywebview pyinstaller pillow || goto :fail
)

".venv\Scripts\python.exe" desktop\build.py %* || goto :fail
echo.
echo Done: dist\Internet Chaos.exe
pause
exit /b 0

:fail
echo.
echo Build failed. See the messages above.
pause
exit /b 1
