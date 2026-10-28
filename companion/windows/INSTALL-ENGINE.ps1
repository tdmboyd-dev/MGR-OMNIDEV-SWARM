$ErrorActionPreference = 'Stop'
$source = Split-Path -Parent $MyInvocation.MyCommand.Path
$engineHome = Join-Path $env:LOCALAPPDATA 'OmniDev\Engine'
$node = (Get-Command node -ErrorAction Stop).Source
if ([int]((& $node -p 'process.versions.node.split(".")[0]')) -lt 22) { throw 'Install Node.js 22 or newer from nodejs.org first.' }
New-Item -ItemType Directory -Force -Path $engineHome | Out-Null
Copy-Item (Join-Path $source 'engine\supervisor.mjs') (Join-Path $engineHome 'supervisor.mjs') -Force
Copy-Item (Join-Path $source 'engine\public-key.pem') (Join-Path $engineHome 'public-key.pem') -Force
$release = Get-Content (Join-Path $source 'engine-release.json') -Raw | ConvertFrom-Json
# Verification and extraction happen in Node, before any release starts.
& $node (Join-Path $source 'engine\install.mjs') $engineHome (Join-Path $source 'engine-release.json')
if ($LASTEXITCODE -ne 0) { throw 'Engine release verification failed.' }
$launcher = Join-Path $engineHome 'start.vbs'
$command = '"' + $node + '" "' + (Join-Path $engineHome 'supervisor.mjs') + '"'
'Set shell = CreateObject("WScript.Shell")', ('shell.Run "' + $command.Replace('"','""') + '", 0, False') | Set-Content $launcher
$startup = [Environment]::GetFolderPath('Startup')
Copy-Item $launcher (Join-Path $startup 'OmniDev-Engine.vbs') -Force
Start-Process wscript.exe -ArgumentList ('"' + $launcher + '"')
Write-Host 'OmniDev Engine installed. It starts when you sign in to Windows. Return to OmniDev.'
