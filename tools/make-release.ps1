# Packs the web game into release\internet-chaos-web.zip for itch.io or any static host.
# Run from anywhere:  pwsh -File tools\make-release.ps1
# The zip holds index.html at its root plus css\, js\ and assets\ (no tools, no saves).

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.IO.Compression, System.IO.Compression.FileSystem

$root = Split-Path $PSScriptRoot -Parent
$outDir = Join-Path $root 'release'
$zipPath = Join-Path $outDir 'internet-chaos-web.zip'
$skip = @('assets/internet-chaos-logo.png')   # full-size master logo; the game uses the smaller copies

New-Item -ItemType Directory -Force $outDir | Out-Null
if (Test-Path $zipPath) { Remove-Item $zipPath }

$files = @(Get-Item (Join-Path $root 'index.html'))
foreach ($dir in 'css', 'js', 'assets') { $files += Get-ChildItem (Join-Path $root $dir) -Recurse -File }

$zip = [System.IO.Compression.ZipFile]::Open($zipPath, 'Create')
try {
  foreach ($f in $files) {
    # Forward slashes, so every unzip tool (itch.io included) sees real folders.
    $entry = $f.FullName.Substring($root.Length + 1).Replace('\', '/')
    if ($skip -contains $entry -or $entry -match '(^|/)_') { continue }
    [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, $f.FullName, $entry, 'Optimal') | Out-Null
  }
} finally {
  $zip.Dispose()
}
'Release ready: {0} ({1:N0} KB)' -f $zipPath, ((Get-Item $zipPath).Length / 1KB)
