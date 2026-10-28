$ErrorActionPreference = 'Stop'
$engineHome = Join-Path $env:LOCALAPPDATA 'OmniDev\Engine'
Remove-Item (Join-Path ([Environment]::GetFolderPath('Startup')) 'OmniDev-Engine.vbs') -Force -ErrorAction SilentlyContinue
# Stop only Node processes whose command line contains this exact engine installation.
Get-CimInstance Win32_Process -Filter "Name='node.exe'" | Where-Object { $_.CommandLine -and $_.CommandLine.Contains($engineHome) } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }
Remove-Item (Join-Path $engineHome 'supervisor.lock') -Force -ErrorAction SilentlyContinue
Write-Host 'Automatic startup disabled and engine stopped. Account sign-in and job memory were preserved. Use SIGN-OUT.cmd if you also want to revoke local account access.'
