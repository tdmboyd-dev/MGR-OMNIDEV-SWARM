#Requires -Version 7.0
param([Parameter(Mandatory)][string]$ManifestPath,[switch]$Recover)
$ErrorActionPreference='Stop'
try {
 $manifest=Get-Content -LiteralPath $ManifestPath -Raw | ConvertFrom-Json
 if($manifest.format -ne 'omnidev-native-attempt/v1'){throw 'Invalid native manifest'}
 $root=[IO.Path]::GetFullPath($manifest.root)
 if([IO.Path]::GetFileName($root) -notmatch '^omni-native-[a-f0-9-]{36}$'){throw 'Invalid owned attempt root'}
 $marker=Get-Content -LiteralPath (Join-Path $root '.omni-owned.json') -Raw | ConvertFrom-Json
 if($marker.nonce -ne $manifest.nonce -or $marker.profileName -ne $manifest.profileName){throw 'Owned attempt identity mismatch'}
 Add-Type -Path (Join-Path $PSScriptRoot 'AppContainerHost.cs')
 if($Recover){
  $journalPath=$root+'.host-state.json'
  if(-not(Test-Path -LiteralPath $journalPath)){throw 'No owned profile creation receipt'}
  if(Test-Path -LiteralPath $journalPath){$journal=Get-Content -LiteralPath $journalPath -Raw|ConvertFrom-Json;if(-not$journal.profileCreated -or $journal.profileName -ne $manifest.profileName){throw 'Recovery identity mismatch'};if([int]$journal.processId -gt 0 -and (Get-Process -Id ([int]$journal.processId) -ErrorAction SilentlyContinue)){throw 'Owned process cleanup still unverified'}}
  $deleted=[OmniAppContainerHost]::DeleteOwnedProfile([string]$manifest.profileName)
  $profileStorage=Join-Path $env:LOCALAPPDATA ('Packages/'+$manifest.profileName)
  [pscustomobject]@{ProfileDeletionHResult=$deleted;CleanupVerified=($deleted -eq 0 -and -not(Test-Path -LiteralPath $profileStorage))}|ConvertTo-Json -Compress
  exit 0
 }
 $result=[OmniAppContainerHost]::Run($root,(Join-Path $root 'runtime/node.exe'),(Join-Path $root 'source'),[string[]]$manifest.arguments,[int]$manifest.timeoutMs,[int]$manifest.outputLimit,[string]$manifest.profileName,[int]$manifest.probeBeforeResumeMs)
 $result | ConvertTo-Json -Depth 8 -Compress
} catch {
 $errorValue=$_.Exception
 while($errorValue.InnerException){$errorValue=$errorValue.InnerException}
 # No command, source, credential or arbitrary exception text is returned.
 [pscustomobject]@{error='native-launch-failed';code=$errorValue.NativeErrorCode;stage=$errorValue.GetType().Name} | ConvertTo-Json -Compress
 exit 1
}
