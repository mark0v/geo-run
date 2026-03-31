. "$PSScriptRoot\preview-common.ps1"

$config = Get-PreviewConfig
$process = Get-PreviewProcess -Config $config
$isHealthy = Test-PreviewHealth -Config $config
$mode = Get-PreviewMode -Config $config
$buildStamp = Get-PreviewBuildStamp -Config $config

if ($process) {
  Set-PreviewPid -Config $config -Pid $process.Id
}

Write-Host "URL: $($config.Url)"
Write-Host "Mode: $mode"
Write-Host "Healthy: $(if ($isHealthy) { 'yes' } else { 'no' })"
Write-Host "PID: $(if ($process) { $process.Id } else { 'none' })"
Write-Host "Last build: $(if ($buildStamp) { $buildStamp } else { 'unknown' })"
