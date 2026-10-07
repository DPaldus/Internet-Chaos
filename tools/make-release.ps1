# Builds the minified web game (dist\) and release\internet-chaos-web.zip for itch.io.
# Run from anywhere:  pwsh -File tools\make-release.ps1   (same as: python tools\build.py)

$ErrorActionPreference = 'Stop'
python (Join-Path $PSScriptRoot 'build.py')
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
