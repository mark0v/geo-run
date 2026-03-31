. "$PSScriptRoot\preview-common.ps1"

$config = Get-PreviewConfig
$process = Get-PreviewProcess -Config $config

if (-not $process) {
  Clear-PreviewPid -Config $config
  Write-Host "Preview server is not running."
  exit 0
}

Stop-PreviewProcess -Config $config
Write-Host "Stopped preview server PID $($process.Id)."
