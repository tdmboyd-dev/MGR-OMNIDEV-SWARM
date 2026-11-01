#Requires -Version 7.0
$ErrorActionPreference='Stop'
Add-Type -Path (Join-Path $PSScriptRoot '../worker/windows/AppContainerHost.cs')
$method=[OmniAppContainerHost].GetMethod('MeasureWritable',[Reflection.BindingFlags]'NonPublic,Static')
$temp=[IO.Path]::GetFullPath([IO.Path]::GetTempPath()).TrimEnd([IO.Path]::DirectorySeparatorChar)
$root=[IO.Path]::Combine($temp,'omni-monitor-contract-'+[Guid]::NewGuid())
[IO.Directory]::CreateDirectory($root) | Out-Null
$checks=[Collections.Generic.List[string]]::new()
$link=Join-Path $root 'link'
function Read-MonitorUsage([string]$path,[bool]$allowMissing=$false){
 $arguments=[object[]]@($path,0,$allowMissing)
 $bytes=$method.Invoke($null,$arguments)
 return @{bytes=[long]$bytes;count=[int]$arguments[1]}
}
function MustReject([scriptblock]$action,[string]$label){
 $rejected=$false
 try { & $action | Out-Null } catch { $rejected=$true }
 if(-not $rejected){throw "Monitor accepted $label"}
 $checks.Add($label)
}
try {
 [IO.File]::WriteAllBytes((Join-Path $root 'ordinary'),[byte[]]::new(32))
 $hidden=Join-Path $root 'hidden'
 [IO.File]::WriteAllBytes($hidden,[byte[]]::new(10))
 [IO.File]::SetAttributes($hidden,[IO.FileAttributes]::Hidden)
 $nested=Join-Path $root 'nested'
 [IO.Directory]::CreateDirectory($nested) | Out-Null
 [IO.File]::WriteAllBytes((Join-Path $nested 'child'),[byte[]]::new(7))
 $value=Read-MonitorUsage $root
 if($value['bytes']-ne49-or$value['count']-ne4){throw "Monitor byte/count mismatch: bytes=$($value['bytes']); count=$($value['count'])"}
 $checks.Add('real bytes, hidden entries and recursive entry count')
 $missing=Join-Path $root 'missing'
 if((Read-MonitorUsage $missing $true).bytes-ne0){throw 'Disappeared nested directory not reconciled'}
 $checks.Add('disappeared nested directory is harmless')
 MustReject { Read-MonitorUsage $missing } 'missing top-level root rejected'
 MustReject { Read-MonitorUsage (Join-Path $root 'ordinary') $true } 'directory-to-file change rejected'
 New-Item -ItemType Junction -Path $link -Target $nested | Out-Null
 MustReject { Read-MonitorUsage $link } 'reparse root rejected'
 MustReject { Read-MonitorUsage $root } 'reparse child rejected'
 [IO.Directory]::Delete($link)
 $denied=Join-Path $root 'denied'
 [IO.Directory]::CreateDirectory($denied) | Out-Null
 $original=(Get-Acl -LiteralPath $denied).GetSecurityDescriptorSddlForm([Security.AccessControl.AccessControlSections]::Access)
 try {
  $acl=Get-Acl -LiteralPath $denied
  $sid=[Security.Principal.WindowsIdentity]::GetCurrent().User
  $rights=[Security.AccessControl.FileSystemRights]::ReadData-bor[Security.AccessControl.FileSystemRights]::ReadAttributes
  $acl.AddAccessRule([Security.AccessControl.FileSystemAccessRule]::new($sid,$rights,[Security.AccessControl.AccessControlType]::Deny))
  Set-Acl -LiteralPath $denied -AclObject $acl
  MustReject { Read-MonitorUsage $denied $true } 'persistent access denial still rejected'
 } finally {
  $restore=[Security.AccessControl.DirectorySecurity]::new()
  $restore.SetSecurityDescriptorSddlForm($original,[Security.AccessControl.AccessControlSections]::Access)
  [IO.FileSystemAclExtensions]::SetAccessControl([IO.DirectoryInfo]::new($denied),$restore)
 }
 $budget=Join-Path $root 'budget'
 [IO.Directory]::CreateDirectory($budget) | Out-Null
 for($index=0;$index-lt4097;$index++){[IO.File]::WriteAllBytes((Join-Path $budget ([string]$index)),[byte[]]::new(0))}
 MustReject { Read-MonitorUsage $budget } '4096-entry cap retained'
} finally {
 if([IO.Directory]::Exists($link)){[IO.Directory]::Delete($link)}
 $resolved=[IO.Path]::GetFullPath($root)
 if([IO.Path]::GetDirectoryName($resolved)-ne$temp-or-not[IO.Path]::GetFileName($resolved).StartsWith('omni-monitor-contract-')){throw 'Owned fixture cleanup target mismatch'}
 Remove-Item -LiteralPath $resolved -Recurse -Force
 if([IO.Directory]::Exists($resolved)){throw 'Owned fixture cleanup not confirmed'}
}
$checks.Add('owned fixture ACLs restored and test tree removed')
@{passed=$checks.Count;checks=$checks;scope='Actual private host monitor method over owned fixtures; not an OS sandbox qualification'} | ConvertTo-Json -Compress
